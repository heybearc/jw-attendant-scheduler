import { sendEmail } from './email'
import { displayPhone } from './formatPhone'

/**
 * Phase 4C: Assignment Notification Email Templates
 * Professional email templates for assignment workflow notifications
 */

interface AssignmentEmailData {
  volunteerFirstName: string
  volunteerLastName: string
  volunteerEmail: string
  eventName: string
  eventDate: string
  eventLocation?: string
  positionName: string
  positionNumber: number
  shiftName?: string
  shiftStart: string
  shiftEnd: string
  isAllDay?: boolean
  overseerName?: string
  overseerEmail?: string
  overseerPhone?: string
  notes?: string
  eventUrl: string
  confirmationToken?: string
}

interface AssignmentUpdateData extends AssignmentEmailData {
  changes: string[]
  previousShiftStart?: string
  previousShiftEnd?: string
}

interface AssignmentCancelledData {
  volunteerFirstName: string
  volunteerLastName: string
  volunteerEmail: string
  eventName: string
  eventDate: string
  positionName: string
  positionNumber: number
  reason?: string
  cancelledBy: string
}

interface AssignmentReminderData extends AssignmentEmailData {
  hoursUntilEvent: number
}

// Generate Assignment Created Email
export function generateAssignmentCreatedEmail(data: AssignmentEmailData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Assignment - ${data.eventName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #10b981; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">New Assignment</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You have been assigned to serve at an upcoming event.</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px 20px;">
          <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${data.volunteerFirstName}!</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for your willingness to serve. Here are the details of your assignment.
          </p>

          <!-- Event Details -->
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 15px 0;">📅 Event Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Event:</td>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">${data.eventName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Date:</td>
                <td style="padding: 8px 0; color: #374151;">${data.eventDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Location:</td>
                <td style="padding: 8px 0; color: #374151;">${data.eventLocation}</td>
              </tr>
            </table>
          </div>

          <!-- Assignment Details -->
          <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0;">📍 Your Assignment</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #1e40af; font-weight: 500;">Position:</td>
                <td style="padding: 8px 0; color: #1e3a8a; font-weight: bold;">${data.positionName} (#${data.positionNumber})</td>
              </tr>
              ${data.shiftName ? `
              <tr>
                <td style="padding: 8px 0; color: #1e40af; font-weight: 500;">Shift:</td>
                <td style="padding: 8px 0; color: #1e3a8a;">${data.shiftName}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #1e40af; font-weight: 500;">Time:</td>
                <td style="padding: 8px 0; color: #1e3a8a;">${data.isAllDay ? 'All Day' : `${data.shiftStart} – ${data.shiftEnd}`}</td>
              </tr>
            </table>
            ${data.notes ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #93c5fd;">
              <p style="color: #1e40af; margin: 0 0 5px 0; font-weight: 500;">📝 Notes:</p>
              <p style="color: #1e3a8a; margin: 0; font-style: italic;">${data.notes}</p>
            </div>
            ` : ''}
          </div>

          ${data.overseerName ? `
          <!-- Overseer Contact -->
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #92400e; margin: 0 0 15px 0;">👤 Your Overseer</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #92400e; font-weight: 500;">Name:</td>
                <td style="padding: 8px 0; color: #78350f;">${data.overseerName}</td>
              </tr>
              ${data.overseerEmail ? `
              <tr>
                <td style="padding: 8px 0; color: #92400e; font-weight: 500;">Email:</td>
                <td style="padding: 8px 0; color: #78350f;"><a href="mailto:${data.overseerEmail}" style="color: #92400e;">${data.overseerEmail}</a></td>
              </tr>
              ` : ''}
              ${data.overseerPhone ? `
              <tr>
                <td style="padding: 8px 0; color: #92400e; font-weight: 500;">Phone:</td>
                <td style="padding: 8px 0; color: #78350f;">${displayPhone(data.overseerPhone)}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          ` : ''}

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.eventUrl}" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              📋 View Full Assignment Details
            </a>
          </div>

          <!-- Support -->
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #6b7280; line-height: 1.6; margin: 0; font-size: 14px;">
              If you have questions or are unable to fulfill this assignment, please contact ${data.overseerName ? `<strong>${data.overseerName}</strong>` : 'your overseer'} as soon as possible.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #374151; color: #d1d5db; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">TheoShift</p>
          <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.7;">This is an automated message. To make changes, contact your overseer.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate Assignment Updated Email
export function generateAssignmentUpdatedEmail(data: AssignmentUpdateData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assignment Updated - ${data.eventName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #f59e0b; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Assignment Updated</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your assignment details have changed — please review below.</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px 20px;">
          <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${data.volunteerFirstName}!</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
            Your assignment for <strong>${data.eventName}</strong> has been updated. Please review the changes below and confirm you can still serve with the new details.
          </p>

          <!-- Changes Summary -->
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #92400e; margin: 0 0 15px 0;">📝 What Changed</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.8;">
              ${data.changes.map(change => `<li>${change}</li>`).join('')}
            </ul>
          </div>

          <!-- Updated Assignment Details -->
          <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0;">📍 Updated Assignment</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #1e40af; font-weight: 500;">Event:</td>
                <td style="padding: 8px 0; color: #1e3a8a;">${data.eventName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #1e40af; font-weight: 500;">Position:</td>
                <td style="padding: 8px 0; color: #1e3a8a; font-weight: bold;">${data.positionName} (#${data.positionNumber})</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #1e40af; font-weight: 500;">Shift Start:</td>
                <td style="padding: 8px 0; color: #1e3a8a;">${data.shiftStart}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #1e40af; font-weight: 500;">Shift End:</td>
                <td style="padding: 8px 0; color: #1e3a8a;">${data.shiftEnd}</td>
              </tr>
            </table>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.eventUrl}" style="display: inline-block; background-color: #f59e0b; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              📋 View Updated Assignment
            </a>
          </div>

          <!-- Support -->
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #6b7280; line-height: 1.6; margin: 0; font-size: 14px;">
              If you have questions or cannot serve with the updated schedule, please contact your overseer as soon as possible.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #374151; color: #d1d5db; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">TheoShift</p>
          <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.7;">This is an automated message. To make changes, contact your overseer.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate Assignment Cancelled Email
export function generateAssignmentCancelledEmail(data: AssignmentCancelledData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assignment Cancelled - ${data.eventName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #ef4444; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Assignment Cancelled</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your assignment has been removed — no action is needed.</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px 20px;">
          <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${data.volunteerFirstName}!</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
            Your assignment for <strong>${data.eventName}</strong> has been cancelled. You are no longer required to serve in this position.
          </p>

          <!-- Cancelled Assignment Details -->
          <div style="background-color: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #991b1b; margin: 0 0 15px 0;">📍 Cancelled Assignment</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #991b1b; font-weight: 500;">Event:</td>
                <td style="padding: 8px 0; color: #7f1d1d;">${data.eventName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #991b1b; font-weight: 500;">Date:</td>
                <td style="padding: 8px 0; color: #7f1d1d;">${data.eventDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #991b1b; font-weight: 500;">Position:</td>
                <td style="padding: 8px 0; color: #7f1d1d;">${data.positionName} (#${data.positionNumber})</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #991b1b; font-weight: 500;">Cancelled By:</td>
                <td style="padding: 8px 0; color: #7f1d1d;">${data.cancelledBy}</td>
              </tr>
            </table>
            ${data.reason ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #fca5a5;">
              <p style="color: #991b1b; margin: 0 0 5px 0; font-weight: 500;">Reason:</p>
              <p style="color: #7f1d1d; margin: 0; font-style: italic;">${data.reason}</p>
            </div>
            ` : ''}
          </div>

          <!-- Information -->
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 0; line-height: 1.6;">
              ℹ️ <strong>No action required.</strong> You are released from this assignment. Thank you for your willingness to serve!
            </p>
          </div>

          <!-- Support -->
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #6b7280; line-height: 1.6; margin: 0; font-size: 14px;">
              If you have questions about this cancellation, please contact your overseer.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #374151; color: #d1d5db; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">TheoShift</p>
          <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.7;">This is an automated message. To make changes, contact your overseer.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate Assignment Reminder Email
export function generateAssignmentReminderEmail(data: AssignmentReminderData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assignment Reminder - ${data.eventName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #8b5cf6; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Assignment Reminder</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your assignment is coming up in ${data.hoursUntilEvent} hours.</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px 20px;">
          <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${data.volunteerFirstName}!</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
            This is a reminder that you have an upcoming assignment. Here are your details.
          </p>

          <!-- Event Details -->
          <div style="background-color: #f5f3ff; border: 1px solid #8b5cf6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #5b21b6; margin: 0 0 15px 0;">📅 Event Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #5b21b6; font-weight: 500;">Event:</td>
                <td style="padding: 8px 0; color: #4c1d95; font-weight: bold;">${data.eventName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #5b21b6; font-weight: 500;">Date:</td>
                <td style="padding: 8px 0; color: #4c1d95;">${data.eventDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #5b21b6; font-weight: 500;">Location:</td>
                <td style="padding: 8px 0; color: #4c1d95;">${data.eventLocation}</td>
              </tr>
            </table>
          </div>

          <!-- Assignment Details -->
          <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0;">📍 Your Assignment</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #1e40af; font-weight: 500;">Position:</td>
                <td style="padding: 8px 0; color: #1e3a8a; font-weight: bold;">${data.positionName} (#${data.positionNumber})</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #1e40af; font-weight: 500;">Shift Start:</td>
                <td style="padding: 8px 0; color: #1e3a8a; font-weight: bold; font-size: 18px;">${data.shiftStart}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #1e40af; font-weight: 500;">Shift End:</td>
                <td style="padding: 8px 0; color: #1e3a8a;">${data.shiftEnd}</td>
              </tr>
            </table>
          </div>

          ${data.confirmationToken ? `
          <!-- Confirmation Buttons -->
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
            <h3 style="color: #92400e; margin: 0 0 15px 0;">⚡ Please Confirm Your Availability</h3>
            <p style="color: #92400e; margin: 0 0 20px 0;">
              Let us know if you can serve at this assignment. Your confirmation helps us plan more effectively.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
              <a href="${process.env.NEXTAUTH_URL}/assignments/confirm/${data.confirmationToken}?action=confirm" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                ✅ Confirm
              </a>
              <a href="${process.env.NEXTAUTH_URL}/assignments/confirm/${data.confirmationToken}?action=tentative" style="display: inline-block; background-color: #f59e0b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                ⏳ Tentative
              </a>
              <a href="${process.env.NEXTAUTH_URL}/assignments/confirm/${data.confirmationToken}?action=decline" style="display: inline-block; background-color: #ef4444; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                ❌ Decline
              </a>
            </div>
          </div>
          ` : ''}

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.eventUrl}" style="display: inline-block; background-color: #8b5cf6; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              📋 View Assignment Details
            </a>
          </div>

          ${data.overseerName ? `
          <!-- Overseer Contact -->
          <div style="margin: 20px 0;">
            <h4 style="color: #374151; margin: 0 0 10px 0;">👤 Your Overseer: ${data.overseerName}</h4>
            <p style="color: #6b7280; margin: 0;">
              ${data.overseerEmail ? `Email: <a href="mailto:${data.overseerEmail}" style="color: #3b82f6;">${data.overseerEmail}</a><br>` : ''}
              ${data.overseerPhone ? `Phone: ${displayPhone(data.overseerPhone)}` : ''}
            </p>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background-color: #374151; color: #d1d5db; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">TheoShift</p>
          <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.7;">This is an automated message. To make changes, contact your overseer.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Send Assignment Notification
export async function sendAssignmentNotification(
  type: 'created' | 'updated' | 'cancelled' | 'reminder',
  data: AssignmentEmailData | AssignmentUpdateData | AssignmentCancelledData | AssignmentReminderData
): Promise<void> {
  let html: string
  let subject: string

  switch (type) {
    case 'created':
      html = generateAssignmentCreatedEmail(data as AssignmentEmailData)
      subject = `Your assignment for ${(data as AssignmentEmailData).eventName}`
      break
    case 'updated':
      html = generateAssignmentUpdatedEmail(data as AssignmentUpdateData)
      subject = `Assignment updated: ${(data as AssignmentUpdateData).eventName}`
      break
    case 'cancelled':
      html = generateAssignmentCancelledEmail(data as AssignmentCancelledData)
      subject = `Assignment cancelled: ${(data as AssignmentCancelledData).eventName}`
      break
    case 'reminder':
      html = generateAssignmentReminderEmail(data as AssignmentReminderData)
      subject = `Reminder: Your assignment for ${(data as AssignmentReminderData).eventName} is in ${(data as AssignmentReminderData).hoursUntilEvent} hours`
      break
    default:
      throw new Error(`Unknown notification type: ${type}`)
  }

  const volunteerEmail = 'volunteerEmail' in data ? data.volunteerEmail : (data as AssignmentCancelledData).volunteerEmail

  await sendEmail({
    to: volunteerEmail,
    subject,
    html
  })
}

// Export types for use in other files
export type {
  AssignmentEmailData,
  AssignmentUpdateData,
  AssignmentCancelledData,
  AssignmentReminderData
}
