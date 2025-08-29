from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.database import Database
from backend.auth import get_current_user
from backend.export_service import ExcelExportService
from typing import List, Optional
import logging

router = APIRouter(prefix="/projects", tags=["projects"])

class ProjectCreate(BaseModel):
    name: str
    product_info: str
    offer_info: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    product_info: Optional[str] = None
    offer_info: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    product_info: str
    offer_info: str
    created_at: str

@router.get("/", response_model=List[ProjectResponse])
async def get_user_projects(current_user: dict = Depends(get_current_user)):

    projects = Database.get_user_projects(current_user["_id"])
    
    return [
        {
            "id": project["_id"],
            "name": project["name"],
            "product_info": project["product_info"],
            "offer_info": project["offer_info"],
            "created_at": project["created_at"].isoformat()
        }
        for project in projects
    ]

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):

    

    if not project.name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project name cannot be empty"
        )
    
    if not project.product_info.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product info cannot be empty"
        )
    
    if not project.offer_info.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Offer info cannot be empty"
        )
    

    project_id = Database.create_project(
        user_id=current_user["_id"],
        name=project.name.strip(),
        product_info=project.product_info.strip(),
        offer_info=project.offer_info.strip()
    )
    

    created_project = Database.get_project_by_id(project_id, current_user["_id"])
    
    return {
        "id": created_project["_id"],
        "name": created_project["name"],
        "product_info": created_project["product_info"],
        "offer_info": created_project["offer_info"],
        "created_at": created_project["created_at"].isoformat()
    }

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):

    project = Database.get_project_by_id(project_id, current_user["_id"])
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return {
        "id": project["_id"],
        "name": project["name"],
        "product_info": project["product_info"],
        "offer_info": project["offer_info"],
        "created_at": project["created_at"].isoformat()
    }

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: dict = Depends(get_current_user)
):

    

    project = Database.get_project_by_id(project_id, current_user["_id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    

    updates = {}
    if project_update.name is not None and project_update.name.strip():
        updates["name"] = project_update.name.strip()
    if project_update.product_info is not None and project_update.product_info.strip():
        updates["product_info"] = project_update.product_info.strip()
    if project_update.offer_info is not None and project_update.offer_info.strip():
        updates["offer_info"] = project_update.offer_info.strip()
    
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid updates provided"
        )
    

    success = Database.update_project(project_id, current_user["_id"], updates)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project"
        )
    

    updated_project = Database.get_project_by_id(project_id, current_user["_id"])
    
    return {
        "id": updated_project["_id"],
        "name": updated_project["name"],
        "product_info": updated_project["product_info"],
        "offer_info": updated_project["offer_info"],
        "created_at": updated_project["created_at"].isoformat()
    }

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):

    

    project = Database.get_project_by_id(project_id, current_user["_id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    

    success = Database.delete_project(project_id, current_user["_id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete project"
        )
    
    return {"message": "Project deleted successfully"}

@router.get("/{project_id}/export")
async def export_project_messages(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Export project messages to Excel file (Growth/Pro plans only)
    """
    try:
        # Verify project exists and belongs to user
        project = Database.get_project_by_id(project_id, current_user["_id"])
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Check user subscription tier (Tier 2+ only)
        user_subscription = Database.get_user_subscription(current_user["_id"])
        if not ExcelExportService.validate_export_eligibility(user_subscription):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Excel export is only available for Growth and Pro plan subscribers. Please upgrade your plan to access this feature."
            )
        
        # Get project messages
        messages = Database.get_project_messages(project_id)
        if not messages:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No messages found for this project"
            )
        
        # Generate Excel file
        excel_buffer = ExcelExportService.create_messages_excel(messages, project["name"])
        filename = ExcelExportService.get_filename(project["name"])
        
        # Log export activity
        logging.info(f"Excel export generated for user {current_user['_id']}, project {project_id}, {len(messages)} messages")
        
        # Return file as streaming response
        def iter_file():
            yield excel_buffer.getvalue()
        
        return StreamingResponse(
            iter_file(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as is
        raise
    except Exception as e:
        logging.error(f"Error exporting project messages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export messages. Please try again."
        )
