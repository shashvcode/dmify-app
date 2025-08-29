from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from backend.database import Database
from backend.auth import Auth, get_current_user
from backend.email_service import send_verification_email, send_password_reset_email, send_admin_signup_notification
from datetime import timedelta
import re

router = APIRouter(prefix="/auth", tags=["authentication"])

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class ResendCodeRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

def validate_password(password: str) -> bool:
    if len(password) < 8:
        return False
    if not re.search(r"[A-Za-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    return True

@router.post("/signup")
async def signup(request: SignupRequest):

    

    if not validate_password(request.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain letters and numbers"
        )
    

    existing_user = Database.get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    

    password_hash = Auth.hash_password(request.password)
    user_id = Database.create_user(request.email, password_hash, request.name)
    
    verification_code = Database.create_verification_code(request.email)
    
    email_sent = await send_verification_email(request.email, verification_code)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again."
        )
    
    # Send admin notification (don't fail signup if this fails)
    try:
        await send_admin_signup_notification(request.name, request.email)
    except Exception as e:
        # Log the error but don't fail the signup
        import logging
        logging.error(f"Failed to send admin signup notification: {str(e)}")
    
    return {"message": "User created successfully. Please check your email for verification code."}

@router.post("/verify-email")
async def verify_email(request: VerifyEmailRequest):
    
    user = Database.get_user_by_email(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.get("email_verified", False):
        return {"message": "Email already verified"}
    
    if Database.verify_email_code(request.email, request.code):
        return {"message": "Email verified successfully. You can now login."}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )

@router.post("/resend-verification")
async def resend_verification_code(request: ResendCodeRequest):
    
    user = Database.get_user_by_email(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.get("email_verified", False):
        return {"message": "Email already verified"}
    
    verification_code = Database.create_verification_code(request.email)
    
    email_sent = await send_verification_email(request.email, verification_code)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again."
        )
    
    return {"message": "Verification code sent successfully"}

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):

    

    user = Auth.authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in"
        )
    

    access_token_expires = timedelta(minutes=30)
    access_token = Auth.create_access_token(
        data={"sub": user["_id"]}, expires_delta=access_token_expires
    )
    

    user_data = {
        "id": user["_id"],
        "email": user["email"],
        "name": user["name"],
        "created_at": user["created_at"]
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }

@router.post("/logout")
async def logout():

    return {"message": "Successfully logged out"}

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):

    user_data = {
        "id": current_user["_id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "created_at": current_user["created_at"]
    }
    return user_data

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Send password reset email"""
    
    # Check if user exists
    user = Database.get_user_by_email(request.email)
    if not user:
        # Return success even if user doesn't exist (security)
        return {"message": "If an account exists, you'll receive reset instructions"}
    
    # Check if email is verified
    if not user.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please verify your email before resetting password"
        )
    
    # Create reset token
    reset_token = Database.create_password_reset_token(request.email)
    
    # Send reset email
    email_sent = await send_password_reset_email(request.email, reset_token)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send reset email. Please try again."
        )
    
    return {"message": "If an account exists, you'll receive reset instructions"}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password with token"""
    
    # Validate new password
    if not validate_password(request.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain letters and numbers"
        )
    
    # Verify reset token
    if not Database.verify_reset_token(request.email, request.token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Hash new password
    new_password_hash = Auth.hash_password(request.new_password)
    
    # Update password
    success = Database.update_user_password(request.email, new_password_hash)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password"
        )
    
    return {"message": "Password updated successfully"}

@router.delete('/delete-account')
async def delete_account(current_user: dict = Depends(get_current_user)):
    """
    Immediately delete user account and all associated data
    This is a permanent hard delete with no retention period
    """
    try:
        # Immediately delete all user data
        success = Database.delete_account_immediately(current_user["_id"])
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete account"
            )
        
        return {
            "message": "Account and all associated data have been permanently deleted.",
            "deletion_status": "completed"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting your account"
        )
