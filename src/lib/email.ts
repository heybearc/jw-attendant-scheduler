import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface InvitationEmailData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  tempPassword: string;
  loginUrl: string;
}

// Get email configuration from environment variables or database
async function getEmailConfig(): Promise<EmailConfig | null> {
  // Try environment variables first
  let smtpUser = process.env.SMTP_USER;
  let smtpPassword = process.env.SMTP_PASSWORD;
  let smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  let smtpPort = parseInt(process.env.SMTP_PORT || '587');
  let smtpSecure = process.env.SMTP_SECURE === 'true';

  // If not in env, try database
  if (!smtpUser || !smtpPassword) {
    try {
      const configRecord = await prisma.system_settings.findFirst({
        where: { key: 'email_config' }
      });
      
      if (configRecord && configRecord.value) {
        const emailConfig = JSON.parse(configRecord.value as string);
        
        // Handle nested config structure from admin panel
        if (emailConfig.authType === 'gmail' && emailConfig.config) {
          smtpUser = emailConfig.config.gmailEmail;
          smtpPassword = emailConfig.config.gmailAppPassword;
          smtpHost = emailConfig.config.smtpServer || smtpHost;
          smtpPort = parseInt(emailConfig.config.smtpPort) || smtpPort;
          smtpSecure = emailConfig.config.smtpSecure !== undefined ? emailConfig.config.smtpSecure : smtpSecure;
        } else if (emailConfig.authType === 'smtp' && emailConfig.config) {
          smtpUser = emailConfig.config.smtpUser;
          smtpPassword = emailConfig.config.smtpPassword;
          smtpHost = emailConfig.config.smtpServer || smtpHost;
          smtpPort = parseInt(emailConfig.config.smtpPort) || smtpPort;
          smtpSecure = emailConfig.config.smtpSecure !== undefined ? emailConfig.config.smtpSecure : smtpSecure;
        } else {
          // Fallback to flat structure
          smtpUser = emailConfig.smtpUser;
          smtpPassword = emailConfig.smtpPassword;
          smtpHost = emailConfig.smtpHost || smtpHost;
          smtpPort = emailConfig.smtpPort || smtpPort;
          smtpSecure = emailConfig.smtpSecure || smtpSecure;
        }
      }
    } catch (error) {
      console.error('Error loading email config from database:', error);
    }
  }

  if (!smtpUser || !smtpPassword) {
    console.warn('Email configuration not found. SMTP credentials required.');
    return null;
  }

  // Port 587 = STARTTLS (secure must be false), port 465 = SSL (secure must be true)
  // Override stored value to prevent misconfiguration causing SSL handshake errors
  if (smtpPort === 587) smtpSecure = false;
  if (smtpPort === 465) smtpSecure = true;

  return {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword
    }
  };
}

// Create email transporter
export async function createEmailTransporter() {
  const config = await getEmailConfig();
  if (!config) {
    throw new Error('Email configuration not available');
  }

  return nodemailer.createTransport(config);
}

// Send email utility
export async function sendEmail(options: EmailOptions): Promise<void> {
  const config = await getEmailConfig();
  if (!config) {
    throw new Error('Email configuration not available');
  }
  const transporter = nodemailer.createTransport(config);

  const fromName = process.env.EMAIL_FROM_NAME || 'TheoShift Team';
  const fromEmail =
    process.env.EMAIL_FROM || process.env.SMTP_USER || config.auth.user;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  };

  await transporter.sendMail(mailOptions);
}

