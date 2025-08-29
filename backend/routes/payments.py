from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel
from backend.database import Database
from backend.auth import get_current_user
from backend.payment_service import PaymentService, PAYMENT_PLANS
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
import stripe
import os

router = APIRouter(prefix="/payments", tags=["payments"])

class CreateCheckoutRequest(BaseModel):
    plan_id: str

class PaymentPlan(BaseModel):
    plan_id: str
    name: str
    description: str
    messages: int  # Monthly message allowance
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
    subscription_remaining: int
    has_subscription: bool
    total_remaining: int

@router.get("/plans", response_model=List[PaymentPlan])
async def get_payment_plans():
    """Get available payment plans - Public endpoint (no auth required)"""
    plans = PaymentService.get_payment_plans()
    
    return [
        {
            "plan_id": plan_id,
            "name": plan_data["name"],
            "description": plan_data["description"],
            "messages": plan_data["messages"],
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
        cancel_url=cancel_url
    )
    
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session"
        )
    
    return session_data

@router.get("/credits", response_model=CreditInfo)
async def get_user_credits(current_user: dict = Depends(get_current_user)):
    """Get current user's credit and subscription information"""
    
    # Get message allowance (includes both subscription and credits)
    allowance_info = Database.get_user_message_allowance(current_user["_id"])
    
    # Get credit info for backward compatibility
    credit_info = Database.get_user_credit_info(current_user["_id"])
    
    if not credit_info:
        # Initialize credits if they don't exist (for existing users)
        Database.initialize_user_credits(current_user["_id"])
        credit_info = Database.get_user_credit_info(current_user["_id"])
    
    return {
        "credits": allowance_info["credits_remaining"],
        "total_earned": credit_info.get("total_earned", 0),
        "total_used": credit_info.get("total_used", 0),
        "subscription_remaining": allowance_info["subscription_remaining"],
        "has_subscription": allowance_info["has_subscription"],
        "total_remaining": allowance_info["total_remaining"]
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
            
            # Handle successful payment (both one-time and subscription)
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
        
        elif event['type'] == 'customer.subscription.created':
            subscription = event['data']['object']
            logging.info(f"Processing customer.subscription.created for subscription: {subscription['id']}")
            # Subscription creation is handled in checkout.session.completed
        
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            logging.info(f"Processing customer.subscription.updated for subscription: {subscription['id']}")
            
            success = PaymentService.handle_subscription_updated(subscription)
            if not success:
                logging.error(f"Failed to process subscription update for: {subscription['id']}")
        
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            logging.info(f"Processing customer.subscription.deleted for subscription: {subscription['id']}")
            
            # Mark subscription as canceled in our database
            success = PaymentService.handle_subscription_updated(subscription)
            if not success:
                logging.error(f"Failed to process subscription deletion for: {subscription['id']}")
        
        elif event['type'] == 'invoice.payment_succeeded':
            invoice = event['data']['object']
            logging.info(f"Processing invoice.payment_succeeded for invoice: {invoice['id']}")
            
            # Reset monthly usage for subscription renewals
            if invoice.get('subscription'):
                success = PaymentService.handle_invoice_payment_succeeded(invoice)
                if not success:
                    logging.error(f"Failed to process invoice payment for: {invoice['id']}")
        
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
            "transaction_type": transaction.get("transaction_type", "one_time"),
            "created_at": transaction["created_at"].isoformat(),
            "updated_at": transaction["updated_at"].isoformat()
        })
    
    return formatted_history

@router.get("/subscription")
async def get_user_subscription(current_user: dict = Depends(get_current_user)):
    """Get user's current subscription information"""
    
    subscription = Database.get_user_subscription(current_user["_id"])
    
    if not subscription:
        return {"has_subscription": False}
    
    return {
        "has_subscription": True,
        "subscription_id": subscription["stripe_subscription_id"],
        "plan_id": subscription["plan_id"],
        "status": subscription["status"],
        "monthly_allowance": subscription["monthly_allowance"],
        "used_this_month": subscription["used_this_month"],
        "current_period_start": subscription["current_period_start"].isoformat(),
        "current_period_end": subscription["current_period_end"].isoformat(),
        "cancel_at_period_end": subscription["cancel_at_period_end"]
    }

