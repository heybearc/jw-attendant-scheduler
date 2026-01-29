import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '../../../../../src/lib/prisma'
import { isEmailConfigured } from '../../../../../src/lib/email'

/**
 * Phase 4C Feature #1: Bulk Assignment Notifications
 * Manual endpoint to send notifications for unsent assignments
 * Called when coordinator clicks "Send Notifications" button
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
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
    if (!isEmailConfigured()) {
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
    const volunteerIds = [...new Set(assignments.map(a => a.attendantId))]
    
    console.log(`📧 Sending notifications to ${volunteerIds.length} volunteer(s) for ${assignments.length} assignment(s)...`)

    let sent = 0
    let failed = 0
    const errors: string[] = []

    // Send one notification per volunteer (consolidates all their assignments)
    for (const volunteerId of volunteerIds) {
      const volunteerAssignments = assignments.filter(a => a.attendantId === volunteerId)
      
      try {
        // Send notification for first assignment (email will include all assignments for this volunteer)
        const notificationResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/assignments/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'created',
            assignmentId: volunteerAssignments[0].id,
            eventId: eventId
          })
        })

        if (notificationResponse.ok) {
          sent++
          console.log(`✅ Notification sent for ${volunteerAssignments.length} assignment(s) to volunteer ${volunteerId}`)
        } else {
          failed++
          const errorData = await notificationResponse.json()
          errors.push(`Volunteer ${volunteerId}: ${errorData.error || 'Unknown error'}`)
          console.error(`❌ Failed to send to volunteer ${volunteerId}:`, errorData)
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
