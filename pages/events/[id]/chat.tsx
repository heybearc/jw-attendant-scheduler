import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../api/auth/[...nextauth]'
import { useEffect, useRef, useState } from 'react'
import EventPageWrapper from '../../../components/EventPageWrapper'

interface EventData {
  id: string
  name: string
  status: string
  eventType: string
  startDate: string
}

interface ChatChannel {
  id: string
  eventId: string
  type: 'EVENT_ANNOUNCEMENTS' | 'EVENT_GENERAL' | 'POSITION' | 'STAFF_INTERNAL'
  name: string
  unreadCount?: number
  pinnedMessageId?: string | null
}

interface ChatMessage {
  id: string
  body: string
  kind: 'TEXT' | 'SYSTEM'
  createdAt: string
  editedAt?: string | null
  senderUser?: { id: string; firstName: string; lastName: string; role: string } | null
  senderVolunteer?: { id: string; firstName: string; lastName: string } | null
}

interface Props {
  event: EventData
  canEdit: boolean
  canDelete: boolean
  canManagePermissions: boolean
  moduleConfig?: any
  terminology?: any
}

export default function EventStaffChatPage({
  event,
  canEdit,
  canDelete,
  canManagePermissions,
  moduleConfig,
  terminology
}: Props) {
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [composer, setComposer] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null)
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null)
  const [wsReady, setWsReady] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const selectedChannelIdRef = useRef<string | null>(null)
  const subscribedChannelIdRef = useRef<string | null>(null)

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || null
  selectedChannelIdRef.current = selectedChannelId

  const loadChannels = async () => {
    const res = await fetch(`/api/events/${event.id}/chat/channels`)
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || 'Unable to load channels')
    const nextChannels = data.data?.channels || []
    setChannels(nextChannels)
    if (!selectedChannelId && nextChannels.length > 0) {
      setSelectedChannelId(nextChannels[0].id)
    }
  }

  const loadMessages = async () => {
    if (!selectedChannelId) return
    const res = await fetch(`/api/events/${event.id}/chat/channels/${selectedChannelId}/messages?limit=60`)
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || 'Unable to load messages')
    setMessages(data.data?.messages || [])
    setPinnedMessageId(data.data?.pinnedMessageId || null)
    setPinnedMessage(data.data?.pinnedMessage || null)
  }

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    const run = async () => {
      try {
        setLoading(true)
        await loadChannels()
      } catch (e: any) {
        setError(e.message || 'Unable to load chat')
      } finally {
        setLoading(false)
      }
    }
    run()
    timer = setInterval(run, 7000)
    return () => {
      if (timer) clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (!selectedChannelId) return
    const run = async () => {
      try {
        await loadMessages()
      } catch (e: any) {
        setError(e.message || 'Unable to load messages')
      }
    }
    run()
    timer = setInterval(run, 5000)
    return () => {
      if (timer) clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId])

  useEffect(() => {
    let cancelled = false

    const connect = async () => {
      try {
        const tokenRes = await fetch(`/api/events/${event.id}/chat/ws-token`)
        const tokenJson = await tokenRes.json()
        if (!tokenRes.ok || !tokenJson.success) return
        const token = tokenJson.data?.token
        if (!token) return

        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
        const socket = new WebSocket(`${proto}://${window.location.host}/api/chat/ws?token=${encodeURIComponent(token)}`)
        wsRef.current = socket

        socket.onopen = () => {
          if (cancelled) return
          setWsReady(true)
        }

        socket.onmessage = (ev) => {
          if (cancelled) return
          try {
            const msg = JSON.parse(ev.data)
            if (msg?.type === 'message:new' && msg.channelId && msg.message) {
              if (msg.channelId !== selectedChannelIdRef.current) return
              setMessages((prev) => [...prev, msg.message])
              return
            }
            if (msg?.type === 'message:delete' && msg.channelId === selectedChannelIdRef.current && msg.messageId) {
              setMessages((prev) => prev.filter((m) => m.id !== msg.messageId))
              if (msg.messageId === pinnedMessageId) {
                setPinnedMessageId(null)
                setPinnedMessage(null)
              }
              return
            }
            if (msg?.type === 'pin:update' && msg.channelId === selectedChannelIdRef.current) {
              // refresh pinned state (and pinned message) from server
              loadMessages()
            }
          } catch {
            // ignore
          }
        }

        socket.onclose = () => {
          if (cancelled) return
          setWsReady(false)
          wsRef.current = null
          subscribedChannelIdRef.current = null
        }
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined') connect()

    return () => {
      cancelled = true
      try {
        wsRef.current?.close()
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id])

  useEffect(() => {
    if (!wsReady || !selectedChannelId) return
    const ws = wsRef.current
    if (!ws) return

    const prev = subscribedChannelIdRef.current
    if (prev && prev !== selectedChannelId) {
      try {
        ws.send(JSON.stringify({ type: 'unsubscribe', channelId: prev }))
      } catch {
        // ignore
      }
    }

    subscribedChannelIdRef.current = selectedChannelId
    try {
      ws.send(JSON.stringify({ type: 'subscribe', channelId: selectedChannelId }))
    } catch {
      // ignore
    }
  }, [wsReady, selectedChannelId])

  const sendMessage = async () => {
    if (!selectedChannelId || !composer.trim()) return
    const res = await fetch(`/api/events/${event.id}/chat/channels/${selectedChannelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: composer.trim() })
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      setError(data.error || 'Failed to send message')
      return
    }
    setComposer('')
    setMessages((prev) => [...prev, data.data])
  }

  const deleteMessage = async (messageId: string) => {
    if (!selectedChannelId) return
    const ok = confirm('Delete this message for all participants?')
    if (!ok) return

    const res = await fetch(
      `/api/events/${event.id}/chat/channels/${selectedChannelId}/messages?messageId=${messageId}`,
      { method: 'DELETE' }
    )
    const data = await res.json()
    if (!res.ok || !data.success) {
      setError(data.error || 'Failed to delete message')
      return
    }
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
  }

  const pinMessage = async (messageId: string) => {
    if (!selectedChannelId) return
    const ok = confirm('Pin this message to the top of the channel?')
    if (!ok) return

    const res = await fetch(`/api/events/${event.id}/chat/channels/${selectedChannelId}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId })
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      setError(data.error || 'Failed to pin message')
      return
    }
    setPinnedMessageId(data.data?.pinnedMessageId || null)
  }

  const unpinChannel = async () => {
    if (!selectedChannelId || !pinnedMessageId) return
    const ok = confirm('Unpin the current pinned message for this channel?')
    if (!ok) return

    const res = await fetch(`/api/events/${event.id}/chat/channels/${selectedChannelId}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: '' })
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      setError(data.error || 'Failed to unpin message')
      return
    }
    setPinnedMessageId(null)
    setPinnedMessage(null)
  }

  const muteSender = async (message: ChatMessage, minutes = 60) => {
    if (!selectedChannelId) return
    const targetKind = message.senderUser ? 'user' : message.senderVolunteer ? 'volunteer' : null
    const targetId = message.senderUser?.id || message.senderVolunteer?.id
    if (!targetKind || !targetId) return

    const confirmed = confirm(`Mute ${senderName(message)} for ${minutes} minutes in this channel?`)
    if (!confirmed) return

    const res = await fetch(`/api/events/${event.id}/chat/channels/${selectedChannelId}/mute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetKind, targetId, durationMinutes: minutes })
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      setError(data.error || 'Failed to mute sender')
      return
    }
    alert(`Muted ${senderName(message)} for ${minutes} minutes.`)
  }

  const senderName = (m: ChatMessage) =>
    m.senderUser
      ? `${m.senderUser.firstName} ${m.senderUser.lastName} (${m.senderUser.role})`
      : m.senderVolunteer
      ? `${m.senderVolunteer.firstName} ${m.senderVolunteer.lastName} (Volunteer)`
      : 'Unknown sender'

  return (
    <EventPageWrapper
      event={event}
      currentPage="chat"
      canEdit={canEdit}
      canDelete={canDelete}
      canManagePermissions={canManagePermissions}
      moduleConfig={moduleConfig}
      terminology={terminology}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Staff Chat</h1>
          <p className="text-gray-600">Moderate and coordinate event communication channels.</p>
        </div>

        {loading && <p className="text-gray-600">Loading chat...</p>}
        {!loading && error && <p className="text-red-600 mb-4">{error}</p>}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-2">
              {channels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChannelId(c.id)}
                  className={`w-full text-left rounded-lg border p-3 ${
                    c.id === selectedChannelId ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{c.type.replace('_', ' ')}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    {(c.unreadCount || 0) > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
              {!selectedChannel ? (
                <p className="text-gray-600">Select a channel to view messages.</p>
              ) : (
                <>
                  <div className="border-b border-gray-200 pb-3 mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedChannel.name}</h2>
                      {selectedChannel.type === 'STAFF_INTERNAL' && (
                        <p className="text-xs text-gray-500">Staff-internal channel. Volunteers cannot see these messages.</p>
                      )}
                    </div>
                    {pinnedMessageId && (
                      <button
                        onClick={unpinChannel}
                        className="text-xs text-amber-700 hover:text-amber-900 underline"
                      >
                        Unpin message
                      </button>
                    )}
                  </div>
                  <div className="h-96 overflow-y-auto border border-gray-100 rounded-md p-3 bg-gray-50 mb-3 space-y-2">
                    {pinnedMessageId && (
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mb-2">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Pinned message</p>
                        {pinnedMessage ? (
                          <div>
                            <p className="text-xs text-amber-700">
                              {senderName(pinnedMessage)} · {new Date(pinnedMessage.createdAt).toLocaleTimeString()}
                            </p>
                            <p className="text-sm text-amber-900 mt-1 whitespace-pre-wrap">{pinnedMessage.body}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-amber-700">Pinned message is not available.</p>
                        )}
                      </div>
                    )}
                    {messages.map((m) => (
                      <div key={m.id} className="bg-white border border-gray-200 rounded-md p-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-gray-500">
                              {senderName(m)} · {new Date(m.createdAt).toLocaleTimeString()}
                            </p>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{m.body}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <button
                              onClick={() => deleteMessage(m.id)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => muteSender(m, 60)}
                              className="text-xs text-amber-600 hover:text-amber-800"
                            >
                              Mute 1h
                            </button>
                            <button
                              onClick={() => pinMessage(m.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Pin
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                      rows={2}
                      placeholder="Send a message to this channel..."
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={2000}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!composer.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Send
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </EventPageWrapper>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string }
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session?.user?.email) {
    return { redirect: { destination: '/auth/signin', permanent: false } }
  }

  const { prisma } = await import('../../../src/lib/prisma')
  const { checkEventAccess, canManageEvent, canDeleteEvent, canManagePermissions } = await import('../../../src/lib/eventAccess')

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  })
  if (!user) {
    return { redirect: { destination: '/auth/signin', permanent: false } }
  }

  const access = await checkEventAccess(user.id, id, 'VIEWER')
  if (!access) {
    return { redirect: { destination: '/events/select', permanent: false } }
  }

  const [event, eventSettings] = await Promise.all([
    prisma.events.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, eventType: true, startDate: true }
    }),
    prisma.events.findUnique({
      where: { id },
      select: { settings: true }
    })
  ])
  if (!event) return { notFound: true }

  const canEdit = await canManageEvent(user.id, id)
  const canDelete = await canDeleteEvent(user.id, id)
  const canManagePerms = await canManagePermissions(user.id, id)

  return {
    props: {
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        eventType: event.eventType,
        startDate: event.startDate?.toISOString() || new Date().toISOString()
      },
      canEdit,
      canDelete,
      canManagePermissions: canManagePerms,
      moduleConfig: (eventSettings?.settings as any)?.modules || null,
      terminology: (eventSettings?.settings as any)?.terminology || null
    }
  }
}
