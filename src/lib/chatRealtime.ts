import type { WebSocket } from 'ws'

type ChannelId = string

type ChatRealtimeClient = {
  ws: WebSocket
  channelIds: Set<ChannelId>
}

type ChatRealtimeState = {
  clients: Set<ChatRealtimeClient>
}

declare global {
  // eslint-disable-next-line no-var
  var __theoshiftChatRealtime: ChatRealtimeState | undefined
}

function getState(): ChatRealtimeState {
  if (!global.__theoshiftChatRealtime) {
    global.__theoshiftChatRealtime = { clients: new Set() }
  }
  return global.__theoshiftChatRealtime
}

export function registerChatRealtimeClient(client: ChatRealtimeClient) {
  getState().clients.add(client)
}

export function unregisterChatRealtimeClient(client: ChatRealtimeClient) {
  getState().clients.delete(client)
}

export function broadcastToChannel(channelId: string, payload: unknown) {
  const state = getState()
  const message = JSON.stringify(payload)

  for (const client of state.clients) {
    if (!client.channelIds.has(channelId)) continue
    try {
      client.ws.send(message)
    } catch {
      // ignore broken sockets; cleanup occurs on close
    }
  }
}

