import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'
import { sendAssignmentNotification, AssignmentEmailData, AssignmentUpdateData, AssignmentCancelledData, AssignmentReminderData } from '../../../src/lib/assignmentEmails'
import { isEmailConfigured } from '../../../src/lib/email'

/**
 * Phase 4C: Assignment Notification API
 * Send email notifications for assignment events
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

    // Check if email is configured
    if (!isEmailConfigured()) {
      return res.status(503).json({ 
        error: 'Email not configured',
        message: 'Email notifications are not available. Please configure SMTP settings in admin panel.'
      })
    }

    const { type, assignmentId, eventId, changes, reason } = req.body

    if (!type || !assignmentId || !eventId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['type', 'assignmentId', 'eventId']
      })
    }

    // Validate notification type
    const validTypes = ['created', 'updated', 'cancelled', 'reminder']
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid notification type',
        validTypes
      })
    }

    // Fetch assignment with all related data
    const assignment = await prisma.position_assignments.findUnique({
      where: { id: assignmentId },
      include: {
        position: {
          include: {
            events: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                location: true
              }
            }
          }
        },
        attendant: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        overseer: {
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    })

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    if (!assignment.attendant?.users) {
      return res.status(400).json({ error: 'Assignment has no associated user' })
    }

    const volunteer = assignment.attendant.users
    const event = assignment.position.events
    const overseer = assignment.overseer?.users

    // Format dates
    const eventDate = new Date(event.startDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const shiftStart = assignment.shiftStart 
      ? new Date(assignment.shiftStart).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      : 'Not specified'

    const shiftEnd = assignment.shiftEnd
      ? new Date(assignment.shiftEnd).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      : 'Not specified'

    const eventUrl = `${process.env.NEXTAUTH_URL}/events/${event.id}/positions`

    // Build notification data based on type
    let notificationData: AssignmentEmailData | AssignmentUpdateData | AssignmentCancelledData | AssignmentReminderData

    switch (type) {
      case 'created':
        notificationData = {
          volunteerFirstName: volunteer.firstName,
          volunteerLastName: volunteer.lastName,
          volunteerEmail: volunteer.email,
          eventName: event.name,
          eventDate,
          eventLocation: event.location,
          positionName: assignment.position.positionName,
          positionNumber: assignment.position.positionNumber,
          shiftStart,
          shiftEnd,
          overseerName: overseer ? `${overseer.firstName} ${overseer.lastName}` : undefined,
          overseerEmail: overseer?.email || undefined,
          overseerPhone: overseer?.phone || undefined,
          notes: assignment.notes || undefined,
          eventUrl
        }
        break

      case 'updated':
        if (!changes || !Array.isArray(changes)) {
          return res.status(400).json({ 
            error: 'Changes array required for update notifications' 
          })
        }
        notificationData = {
          volunteerFirstName: volunteer.firstName,
          volunteerLastName: volunteer.lastName,
          volunteerEmail: volunteer.email,
          eventName: event.name,
          eventDate,
          eventLocation: event.location,
          positionName: assignment.position.positionName,
          positionNumber: assignment.position.positionNumber,
          shiftStart,
          shiftEnd,
          overseerName: overseer ? `${overseer.firstName} ${overseer.lastName}` : undefined,
          overseerEmail: overseer?.email || undefined,
          overseerPhone: overseer?.phone || undefined,
          notes: assignment.notes || undefined,
          eventUrl,
          changes
        }
        break

      case 'cancelled':
        notificationData = {
          volunteerFirstName: volunteer.firstName,
          volunteerLastName: volunteer.lastName,
          volunteerEmail: volunteer.email,
          eventName: event.name,
          eventDate,
          positionName: assignment.position.positionName,
          positionNumber: assignment.position.positionNumber,
          reason: reason || undefined,
          cancelledBy: session.user.name || session.user.email || 'System Administrator'
        }
        break

      case 'reminder':
        // Calculate hours until event
        const now = new Date()
        const eventStart = new Date(event.startDate)
        const hoursUntilEvent = Math.round((eventStart.getTime() - now.getTime()) / (1000 * 60 * 60))

        notificationData = {
          volunteerFirstName: volunteer.firstName,
          volunteerLastName: volunteer.lastName,
          volunteerEmail: volunteer.email,
          eventName: event.name,
          eventDate,
          eventLocation: event.location,
          positionName: assignment.position.positionName,
          positionNumber: assignment.position.positionNumber,
          shiftStart,
          shiftEnd,
          overseerName: overseer ? `${overseer.firstName} ${overseer.lastName}` : undefined,
          overseerEmail: overseer?.email || undefined,
          overseerPhone: overseer?.phone || undefined,
          notes: assignment.notes || undefined,
          eventUrl,
          hoursUntilEvent
        }
        break

      default:
        return res.status(400).json({ error: 'Invalid notification type' })
    }

    // Send the notification
    await sendAssignmentNotification(type as any, notificationData)

    // Log the notification (optional - could add to database)
    console.log(`Assignment notification sent: ${type} for assignment ${assignmentId}`)

    return res.status(200).json({
      success: true,
      message: `${type} notification sent successfully`,
      recipient: volunteer.email,
      assignmentId,
      eventId
    })

  } catch (error: any) {
    console.error('Assignment notification error:', error)
    
    // Check if it's an email configuration error
    if (error.message?.includes('Email configuration')) {
      return res.status(503).json({
        error: 'Email service unavailable',
        message: 'Unable to send notification. Please check email configuration.',
        details: error.message
      })
    }

    return res.status(500).json({
      error: 'Failed to send notification',
      message: error.message || 'An unexpected error occurred'
    })
  }
}
