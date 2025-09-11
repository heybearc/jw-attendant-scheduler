# Gmail API Setup Instructions

## Overview
The JW Attendant Scheduler now includes Gmail integration for sending user invitations and notifications. Follow these steps to set up Gmail API access.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Name it something like "JW Attendant Scheduler"

## Step 2: Enable Gmail API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Gmail API"
3. Click on "Gmail API" and click **Enable**

## Step 3: Create Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in required fields:
     - App name: "JW Attendant Scheduler"
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes: `https://www.googleapis.com/auth/gmail.send`
   - Add test users (your Gmail address)

4. Create OAuth client ID:
   - Application type: **Desktop application**
   - Name: "JW Scheduler Gmail Client"
   - Click **Create**

## Step 4: Download Credentials

1. Download the JSON file (it will be named something like `client_secret_xxx.json`)
2. Rename it to `gmail_credentials.json`
3. Place it in your project root directory:
   ```
   /Users/cory/Documents/Cloudy-Work/applications/jw-attendant-scheduler/gmail_credentials.json
   ```

## Step 5: First-Time Authentication

1. When you first try to send an invitation, the system will:
   - Open a browser window for Google OAuth
   - Ask you to sign in with your Gmail account
   - Request permission to send emails on your behalf
   - Save the authentication token for future use

## Security Notes

- The `gmail_credentials.json` file contains sensitive information
- The `gmail_token.json` file (created after first auth) contains your access token
- Both files are gitignored for security
- Only share these files with authorized administrators

## Testing the Integration

1. Start your Django server
2. Go to Users > Invite User
3. Fill out the invitation form
4. Submit - this will trigger the Gmail authentication flow
5. Check that the invitation email was sent successfully

## Troubleshooting

### "File not found" error
- Ensure `gmail_credentials.json` is in the project root
- Check file permissions

### Authentication fails
- Verify your Gmail account has access to the Google Cloud project
- Check that Gmail API is enabled
- Ensure you're added as a test user in OAuth consent screen

### Email sending fails
- Check your Gmail account has sufficient quota
- Verify the recipient email address is valid
- Check Django logs for detailed error messages

## Production Considerations

For production deployment:
1. Move credentials to environment variables or secure storage
2. Consider using a service account instead of OAuth
3. Set up proper error handling and logging
4. Monitor API usage and quotas
