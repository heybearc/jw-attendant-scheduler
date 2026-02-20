import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'
import { randomBytes } from 'crypto'
import nodemailer from 'nodemailer'

/**
 * Phase 4C: Bulk Availability Request API
 * Send availability requests to volunteers for an event
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id: eventId } = req.query
    const { volunteerIds, deadline, customMessage } = req.body

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'Event ID required' })
    }

    // Fetch event details
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        location: true,
        venue: true
      }
    })

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Get attendants to request from (attendants are event-specific volunteers)
    let attendants
    if (volunteerIds && Array.isArray(volunteerIds) && volunteerIds.length > 0) {
      // Specific attendants
      attendants = await prisma.volunteers.findMany({
        where: {
          id: { in: volunteerIds },
          isActive: true
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      })
    } else {
      // All active attendants for this event
      const eventVolunteers = await prisma.event_volunteers.findMany({
        where: {
          eventId,
          volunteer: {
            isActive: true
          }
        },
        include: {
          volunteer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      })
      attendants = eventVolunteers.map(ev => ev.volunteer).filter(Boolean)
    }

    if (attendants.length === 0) {
      return res.status(400).json({ error: 'No attendants found to request from' })
    }

    // Format dates
    const startDate = new Date(event.startDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const endDate = new Date(event.endDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const deadlineDate = deadline ? new Date(deadline).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : null

    const baseUrl = process.env.NEXTAUTH_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`

    // Create availability records and send emails
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const attendant of attendants) {
      try {
        // Check if availability request already exists
        const existing = await prisma.volunteer_availability.findUnique({
          where: {
            eventId_volunteerId: {
              eventId,
              volunteerId: attendant.id
            }
          }
        })

        if (existing) {
          // Update existing request
          await prisma.volunteer_availability.update({
            where: { id: existing.id },
            data: {
              requestedAt: new Date(),
              reminderSentAt: null
            }
          })
        } else {
          // Create new availability request
          await prisma.volunteer_availability.create({
            data: {
              id: randomBytes(16).toString('hex'),
              eventId,
              volunteerId: attendant.id,
              status: 'PENDING',
              requestedAt: new Date()
            }
          })
        }

        // Generate response URL - direct to volunteer login page
        const responseUrl = `${baseUrl}/volunteer/login`

        // Send email using database configuration
        const emailHtml = generateAvailabilityRequestEmail({
          volunteerFirstName: attendant.firstName,
          volunteerLastName: attendant.lastName,
          eventName: event.name,
          startDate,
          endDate,
          location: event.location || event.venue || 'Location TBD',
          deadline: deadlineDate,
          customMessage,
          responseUrl
        })

        await sendAvailabilityEmail(attendant.email, `Availability Request: ${event.name}`, emailHtml)

        results.sent++
      } catch (error: any) {
        console.error(`Failed to send to ${attendant.email}:`, error)
        results.failed++
        results.errors.push(`${attendant.firstName} ${attendant.lastName}: ${error.message}`)
      }
    }

    return res.status(200).json({
      success: true,
      message: `Availability requests sent to ${results.sent} attendants`,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined
    })

  } catch (error: any) {
    console.error('Availability request error:', error)
    return res.status(500).json({
      error: 'Failed to send availability requests',
      message: error.message
    })
  }
}

// Send email using database configuration
async function sendAvailabilityEmail(to: string, subject: string, html: string) {
  // Get email configuration from database
  const emailConfig = await prisma.system_settings.findFirst({
    where: { key: 'email_config' }
  })

  if (!emailConfig) {
    throw new Error('Email configuration not found. Please configure email settings in Admin → Email Configuration.')
  }

  const { authType, config } = JSON.parse(emailConfig.value)

  // Create transporter based on auth type
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

  // Send email
  await transporter.sendMail({
    from: `"TheoShift Team" <${config.fromEmail}>`,
    to,
    subject,
    html
  })
}

// Generate availability request email HTML
function generateAvailabilityRequestEmail(data: {
  volunteerFirstName: string
  volunteerLastName: string
  eventName: string
  startDate: string
  endDate: string
  location: string
  deadline: string | null
  customMessage?: string
  responseUrl: string
}): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Availability Request - ${data.eventName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #3b82f6; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📅 Availability Request</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Can you help with an upcoming event?</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px 20px;">
          <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${data.volunteerFirstName}!</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
            We're planning for an upcoming event and would like to know if you're available to serve. Your response will help us plan assignments more effectively.
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
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Start Date:</td>
                <td style="padding: 8px 0; color: #374151;">${data.startDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">End Date:</td>
                <td style="padding: 8px 0; color: #374151;">${data.endDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Location:</td>
                <td style="padding: 8px 0; color: #374151;">${data.location}</td>
              </tr>
              ${data.deadline ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Response Deadline:</td>
                <td style="padding: 8px 0; color: #dc2626; font-weight: bold;">${data.deadline}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          ${data.customMessage ? `
          <!-- Custom Message -->
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <h4 style="color: #92400e; margin: 0 0 10px 0;">📝 Message from Coordinator</h4>
            <p style="color: #92400e; margin: 0; line-height: 1.6;">${data.customMessage}</p>
          </div>
          ` : ''}

          <!-- Response Options -->
          <div style="margin: 30px 0;">
            <h3 style="color: #374151; margin: 0 0 15px 0;">Please Let Us Know Your Availability</h3>
            <p style="color: #6b7280; margin: 0 0 20px 0;">
              Click the button below to respond with your availability for this event.
            </p>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.responseUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              📋 Respond to Request
            </a>
          </div>

          <!-- Response Options Info -->
          <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #1e40af; margin: 0 0 10px 0;">Response Options</h4>
            <ul style="color: #1e40af; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>Available:</strong> You can serve during the entire event</li>
              <li><strong>Partial Availability:</strong> You can serve on specific dates/times</li>
              <li><strong>Not Available:</strong> You cannot serve at this event</li>
            </ul>
          </div>

          <!-- Why This Matters -->
          <div style="margin: 30px 0;">
            <h4 style="color: #374151; margin: 0 0 10px 0;">Why Your Response Matters</h4>
            <p style="color: #6b7280; line-height: 1.6; margin: 0;">
              Your availability response helps coordinators plan assignments more effectively. When we know who's available before making assignments, we can:
            </p>
            <ul style="color: #6b7280; line-height: 1.6; margin: 10px 0 0 20px;">
              <li>Reduce last-minute cancellations</li>
              <li>Assign volunteers to positions that work with their schedule</li>
              <li>Ensure adequate coverage for all positions</li>
            </ul>
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
  `
}
