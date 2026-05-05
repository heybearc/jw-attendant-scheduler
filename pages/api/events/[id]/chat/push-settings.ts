import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { canManageEvent } from '@/lib/eventAccess'

function getEnabled(settings: any): boolean {
  return !!settings?.chat?.pushNotificationsEnabled
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: eventId } = req.query
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ success: false, error: 'Event ID is required' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  })
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' })
  }

  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: { id: true, settings: true }
  })
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' })
  }

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: { enabled: getEnabled(event.settings) } })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const canManage = await canManageEvent(user.id, eventId)
  if (!canManage) {
    return res.status(403).json({ success: false, error: 'Only ADMIN can change chat notification settings' })
  }

  const enabled = !!req.body?.enabled
  const nextSettings = {
    ...(event.settings || {}),
    chat: {
      ...((event.settings as any)?.chat || {}),
      pushNotificationsEnabled: enabled
    }
  }

  await prisma.events.update({
    where: { id: eventId },
    data: { settings: nextSettings as any }
  })

  return res.status(200).json({ success: true, data: { enabled } })
}

