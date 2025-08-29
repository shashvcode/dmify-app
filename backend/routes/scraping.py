from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from pydantic import BaseModel
from backend.database import Database
from backend.auth import get_current_user
from backend.scraper_algos import scrape
from typing import List, Optional
from datetime import datetime
import logging

router = APIRouter(prefix="/scrape", tags=["scraping"])

class ScrapeRequest(BaseModel):
    username: str

class MessageResponse(BaseModel):
    id: str
    username: str
    generated_message: str
    user_info: dict
    created_at: str

class UpdateMessageRequest(BaseModel):
    generated_message: str

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
    
    # Check if user has available messages (subscription or credits)
    allowance_info = Database.get_user_message_allowance(current_user["_id"])
    if allowance_info["total_remaining"] <= 0:
        if allowance_info["has_subscription"]:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Monthly message limit reached. Your allowance will reset at the next billing period."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Insufficient credits. Please subscribe or purchase more credits to continue generating messages."
            )

    project = Database.get_project_by_id(project_id, current_user["_id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    

    username = request.username.strip().lstrip('@')
    
    try:
        # Use one message from allowance (subscription or credit)
        message_used = Database.use_monthly_message(current_user["_id"])
        if not message_used:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Failed to use message allowance. Please try again or check your subscription status."
            )

        # Extract first name only for more natural messaging
        first_name = current_user["name"].split()[0] if current_user["name"] else "there"
        
        result = scrape(
            username=username,
            product_info=project["product_info"],
            offer_info=project["offer_info"],
            name=first_name
        )
        
        if not result["success"]:
            # If scraping failed, refund the message usage (subscription or credit)
            Database.refund_monthly_message(current_user["_id"])
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
            user_info=result["user_info"],
            user_id=current_user["_id"]
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
        # For unexpected errors, refund the message if it was used
        try:
            Database.refund_monthly_message(current_user["_id"])
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

@router.put("/projects/{project_id}/messages/{message_id}", response_model=MessageResponse)
async def update_message(
    project_id: str,
    message_id: str,
    request: UpdateMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update a generated message"""
    
    if not request.generated_message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty"
        )
    
    # Verify project exists and belongs to user
    project = Database.get_project_by_id(project_id, current_user["_id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get the message to verify it exists and belongs to this project
    messages = Database.get_project_messages(project_id)
    message = next((m for m in messages if m["_id"] == message_id), None)
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Update the message
    success = Database.update_message(message_id, request.generated_message.strip())
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update message"
        )
    
    # Return the updated message
    updated_message = Database.get_message_by_id(message_id)
    if not updated_message:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve updated message"
        )
    
    return {
        "id": updated_message["_id"],
        "username": updated_message["username"],
        "generated_message": updated_message["generated_message"],
        "user_info": updated_message["user_info"],
        "created_at": updated_message["created_at"].isoformat()
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

# New Async DM Generation Models and Endpoints

class DMJobResponse(BaseModel):
    id: str
    username: str
    status: str  # pending, processing, completed, failed
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    result: Optional[ScrapeResponse] = None

class QueueDMRequest(BaseModel):
    username: str

class QueueDMResponse(BaseModel):
    job_id: str
    status: str
    message: str

def process_dm_job(job_id: str):
    """Background function to process DM generation jobs"""
    try:
        # Get the job
        job = Database.get_dm_job(job_id)
        if not job:
            logging.error(f"Job {job_id} not found")
            return
        
        # Mark as processing
        Database.update_dm_job_status(job_id, "processing", datetime.utcnow())
        
        # Get project and user info
        project = Database.get_project_by_id(job["project_id"], job["user_id"])
        user = Database.get_user_by_id(job["user_id"])
        
        if not project or not user:
            Database.fail_dm_job(job_id, "Project or user not found")
            return
        
        # Check message allowance before processing
        allowance_info = Database.get_user_message_allowance(job["user_id"])
        if allowance_info["total_remaining"] <= 0:
            Database.fail_dm_job(job_id, "Insufficient message allowance")
            return
        
        # Use message from allowance
        message_used = Database.use_monthly_message(job["user_id"])
        if not message_used:
            Database.fail_dm_job(job_id, "Failed to use message allowance")
            return
        
        try:
            # Extract first name only for more natural messaging
            first_name = user["name"].split()[0] if user["name"] else "there"
            
            # Run the scraping
            result = scrape(
                username=job["username"],
                product_info=project["product_info"],
                offer_info=project["offer_info"],
                name=first_name
            )
            
            if not result["success"]:
                # Refund message if scraping failed
                Database.refund_monthly_message(job["user_id"])
                Database.fail_dm_job(job_id, result["error"])
                return
            
            # Save the message
            message_id = Database.save_message(
                project_id=job["project_id"],
                username=job["username"],
                generated_message=result["message"],
                user_info=result["user_info"],
                user_id=job["user_id"]
            )
            
            # Complete the job
            result["message_id"] = message_id
            Database.complete_dm_job(job_id, result)
            
        except Exception as e:
            # Refund message on error
            Database.refund_monthly_message(job["user_id"])
            Database.fail_dm_job(job_id, f"Processing error: {str(e)}")
            
    except Exception as e:
        logging.error(f"Error processing job {job_id}: {str(e)}")
        Database.fail_dm_job(job_id, f"Unexpected error: {str(e)}")

@router.post("/projects/{project_id}/queue", response_model=QueueDMResponse)
async def queue_dm_generation(
    project_id: str,
    request: QueueDMRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Queue a DM generation job for async processing"""
    
    if not request.username.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot be empty"
        )
    
    # Check if user has available messages (subscription or credits)
    allowance_info = Database.get_user_message_allowance(current_user["_id"])
    if allowance_info["total_remaining"] <= 0:
        if allowance_info["has_subscription"]:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Monthly message limit reached. Your allowance will reset at the next billing period."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Insufficient credits. Please subscribe or purchase more credits to continue generating messages."
            )

    # Verify project exists and belongs to user
    project = Database.get_project_by_id(project_id, current_user["_id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Create the job
    job_id = Database.create_dm_job(
        user_id=current_user["_id"],
        project_id=project_id,
        username=request.username
    )
    
    # Add background task to process the job
    background_tasks.add_task(process_dm_job, job_id)
    
    return {
        "job_id": job_id,
        "status": "pending",
        "message": f"DM generation for @{request.username.strip().lstrip('@')} has been queued"
    }

@router.get("/jobs/{job_id}", response_model=DMJobResponse)
async def get_dm_job_status(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get the status of a DM generation job"""
    
    job = Database.get_dm_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Verify job belongs to current user
    if job["user_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "id": job["_id"],
        "username": job["username"],
        "status": job["status"],
        "created_at": job["created_at"].isoformat(),
        "started_at": job["started_at"].isoformat() if job["started_at"] else None,
        "completed_at": job["completed_at"].isoformat() if job["completed_at"] else None,
        "result": job["result"] if job["result"] else None
    }

@router.get("/projects/{project_id}/jobs", response_model=List[DMJobResponse])
async def get_project_dm_jobs(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all DM generation jobs for a project"""
    
    # Verify project exists and belongs to user
    project = Database.get_project_by_id(project_id, current_user["_id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    jobs = Database.get_project_dm_jobs(project_id, current_user["_id"])
    
    return [
        {
            "id": job["_id"],
            "username": job["username"],
            "status": job["status"],
            "created_at": job["created_at"].isoformat(),
            "started_at": job["started_at"].isoformat() if job["started_at"] else None,
            "completed_at": job["completed_at"].isoformat() if job["completed_at"] else None,
            "result": job["result"] if job["result"] else None
        }
        for job in jobs
    ]

@router.delete("/jobs/{job_id}")
async def cancel_dm_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel a pending DM generation job"""
    
    job = Database.get_dm_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Verify job belongs to current user
    if job["user_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Can only cancel pending jobs
    if job["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel pending jobs"
        )
    
    success = Database.delete_dm_job(job_id, current_user["_id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel job"
        )
    
    return {"message": "Job cancelled successfully"}