@router.post("/cancel-subscription")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """Cancel user's subscription at period end"""
    
    subscription = Database.get_user_subscription(current_user["_id"])
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    try:
        # Cancel subscription in Stripe
        stripe.Subscription.modify(
            subscription["stripe_subscription_id"],
            cancel_at_period_end=True
        )
        
        # Update our database
        success = Database.cancel_subscription(
            subscription["stripe_subscription_id"],
            cancel_at_period_end=True
        )
        
        if success:
            return {"message": "Subscription will be canceled at the end of the current period"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cancel subscription"
            )
            
    except Exception as e:
        logging.error(f"Error canceling subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )

@router.post("/refresh-subscription")
async def refresh_subscription_from_stripe(current_user: dict = Depends(get_current_user)):
    """Force refresh subscription data from Stripe (useful for immediate updates after checkout)"""
    
    try:
        # First, let's check if user has ANY Stripe customer records by searching recent checkout sessions
        # This helps handle cases where webhooks failed but payment succeeded
        import stripe
        
        # Get all recent checkout sessions for this user to find their latest subscription
        recent_sessions = stripe.checkout.Session.list(limit=10)
        user_session = None
        
        for session in recent_sessions.data:
            if (session.metadata and 
                session.metadata.get('user_id') == current_user["_id"] and 
                session.payment_status == 'paid' and
                session.mode == 'subscription'):
                user_session = session
                break
        
        if not user_session:
            # Check if user has existing subscription in our DB
            subscription = Database.get_user_subscription(current_user["_id"])
            if not subscription:
                return {
                    "success": False,
                    "message": "No subscription found",
                    "has_subscription": False
                }
            
            # Try to refresh existing subscription
            stripe_subscription = stripe.Subscription.retrieve(subscription["stripe_subscription_id"])
        else:
            # Handle case where payment succeeded but webhook failed
            logging.info(f"Found recent checkout session {user_session.id} for user {current_user['_id']}")
            
            if user_session.subscription:
                stripe_subscription = stripe.Subscription.retrieve(user_session.subscription)
                
                # Process this as if it came from webhook
                success = PaymentService.handle_subscription_created(user_session)
                if success:
                    logging.info(f"Successfully processed missed subscription for user {current_user['_id']}")
                else:
                    logging.error(f"Failed to process missed subscription for user {current_user['_id']}")
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No subscription found in checkout session"
                )
        
        # Update our database with the latest Stripe data
        stripe_price_id = stripe_subscription['items']['data'][0]['price']['id']
        
        # Find the corresponding plan in our system
        new_plan_id = None
        new_monthly_allowance = None
        
        for plan_id, plan_data in PAYMENT_PLANS.items():
            if plan_data["price_id"] == stripe_price_id:
                new_plan_id = plan_id
                new_monthly_allowance = plan_data["messages"]
                break
        
        if new_plan_id:
            updates = {
                "plan_id": new_plan_id,
                "status": stripe_subscription['status'],
                "monthly_allowance": new_monthly_allowance,
                "current_period_start": datetime.fromtimestamp(stripe_subscription['current_period_start']),
                "current_period_end": datetime.fromtimestamp(stripe_subscription['current_period_end'])
            }
            
            # Try to update existing subscription first
            subscription = Database.get_user_subscription(current_user["_id"])
            success = False
            
            if subscription:
                success = Database.update_subscription(subscription["stripe_subscription_id"], updates)
            
            # If no existing subscription or update failed, create new one
            if not success:
                subscription_id = Database.create_subscription(
                    user_id=current_user["_id"],
                    stripe_subscription_id=stripe_subscription.id,
                    stripe_customer_id=stripe_subscription.customer,
                    plan_id=new_plan_id,
                    status=stripe_subscription.status,
                    monthly_allowance=new_monthly_allowance,
                    current_period_start=datetime.fromtimestamp(stripe_subscription.current_period_start),
                    current_period_end=datetime.fromtimestamp(stripe_subscription.current_period_end)
                )
                success = subscription_id is not None
            
            if success:
                # Return the updated subscription
                updated_subscription = Database.get_user_subscription(current_user["_id"])
                return {
                    "success": True,
                    "message": "Subscription refreshed successfully",
                    "subscription": updated_subscription,
                    "has_subscription": True
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update subscription data"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to map Stripe subscription to plan"
            )
            
    except stripe.error.StripeError as e:
        logging.error(f"Stripe error refreshing subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stripe error: {str(e)}"
        )
    except Exception as e:
        logging.error(f"Error refreshing subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh subscription data"
        )
