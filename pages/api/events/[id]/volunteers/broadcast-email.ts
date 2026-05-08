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
  try {
    return await handleBroadcastEmail(req, res)
  } catch (err: unknown) {
    console.error('[broadcast-email]', err)
    const msg = err instanceof Error ? err.message : 'Server error'
    return res.status(500).json({ success: false, error: msg })
  }
}

async function handleBroadcastEmail(req: NextApiRequest, res: NextApiResponse) {
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
    // Match Volunteers page: "active" = on roster for this event AND volunteer profile not deactivated
    memberships = await prisma.event_volunteers.findMany({
      where: {
        eventId,
        isActive: true,
        volunteerId: { not: null },
        volunteer: { isActive: true },
      },
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
    // Client may send event_volunteers.id OR volunteers.id (SSR uses volunteer id when join row missing)
    memberships = await prisma.event_volunteers.findMany({
      where: {
        eventId,
        volunteerId: { not: null },
        OR: [{ id: { in: associationIds } }, { volunteerId: { in: associationIds } }],
      },
      select: {
        id: true,
        volunteerId: true,
        volunteer: { select: { firstName: true, email: true } },
      },
    })

    const matchedKeys = new Set<string>()
    for (const m of memberships) {
      if (associationIds.includes(m.id)) matchedKeys.add(m.id)
      if (m.volunteerId && associationIds.includes(m.volunteerId)) matchedKeys.add(m.volunteerId)
    }
    const unmatched = associationIds.filter((id) => !matchedKeys.has(id))
    if (unmatched.length > 0) {
      return res.status(400).json({
        success: false,
        error:
          'Some selected volunteers are not on this event roster. Refresh the page and try again.',
      })
    }
  }

  type Recipient = { firstName: string; email: string }
  const volunteerKey = (v: { email: string } | null) => v?.email?.trim().toLowerCase() ?? ''
  const rawRecipients = memberships
    .map((m) => m.volunteer)
    .filter((v): v is Recipient => !!v?.email?.trim())

  const seen = new Set<string>()
  const uniqueRecipients = rawRecipients.filter((r) => {
    const key = volunteerKey(r)
    if (!key || seen.has(key)) return false
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

  // Send in the background so HAProxy/nginx does not return 504 while SMTP delivers many messages.
  const eventName = event.name
  const recipientsSnapshot = uniqueRecipients.map((r) => ({ ...r }))
  void runBroadcastEmailJob({
    recipients: recipientsSnapshot,
    subject: subjectSafe,
    messageHtml,
    eventName,
    startDate,
    endDate,
    dashboardUrl,
    eventId,
  })

  const n = uniqueRecipients.length
  return res.status(202).json({
    success: true,
    async: true,
    recipientCount: n,
    message: `Queued ${n} recipient${n === 1 ? '' : 's'}. Gmail accepts the send first; each recipient’s mail server may still reject later (disabled mailbox, full inbox, etc.) — watch your inbox for bounce notices. You can leave this page — large lists may take a minute.`,
  })
}

async function runBroadcastEmailJob(params: {
  recipients: { firstName: string; email: string }[]
  subject: string
  messageHtml: string
  eventName: string
  startDate?: string
  endDate?: string
  dashboardUrl: string
  eventId: string
}) {
  const { recipients, subject, messageHtml, eventName, startDate, endDate, dashboardUrl, eventId } =
    params
  let sent = 0
  let failed = 0
  const errors: string[] = []

  try {
    for (const recipient of recipients) {
      try {
        const html = generateVolunteerBroadcastEmail({
          firstName: recipient.firstName,
          eventName,
          eventStartDate: startDate,
          eventEndDate: endDate,
          dashboardUrl,
          messageHtml,
        })
        await sendEmail({
          to: recipient.email,
          subject,
          html,
        })
        sent++
      } catch (err: unknown) {
        failed++
        const msg = err instanceof Error ? err.message : 'Unknown send error'
        errors.push(`${recipient.email}: ${msg}`)
      }
    }
    console.log(
      `[broadcast-email] event=${eventId} done sent=${sent} failed=${failed}${failed ? ` firstError=${errors[0]}` : ''}`
    )
    if (sent === 0 && failed > 0) {
      console.error('[broadcast-email] all sends failed:', errors.slice(0, 10))
    }
  } catch (err: unknown) {
    console.error('[broadcast-email] job crashed', err)
  }
}
