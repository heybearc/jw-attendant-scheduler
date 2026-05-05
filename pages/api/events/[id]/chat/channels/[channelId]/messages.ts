import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { canAccessChatChannel } from '@/lib/chatAccess'
import { checkEventAccess } from '@/lib/eventAccess'
import { broadcastToChannel } from '@/lib/chatRealtime'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  const viewAsVolunteerId =
    typeof req.headers['x-view-as-volunteer-id'] === 'string' ? req.headers['x-view-as-volunteer-id'] : null
  const access = await canAccessChatChannel(eventId, channelId, session.user.email, { viewAsVolunteerId })
  if (!access.allowed || !access.actor || !access.channel) {
    return res.status(403).json({ success: false, error: 'Access denied for this channel' })
  }

  if (req.method === 'GET') {
    const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 40
    const limit = Number.isNaN(limitRaw) ? 40 : Math.min(Math.max(limitRaw, 1), 100)
    const before = typeof req.query.before === 'string' ? req.query.before : undefined

    const messages = await prisma.event_chat_messages.findMany({
      where: {
        channelId,
        deletedAt: null,
        ...(before ? { createdAt: { lt: new Date(before) } } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        body: true,
        kind: true,
        createdAt: true,
        editedAt: true,
        senderUser: { select: { id: true, firstName: true, lastName: true, role: true } },
        senderVolunteer: { select: { id: true, firstName: true, lastName: true } }
      }
    })

    if (messages.length > 0) {
      const newestMessage = messages[0]
      await prisma.event_chat_reads.upsert({
        where:
          access.actor.kind === 'user'
            ? { channelId_userId: { channelId, userId: access.actor.id } }
            : { channelId_volunteerId: { channelId, volunteerId: access.actor.id } },
        create:
          access.actor.kind === 'user'
            ? {
                channelId,
                userId: access.actor.id,
                lastReadMessageId: newestMessage.id,
                lastReadAt: new Date()
              }
            : {
                channelId,
                volunteerId: access.actor.id,
                lastReadMessageId: newestMessage.id,
                lastReadAt: new Date()
              },
        update: {
          lastReadMessageId: newestMessage.id,
          lastReadAt: new Date()
        }
      })
    }

    const pinnedMessageId = access.channel.pinnedMessageId || null
    const pinnedMessage =
      pinnedMessageId
        ? await prisma.event_chat_messages.findFirst({
            where: { id: pinnedMessageId, channelId, deletedAt: null },
            select: {
              id: true,
              body: true,
              kind: true,
              createdAt: true,
              editedAt: true,
              senderUser: { select: { id: true, firstName: true, lastName: true, role: true } },
              senderVolunteer: { select: { id: true, firstName: true, lastName: true } }
            }
          })
        : null

    return res.status(200).json({
      success: true,
      data: {
        channel: access.channel,
        actor: { kind: access.actor.kind, id: access.actor.id, role: access.actor.role },
        messages: [...messages].reverse(),
        nextBefore: messages.length > 0 ? messages[messages.length - 1].createdAt.toISOString() : null,
        pinnedMessageId,
        pinnedMessage
      }
    })
  }

  if (req.method === 'POST') {
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : ''
    if (!body) {
      return res.status(400).json({ success: false, error: 'Message body is required' })
    }
    if (body.length > 2000) {
      return res.status(400).json({ success: false, error: 'Message is too long (max 2000 chars)' })
    }

    const member = await prisma.event_chat_members.findFirst({
      where: {
        channelId,
        ...(access.actor.kind === 'user' ? { userId: access.actor.id } : { volunteerId: access.actor.id })
      },
      select: { mutedUntil: true }
    })

    if (member?.mutedUntil && member.mutedUntil > new Date()) {
      return res.status(403).json({ success: false, error: 'You are muted in this channel' })
    }

    await prisma.event_chat_members.upsert({
      where:
        access.actor.kind === 'user'
          ? { channelId_userId: { channelId, userId: access.actor.id } }
          : { channelId_volunteerId: { channelId, volunteerId: access.actor.id } },
      create:
        access.actor.kind === 'user'
          ? { channelId, userId: access.actor.id, role: 'MEMBER' }
          : { channelId, volunteerId: access.actor.id, role: 'MEMBER' },
      update: {}
    })

    const message = await prisma.event_chat_messages.create({
      data: {
        channelId,
        body,
        kind: 'TEXT',
        ...(access.actor.kind === 'user'
          ? { senderUserId: access.actor.id }
          : { senderVolunteerId: access.actor.id })
      },
      select: {
        id: true,
        body: true,
        kind: true,
        createdAt: true,
        editedAt: true,
        senderUser: { select: { id: true, firstName: true, lastName: true, role: true } },
        senderVolunteer: { select: { id: true, firstName: true, lastName: true } }
      }
    })

    broadcastToChannel(channelId, { type: 'message:new', channelId, message })

    return res.status(201).json({ success: true, data: message })
  }

  if (req.method === 'DELETE') {
    const messageId = typeof req.query.messageId === 'string' ? req.query.messageId : null
    if (!messageId) {
      return res.status(400).json({ success: false, error: 'messageId is required' })
    }

    if (access.actor.kind !== 'user') {
      return res.status(403).json({ success: false, error: 'Only staff can moderate messages' })
    }

    const isSystemStaff = ['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER', 'KEYMAN'].includes(access.actor.role)
    const eventPermission = await checkEventAccess(access.actor.id, eventId, 'COORDINATOR')
    const isEventStaff = !!eventPermission && ['ADMIN', 'COORDINATOR'].includes(eventPermission.role)

    if (!isSystemStaff && !isEventStaff) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions to moderate messages' })
    }

    const existing = await prisma.event_chat_messages.findFirst({
      where: { id: messageId, channelId, deletedAt: null },
      select: { id: true }
    })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Message not found' })
    }

    await prisma.event_chat_messages.update({
      where: { id: messageId },
      data: { deletedAt: new Date() }
    })

    if (access.channel.pinnedMessageId === messageId) {
      await prisma.event_chat_channels.update({
        where: { id: channelId },
        data: { pinnedMessageId: null }
      })
      broadcastToChannel(channelId, { type: 'pin:update', channelId, pinnedMessageId: null })
    }

    broadcastToChannel(channelId, { type: 'message:delete', channelId, messageId })

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
