import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { resolveActorFromSessionEmail } from '@/lib/chatAccess'

function parseSubscription(body: any) {
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : null
  const p256dh = typeof body?.keys?.p256dh === 'string' ? body.keys.p256dh : null
  const auth = typeof body?.keys?.auth === 'string' ? body.keys.auth : null
  if (!endpoint || !p256dh || !auth) return null
  return { endpoint, p256dh, auth }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const viewAsVolunteerId =
    typeof req.headers['x-view-as-volunteer-id'] === 'string' ? req.headers['x-view-as-volunteer-id'] : null

  const actor = await resolveActorFromSessionEmail(session.user.email, { viewAsVolunteerId })
  if (!actor) {
    return res.status(403).json({ success: false, error: 'Unable to resolve actor' })
  }

  const sub = parseSubscription(req.body)
  if (!sub) {
    return res.status(400).json({ success: false, error: 'Invalid subscription payload' })
  }

  const ua = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null

  await prisma.event_chat_push_subscriptions.upsert({
    where: { endpoint: sub.endpoint },
    create: {
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      userAgent: ua,
      lastSeenAt: new Date(),
      ...(actor.kind === 'user' ? { userId: actor.id } : { volunteerId: actor.id })
    },
    update: {
      p256dh: sub.p256dh,
      auth: sub.auth,
      userAgent: ua,
      lastSeenAt: new Date(),
      userId: actor.kind === 'user' ? actor.id : null,
      volunteerId: actor.kind === 'volunteer' ? actor.id : null
    }
  })

  return res.status(200).json({ success: true })
}

