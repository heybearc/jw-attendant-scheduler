import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { WebSocketServer } from 'ws'
import { canAccessChatChannel } from '@/lib/chatAccess'
import { registerChatRealtimeClient, unregisterChatRealtimeClient } from '@/lib/chatRealtime'

type WsInbound =
  | { type: 'subscribe'; channelId: string }
  | { type: 'unsubscribe'; channelId: string }
  | { type: 'ping' }

type WsTokenPayload = { v: 1; eventId: string; email: string; iat?: number; exp?: number }

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

      const client = { ws, channelIds: new Set<string>() }
      registerChatRealtimeClient(client)

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

        if ((msg.type === 'subscribe' || msg.type === 'unsubscribe') && typeof (msg as any).channelId !== 'string') return

        if (msg.type === 'subscribe') {
          const channelId = (msg as any).channelId as string
          const access = await canAccessChatChannel(payload.eventId, channelId, payload.email)
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

