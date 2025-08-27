import requests
import os
import logging
from typing import Optional
from jinja2 import Environment, BaseLoader
from dotenv import load_dotenv

load_dotenv()

EMAIL_SENDING_KEY = os.getenv("EMAIL_SENDING_KEY")
DOMAIN = "dmify.app"
FROM_EMAIL = f"DMify <postmaster@{DOMAIN}>"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

if FRONTEND_URL == "http://localhost:3000":
    FRONTEND_URL = "http://localhost:5173"

if not EMAIL_SENDING_KEY:
    logging.error("EMAIL_SENDING_KEY environment variable not found!")
else:
    logging.info(f"EMAIL_SENDING_KEY loaded successfully (length: {len(EMAIL_SENDING_KEY)})")

template_env = Environment(loader=BaseLoader())

verification_template = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Welcome to DMify!</h2>
    <p>Thanks for signing up. Please verify your email address by entering this verification code in our app:</p>
    <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #f8f9fa; border: 2px solid #007bff; color: #007bff; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 4px; display: inline-block;">
            {{ verification_code }}
        </div>
    </div>
    <p>This verification code will expire in 15 minutes.</p>
    <p>If you didn't create an account with us, please ignore this email.</p>
</body>
</html>
"""

reset_password_template = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Reset Your Password</h2>
    <p>You requested a password reset. Click the button below to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ reset_url }}" 
           style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
        </a>
    </div>
    <p>Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; color: #666;">{{ reset_url }}</p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't request this reset, please ignore this email.</p>
</body>
</html>
"""

async def send_email_mailgun(to_email: str, subject: str, html_content: str) -> bool:
    try:
        url = f"https://api.mailgun.net/v3/{DOMAIN}/messages"
        
        data = {
            "from": FROM_EMAIL,
            "to": to_email,
            "subject": subject,
            "html": html_content
        }
        
        response = requests.post(
            url,
            auth=("api", EMAIL_SENDING_KEY),
            data=data,
            timeout=10
        )
        
        if response.status_code == 200:
            logging.info(f"Email sent successfully to {to_email}")
            return True
        else:
            logging.error(f"Failed to send email to {to_email}. Status: {response.status_code}, Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        logging.error(f"Request error sending email to {to_email}: {str(e)}")
        return False
    except Exception as e:
        logging.error(f"Unexpected error sending email to {to_email}: {str(e)}")
        return False

async def send_verification_email(email: str, verification_code: str) -> bool:
    template = template_env.from_string(verification_template)
    html_content = template.render(verification_code=verification_code)
    
    return await send_email_mailgun(
        to_email=email,
        subject="Verify Your Email - DMify",
        html_content=html_content
    )

async def send_password_reset_email(email: str, token: str) -> bool:
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    template = template_env.from_string(reset_password_template)
    html_content = template.render(reset_url=reset_url)
    
    return await send_email_mailgun(
        to_email=email,
        subject="Reset Your Password - DMify",
        html_content=html_content
    )

async def send_leads_ready_email(email: str, project_name: str, lead_count: int) -> bool:
    subject = f"🎉 Your leads are ready for '{project_name}'"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">🎉 Your Leads Are Ready!</h2>
                <p>Great news! We've successfully processed your lead generation request.</p>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #2563eb;">Project: {project_name}</h3>
                    <p style="margin: 0; font-size: 18px;"><strong>{lead_count} leads</strong> have been generated and are now available in your dashboard.</p>
                </div>
                
                <p>Your AI-powered lead generation is complete! You can now:</p>
                <ul>
                    <li>View and analyze your new leads</li>
                    <li>Export lead data</li>
                    <li>Start your outreach campaigns</li>
                </ul>
                
                <a href="{FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Your Leads</a>
                
                <p>Ready to scale your business with these high-quality leads!</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #666; font-size: 14px;">
                    Best regards,<br>
                    The DMify Team<br>
                    <em>Powering your lead generation with AI</em>
                </p>
            </div>
        </body>
    </html>
    """
    
    return await send_email_mailgun(
        to_email=email,
        subject=subject,
        html_content=html_content
    )