"""
Secure Gmail OAuth2 authentication with environment variables and database storage
"""

import os
import json
import base64
from django.conf import settings
from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.http import JsonResponse
from django.urls import reverse
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from .models import EmailConfiguration
from cryptography.fernet import Fernet

# Gmail API scopes
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

class SecureGmailAuth:
    """Secure Gmail authentication using environment variables"""
    
    @staticmethod
    def get_encryption_key():
        """Get or create encryption key for storing sensitive data"""
        key = os.environ.get('GMAIL_ENCRYPTION_KEY')
        if not key:
            # Generate a new key (in production, this should be set manually)
            key = Fernet.generate_key().decode()
            print(f"⚠️  SECURITY: Set this environment variable:")
            print(f"export GMAIL_ENCRYPTION_KEY='{key}'")
        return key.encode() if isinstance(key, str) else key
    
    @staticmethod
    def encrypt_data(data):
        """Encrypt sensitive data for database storage"""
        key = SecureGmailAuth.get_encryption_key()
        f = Fernet(key)
        return f.encrypt(data.encode()).decode()
    
    @staticmethod
    def decrypt_data(encrypted_data):
        """Decrypt sensitive data from database"""
        key = SecureGmailAuth.get_encryption_key()
        f = Fernet(key)
        return f.decrypt(encrypted_data.encode()).decode()
    
    @staticmethod
    def get_client_config():
        """Get OAuth2 client configuration from environment variables"""
        client_id = os.environ.get('GOOGLE_CLIENT_ID')
        client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
        
        if not client_id or not client_secret:
            raise ValueError(
                "Missing Google OAuth2 credentials. Please set environment variables:\n"
                "GOOGLE_CLIENT_ID=your-client-id.googleusercontent.com\n"
                "GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret"
            )
        
        return {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [f"{settings.SITE_URL}/gmail/auth/callback/"]
            }
        }
    
    @staticmethod
    def store_credentials(credentials):
        """Securely store credentials in database"""
        config, created = EmailConfiguration.objects.get_or_create()
        
        # Encrypt and store the credentials
        creds_json = credentials.to_json()
        encrypted_creds = SecureGmailAuth.encrypt_data(creds_json)
        
        # Store in a new field (we'll add this to the model)
        config.encrypted_gmail_token = encrypted_creds
        config.gmail_authenticated = True
        config.save()
    
    @staticmethod
    def load_credentials():
        """Load and decrypt credentials from database"""
        try:
            config = EmailConfiguration.objects.get()
            if not config.encrypted_gmail_token:
                return None
            
            # Decrypt credentials
            creds_json = SecureGmailAuth.decrypt_data(config.encrypted_gmail_token)
            return Credentials.from_authorized_user_info(json.loads(creds_json), SCOPES)
        except (EmailConfiguration.DoesNotExist, Exception):
            return None

@staff_member_required
def secure_gmail_auth_start(request):
    """Start secure Gmail OAuth2 authentication flow"""
    try:
        # Get client configuration from environment
        client_config = SecureGmailAuth.get_client_config()
        
        # Create flow instance
        flow = Flow.from_client_config(
            client_config,
            scopes=SCOPES,
            redirect_uri=request.build_absolute_uri(reverse('scheduler:secure_gmail_auth_callback'))
        )
        
        # Generate authorization URL
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        
        # Store state in session for security
        request.session['gmail_auth_state'] = state
        
        return redirect(authorization_url)
        
    except ValueError as e:
        messages.error(request, f'Configuration error: {str(e)}')
        return redirect('admin:scheduler_emailconfiguration_changelist')
    except Exception as e:
        messages.error(request, f'Error starting Gmail authentication: {str(e)}')
        return redirect('admin:scheduler_emailconfiguration_changelist')

@staff_member_required
def secure_gmail_auth_callback(request):
    """Handle secure Gmail OAuth2 callback"""
    try:
        # Verify state parameter
        state = request.session.get('gmail_auth_state')
        if not state or request.GET.get('state') != state:
            messages.error(request, 'Invalid authentication state. Please try again.')
            return redirect('admin:scheduler_emailconfiguration_changelist')
        
        # Check for authorization code
        code = request.GET.get('code')
        if not code:
            error = request.GET.get('error', 'Unknown error')
            messages.error(request, f'Gmail authentication failed: {error}')
            return redirect('admin:scheduler_emailconfiguration_changelist')
        
        # Get client configuration
        client_config = SecureGmailAuth.get_client_config()
        
        # Create flow and fetch token
        flow = Flow.from_client_config(
            client_config,
            scopes=SCOPES,
            redirect_uri=request.build_absolute_uri(reverse('scheduler:secure_gmail_auth_callback'))
        )
        flow.fetch_token(code=code)
        
        # Securely store credentials
        SecureGmailAuth.store_credentials(flow.credentials)
        
        # Test the connection
        service = build('gmail', 'v1', credentials=flow.credentials)
        profile = service.users().getProfile(userId='me').execute()
        email_address = profile.get('emailAddress', 'Unknown')
        
        # Update EmailConfiguration
        config, created = EmailConfiguration.objects.get_or_create()
        config.gmail_authenticated = True
        config.gmail_enabled = True
        config.save()
        
        # Clean up session
        if 'gmail_auth_state' in request.session:
            del request.session['gmail_auth_state']
        
        messages.success(request, 
            f'Gmail authentication successful! Connected to: {email_address}')
        return redirect('admin:scheduler_emailconfiguration_changelist')
        
    except Exception as e:
        messages.error(request, f'Error completing Gmail authentication: {str(e)}')
        return redirect('admin:scheduler_emailconfiguration_changelist')

@staff_member_required
def secure_gmail_test_connection(request):
    """Test secure Gmail API connection"""
    try:
        # Load credentials from database
        creds = SecureGmailAuth.load_credentials()
        
        if not creds:
            return JsonResponse({
                'success': False,
                'message': 'No Gmail authentication found. Please authenticate first.'
            })
        
        # Refresh if needed
        if not creds.valid:
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
                # Re-store refreshed credentials
                SecureGmailAuth.store_credentials(creds)
            else:
                return JsonResponse({
                    'success': False,
                    'message': 'Gmail authentication expired. Please re-authenticate.'
                })
        
        # Test connection
        service = build('gmail', 'v1', credentials=creds)
        profile = service.users().getProfile(userId='me').execute()
        email_address = profile.get('emailAddress', 'Unknown')
        
        # Update configuration
        config, created = EmailConfiguration.objects.get_or_create()
        config.gmail_authenticated = True
        config.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Gmail connection successful! Connected to: {email_address}',
            'email': email_address
        })
        
    except Exception as e:
        # Update configuration
        config, created = EmailConfiguration.objects.get_or_create()
        config.gmail_authenticated = False
        config.save()
        
        return JsonResponse({
            'success': False,
            'message': f'Gmail connection failed: {str(e)}'
        })

@staff_member_required
def secure_gmail_revoke_auth(request):
    """Revoke secure Gmail authentication"""
    try:
        # Remove encrypted credentials from database
        config, created = EmailConfiguration.objects.get_or_create()
        config.encrypted_gmail_token = ''
        config.gmail_authenticated = False
        config.gmail_enabled = False
        config.save()
        
        messages.success(request, 'Gmail authentication revoked successfully.')
        return redirect('admin:scheduler_emailconfiguration_changelist')
        
    except Exception as e:
        messages.error(request, f'Error revoking Gmail authentication: {str(e)}')
        return redirect('admin:scheduler_emailconfiguration_changelist')
