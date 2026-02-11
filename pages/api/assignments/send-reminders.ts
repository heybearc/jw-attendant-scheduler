import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../src/lib/prisma'
import { isEmailConfigured } from '../../../src/lib/email'

/**
 * Phase 4C Feature #1: Automated Assignment Reminders
 * Scheduled endpoint to send reminder emails before events
 * Called by cron job or PM2 scheduled task
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Only allow POST and require API key for security
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Simple API key check (should be set in environment)
    const apiKey = req.headers['x-api-key']
    if (!process.env.CRON_API_KEY || apiKey !== process.env.CRON_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check if email is configured
    const emailConfigured = await isEmailConfigured();
    if (!emailConfigured) {
      return res.status(400).json({ 
        error: 'Email not configured',
        message: 'SMTP settings must be configured before sending reminders'
      })
    }

    // Check notification settings
    const settingsRecord = await prisma.system_settings.findFirst({
      where: { key: 'notification_settings' }
    })

    let reminderSettings = {
      enabled: false,
      timing: ['24h'] // default
    }

    if (settingsRecord?.value) {
      try {
        const settings = JSON.parse(settingsRecord.value as string)
        reminderSettings = {
          enabled: settings.remindersEnabled !== false,
          timing: settings.reminderTiming || ['24h']
        }
      } catch (e) {
        console.error('Failed to parse notification settings:', e)
      }
    }

    if (!reminderSettings.enabled) {
      return res.status(200).json({
        success: true,
        message: 'Reminders disabled in settings',
        sent: 0
      })
    }

    const now = new Date()
    const reminders: { hours: number; label: string }[] = []

    // Parse reminder timing settings
    reminderSettings.timing.forEach(timing => {
      if (timing === '24h') reminders.push({ hours: 24, label: '24 hours' })
      if (timing === '48h') reminders.push({ hours: 48, label: '48 hours' })
      if (timing === '1week') reminders.push({ hours: 168, label: '1 week' })
    })

    let totalSent = 0
    let totalFailed = 0
    const errors: string[] = []

    console.log(`🔔 Checking for events needing reminders...`)

    // For each reminder window, find events that need reminders
    for (const reminder of reminders) {
      const windowStart = new Date(now.getTime() + (reminder.hours * 60 * 60 * 1000))
      const windowEnd = new Date(windowStart.getTime() + (60 * 60 * 1000)) // 1 hour window

      // Find events starting in this window
      const upcomingEvents = await prisma.events.findMany({
        where: {
          startDate: {
            gte: windowStart,
            lte: windowEnd
          },
          isActive: true
        },
        select: {
          id: true,
          name: true,
          startDate: true
        }
      })

      console.log(`📅 Found ${upcomingEvents.length} event(s) in ${reminder.label} window`)

      // For each event, find all assignments and send reminders
      for (const event of upcomingEvents) {
        try {
          // Get all assignments for this event
          const assignments = await prisma.position_assignments.findMany({
            where: {
              positions: { eventId: event.id }
            }
          })

          if (assignments.length === 0) {
            console.log(`⏭️  Event ${event.name} has no assignments, skipping`)
            continue
          }

          // Get unique volunteers
          const volunteerIds = [...new Set(assignments.map(a => a.attendantId))]
          
          console.log(`📧 Sending ${reminder.label} reminders to ${volunteerIds.length} volunteer(s) for ${event.name}`)

          // Send reminder to each volunteer
          for (const volunteerId of volunteerIds) {
            const volunteerAssignments = assignments.filter(a => a.attendantId === volunteerId)
            
            try {
              const notificationResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/assignments/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'reminder',
                  assignmentId: volunteerAssignments[0].id,
                  eventId: event.id,
                  reminderWindow: reminder.label
                })
              })

              if (notificationResponse.ok) {
                totalSent++
              } else {
                totalFailed++
                const errorData = await notificationResponse.json()
                errors.push(`Event ${event.name}, Volunteer ${volunteerId}: ${errorData.error || 'Unknown error'}`)
                console.error(`❌ Failed to send reminder:`, errorData)
              }
            } catch (error: any) {
              totalFailed++
              errors.push(`Event ${event.name}, Volunteer ${volunteerId}: ${error.message}`)
              console.error(`❌ Error sending reminder:`, error)
            }
          }
        } catch (error: any) {
          console.error(`❌ Error processing event ${event.name}:`, error)
          errors.push(`Event ${event.name}: ${error.message}`)
        }
      }
    }

    console.log(`📊 Reminder results: ${totalSent} sent, ${totalFailed} failed`)

    return res.status(200).json({
      success: true,
      message: `Sent ${totalSent} reminder(s)${totalFailed > 0 ? `, ${totalFailed} failed` : ''}`,
      sent: totalSent,
      failed: totalFailed,
      errors: totalFailed > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error('Send reminders API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
