import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { canAccessChatChannel } from '@/lib/chatAccess'
import { checkEventAccess } from '@/lib/eventAccess'
import { broadcastToChannel } from '@/lib/chatRealtime'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { id: eventId, channelId } = req.query
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ success: false, error: 'Event ID is required' })
  }
  if (!channelId || typeof channelId !== 'string') {
    return res.status(400).json({ success: false, error: 'Channel ID is required' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const access = await canAccessChatChannel(eventId, channelId, session.user.email)
  if (!access.allowed || !access.actor || access.actor.kind !== 'user') {
    return res.status(403).json({ success: false, error: 'Staff access required' })
  }

  const isSystemStaff = ['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER', 'KEYMAN'].includes(access.actor.role)
  const eventPermission = await checkEventAccess(access.actor.id, eventId, 'COORDINATOR')
  const isEventStaff = !!eventPermission && ['ADMIN', 'COORDINATOR'].includes(eventPermission.role)
  if (!isSystemStaff && !isEventStaff) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions to pin messages' })
  }

  const rawMessageId = req.body?.messageId
  const messageId = typeof rawMessageId === 'string' && rawMessageId.length > 0 ? rawMessageId : null

  if (messageId) {
    const message = await prisma.event_chat_messages.findFirst({
      where: { id: messageId, channelId, deletedAt: null },
      select: { id: true }
    })
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found in this channel' })
    }
  }

  await prisma.event_chat_channels.update({
    where: { id: channelId },
    data: { pinnedMessageId: messageId }
  })

  broadcastToChannel(channelId, { type: 'pin:update', channelId, pinnedMessageId: messageId })

  return res.status(200).json({
    success: true,
    data: { channelId, pinnedMessageId: messageId }
  })
}

