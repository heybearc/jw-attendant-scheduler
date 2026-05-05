import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { WebSocketServer } from 'ws'
import { canAccessChatChannel } from '@/lib/chatAccess'
import { canAccessEventChat } from '@/lib/chatAccess'
import { registerChatRealtimeClient, unregisterChatRealtimeClient } from '@/lib/chatRealtime'
import { prisma } from '@/lib/prisma'

type WsInbound =
  | { type: 'subscribe'; channelId: string }
  | { type: 'unsubscribe'; channelId: string }
  | { type: 'subscribeEvent' }
  | { type: 'unsubscribeEvent' }
  | { type: 'typing:start'; channelId: string }
  | { type: 'typing:stop'; channelId: string }
  | { type: 'ping' }

type WsTokenPayload = { v: 1; eventId: string; email: string; viewAsVolunteerId?: string | null; iat?: number; exp?: number }

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Init the upgrade handler once per Node process
  if (!(res.socket as any).server.__theoshiftChatWss) {
    const wss = new WebSocketServer({ noServer: true })

    ;(res.socket as any).server.on('upgrade', (request: any, socket: any, head: any) => {
      try {
        const url = new URL(request.url || '', 'http://localhost')
        if (url.pathname !== '/api/chat/ws') {
          return
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request, url)
        })
      } catch {
        socket.destroy()
      }
    })

    wss.on('connection', async (ws: any, request: any, url: URL) => {
      const token = url.searchParams.get('token') || ''
      const secret = process.env.NEXTAUTH_SECRET
      if (!secret) {
        ws.close()
        return
      }

      let payload: WsTokenPayload | null = null
      try {
        payload = jwt.verify(token, secret) as WsTokenPayload
      } catch {
        ws.close()
        return
      }

      if (!payload?.eventId || !payload?.email) {
        ws.close()
        return
      }

      const client = { ws, channelIds: new Set<string>(), eventIds: new Set<string>() }
      registerChatRealtimeClient(client)
      const lastTypingAtByChannel = new Map<string, number>()

      ws.on('message', async (raw: any) => {
        let msg: WsInbound | null = null
        try {
          msg = JSON.parse(raw.toString())
        } catch {
          return
        }

        if (!msg || typeof (msg as any).type !== 'string') return

        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }))
          return
        }

        if (msg.type === 'subscribeEvent') {
          const access = await canAccessEventChat(payload.eventId, payload.email, {
            viewAsVolunteerId: payload.viewAsVolunteerId || null
          })
          if (!access.allowed) {
            ws.send(JSON.stringify({ type: 'error', error: 'Access denied' }))
            return
          }
          client.eventIds.add(payload.eventId)
          ws.send(JSON.stringify({ type: 'event:subscribed', eventId: payload.eventId }))
          return
        }

        if (msg.type === 'unsubscribeEvent') {
          client.eventIds.delete(payload.eventId)
          ws.send(JSON.stringify({ type: 'event:unsubscribed', eventId: payload.eventId }))
          return
        }

        if ((msg.type === 'subscribe' || msg.type === 'unsubscribe') && typeof (msg as any).channelId !== 'string') return
        if ((msg.type === 'typing:start' || msg.type === 'typing:stop') && typeof (msg as any).channelId !== 'string') return

        if (msg.type === 'subscribe') {
          const channelId = (msg as any).channelId as string
          const access = await canAccessChatChannel(payload.eventId, channelId, payload.email, {
            viewAsVolunteerId: payload.viewAsVolunteerId || null
          })
          if (!access.allowed) {
            ws.send(JSON.stringify({ type: 'error', error: 'Access denied' }))
            return
          }
          client.channelIds.add(channelId)
          ws.send(JSON.stringify({ type: 'subscribed', channelId }))
          return
        }

        if (msg.type === 'unsubscribe') {
          const channelId = (msg as any).channelId as string
          client.channelIds.delete(channelId)
          ws.send(JSON.stringify({ type: 'unsubscribed', channelId }))
          return
        }

        if (msg.type === 'typing:start' || msg.type === 'typing:stop') {
          const channelId = (msg as any).channelId as string
          if (!client.channelIds.has(channelId)) return
          const now = Date.now()
          const last = lastTypingAtByChannel.get(channelId) || 0
          if (now - last < 500) return
          lastTypingAtByChannel.set(channelId, now)

          const access = await canAccessChatChannel(payload.eventId, channelId, payload.email, {
            viewAsVolunteerId: payload.viewAsVolunteerId || null
          })
          if (!access.allowed || !access.actor) return

          const actorName =
            access.actor.kind === 'user'
              ? (
                  await prisma.users.findUnique({
                    where: { id: access.actor.id },
                    select: { firstName: true, lastName: true }
                  })
                )
              : (
                  await prisma.volunteers.findUnique({
                    where: { id: access.actor.id },
                    select: { firstName: true, lastName: true }
                  })
                )

          const label = actorName ? `${actorName.firstName} ${actorName.lastName}` : access.actor.kind === 'user' ? 'Staff' : 'Volunteer'

          // Broadcast a minimal typing event; clients render names from cached participants when available.
          // We still include kind/id so UI can de-dupe and show a stable label.
          const payloadOut = {
            type: 'typing',
            channelId,
            actor: { kind: access.actor.kind, id: access.actor.id, label },
            isTyping: msg.type === 'typing:start'
          }

          // Lazy import to avoid circulars at module init time.
          const { broadcastToChannel } = await import('@/lib/chatRealtime')
          broadcastToChannel(channelId, payloadOut)
          return
        }
      })

      ws.on('close', () => {
        unregisterChatRealtimeClient(client)
      })
    })

    ;(res.socket as any).server.__theoshiftChatWss = wss
  }

  res.status(200).json({ ok: true })
}

