"""
Gmail OAuth2 authentication views for JW Attendant Scheduler
"""

import os
import json
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.http import JsonResponse
from django.conf import settings
from django.urls import reverse
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from .models import EmailConfiguration

# Gmail API scopes
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

@staff_member_required
def gmail_auth_start(request):
    """Start Gmail OAuth2 authentication flow"""
    try:
        credentials_path = os.path.join(settings.BASE_DIR, 'gmail_credentials.json')
        
        if not os.path.exists(credentials_path):
            messages.error(request, 
                'Gmail credentials file not found. Please upload gmail_credentials.json to the project root.')
            return redirect('admin:scheduler_emailconfiguration_changelist')
        
        # Create flow instance
        flow = Flow.from_client_secrets_file(
            credentials_path,
            scopes=SCOPES,
            redirect_uri=request.build_absolute_uri(reverse('scheduler:gmail_auth_callback'))
        )
        
        # Generate authorization URL
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        
        # Store state in session for security
        request.session['gmail_auth_state'] = state
        
        return redirect(authorization_url)
        
    except Exception as e:
        messages.error(request, f'Error starting Gmail authentication: {str(e)}')
        return redirect('admin:scheduler_emailconfiguration_changelist')

@staff_member_required
def gmail_auth_callback(request):
    """Handle Gmail OAuth2 callback"""
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
        
        credentials_path = os.path.join(settings.BASE_DIR, 'gmail_credentials.json')
        token_path = os.path.join(settings.BASE_DIR, 'gmail_token.json')
        
        # Create flow and fetch token
        flow = Flow.from_client_secrets_file(
            credentials_path,
            scopes=SCOPES,
            redirect_uri=request.build_absolute_uri(reverse('scheduler:gmail_auth_callback'))
        )
        flow.fetch_token(code=code)
        
        # Save credentials
        creds = flow.credentials
        with open(token_path, 'w') as token_file:
            token_file.write(creds.to_json())
        
        # Test the connection
        service = build('gmail', 'v1', credentials=creds)
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
def gmail_test_connection(request):
    """Test Gmail API connection"""
    try:
        token_path = os.path.join(settings.BASE_DIR, 'gmail_token.json')
        
        if not os.path.exists(token_path):
            return JsonResponse({
                'success': False,
                'message': 'No Gmail authentication found. Please authenticate first.'
            })
        
        # Load and validate credentials
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
        
        if not creds.valid:
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
                # Save refreshed token
                with open(token_path, 'w') as token_file:
                    token_file.write(creds.to_json())
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
def gmail_revoke_auth(request):
    """Revoke Gmail authentication"""
    try:
        token_path = os.path.join(settings.BASE_DIR, 'gmail_token.json')
        
        # Remove token file
        if os.path.exists(token_path):
            os.remove(token_path)
        
        # Update configuration
        config, created = EmailConfiguration.objects.get_or_create()
        config.gmail_authenticated = False
        config.gmail_enabled = False
        config.save()
        
        messages.success(request, 'Gmail authentication revoked successfully.')
        return redirect('admin:scheduler_emailconfiguration_changelist')
        
    except Exception as e:
        messages.error(request, f'Error revoking Gmail authentication: {str(e)}')
        return redirect('admin:scheduler_emailconfiguration_changelist')
