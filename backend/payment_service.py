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

# Payment plan configuration - Updated for subscription model
PAYMENT_PLANS = {
    "plan_1": {
        "price_id": os.getenv("STRIPE_PRICE_ONE"),
        "messages": 100,  # Monthly message allowance
        "amount": 499,  # $4.99/month in cents
        "name": "Starter Plan",
        "description": "100 messages per month"
    },
    "plan_2": {
        "price_id": os.getenv("STRIPE_PRICE_TWO"), 
        "messages": 500,  # Monthly message allowance
        "amount": 1999,  # $19.99/month in cents
        "name": "Growth Plan",
        "description": "500 messages per month"
    },
    "plan_3": {
        "price_id": os.getenv("STRIPE_PRICE_THREE"),
        "messages": 1500,  # Monthly message allowance
        "amount": 4999,  # $49.99/month in cents
        "name": "Pro Plan", 
        "description": "1500 messages per month"
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
        """Create a Stripe subscription checkout session with promotion codes enabled"""
        try:
            if plan_id not in PAYMENT_PLANS:
                raise ValueError(f"Invalid plan_id: {plan_id}")
            
            plan = PAYMENT_PLANS[plan_id]
            
            # Create Stripe checkout session for subscription
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': plan["price_id"],
                    'quantity': 1,
                }],
                mode='subscription',  # Changed from 'payment' to 'subscription'
                success_url=success_url,
                cancel_url=cancel_url,
                allow_promotion_codes=True,  # Enable promotion code field in Stripe checkout
                metadata={
                    'user_id': user_id,
                    'plan_id': plan_id,
                    'monthly_messages': plan["messages"]
                }
            )
            
            # Record the transaction in our database
            Database.create_payment_transaction(
                user_id=user_id,
                stripe_session_id=session.id,
                amount=plan["amount"],
                credits=plan["messages"],  # For backward compatibility
                price_id=plan["price_id"],
                status="pending",
                transaction_type="subscription"
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
        """Handle successful payment webhook (legacy one-time payments)"""
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
            
            # Handle based on transaction type
            if transaction.get("transaction_type") == "subscription":
                return PaymentService.handle_subscription_created(session)
            else:
                # Legacy one-time payment
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
    def handle_subscription_created(session) -> bool:
        """Handle subscription creation from checkout session"""
        try:
            # Get the subscription from the session
            subscription = stripe.Subscription.retrieve(session.subscription)
            
            # Get plan details from metadata
            plan_id = session.metadata.get('plan_id')
            if not plan_id or plan_id not in PAYMENT_PLANS:
                logging.error(f"Invalid plan_id in session metadata: {plan_id}")
                return False
            
            plan = PAYMENT_PLANS[plan_id]
            
            # Create subscription record in our database
            subscription_id = Database.create_subscription(
                user_id=session.metadata['user_id'],
                stripe_subscription_id=subscription.id,
                stripe_customer_id=subscription.customer,
                plan_id=plan_id,
                status=subscription.status,
                monthly_allowance=plan["messages"],
                current_period_start=datetime.fromtimestamp(subscription.current_period_start),
                current_period_end=datetime.fromtimestamp(subscription.current_period_end)
            )
            
            if subscription_id:
                # Update transaction record
                Database.update_payment_status(session.id, "completed")
                logging.info(f"Successfully created subscription for user {session.metadata['user_id']}")
                return True
            else:
                logging.error(f"Failed to create subscription record for session: {session.id}")
                return False
                
        except Exception as e:
            logging.error(f"Error handling subscription creation: {str(e)}")
            return False
    
    @staticmethod
    def handle_subscription_updated(subscription_data) -> bool:
        """Handle subscription status updates"""
        try:
            subscription_id = subscription_data['id']
            
            # Update subscription in our database
            updates = {
                "status": subscription_data['status'],
                "current_period_start": datetime.fromtimestamp(subscription_data['current_period_start']),
                "current_period_end": datetime.fromtimestamp(subscription_data['current_period_end'])
            }
            
            success = Database.update_subscription(subscription_id, updates)
            
            if success:
                logging.info(f"Successfully updated subscription {subscription_id}")
                return True
            else:
                logging.error(f"Failed to update subscription {subscription_id}")
                return False
                
        except Exception as e:
            logging.error(f"Error handling subscription update: {str(e)}")
            return False
    
    @staticmethod
    def handle_invoice_payment_succeeded(invoice_data) -> bool:
        """Handle successful subscription payment (monthly renewal)"""
        try:
            subscription_id = invoice_data['subscription']
            
            # Reset monthly usage for the subscription
            success = Database.reset_monthly_usage(subscription_id)
            
            if success:
                logging.info(f"Successfully reset monthly usage for subscription {subscription_id}")
                return True
            else:
                logging.error(f"Failed to reset monthly usage for subscription {subscription_id}")
                return False
                
        except Exception as e:
            logging.error(f"Error handling invoice payment: {str(e)}")
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
