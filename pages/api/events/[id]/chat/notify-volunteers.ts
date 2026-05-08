import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { isEmailConfigured, sendEmail } from '@/lib/email'
import { generateChatEnabledEmail } from '@/lib/chatEmails'
import { formatCalendarDateLabel } from '@/lib/calendarDate'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { id: eventId } = req.query
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ success: false, error: 'Event ID is required' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true }
  })

  if (!actor || !['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER', 'KEYMAN'].includes(actor.role)) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' })
  }

  const emailReady = await isEmailConfigured()
  if (!emailReady) {
    return res.status(400).json({ success: false, error: 'Email is not configured' })
  }

  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: { id: true, name: true, startDate: true, endDate: true }
  })

  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' })
  }

  const customMessage = typeof req.body?.message === 'string' ? req.body.message.trim() : ''

  const memberships = await prisma.event_volunteers.findMany({
    where: {
      eventId,
      isActive: true,
      volunteerId: { not: null },
      volunteer: { isActive: true },
    },
    select: {
      volunteer: {
        select: { id: true, firstName: true, email: true }
      }
    }
  })

  const recipients = memberships
    .map((m) => m.volunteer)
    .filter((v): v is { id: string; firstName: string; email: string } => !!v?.email)

  const seenEmails = new Set<string>()
  const uniqueRecipients = recipients.filter((r) => {
    const key = r.email.toLowerCase()
    if (seenEmails.has(key)) return false
    seenEmails.add(key)
    return true
  })

  if (uniqueRecipients.length === 0) {
    return res.status(200).json({
      success: true,
      sent: 0,
      failed: 0,
      message: 'No active volunteers with email found for this event'
    })
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://theoshift.com'
  const dashboardUrl = `${baseUrl}/volunteer/dashboard?eventId=${event.id}`
  const startDate = event.startDate ? formatCalendarDateLabel(event.startDate.toISOString()) : undefined
  const endDate = event.endDate ? formatCalendarDateLabel(event.endDate.toISOString()) : undefined

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const recipient of uniqueRecipients) {
    try {
      const html = generateChatEnabledEmail({
        firstName: recipient.firstName,
        eventName: event.name,
        eventStartDate: startDate || undefined,
        eventEndDate: endDate || undefined,
        dashboardUrl,
        customMessage: customMessage || undefined
      })

      await sendEmail({
        to: recipient.email,
        subject: `Event chat is now available for ${event.name}`,
        html
      })
      sent++
    } catch (error: any) {
      failed++
      errors.push(`${recipient.email}: ${error?.message || 'Unknown send error'}`)
    }
  }

  return res.status(200).json({
    success: true,
    sent,
    failed,
    errors: failed > 0 ? errors : undefined,
    message: `Chat rollout email sent to ${sent} volunteer${sent === 1 ? '' : 's'}${failed ? ` (${failed} failed)` : ''}`
  })
}