// Generate invitation email HTML template
export function generateInvitationEmail(data: InvitationEmailData): string {
  const roleDisplayName = data.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Theocratic Shift Scheduler</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #dc2626; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🛡️ Theocratic Shift Scheduler</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Welcome to the Team!</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px 20px;">
          <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${data.firstName}!</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
            You have been invited to join the Theocratic Shift Scheduler system. Your account has been created with the following details:
          </p>

          <!-- Account Details -->
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 15px 0;">Account Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Name:</td>
                <td style="padding: 8px 0; color: #374151;">${data.firstName} ${data.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Email:</td>
                <td style="padding: 8px 0; color: #374151;">${data.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Role:</td>
                <td style="padding: 8px 0; color: #374151;">${roleDisplayName}</td>
              </tr>
            </table>
          </div>

          <!-- Login Credentials -->
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #92400e; margin: 0 0 15px 0;">🔑 Login Credentials</h3>
            <p style="color: #92400e; margin: 0 0 10px 0; font-weight: 500;">Temporary Password:</p>
            <div style="background-color: #ffffff; border: 1px solid #d97706; border-radius: 4px; padding: 12px; font-family: monospace; font-size: 16px; font-weight: bold; color: #92400e; letter-spacing: 1px;">
              ${data.tempPassword}
            </div>
            <p style="color: #92400e; margin: 15px 0 0 0; font-size: 14px;">
              ⚠️ <strong>Important:</strong> You will be required to change this password on your first login for security purposes.
            </p>
          </div>

          <!-- Getting Started -->
          <div style="margin: 30px 0;">
            <h3 style="color: #374151; margin: 0 0 15px 0;">Getting Started</h3>
            <ol style="color: #6b7280; line-height: 1.6; padding-left: 20px;">
              <li style="margin: 8px 0;">Click the login button below to access the system</li>
              <li style="margin: 8px 0;">Use your email address and the temporary password provided</li>
              <li style="margin: 8px 0;">Create a new secure password when prompted</li>
              <li style="margin: 8px 0;">Complete your profile setup</li>
            </ol>
          </div>

          <!-- Login Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" style="display: inline-block; background-color: #dc2626; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              🚀 Login to Your Account
            </a>
          </div>

          <!-- Role Information -->
          <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0;">👥 Your Role: ${roleDisplayName}</h3>
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
              ${getRoleDescription(data.role)}
            </p>
          </div>

          <!-- Support -->
          <div style="margin: 30px 0;">
            <h3 style="color: #374151; margin: 0 0 15px 0;">Need Help?</h3>
            <p style="color: #6b7280; line-height: 1.6; margin: 0;">
              If you have any questions or need assistance getting started, please contact your system administrator or overseer.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #374151; color: #d1d5db; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">
            TheoShift - Supporting Theocratic Event Coordination
          </p>
          <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
            This email was sent automatically. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Get role description for email template
function getRoleDescription(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'You have full administrative access to manage users, events, and system settings.';
    case 'OVERSEER':
      return 'You can manage events, assign attendants, and oversee Kingdom Hall operations.';
    case 'ASSISTANT_OVERSEER':
      return 'You can assist with event management and attendant coordination.';
    case 'KEYMAN':
      return 'You are responsible for facility access, setup, and key management.';
    case 'VOLUNTEER':
      return 'You can view your assignments and participate in assigned Kingdom Hall events.';
    default:
      return 'You have been granted access to the Theocratic Shift Scheduler system.';
  }
}

// Send invitation email
export async function sendInvitationEmail(data: InvitationEmailData): Promise<void> {
  const html = generateInvitationEmail(data);
  
  const subject = `Welcome to Theocratic Shift Scheduler - Your Account is Ready!`;
  
  const text = `
Welcome to Theocratic Shift Scheduler!

Hello ${data.firstName},

You have been invited to join the Theocratic Shift Scheduler system.

Account Details:
- Name: ${data.firstName} ${data.lastName}
- Email: ${data.email}
- Role: ${data.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

Login Credentials:
- Temporary Password: ${data.tempPassword}
- Login URL: ${data.loginUrl}

IMPORTANT: You will be required to change this password on your first login.

Getting Started:
1. Visit the login URL above
2. Use your email and temporary password
3. Create a new secure password when prompted
4. Complete your profile setup

If you need assistance, please contact your system administrator.

Theocratic Shift Scheduler
  `;

  await sendEmail({
    to: data.email,
    subject,
    html,
    text
  });
}

// Generate password reset email HTML template
export function generatePasswordResetEmail(data: { firstName: string; email: string; newPassword: string; loginUrl: string }): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - TheoShift</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #1e40af; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔐 Password Reset</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">TheoShift Account</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px 20px;">
          <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${data.firstName}!</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
            Your TheoShift account password has been reset by an administrator. Below are your new login credentials.
          </p>

          <!-- New Password -->
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #92400e; margin: 0 0 15px 0;">🔑 New Password</h3>
            <div style="background-color: #ffffff; border: 1px solid #d97706; border-radius: 4px; padding: 12px; font-family: monospace; font-size: 16px; font-weight: bold; color: #92400e; letter-spacing: 1px;">
              ${data.newPassword}
            </div>
            <p style="color: #92400e; margin: 15px 0 0 0; font-size: 14px;">
              ⚠️ <strong>Important:</strong> Please change this password after logging in for security purposes.
            </p>
          </div>

          <!-- Login Instructions -->
          <div style="margin: 30px 0;">
            <h3 style="color: #374151; margin: 0 0 15px 0;">Next Steps</h3>
            <ol style="color: #6b7280; line-height: 1.6; padding-left: 20px;">
              <li style="margin: 8px 0;">Click the login button below</li>
              <li style="margin: 8px 0;">Use your email: <strong>${data.email}</strong></li>
              <li style="margin: 8px 0;">Enter the new password provided above</li>
              <li style="margin: 8px 0;">Change your password to something secure and memorable</li>
            </ol>
          </div>

          <!-- Login Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" style="display: inline-block; background-color: #1e40af; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              🚀 Login Now
            </a>
          </div>

          <!-- Security Notice -->
          <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0;">🛡️ Security Notice</h3>
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
              If you did not request this password reset, please contact your system administrator immediately.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #374151; color: #d1d5db; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">
            TheoShift - Volunteer Coordination Platform
          </p>
          <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
            This email was sent automatically. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send password reset email
export async function sendPasswordResetEmail(data: { firstName: string; email: string; newPassword: string; loginUrl: string }): Promise<void> {
  const html = generatePasswordResetEmail(data);
  
  const subject = `Password Reset - TheoShift Account`;
  
  const text = `
Password Reset - TheoShift Account

Hello ${data.firstName},

Your TheoShift account password has been reset by an administrator.

New Password: ${data.newPassword}

Next Steps:
1. Visit: ${data.loginUrl}
2. Login with your email: ${data.email}
3. Use the new password provided above
4. Change your password to something secure and memorable

Security Notice:
If you did not request this password reset, please contact your system administrator immediately.

TheoShift - Volunteer Coordination Platform
  `;

  await sendEmail({
    to: data.email,
    subject,
    html,
    text
  });
}

// Generate document publish notification email
export function generateDocumentPublishEmail(data: { firstName: string; documentTitle: string; eventName: string; documentUrl: string }): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Document Published - TheoShift</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #f59e0b; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📄 New Document Published</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">TheoShift</p>
        </div>
        <div style="padding: 30px 20px;">
          <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${data.firstName}!</h2>
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
            A new document has been published for <strong>${data.eventName}</strong>.
          </p>
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #92400e; margin: 0 0 10px 0;">📄 ${data.documentTitle}</h3>
            <p style="color: #92400e; margin: 0; font-size: 14px;">This document is now available for you to view and download.</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.documentUrl}" style="display: inline-block; background-color: #f59e0b; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">📥 View Document</a>
          </div>
        </div>
        <div style="background-color: #374151; color: #d1d5db; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">TheoShift - Volunteer Coordination Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send document publish notification
export async function sendDocumentPublishEmail(data: { firstName: string; email: string; documentTitle: string; eventName: string; documentUrl: string }): Promise<void> {
  const html = generateDocumentPublishEmail(data);
  const subject = `New Document: ${data.documentTitle} - ${data.eventName}`;
  const text = `New Document Published\n\nHello ${data.firstName},\n\nA new document has been published for ${data.eventName}:\n\n${data.documentTitle}\n\nView it here: ${data.documentUrl}\n\nTheoShift`;
  await sendEmail({ to: data.email, subject, html, text });
}

// Generate feedback notification email for admins
export function generateFeedbackNotificationEmail(data: { feedbackType: string; title: string; description: string; submittedBy: string; priority: string; feedbackUrl: string }): string {
  const priorityColors: Record<string, string> = {
    HIGH: '#dc2626',
    MEDIUM: '#f59e0b',
    LOW: '#10b981'
  };
  const priorityColor = priorityColors[data.priority] || '#6b7280';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Feedback Submitted - TheoShift</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #3b82f6; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">💡 New Feedback Submitted</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">TheoShift Admin</p>
        </div>
        <div style="padding: 30px 20px;">
          <h2 style="color: #374151; margin: 0 0 20px 0;">New ${data.feedbackType} Feedback</h2>
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="margin-bottom: 15px;">
              <span style="color: #6b7280; font-weight: 500;">Priority:</span>
              <span style="display: inline-block; margin-left: 10px; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; color: white; background-color: ${priorityColor};">${data.priority}</span>
            </div>
            <h3 style="color: #374151; margin: 0 0 10px 0;">${data.title}</h3>
            <p style="color: #6b7280; line-height: 1.6; margin: 0;">${data.description}</p>
            <p style="color: #9ca3af; font-size: 14px; margin: 15px 0 0 0;">Submitted by: ${data.submittedBy}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.feedbackUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">📋 View in Admin Panel</a>
          </div>
        </div>
        <div style="background-color: #374151; color: #d1d5db; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">TheoShift - Volunteer Coordination Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send feedback notification to admins
export async function sendFeedbackNotificationEmail(data: { adminEmail: string; feedbackType: string; title: string; description: string; submittedBy: string; priority: string; feedbackUrl: string }): Promise<void> {
  const html = generateFeedbackNotificationEmail(data);
  const subject = `[${data.priority}] New ${data.feedbackType} Feedback: ${data.title}`;
  const text = `New Feedback Submitted\n\nType: ${data.feedbackType}\nPriority: ${data.priority}\nTitle: ${data.title}\n\nDescription:\n${data.description}\n\nSubmitted by: ${data.submittedBy}\n\nView in admin panel: ${data.feedbackUrl}\n\nTheoShift`;
  await sendEmail({ to: data.adminEmail, subject, html, text });
}

// Check if email is configured
export async function isEmailConfigured(): Promise<boolean> {
  // Check environment variables first
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    return true;
  }
  
  // Check database configuration
  try {
    const configRecord = await prisma.system_settings.findFirst({
      where: { key: 'email_config' }
    });
    
    if (configRecord && configRecord.value) {
      const emailConfig = JSON.parse(configRecord.value as string);
      
      // Handle nested config structure from admin panel
      if (emailConfig.authType === 'gmail' && emailConfig.config) {
        return !!(emailConfig.config.gmailEmail && emailConfig.config.gmailAppPassword);
      } else if (emailConfig.authType === 'smtp' && emailConfig.config) {
        return !!(emailConfig.config.smtpUser && emailConfig.config.smtpPassword);
      } else {
        // Fallback to flat structure
        return !!(emailConfig.smtpUser && emailConfig.smtpPassword);
      }
    }
  } catch (error) {
    console.error('Error checking email config from database:', error);
  }
  
  return false;
}
