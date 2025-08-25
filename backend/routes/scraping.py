from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from backend.database import Database
from backend.auth import get_current_user
from backend.scraper_algos import scrape
from typing import List, Optional

router = APIRouter(prefix="/scrape", tags=["scraping"])

class ScrapeRequest(BaseModel):
    username: str

class MessageResponse(BaseModel):
    id: str
    username: str
    generated_message: str
    user_info: dict
    created_at: str

class ScrapeResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    user_info: Optional[dict] = None
    error: Optional[str] = None
    message_id: Optional[str] = None

@router.post("/projects/{project_id}/generate", response_model=ScrapeResponse)
async def generate_dm_message(
    project_id: str,
    request: ScrapeRequest,
    current_user: dict = Depends(get_current_user)
):

    

    if not request.username.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot be empty"
        )
    
    # Check if user has available credits
    user_credits = Database.get_user_credits(current_user["_id"])
    if user_credits <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient credits. Please purchase more credits to continue generating messages."
        )

    project = Database.get_project_by_id(project_id, current_user["_id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    

    username = request.username.strip().lstrip('@')
    
    try:
        # Use one credit before processing
        credit_used = Database.use_credit(current_user["_id"])
        if not credit_used:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Failed to use credit. Please try again or purchase more credits."
            )

        result = scrape(
            username=username,
            product_info=project["product_info"],
            offer_info=project["offer_info"],
            name=current_user["name"]
        )
        
        if not result["success"]:
            # If scraping failed, refund the credit
            Database.add_credits(current_user["_id"], 1)
            return {
                "success": False,
                "message": None,
                "user_info": None,
                "error": result["error"],
                "message_id": None
            }
        

        message_id = Database.save_message(
            project_id=project_id,
            username=username,
            generated_message=result["message"],
            user_info=result["user_info"]
        )
        
        return {
            "success": True,
            "message": result["message"],
            "user_info": result["user_info"],
            "error": None,
            "message_id": message_id
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as is
        raise
    except Exception as e:
        # For unexpected errors, refund the credit if it was used
        try:
            Database.add_credits(current_user["_id"], 1)
        except:
            pass  # If refund fails, log but don't break the error response
        
        return {
            "success": False,
            "message": None,
            "user_info": None,
            "error": f"An unexpected error occurred: {str(e)}",
            "message_id": None
        }

@router.get("/projects/{project_id}/messages", response_model=List[MessageResponse])
async def get_project_messages(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):

    

    project = Database.get_project_by_id(project_id, current_user["_id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    

    messages = Database.get_project_messages(project_id)
    
    return [
        {
            "id": message["_id"],
            "username": message["username"],
            "generated_message": message["generated_message"],
            "user_info": message["user_info"],
            "created_at": message["created_at"].isoformat()
        }
        for message in messages
    ]

@router.get("/projects/{project_id}/messages/{message_id}", response_model=MessageResponse)
async def get_message(
    project_id: str,
    message_id: str,
    current_user: dict = Depends(get_current_user)
):

    

    project = Database.get_project_by_id(project_id, current_user["_id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    

    messages = Database.get_project_messages(project_id)
    message = next((m for m in messages if m["_id"] == message_id), None)
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    return {
        "id": message["_id"],
        "username": message["username"],
        "generated_message": message["generated_message"],
        "user_info": message["user_info"],
        "created_at": message["created_at"].isoformat()
    }

@router.get("/messages", response_model=List[MessageResponse])
async def get_all_user_messages(current_user: dict = Depends(get_current_user)):
    
    user_projects = Database.get_user_projects(current_user["_id"])
    all_messages = []
    
    for project in user_projects:
        project_messages = Database.get_project_messages(project["_id"])
        all_messages.extend(project_messages)
    
    all_messages.sort(key=lambda x: x["created_at"], reverse=True)
    
    return [
        {
            "id": message["_id"],
            "username": message["username"],
            "generated_message": message["generated_message"],
            "user_info": message["user_info"],
            "created_at": message["created_at"].isoformat()
        }
        for message in all_messages
    ]
