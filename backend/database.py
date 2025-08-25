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
        return str(result.inserted_id)
    
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
