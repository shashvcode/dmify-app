import stripe
import os
from dotenv import load_dotenv
from typing import Dict, Any, Optional
import logging
from datetime import datetime
from backend.database import Database

load_dotenv()

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_API_KEY")

# Payment plan configuration - One-time message purchases
PAYMENT_PLANS = {
    "plan_1": {
        "price_id": os.getenv("STRIPE_PRICE_ONE"),
        "messages": 100,  # One-time message credits
        "amount": 499,  # $4.99 one-time in cents
        "name": "Starter Pack",
        "description": "100 message credits"
    },
    "plan_2": {
        "price_id": os.getenv("STRIPE_PRICE_TWO"), 
        "messages": 500,  # One-time message credits
        "amount": 1999,  # $19.99 one-time in cents
        "name": "Growth Pack",
        "description": "500 message credits"
    },
    "plan_3": {
        "price_id": os.getenv("STRIPE_PRICE_THREE"),
        "messages": 1500,  # One-time message credits
        "amount": 4999,  # $49.99 one-time in cents
        "name": "Pro Pack", 
        "description": "1500 message credits"
    }
}

class PaymentService:
    @staticmethod
    def get_payment_plans() -> Dict[str, Any]:
        """Get available payment plans"""
        return PAYMENT_PLANS
    
    @staticmethod
    def get_plan_by_price_id(price_id: str) -> Optional[Dict[str, Any]]:
        """Get plan details by Stripe price ID"""
        for plan_key, plan_data in PAYMENT_PLANS.items():
            if plan_data["price_id"] == price_id:
                return {**plan_data, "plan_id": plan_key}
        return None
    
    @staticmethod
    def create_checkout_session(
        user_id: str,
        plan_id: str,
        success_url: str,
        cancel_url: str
    ) -> Optional[Dict[str, Any]]:
        """Create a Stripe one-time payment checkout session with promotion codes enabled"""
        try:
            if plan_id not in PAYMENT_PLANS:
                raise ValueError(f"Invalid plan_id: {plan_id}")
            
            plan = PAYMENT_PLANS[plan_id]
            
            # Create Stripe checkout session for one-time payment
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': plan["price_id"],
                    'quantity': 1,
                }],
                mode='payment',  # One-time payment mode
                success_url=success_url,
                cancel_url=cancel_url,
                allow_promotion_codes=True,  # Enable promotion code field in Stripe checkout
                metadata={
                    'user_id': user_id,
                    'plan_id': plan_id,
                    'message_credits': plan["messages"]
                }
            )
            
            # Record the transaction in our database
            Database.create_payment_transaction(
                user_id=user_id,
                stripe_session_id=session.id,
                amount=plan["amount"],
                credits=plan["messages"],
                price_id=plan["price_id"],
                status="pending",
                transaction_type="one_time"
            )
            
            return {
                "session_id": session.id,
                "checkout_url": session.url,
                "plan": plan
            }
            
        except Exception as e:
            logging.error(f"Error creating checkout session: {str(e)}")
            return None
    
    @staticmethod
    def handle_successful_payment(stripe_session_id: str) -> bool:
        """Handle successful one-time payment webhook"""
        try:
            # Get the transaction from our database
            transaction = Database.get_payment_by_session_id(stripe_session_id)
            if not transaction:
                logging.error(f"Transaction not found for session: {stripe_session_id}")
                return False
            
            # Check if already processed to prevent duplicate credits
            if transaction["status"] == "completed":
                logging.info(f"Payment already processed for session: {stripe_session_id}")
                return True
            
            # Retrieve the session from Stripe to verify
            session = stripe.checkout.Session.retrieve(stripe_session_id)
            
            if session.payment_status != 'paid':
                logging.error(f"Payment not completed for session: {stripe_session_id}")
                return False
            
            # Add credits to user account
            success = Database.add_credits(
                user_id=transaction["user_id"],
                credits_to_add=transaction["credits"],
                transaction_id=transaction["_id"]
            )
            
            if success:
                Database.update_payment_status(stripe_session_id, "completed")
                logging.info(f"Successfully added {transaction['credits']} credits to user {transaction['user_id']}")
                return True
            else:
                logging.error(f"Failed to add credits for session: {stripe_session_id}")
                return False
                
        except Exception as e:
            logging.error(f"Error handling successful payment: {str(e)}")
            return False
    

    
    @staticmethod
    def verify_webhook_signature(payload: bytes, signature: str) -> Optional[Dict[str, Any]]:
        """Verify Stripe webhook signature and return the event"""
        try:
            webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
            if not webhook_secret:
                raise ValueError("STRIPE_WEBHOOK_SECRET not configured")
            
            event = stripe.Webhook.construct_event(
                payload, signature, webhook_secret
            )
            return event
            
        except ValueError as e:
            logging.error(f"Invalid payload: {str(e)}")
            return None
        except stripe.error.SignatureVerificationError as e:
            logging.error(f"Invalid signature: {str(e)}")
            return None
        except Exception as e:
            logging.error(f"Error verifying webhook: {str(e)}")
            return None
