import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '../../../../../src/lib/prisma'
import nodemailer from 'nodemailer'
import { generateAssignmentCreatedEmail } from '../../../../../src/lib/assignmentEmails'
import fs from 'fs'

const logToFile = (message: string) => {
  try {
    fs.appendFileSync('/tmp/notification-debug.log', `${new Date().toISOString()} - ${message}\n`)
  } catch (e) {
    // Ignore file write errors
  }
}

// Send email using database configuration (same pattern as availability-request)
async function sendAssignmentEmail(to: string, subject: string, html: string) {
  const emailConfig = await prisma.system_settings.findFirst({
    where: { key: 'email_config' }
  })

  if (!emailConfig) {
    throw new Error('Email configuration not found')
  }

  const { authType, config } = JSON.parse(emailConfig.value)

  let transporter
  
  if (authType === 'gmail') {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: config.gmailEmail,
        pass: config.gmailAppPassword
      }
    })
  } else {
    transporter = nodemailer.createTransport({
      host: config.smtpServer,
      port: parseInt(config.smtpPort || '587'),
      secure: config.smtpSecure || false,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword
      }
    })
  }

  await transporter.sendMail({
    from: `"TheoShift Team" <${config.fromEmail}>`,
    to,
    subject,
    html
  })
}

/**
 * Phase 4C Feature #1: Bulk Assignment Notifications
 * Manual endpoint to send notifications for unsent assignments
 * Called when coordinator clicks "Send Notifications" button
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  logToFile('=== SEND NOTIFICATIONS CALLED ===')
  try {
    const session = await getServerSession(req, res, authOptions)
    logToFile(`Session: ${session ? 'Present' : 'Missing'}`)
    if (!session) {
      logToFile('ERROR: No session - returning 401')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id: eventId } = req.query

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'Event ID is required' })
    }

    // Check user permissions
    const user = await prisma.users.findUnique({
      where: { email: session.user?.email || '' }
    })

    if (!user || !['ADMIN', 'OVERSEER', 'admin', 'overseer'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Check if email is configured
    const emailConfigured = await isEmailConfigured();
    if (!emailConfigured) {
      return res.status(400).json({ 
        error: 'Email not configured',
        message: 'SMTP settings must be configured before sending notifications'
      })
    }

    // Check notification settings
    const settingsRecord = await prisma.system_settings.findFirst({
      where: { key: 'notification_settings' }
    })

    let notificationsEnabled = true
    if (settingsRecord?.value) {
      try {
        const settings = JSON.parse(settingsRecord.value as string)
        notificationsEnabled = settings.assignmentCreated !== false
      } catch (e) {
        console.error('Failed to parse notification settings:', e)
      }
    }

    if (!notificationsEnabled) {
      return res.status(400).json({
        error: 'Notifications disabled',
        message: 'Assignment notifications are disabled in settings'
      })
    }

    // Find all assignments for this event
    const assignments = await prisma.position_assignments.findMany({
      where: {
        positions: { eventId: eventId }
      }
    })

    if (assignments.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No assignments to notify',
        sent: 0,
        failed: 0
      })
    }

    // Get unique volunteers from assignments
    const volunteerIds = [...new Set(assignments.map(a => a.volunteerId))]
    
    logToFile(`Found ${volunteerIds.length} volunteer(s) for ${assignments.length} assignment(s)`)
    logToFile(`Volunteer IDs: ${JSON.stringify(volunteerIds)}`)
    
    process.stderr.write(`📧 Sending notifications to ${volunteerIds.length} volunteer(s) for ${assignments.length} assignment(s)...\n`)
    process.stderr.write(`Volunteer IDs: ${JSON.stringify(volunteerIds)}\n`)
    process.stderr.write(`Sample assignment: ${JSON.stringify(assignments[0])}\n`)

    let sent = 0
    let failed = 0
    const errors: string[] = []

    // Send one notification per volunteer (consolidates all their assignments)
    for (const volunteerId of volunteerIds) {
      const volunteerAssignments = assignments.filter(a => a.volunteerId === volunteerId)
      
      logToFile(`Processing volunteer ${volunteerId} with ${volunteerAssignments.length} assignment(s)`)
      
      try {
        // Get full assignment details with volunteer and event info
        const assignment = await prisma.position_assignments.findUnique({
          where: { id: volunteerAssignments[0].id },
          include: {
            volunteer: {
              include: {
                user: true
              }
            },
            positions: {
              include: {
                events: true
              }
            },
            shift: true,
            overseer: {
              include: {
                user: true
              }
            }
          }
        })

        if (!assignment || !assignment.volunteer) {
          throw new Error('Assignment or volunteer not found')
        }

        const volunteer = assignment.volunteer
        const event = assignment.positions.events
        
        // Get volunteer email (from user if linked, otherwise from volunteer record)
        const volunteerEmail = volunteer.user?.email || volunteer.email
        const volunteerFirstName = volunteer.user?.firstName || volunteer.firstName
        const volunteerLastName = volunteer.user?.lastName || volunteer.lastName

        // Format event date
        const eventDate = new Date(event.startDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })

        // Format shift times
        const shiftStart = assignment.shift?.startTime || 'Not specified'
        const shiftEnd = assignment.shift?.endTime || 'Not specified'

        // Get overseer info if exists
        const overseer = assignment.overseer
        const overseerName = overseer ? `${overseer.user?.firstName || overseer.firstName} ${overseer.user?.lastName || overseer.lastName}` : undefined
        const overseerEmail = overseer ? (overseer.user?.email || overseer.email) : undefined
        const overseerPhone = overseer ? (overseer.user?.phone || overseer.phone) : undefined

        // Generate email HTML
        const emailHtml = generateAssignmentCreatedEmail({
          volunteerFirstName,
          volunteerLastName,
          volunteerEmail,
          eventName: event.name,
          eventDate,
          eventLocation: event.location || event.venue || 'Location TBD',
          positionName: assignment.positions.positionName,
          positionNumber: assignment.positions.positionNumber,
          shiftStart,
          shiftEnd,
          overseerName,
          overseerEmail,
          overseerPhone,
          eventUrl: `${process.env.NEXTAUTH_URL}/events/${event.id}/positions`
        })

        // Send email directly (same pattern as availability-request)
        await sendAssignmentEmail(
          volunteerEmail,
          `New Assignment: ${event.name}`,
          emailHtml
        )

        sent++
        logToFile(`SUCCESS: Email sent to ${volunteerEmail}`)
      } catch (error: any) {
        failed++
        errors.push(`Volunteer ${volunteerId}: ${error.message}`)
        logToFile(`FAILED: ${error.message}`)
        console.error(`❌ Error sending to volunteer ${volunteerId}:`, error)
      }
    }

    console.log(`📊 Notification results: ${sent} sent, ${failed} failed`)

    return res.status(200).json({
      success: true,
      message: `Sent ${sent} notification(s)${failed > 0 ? `, ${failed} failed` : ''}`,
      sent,
      failed,
      errors: failed > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error('Send notifications API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
