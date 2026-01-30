import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '../../../../../src/lib/prisma'
import { isEmailConfigured } from '../../../../../src/lib/email'
import fs from 'fs'

const logToFile = (message: string) => {
  try {
    fs.appendFileSync('/tmp/notification-debug.log', `${new Date().toISOString()} - ${message}\n`)
  } catch (e) {
    // Ignore file write errors
  }
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
      logToFile(`First assignment ID: ${volunteerAssignments[0].id}`)
      
      process.stderr.write(`\n🔄 Processing volunteer ${volunteerId}:\n`)
      process.stderr.write(`  - ${volunteerAssignments.length} assignment(s)\n`)
      process.stderr.write(`  - First assignment ID: ${volunteerAssignments[0].id}\n`)
      
      try {
        // Send notification for first assignment (email will include all assignments for this volunteer)
        logToFile(`Calling notify API for assignment ${volunteerAssignments[0].id}`)
        process.stderr.write(`  - Calling notify API...\n`)
        const notificationResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/assignments/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'created',
            assignmentId: volunteerAssignments[0].id,
            eventId: eventId
          })
        })

        logToFile(`Notify API response status: ${notificationResponse.status}`)
        process.stderr.write(`  - Notify API response status: ${notificationResponse.status}\n`)

        if (notificationResponse.ok) {
          sent++
          logToFile(`SUCCESS: Notification sent to volunteer ${volunteerId}`)
          process.stderr.write(`✅ Notification sent for ${volunteerAssignments.length} assignment(s) to volunteer ${volunteerId}\n`)
        } else {
          failed++
          const errorData = await notificationResponse.json()
          logToFile(`FAILED: ${JSON.stringify(errorData)}`)
          process.stderr.write(`  - Error data: ${JSON.stringify(errorData)}\n`)
          errors.push(`Volunteer ${volunteerId}: ${errorData.error || 'Unknown error'}`)
          process.stderr.write(`❌ Failed to send to volunteer ${volunteerId}: ${JSON.stringify(errorData)}\n`)
        }
      } catch (error: any) {
        failed++
        errors.push(`Volunteer ${volunteerId}: ${error.message}`)
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
