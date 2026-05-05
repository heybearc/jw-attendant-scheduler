import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { canAccessEventChat } from '@/lib/chatAccess'

async function ensureDefaultChannels(eventId: string) {
  const announcements = await prisma.event_chat_channels.findFirst({
    where: { eventId, type: 'EVENT_ANNOUNCEMENTS', isArchived: false }
  })

  if (!announcements) {
    await prisma.event_chat_channels.create({
      data: {
        eventId,
        type: 'EVENT_ANNOUNCEMENTS',
        name: 'Event Announcements'
      }
    })
  }

  const general = await prisma.event_chat_channels.findFirst({
    where: { eventId, type: 'EVENT_GENERAL', isArchived: false }
  })

  if (!general) {
    await prisma.event_chat_channels.create({
      data: {
        eventId,
        type: 'EVENT_GENERAL',
        name: 'Event General'
      }
    })
  }

  const staffInternal = await prisma.event_chat_channels.findFirst({
    where: { eventId, type: 'STAFF_INTERNAL', isArchived: false }
  })
  if (!staffInternal) {
    await prisma.event_chat_channels.create({
      data: {
        eventId,
        type: 'STAFF_INTERNAL',
        name: 'Staff Internal'
      }
    })
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

  const viewAsVolunteerId =
    typeof req.headers['x-view-as-volunteer-id'] === 'string' ? req.headers['x-view-as-volunteer-id'] : null
  const chatAccess = await canAccessEventChat(eventId, session.user.email, { viewAsVolunteerId })
  if (!chatAccess.allowed || !chatAccess.actor) {
    return res.status(403).json({ success: false, error: 'Access denied for event chat' })
  }

  await ensureDefaultChannels(eventId)

  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: { settings: true }
  })
  const pushNotificationsEnabled = !!(event?.settings as any)?.chat?.pushNotificationsEnabled

  let positionIdsForVolunteer: string[] | null = null
  if (chatAccess.actor.kind === 'volunteer') {
    const assignments = await prisma.position_assignments.findMany({
      where: {
        volunteerId: chatAccess.actor.id,
        positions: { eventId }
      },
      select: { positionId: true }
    })
    positionIdsForVolunteer = [...new Set(assignments.map((a) => a.positionId))]
  }

  const channels = await prisma.event_chat_channels.findMany({
    where: {
      eventId,
      isArchived: false,
      ...(chatAccess.actor.kind === 'volunteer'
        ? {
            OR: [
              { type: 'EVENT_ANNOUNCEMENTS' },
              { type: 'EVENT_GENERAL' },
              {
                type: 'POSITION',
                positionId: { in: positionIdsForVolunteer && positionIdsForVolunteer.length > 0 ? positionIdsForVolunteer : ['__none__'] }
              }
            ]
          }
        : {})
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      eventId: true,
      type: true,
      name: true,
      positionId: true,
      createdAt: true,
      updatedAt: true,
      pinnedMessageId: true
    }
  })

  const channelsWithUnread = await Promise.all(
    channels.map(async (channel) => {
      const readState = await prisma.event_chat_reads.findFirst({
        where: {
          channelId: channel.id,
          ...(chatAccess.actor.kind === 'user'
            ? { userId: chatAccess.actor.id }
            : { volunteerId: chatAccess.actor.id })
        },
        select: { lastReadAt: true }
      })

      const unreadCount = await prisma.event_chat_messages.count({
        where: {
          channelId: channel.id,
          deletedAt: null,
          ...(readState?.lastReadAt ? { createdAt: { gt: readState.lastReadAt } } : {}),
          ...(chatAccess.actor.kind === 'user'
            ? { NOT: { senderUserId: chatAccess.actor.id } }
            : { NOT: { senderVolunteerId: chatAccess.actor.id } })
        }
      })

      const latestMessage = await prisma.event_chat_messages.findFirst({
        where: { channelId: channel.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })

      return {
        ...channel,
        unreadCount,
        lastMessageAt: latestMessage?.createdAt?.toISOString() || null
      }
    })
  )

  return res.status(200).json({
    success: true,
    data: {
      actor: { kind: chatAccess.actor.kind, id: chatAccess.actor.id, role: chatAccess.actor.role },
      channels: channelsWithUnread,
      pushNotificationsEnabled
    }
  })
}
