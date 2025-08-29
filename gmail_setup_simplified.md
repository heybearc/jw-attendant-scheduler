# Simplified Gmail Setup for JW Attendant Scheduler

## Quick Setup Process

### 1. Google Cloud Console Setup (5 minutes)

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create or select a project**
3. **Enable Gmail API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API" and enable it
4. **Create OAuth2 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "JW Attendant Scheduler"
   - Authorized redirect URIs: `http://localhost:8000/scheduler/gmail/auth/callback/`
   - Download the JSON file as `gmail_credentials.json`

### 2. Install Credentials

1. **Place the downloaded `gmail_credentials.json` file in your project root:**
   ```
   /Users/cory/Documents/Cloudy-Work/applications/jw-attendant-scheduler-django/gmail_credentials.json
   ```

### 3. Authenticate in Django Admin

1. **Go to Django Admin:** `http://localhost:8000/admin/`
2. **Navigate to:** "Email Configuration"
3. **Click the blue "🔐 Authenticate with Gmail" button**
4. **Follow the Google OAuth flow:**
   - Sign in to your Google account
   - Grant permissions to send emails
   - You'll be redirected back to the admin
5. **Test the connection** using the "🧪 Test Connection" button

## That's It! 🎉

Your Django app can now send emails through your Gmail account automatically. The system will:

- ✅ Send user invitation emails
- ✅ Send assignment notifications (if enabled)
- ✅ Send event reminders (if enabled)
- ✅ Automatically refresh authentication tokens
- ✅ Handle errors gracefully

## Security Notes

- The `gmail_credentials.json` and `gmail_token.json` files are automatically gitignored
- Only admin users can access the authentication flow
- Tokens are automatically refreshed when needed
- You can revoke access anytime from the admin interface

## Troubleshooting

**"Credentials file not found"** → Make sure `gmail_credentials.json` is in the project root

**"Authentication failed"** → Check that your redirect URI in Google Cloud Console matches exactly: `http://localhost:8000/scheduler/gmail/auth/callback/`

**"Access denied"** → Make sure you're using an admin account in Django

## Production Setup

For production, update the redirect URI in Google Cloud Console to your production domain:
```
https://yourdomain.com/scheduler/gmail/auth/callback/
```
