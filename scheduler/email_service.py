"""
Email service for JW Attendant Scheduler using Google Gmail API
"""

import os
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import logging

logger = logging.getLogger(__name__)

# Gmail API scopes
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

class GmailService:
    """Service for sending emails through Gmail API"""
    
    def __init__(self):
        self.service = None
        self.credentials = None
        
    def authenticate(self):
        """Authenticate with Google Gmail API"""
        creds = None
        token_path = os.path.join(settings.BASE_DIR, 'gmail_token.json')
        credentials_path = os.path.join(settings.BASE_DIR, 'gmail_credentials.json')
        
        # Load existing token
        if os.path.exists(token_path):
            creds = Credentials.from_authorized_user_file(token_path, SCOPES)
        
        # If no valid credentials, authenticate
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(credentials_path):
                    raise FileNotFoundError(
                        f"Gmail credentials file not found at {credentials_path}. "
                        "Please download credentials from Google Cloud Console."
                    )
                
                flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save credentials for next run
            with open(token_path, 'w') as token:
                token.write(creds.to_json())
        
        self.credentials = creds
        self.service = build('gmail', 'v1', credentials=creds)
        return True
    
    def create_message(self, to_email, subject, html_content, text_content=None):
        """Create email message"""
        message = MIMEMultipart('alternative')
        message['to'] = to_email
        message['subject'] = subject
        
        # Add text version if provided
        if text_content:
            text_part = MIMEText(text_content, 'plain')
            message.attach(text_part)
        
        # Add HTML version
        html_part = MIMEText(html_content, 'html')
        message.attach(html_part)
        
        # Encode message
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        return {'raw': raw_message}
    
    def send_email(self, to_email, subject, html_content, text_content=None):
        """Send email via Gmail API"""
        try:
            if not self.service:
                self.authenticate()
            
            message = self.create_message(to_email, subject, html_content, text_content)
            result = self.service.users().messages().send(userId='me', body=message).execute()
            
            logger.info(f"Email sent successfully to {to_email}. Message ID: {result['id']}")
            return True, result['id']
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False, str(e)


def send_user_invitation(user, invitation_url):
    """Send user invitation email using App Password or Gmail API"""
    from .models import EmailConfiguration
    from .simple_gmail_auth import SimpleGmailService
    
    try:
        # Check if we have App Password configured
        config = EmailConfiguration.objects.get()
        if config.gmail_email and config.encrypted_gmail_app_password:
            # Use App Password method
            service = SimpleGmailService()
            
            # Render email template
            context = {
                'user': user,
                'invitation_url': invitation_url,
                'site_name': config.site_name or 'JW Attendant Scheduler',
                'from_name': config.from_name or 'JW Attendant Scheduler',
                'current_year': timezone.now().year,
            }
            
            html_content = render_to_string('scheduler/emails/user_invitation.html', context)
            text_content = render_to_string('scheduler/emails/user_invitation.txt', context)
            
            subject = f"Invitation to Join {context['site_name']}"
            
            return service.send_email(
                to_email=user.email,
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
        else:
            # Fall back to Gmail API method
            gmail_service = GmailService()
            
            context = {
                'user': user,
                'invitation_url': invitation_url,
                'site_name': 'JW Attendant Scheduler',
                'current_year': timezone.now().year,
            }
            
            html_content = render_to_string('scheduler/emails/user_invitation.html', context)
            text_content = render_to_string('scheduler/emails/user_invitation.txt', context)
            
            subject = f"Invitation to Join {context['site_name']}"
            
            return gmail_service.send_email(
                to_email=user.email,
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
            
    except EmailConfiguration.DoesNotExist:
        return False, "Email configuration not found"
    except Exception as e:
        return False, f"Email service error: {str(e)}"


def send_assignment_notification(assignment, notification_type='created'):
    """Send assignment notification email"""
    gmail_service = GmailService()
    
    # Determine email subject and template based on notification type
    if notification_type == 'created':
        subject = f"New Assignment: {assignment.event.name}"
        template_name = 'assignment_created'
    elif notification_type == 'updated':
        subject = f"Assignment Updated: {assignment.event.name}"
        template_name = 'assignment_updated'
    elif notification_type == 'cancelled':
        subject = f"Assignment Cancelled: {assignment.event.name}"
        template_name = 'assignment_cancelled'
    else:
        return False, "Invalid notification type"
    
    context = {
        'assignment': assignment,
        'attendant': assignment.attendant,
        'event': assignment.event,
        'site_name': 'JW Attendant Scheduler',
        'current_year': timezone.now().year,
    }
    
    html_content = render_to_string(f'scheduler/emails/{template_name}.html', context)
    text_content = render_to_string(f'scheduler/emails/{template_name}.txt', context)
    
    success, result = gmail_service.send_email(
        to_email=assignment.attendant.email,
        subject=subject,
        html_content=html_content,
        text_content=text_content
    )
    
    return success, result


def send_event_reminder(event, attendants):
    """Send event reminder to multiple attendants"""
    gmail_service = GmailService()
    results = []
    
    subject = f"Reminder: {event.name} - {event.start_date.strftime('%B %d, %Y')}"
    
    for attendant in attendants:
        # Get attendant's assignments for this event
        assignments = attendant.assignment_set.filter(event=event)
        
        context = {
            'attendant': attendant,
            'event': event,
            'assignments': assignments,
            'site_name': 'JW Attendant Scheduler',
            'current_year': timezone.now().year,
        }
        
        html_content = render_to_string('scheduler/emails/event_reminder.html', context)
        text_content = render_to_string('scheduler/emails/event_reminder.txt', context)
        
        success, result = gmail_service.send_email(
            to_email=attendant.email,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )
        
        results.append({
            'attendant': attendant.get_full_name(),
            'email': attendant.email,
            'success': success,
            'result': result
        })
    
    return results
