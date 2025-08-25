from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel
from backend.database import Database
from backend.auth import get_current_user
from backend.payment_service import PaymentService
from typing import List, Dict, Any, Optional
import logging
import os

router = APIRouter(prefix="/payments", tags=["payments"])

class CreateCheckoutRequest(BaseModel):
    plan_id: str
    coupon_id: Optional[str] = None
    allow_promotion_codes: bool = False

class PaymentPlan(BaseModel):
    plan_id: str
    name: str
    description: str
    credits: int
    amount: int
    price_id: str

class CheckoutResponse(BaseModel):
    session_id: str
    checkout_url: str
    plan: Dict[str, Any]

class CreditInfo(BaseModel):
    credits: int
    total_earned: int
    total_used: int

@router.get("/plans", response_model=List[PaymentPlan])
async def get_payment_plans():
    """Get available payment plans - Public endpoint (no auth required)"""
    plans = PaymentService.get_payment_plans()
    
    return [
        {
            "plan_id": plan_id,
            "name": plan_data["name"],
            "description": plan_data["description"],
            "credits": plan_data["credits"],
            "amount": plan_data["amount"],
            "price_id": plan_data["price_id"]
        }
        for plan_id, plan_data in plans.items()
    ]

@router.post("/create-checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CreateCheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Stripe checkout session"""
    
    # Validate plan_id
    plans = PaymentService.get_payment_plans()
    if request.plan_id not in plans:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan_id"
        )
    
    # Create checkout session
    # Note: Update these URLs to match your frontend deployment
    success_url = os.getenv("FRONTEND_URL", "http://localhost:5173") + "/app/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}"
    cancel_url = os.getenv("FRONTEND_URL", "http://localhost:5173") + "/app/dashboard?payment=cancelled"
    
    session_data = PaymentService.create_checkout_session(
        user_id=current_user["_id"],
        plan_id=request.plan_id,
        success_url=success_url,
        cancel_url=cancel_url,
        coupon_id=request.coupon_id,
        allow_promotion_codes=request.allow_promotion_codes
    )
    
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session"
        )
    
    return session_data

@router.get("/credits", response_model=CreditInfo)
async def get_user_credits(current_user: dict = Depends(get_current_user)):
    """Get current user's credit information"""
    
    credit_info = Database.get_user_credit_info(current_user["_id"])
    
    if not credit_info:
        # Initialize credits if they don't exist (for existing users)
        Database.initialize_user_credits(current_user["_id"])
        credit_info = Database.get_user_credit_info(current_user["_id"])
    
    return {
        "credits": credit_info.get("credits", 0),
        "total_earned": credit_info.get("total_earned", 0),
        "total_used": credit_info.get("total_used", 0)
    }

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    
    try:
        # Get the raw payload and signature
        payload = await request.body()
        signature = request.headers.get("stripe-signature")
        
        if not signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing stripe-signature header"
            )
        
        # Verify the webhook signature
        event = PaymentService.verify_webhook_signature(payload, signature)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature"
            )
        
        # Handle the event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            session_id = session['id']
            
            logging.info(f"Processing checkout.session.completed for session: {session_id}")
            
            # Handle successful payment
            success = PaymentService.handle_successful_payment(session_id)
            if not success:
                logging.error(f"Failed to process payment for session: {session_id}")
                # Don't return error to Stripe, as we've received the event
                # We can retry processing later if needed
        
        elif event['type'] == 'checkout.session.async_payment_succeeded':
            session = event['data']['object']
            session_id = session['id']
            
            logging.info(f"Processing checkout.session.async_payment_succeeded for session: {session_id}")
            
            # Handle successful delayed payment
            success = PaymentService.handle_successful_payment(session_id)
            if not success:
                logging.error(f"Failed to process delayed payment for session: {session_id}")
        
        else:
            logging.info(f"Unhandled event type: {event['type']}")
        
        return {"status": "success"}
        
    except Exception as e:
        logging.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/history")
async def get_payment_history(current_user: dict = Depends(get_current_user)):
    """Get user's payment history"""
    
    history = Database.get_user_payment_history(current_user["_id"])
    
    # Format the response
    formatted_history = []
    for transaction in history:
        formatted_history.append({
            "id": transaction["_id"],
            "amount": transaction["amount"],
            "credits": transaction["credits"],
            "status": transaction["status"],
            "created_at": transaction["created_at"].isoformat(),
            "updated_at": transaction["updated_at"].isoformat()
        })
    
    return formatted_history
