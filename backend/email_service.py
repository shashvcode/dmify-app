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
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://dmify.app")
ADMIN_EMAIL = "shashi.optimizestudio@gmail.com"

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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - DMify</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .glass-effect {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .electric-blue { color: #4F46E5; }
        .neon-purple { color: #7C3AED; }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Main Container -->
        <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 24px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
            
            <!-- Header with Logo -->
            <div style="text-align: center; margin-bottom: 40px;">
                <img src="https://dmify.app/dmifylogo.png" alt="DMify" style="height: 48px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                    Welcome to DMify!
                </h1>
            </div>
            
            <!-- Content -->
            <div style="text-align: center; margin-bottom: 40px;">
                <p style="font-size: 18px; color: #6B7280; margin-bottom: 30px; line-height: 1.6;">
                    Thanks for signing up! Please verify your email address by entering this verification code in our app:
                </p>
                
                <!-- Verification Code -->
                <div style="margin: 40px 0;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 24px 32px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);">
                        <div style="color: white; font-size: 36px; font-weight: 800; letter-spacing: 8px; font-family: 'Inter', monospace;">
                            {{ verification_code }}
                        </div>
                    </div>
                </div>
                
                <p style="font-size: 16px; color: #9CA3AF; margin-bottom: 30px;">
                    This verification code will expire in <strong style="color: #4F46E5;">15 minutes</strong>.
                </p>
            </div>
            
            <!-- Instructions Section -->
            <div style="text-align: center; margin-bottom: 30px;">
                <p style="font-size: 16px; color: #6B7280; margin: 0; line-height: 1.6;">
                    Enter this code in the verification form to complete your signup.
                </p>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #E5E7EB; padding-top: 30px; text-align: center;">
                <p style="font-size: 14px; color: #9CA3AF; margin: 0;">
                    If you didn't create an account with us, please ignore this email.
                </p>
                <p style="font-size: 14px; color: #9CA3AF; margin: 10px 0 0 0;">
                    Questions? <a href="mailto:support@dmify.app" style="color: #4F46E5; text-decoration: none;">Contact our support team</a>
                </p>
            </div>
        </div>
        
        <!-- Bottom Footer -->
        <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 14px; color: rgba(255, 255, 255, 0.8); margin: 0;">
                © 2024 DMify - AI-Powered Instagram DM Automation
            </p>
        </div>
    </div>
</body>
</html>
"""

reset_password_template = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - DMify</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .glass-effect {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .electric-blue { color: #4F46E5; }
        .neon-purple { color: #7C3AED; }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Main Container -->
        <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 24px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
            
            <!-- Header with Logo -->
            <div style="text-align: center; margin-bottom: 40px;">
                <img src="https://dmify.app/dmifylogo.png" alt="DMify" style="height: 48px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                    Reset Your Password
                </h1>
            </div>
            
            <!-- Content -->
            <div style="text-align: center; margin-bottom: 40px;">
                <p style="font-size: 18px; color: #6B7280; margin-bottom: 30px; line-height: 1.6;">
                    You requested a password reset for your DMify account. Click the button below to create a new password:
                </p>
                
                <!-- Reset Button -->
                <div style="margin: 40px 0;">
                    <a href="{{ reset_url }}" style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.4); transition: all 0.3s ease;">
                        Reset My Password →
                    </a>
                </div>
                
                <p style="font-size: 16px; color: #9CA3AF; margin-bottom: 20px;">
                    This link will expire in <strong style="color: #4F46E5;">1 hour</strong> for security.
                </p>
                
                <!-- Alternative Link -->
                <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 30px 0;">
                    <p style="font-size: 14px; color: #6B7280; margin-bottom: 10px;">
                        If the button doesn't work, copy and paste this link:
                    </p>
                    <p style="word-break: break-all; color: #4F46E5; font-size: 14px; font-family: monospace; margin: 0;">
                        {{ reset_url }}
                    </p>
                </div>
            </div>
            
            <!-- Security Notice -->
            <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <div style="background: #F59E0B; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <span style="color: white; font-weight: bold; font-size: 14px;">!</span>
                    </div>
                    <p style="font-size: 16px; font-weight: 600; color: #92400E; margin: 0;">
                        Security Notice
                    </p>
                </div>
                <p style="font-size: 14px; color: #92400E; margin: 0; line-height: 1.5;">
                    If you didn't request this password reset, please ignore this email. Your account remains secure.
                </p>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #E5E7EB; padding-top: 30px; text-align: center;">
                <p style="font-size: 14px; color: #9CA3AF; margin: 10px 0 0 0;">
                    Questions? <a href="mailto:support@dmify.app" style="color: #4F46E5; text-decoration: none;">Contact our support team</a>
                </p>
            </div>
        </div>
        
        <!-- Bottom Footer -->
        <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 14px; color: rgba(255, 255, 255, 0.8); margin: 0;">
                © 2024 DMify - AI-Powered Instagram DM Automation
            </p>
        </div>
    </div>
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
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Leads Are Ready - DMify</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            .gradient-bg {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }}
            
            .glass-effect {{
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }}
            
            .electric-blue {{ color: #4F46E5; }}
            .neon-purple {{ color: #7C3AED; }}
        </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Main Container -->
            <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 24px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
                
                <!-- Header with Logo -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <img src="https://dmify.app/dmifylogo.png" alt="DMify" style="height: 48px; margin-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                        🎉 Your Leads Are Ready!
                    </h1>
                </div>
                
                <!-- Content -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <p style="font-size: 18px; color: #6B7280; margin-bottom: 30px; line-height: 1.6;">
                        Great news! We've successfully processed your lead generation request and your personalized DMs are ready.
                    </p>
                    
                    <!-- Project Card -->
                    <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); border-radius: 16px; padding: 30px; margin: 30px 0; color: white; box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);">
                        <h2 style="margin: 0 0 15px 0; font-size: 24px; font-weight: 700;">
                            {project_name}
                        </h2>
                        <div style="font-size: 36px; font-weight: 800; margin: 20px 0;">
                            {lead_count} Messages Generated
                        </div>
                        <p style="margin: 0; opacity: 0.9; font-size: 16px;">
                            Ready for your outreach campaigns
                        </p>
                    </div>
                    
                    <!-- Features List -->
                    <div style="text-align: left; background: #F9FAFB; border-radius: 16px; padding: 30px; margin: 30px 0;">
                        <h3 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 700; color: #1F2937;">
                            What you can do now:
                        </h3>
                        <div style="space-y: 15px;">
                            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                                <div style="background: #10B981; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                                    <span style="color: white; font-weight: bold; font-size: 14px;">✓</span>
                                </div>
                                <span style="color: #374151; font-size: 16px;">View and analyze your personalized messages</span>
                            </div>
                            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                                <div style="background: #10B981; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                                    <span style="color: white; font-weight: bold; font-size: 14px;">✓</span>
                                </div>
                                <span style="color: #374151; font-size: 16px;">Copy messages for your Instagram outreach</span>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <div style="background: #10B981; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                                    <span style="color: white; font-weight: bold; font-size: 14px;">✓</span>
                                </div>
                                <span style="color: #374151; font-size: 16px;">Start converting prospects into customers</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- CTA Section -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <a href="{FRONTEND_URL}/app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.4); transition: all 0.3s ease;">
                        View My Messages →
                    </a>
                </div>
                
                <!-- Success Message -->
                <div style="background: #ECFDF5; border: 1px solid #10B981; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div style="background: #10B981; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                            <span style="color: white; font-weight: bold; font-size: 14px;">✓</span>
                        </div>
                        <p style="font-size: 16px; font-weight: 600; color: #065F46; margin: 0;">
                            Ready to Scale Your Outreach
                        </p>
                    </div>
                    <p style="font-size: 14px; color: #065F46; margin: 0; line-height: 1.5;">
                        Your AI-powered messages are crafted to get responses. Time to turn prospects into customers!
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="border-top: 1px solid #E5E7EB; padding-top: 30px; text-align: center;">
                    <p style="font-size: 14px; color: #9CA3AF; margin: 0;">
                        Best regards,<br>
                        <strong style="color: #4F46E5;">The DMify Team</strong><br>
                        <em>Powering your Instagram outreach with AI</em>
                    </p>
                    <p style="font-size: 14px; color: #9CA3AF; margin: 15px 0 0 0;">
                        Questions? <a href="mailto:support@dmify.app" style="color: #4F46E5; text-decoration: none;">Contact our support team</a>
                    </p>
                </div>
            </div>
            
            <!-- Bottom Footer -->
            <div style="text-align: center; margin-top: 30px;">
                <p style="font-size: 14px; color: rgba(255, 255, 255, 0.8); margin: 0;">
                    © 2024 DMify - AI-Powered Instagram DM Automation
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email_mailgun(
        to_email=email,
        subject=subject,
        html_content=html_content
    )

# Admin notification template for new user signups
admin_notification_template = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New User Signup - DMify</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .glass-effect {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .electric-blue { color: #4F46E5; }
        .neon-purple { color: #7C3AED; }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Main Container -->
        <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 24px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
            
            <!-- Header with Logo -->
            <div style="text-align: center; margin-bottom: 40px;">
                <img src="https://dmify.app/dmifylogo.png" alt="DMify" style="height: 48px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                    🎉 New User Signup!
                </h1>
            </div>
            
            <!-- Content -->
            <div style="margin-bottom: 40px;">
                <p style="font-size: 18px; color: #6B7280; margin-bottom: 30px; line-height: 1.6;">
                    Great news! A new user has just signed up for DMify:
                </p>
                
                <!-- User Details -->
                <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin: 30px 0;">
                    <h3 style="font-size: 18px; font-weight: 600; color: #4F46E5; margin-bottom: 16px;">User Details</h3>
                    <div style="space-y: 12px;">
                        <p style="margin: 8px 0; color: #374151;"><strong>Name:</strong> {{ user_name }}</p>
                        <p style="margin: 8px 0; color: #374151;"><strong>Email:</strong> {{ user_email }}</p>
                        <p style="margin: 8px 0; color: #374151;"><strong>Signup Time:</strong> {{ signup_time }}</p>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div style="text-align: center; margin: 40px 0;">
                    <a href="https://dmify.app/app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.4); margin-right: 12px;">
                        View Dashboard
                    </a>
                    <a href="mailto:{{ user_email }}" style="display: inline-block; background: transparent; color: #4F46E5; text-decoration: none; padding: 16px 32px; border: 2px solid #4F46E5; border-radius: 12px; font-weight: 600; font-size: 16px;">
                        Contact User
                    </a>
                </div>
            </div>
            
            <!-- Stats Notice -->
            <div style="background: #DBEAFE; border: 1px solid #3B82F6; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <div style="background: #3B82F6; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <span style="color: white; font-weight: bold; font-size: 14px;">📊</span>
                    </div>
                    <p style="font-size: 16px; font-weight: 600; color: #1E40AF; margin: 0;">
                        Growing Strong!
                    </p>
                </div>
                <p style="font-size: 14px; color: #1E40AF; margin: 0; line-height: 1.5;">
                    Your user base is expanding. This new signup brings you one step closer to your goals!
                </p>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #E5E7EB; padding-top: 30px; text-align: center;">
                <p style="font-size: 14px; color: #9CA3AF; margin: 10px 0 0 0;">
                    DMify Admin Notification System
                </p>
            </div>
        </div>
        
        <!-- Bottom Footer -->
        <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 14px; color: rgba(255, 255, 255, 0.8); margin: 0;">
                © 2024 DMify - AI-Powered Instagram DM Automation
            </p>
        </div>
    </div>
</body>
</html>
"""

async def send_admin_signup_notification(user_name: str, user_email: str) -> bool:
    """Send admin notification when a new user signs up"""
    try:
        from datetime import datetime
        
        # Format current time
        signup_time = datetime.utcnow().strftime("%B %d, %Y at %I:%M %p UTC")
        
        # Render template
        template = template_env.from_string(admin_notification_template)
        html_content = template.render(
            user_name=user_name,
            user_email=user_email,
            signup_time=signup_time
        )
        
        # Send notification to admin
        return await send_email_mailgun(
            to_email=ADMIN_EMAIL,
            subject=f"🎉 New DMify Signup: {user_name}",
            html_content=html_content
        )
    except Exception as e:
        logging.error(f"Failed to send admin signup notification: {str(e)}")
        return False