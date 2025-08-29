"""
Simple Gmail authentication using App Passwords (SMTP)
Much simpler than OAuth2 - just username and app password
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.conf import settings
from django.template.loader import render_to_string
from django.contrib import messages
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import EmailConfiguration
from cryptography.fernet import Fernet

class SimpleGmailService:
    """Simple Gmail service using App Passwords"""
    
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
    
    @staticmethod
    def get_encryption_key():
        """Get or create encryption key"""
        key = os.environ.get('EMAIL_ENCRYPTION_KEY')
        if not key:
            # For development, use a fixed key (in production, set environment variable)
            key = "iaCCHfHQCLz_aBh0aNx9Y_UodwYAZcFAQJ8g8v9hCQc="
            print(f"⚠️  Using default encryption key. For production, set: export EMAIL_ENCRYPTION_KEY='{key}'")
        return key.encode() if isinstance(key, str) else key
    
    @staticmethod
    def encrypt_password(password):
        """Encrypt app password for storage"""
        key = SimpleGmailService.get_encryption_key()
        f = Fernet(key)
        return f.encrypt(password.encode()).decode()
    
    @staticmethod
    def decrypt_password(encrypted_password):
        """Decrypt app password from storage"""
        key = SimpleGmailService.get_encryption_key()
        f = Fernet(key)
        return f.decrypt(encrypted_password.encode()).decode()
    
    def send_email(self, to_email, subject, html_content, text_content=None):
        """Send email using Gmail SMTP with App Password"""
        try:
            # Get credentials from EmailConfiguration
            try:
                config = EmailConfiguration.objects.get()
            except EmailConfiguration.DoesNotExist:
                return False, "Email configuration not found"
            
            if not config.gmail_email or not config.encrypted_gmail_app_password:
                return False, "Gmail credentials not configured"
            
            # Decrypt app password
            try:
                app_password = self.decrypt_password(config.encrypted_gmail_app_password)
            except Exception as e:
                return False, f"Failed to decrypt app password: {str(e)}"
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{config.from_name} <{config.gmail_email}>"
            msg['To'] = to_email
            
            # Add text and HTML parts
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(config.gmail_email, app_password)
                server.send_message(msg)
            
            return True, "Email sent successfully"
            
        except Exception as e:
            return False, f"Failed to send email: {str(e)}"

# Admin views for managing App Password authentication
@login_required
def configure_gmail_app_password(request):
    """Configure Gmail App Password"""
    if request.method == 'POST':
        gmail_email = request.POST.get('gmail_email')
        app_password = request.POST.get('app_password')
        
        if not gmail_email or not app_password:
            messages.error(request, 'Please provide both Gmail address and App Password')
            return redirect('admin:scheduler_emailconfiguration_changelist')
        
        try:
            # Get or create configuration
            config, created = EmailConfiguration.objects.get_or_create()
            
            # Store credentials
            service = SimpleGmailService()
            config.gmail_email = gmail_email
            config.encrypted_gmail_app_password = service.encrypt_password(app_password)
            config.gmail_enabled = True
            config.save()
            
            # Test sending (to test email if provided, or to the gmail account itself)
            test_email = config.test_email_address or gmail_email
            success, message = service.send_email(
                test_email,
                "Gmail Configuration Test - JW Attendant Scheduler",
                "<h1>Gmail Setup Successful!</h1><p>Your Gmail App Password is working correctly.</p>",
                "Gmail Setup Successful!\n\nYour Gmail App Password is working correctly."
            )
            
            if success:
                messages.success(request, f'Gmail App Password configured and tested successfully for {gmail_email}. Test email sent to {test_email}.')
            else:
                messages.warning(request, f'Gmail App Password saved for {gmail_email}, but test email failed: {message}. Please check your settings.')
            
        except Exception as e:
            messages.error(request, f'Error configuring Gmail: {str(e)}')
        
        return redirect('admin:scheduler_emailconfiguration_changelist')
    
    return redirect('admin:scheduler_emailconfiguration_changelist')

@staff_member_required
def test_gmail_app_password(request):
    """Test Gmail App Password connection"""
    try:
        config = EmailConfiguration.objects.get()
        
        if not config.gmail_email or not config.encrypted_gmail_app_password:
            return JsonResponse({
                'success': False,
                'message': 'Gmail App Password not configured'
            })
        
        service = SimpleGmailService()
        
        # Test with a simple email to test address or self
        test_email = config.test_email_address or config.gmail_email
        
        success, message = service.send_email(
            test_email,
            "Gmail Test - JW Attendant Scheduler",
            "<h2>✅ Gmail Test Successful!</h2><p>Your Gmail App Password is working correctly.</p>",
            "✅ Gmail Test Successful!\n\nYour Gmail App Password is working correctly."
        )
        
        if success:
            config.gmail_authenticated = True
            config.save()
        
        return JsonResponse({
            'success': success,
            'message': message,
            'email': config.gmail_email
        })
        
    except EmailConfiguration.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Email configuration not found'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Test failed: {str(e)}'
        })

@staff_member_required
def remove_gmail_app_password(request):
    """Remove Gmail App Password configuration"""
    try:
        config = EmailConfiguration.objects.get()
        config.gmail_email = ''
        config.encrypted_gmail_app_password = ''
        config.gmail_enabled = False
        config.gmail_authenticated = False
        config.save()
        
        messages.success(request, 'Gmail App Password removed successfully')
        
    except Exception as e:
        messages.error(request, f'Error removing Gmail configuration: {str(e)}')
    
    return redirect('admin:scheduler_emailconfiguration_changelist')

# Update the email service to use App Password method
def send_user_invitation(user, invitation_url):
    """Send user invitation email using App Password method"""
    try:
        config = EmailConfiguration.objects.get()
        
        if not config.send_invitation_emails or not config.gmail_enabled:
            return False, "Email invitations disabled"
        
        service = SimpleGmailService()
        
        # Render email templates
        context = {
            'user': user,
            'invitation_url': invitation_url,
            'site_name': config.site_name,
            'from_name': config.from_name,
        }
        
        html_content = render_to_string('scheduler/emails/user_invitation.html', context)
        text_content = render_to_string('scheduler/emails/user_invitation.txt', context)
        
        subject = f"Invitation to {config.site_name}"
        
        return service.send_email(user.email, subject, html_content, text_content)
        
    except EmailConfiguration.DoesNotExist:
        return False, "Email configuration not found"
    except Exception as e:
        return False, f"Error sending invitation: {str(e)}"
