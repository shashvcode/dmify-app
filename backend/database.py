from pymongo import MongoClient
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from bson import ObjectId
import secrets

load_dotenv()


client = MongoClient(os.getenv("MONGO_URI"))
db = client.dmify


users_collection = db.users
projects_collection = db.projects
messages_collection = db.messages
verification_codes_collection = db.verification_codes
user_credits_collection = db.user_credits
payment_transactions_collection = db.payment_transactions

class Database:
    @staticmethod
    def create_user(email: str, password_hash: str, name: str) -> str:
    
        user_doc = {
            "email": email.lower(),
            "password_hash": password_hash,
            "name": name,
            "email_verified": False,
            "created_at": datetime.utcnow()
        }
        result = users_collection.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Initialize user with 10 free credits
        Database.initialize_user_credits(user_id)
        
        return user_id
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    
        user = users_collection.find_one({"email": email.lower()})
        if user:
            user["_id"] = str(user["_id"])
        return user
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    
        try:
            user = users_collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user["_id"] = str(user["_id"])
            return user
        except:
            return None
    
    @staticmethod
    def create_project(user_id: str, name: str, product_info: str, offer_info: str) -> str:
    
        project_doc = {
            "user_id": ObjectId(user_id),
            "name": name,
            "product_info": product_info,
            "offer_info": offer_info,
            "created_at": datetime.utcnow()
        }
        result = projects_collection.insert_one(project_doc)
        return str(result.inserted_id)
    
    @staticmethod
    def get_user_projects(user_id: str) -> list:
    
        try:
            projects = list(projects_collection.find({"user_id": ObjectId(user_id)}))
            for project in projects:
                project["_id"] = str(project["_id"])
                project["user_id"] = str(project["user_id"])
            return projects
        except:
            return []
    
    @staticmethod
    def get_project_by_id(project_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    
        try:
            project = projects_collection.find_one({
                "_id": ObjectId(project_id),
                "user_id": ObjectId(user_id)
            })
            if project:
                project["_id"] = str(project["_id"])
                project["user_id"] = str(project["user_id"])
            return project
        except:
            return None
    
    @staticmethod
    def update_project(project_id: str, user_id: str, updates: Dict[str, Any]) -> bool:
    
        try:
            result = projects_collection.update_one(
                {"_id": ObjectId(project_id), "user_id": ObjectId(user_id)},
                {"$set": updates}
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def delete_project(project_id: str, user_id: str) -> bool:
    
        try:

            result = projects_collection.delete_one({
                "_id": ObjectId(project_id),
                "user_id": ObjectId(user_id)
            })
            

            if result.deleted_count > 0:
                messages_collection.delete_many({"project_id": ObjectId(project_id)})
            
            return result.deleted_count > 0
        except:
            return False
    
    @staticmethod
    def save_message(project_id: str, username: str, generated_message: str, user_info: Dict[str, Any]) -> str:
    
        message_doc = {
            "project_id": ObjectId(project_id),
            "username": username,
            "generated_message": generated_message,
            "user_info": user_info,
            "created_at": datetime.utcnow()
        }
        result = messages_collection.insert_one(message_doc)
        return str(result.inserted_id)
    
    @staticmethod
    def get_project_messages(project_id: str) -> list:
    
        try:
            messages = list(messages_collection.find(
                {"project_id": ObjectId(project_id)}
            ).sort("created_at", -1))
            
            for message in messages:
                message["_id"] = str(message["_id"])
                message["project_id"] = str(message["project_id"])
            
            return messages
        except:
            return []
    
    @staticmethod
    def create_verification_code(email: str) -> str:
        code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        
        verification_doc = {
            "email": email.lower(),
            "code": code,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=15),
            "used": False
        }
        
        verification_codes_collection.delete_many({"email": email.lower()})
        verification_codes_collection.insert_one(verification_doc)
        return code
    
    @staticmethod
    def verify_email_code(email: str, code: str) -> bool:
        try:
            verification = verification_codes_collection.find_one({
                "email": email.lower(),
                "code": code,
                "used": False,
                "expires_at": {"$gt": datetime.utcnow()}
            })
            
            if verification:
                verification_codes_collection.update_one(
                    {"_id": verification["_id"]},
                    {"$set": {"used": True}}
                )
                
                users_collection.update_one(
                    {"email": email.lower()},
                    {"$set": {"email_verified": True}}
                )
                return True
            return False
        except:
            return False
    
    # Credit Management Methods
    @staticmethod
    def initialize_user_credits(user_id: str) -> None:
        """Initialize a new user with 10 free credits"""
        try:
            credit_doc = {
                "user_id": ObjectId(user_id),
                "credits": 10,
                "total_earned": 10,
                "total_used": 0,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            user_credits_collection.insert_one(credit_doc)
        except Exception as e:
            # If credits already exist for user, skip
            pass
    
    @staticmethod
    def get_user_credits(user_id: str) -> int:
        """Get current credit balance for user"""
        try:
            credits = user_credits_collection.find_one({"user_id": ObjectId(user_id)})
            return credits["credits"] if credits else 0
        except:
            return 0
    
    @staticmethod
    def use_credit(user_id: str) -> bool:
        """Use one credit for message generation. Returns True if successful."""
        try:
            result = user_credits_collection.update_one(
                {
                    "user_id": ObjectId(user_id),
                    "credits": {"$gt": 0}  # Only if credits > 0
                },
                {
                    "$inc": {"credits": -1, "total_used": 1},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def add_credits(user_id: str, credits_to_add: int, transaction_id: str = None) -> bool:
        """Add credits to user account"""
        try:
            result = user_credits_collection.update_one(
                {"user_id": ObjectId(user_id)},
                {
                    "$inc": {"credits": credits_to_add, "total_earned": credits_to_add},
                    "$set": {"updated_at": datetime.utcnow()}
                },
                upsert=True
            )
            return True
        except:
            return False
    
    @staticmethod
    def get_user_credit_info(user_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed credit information for user"""
        try:
            credits = user_credits_collection.find_one({"user_id": ObjectId(user_id)})
            if credits:
                credits["_id"] = str(credits["_id"])
                credits["user_id"] = str(credits["user_id"])
            return credits
        except:
            return None
    
    # Payment Transaction Methods
    @staticmethod
    def create_payment_transaction(
        user_id: str, 
        stripe_session_id: str, 
        amount: int, 
        credits: int,
        price_id: str,
        status: str = "pending"
    ) -> str:
        """Create a payment transaction record"""
        transaction_doc = {
            "user_id": ObjectId(user_id),
            "stripe_session_id": stripe_session_id,
            "amount": amount,  # in cents
            "credits": credits,
            "price_id": price_id,
            "status": status,  # pending, completed, failed
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = payment_transactions_collection.insert_one(transaction_doc)
        return str(result.inserted_id)
    
    @staticmethod
    def get_payment_by_session_id(stripe_session_id: str) -> Optional[Dict[str, Any]]:
        """Get payment transaction by Stripe session ID"""
        try:
            transaction = payment_transactions_collection.find_one(
                {"stripe_session_id": stripe_session_id}
            )
            if transaction:
                transaction["_id"] = str(transaction["_id"])
                transaction["user_id"] = str(transaction["user_id"])
            return transaction
        except:
            return None
    
    @staticmethod
    def update_payment_status(stripe_session_id: str, status: str) -> bool:
        """Update payment transaction status"""
        try:
            result = payment_transactions_collection.update_one(
                {"stripe_session_id": stripe_session_id},
                {
                    "$set": {
                        "status": status,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def get_user_payment_history(user_id: str) -> list:
        """Get payment history for user"""
        try:
            transactions = list(payment_transactions_collection.find(
                {"user_id": ObjectId(user_id)}
            ).sort("created_at", -1))
            
            for transaction in transactions:
                transaction["_id"] = str(transaction["_id"])
                transaction["user_id"] = str(transaction["user_id"])
            
            return transactions
        except:
            return []
