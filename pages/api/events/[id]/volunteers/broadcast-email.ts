import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { isEmailConfigured, sendEmail } from '@/lib/email'
import {
  generateVolunteerBroadcastEmail,
  formatPlainMessageAsHtml,
} from '@/lib/volunteerBroadcastEmail'
import { formatCalendarDateLabel } from '@/lib/calendarDate'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const eventId = req.query.id
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ success: false, error: 'Event ID is required' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  })

  if (
    !actor ||
    !['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER', 'KEYMAN'].includes(actor.role)
  ) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' })
  }

  const emailReady = await isEmailConfigured()
  if (!emailReady) {
    return res.status(400).json({ success: false, error: 'Email is not configured' })
  }

  const scope = req.body?.scope as string | undefined
  const subjectRaw = typeof req.body?.subject === 'string' ? req.body.subject.trim() : ''
  const messageRaw = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
  const associationIdsRaw = Array.isArray(req.body?.associationIds)
    ? (req.body.associationIds as unknown[]).filter((id): id is string => typeof id === 'string')
    : []
  const associationIds = [...new Set(associationIdsRaw)]

  if (scope !== 'selected' && scope !== 'all_active') {
    return res.status(400).json({ success: false, error: 'Invalid scope' })
  }
  const subjectSafe = subjectRaw.replace(/[\r\n]+/g, ' ').slice(0, 200)
  if (!subjectSafe) {
    return res.status(400).json({ success: false, error: 'Subject is required (max 200 characters)' })
  }
  if (!messageRaw || messageRaw.length > 15000) {
    return res.status(400).json({
      success: false,
      error: 'Message is required (max 15000 characters)',
    })
  }

  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: { id: true, name: true, startDate: true, endDate: true },
  })

  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' })
  }

  const baseUrl = process.env.NEXTAUTH_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`
  const dashboardUrl = `${baseUrl}/volunteer/dashboard?eventId=${event.id}`
  const startDate = event.startDate ? formatCalendarDateLabel(event.startDate.toISOString()) : undefined
  const endDate = event.endDate ? formatCalendarDateLabel(event.endDate.toISOString()) : undefined
  const messageHtml = formatPlainMessageAsHtml(messageRaw)

  let memberships: {
    volunteer: { firstName: string; email: string } | null
  }[]

  if (scope === 'all_active') {
    memberships = await prisma.event_volunteers.findMany({
      where: { eventId, isActive: true, volunteerId: { not: null } },
      select: {
        volunteer: { select: { firstName: true, email: true } },
      },
    })
  } else {
    if (associationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No volunteers selected',
      })
    }
    memberships = await prisma.event_volunteers.findMany({
      where: {
        eventId,
        id: { in: associationIds },
        volunteerId: { not: null },
      },
      select: {
        volunteer: { select: { firstName: true, email: true } },
      },
    })

    if (memberships.length !== associationIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some selections are invalid for this event',
      })
    }
  }

  type Recipient = { firstName: string; email: string }
  const rawRecipients = memberships
    .map((m) => m.volunteer)
    .filter((v): v is Recipient => !!v?.email?.trim())

  const seen = new Set<string>()
  const uniqueRecipients = rawRecipients.filter((r) => {
    const key = r.email.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (uniqueRecipients.length === 0) {
    return res.status(200).json({
      success: true,
      sent: 0,
      failed: 0,
      message: 'No volunteers with an email address matched this send.',
    })
  }

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const recipient of uniqueRecipients) {
    try {
      const html = generateVolunteerBroadcastEmail({
        firstName: recipient.firstName,
        eventName: event.name,
        eventStartDate: startDate,
        eventEndDate: endDate,
        dashboardUrl,
        messageHtml,
      })
      await sendEmail({
        to: recipient.email,
        subject: subjectSafe,
        html,
      })
      sent++
    } catch (err: unknown) {
      failed++
      const msg = err instanceof Error ? err.message : 'Unknown send error'
      errors.push(`${recipient.email}: ${msg}`)
    }
  }

  return res.status(200).json({
    success: true,
    sent,
    failed,
    errors: failed > 0 ? errors : undefined,
    message:
      sent === 0
        ? 'No emails were sent'
        : `Sent ${sent} email${sent === 1 ? '' : 's'}${failed ? ` (${failed} failed)` : ''}`,
  })
}
