import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { resolveActorFromSessionEmail } from '@/lib/chatAccess'

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

  const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : null
  if (!endpoint) {
    return res.status(400).json({ success: false, error: 'endpoint is required' })
  }

  const sub = await prisma.event_chat_push_subscriptions.findUnique({
    where: { endpoint },
    select: { userId: true, volunteerId: true }
  })

  const enabled =
    !!sub &&
    ((actor.kind === 'user' && sub.userId === actor.id) || (actor.kind === 'volunteer' && sub.volunteerId === actor.id))

  return res.status(200).json({ success: true, data: { enabled } })
}

