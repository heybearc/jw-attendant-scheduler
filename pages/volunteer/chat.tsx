import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Head from 'next/head'
import { getViewAsHeaders, getViewAsVolunteerId, setViewAsVolunteerId } from '@/lib/viewAsClient'

interface ChatChannel {
  id: string
  eventId: string
  type: 'EVENT_ANNOUNCEMENTS' | 'EVENT_GENERAL' | 'POSITION'
  name: string
  positionId?: string | null
  unreadCount?: number
  lastMessageAt?: string | null
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

export default function VolunteerChatPage() {
  const router = useRouter()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/volunteer/login')
    }
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [composerValue, setComposerValue] = useState('')
  const [sending, setSending] = useState(false)
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null)
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const selectedChannelIdRef = useRef<string | null>(null)
  const subscribedChannelIdRef = useRef<string | null>(null)
  const viewAsVolunteerIdFromQuery = typeof router.query.viewAsVolunteerId === 'string' ? router.query.viewAsVolunteerId : null

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER'].includes(session?.user?.role || '')) return
    if (viewAsVolunteerIdFromQuery) {
      setViewAsVolunteerId(viewAsVolunteerIdFromQuery)
    }
  }, [session?.user?.role, viewAsVolunteerIdFromQuery])

  const effectiveViewAsVolunteerId =
    ['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER'].includes(session?.user?.role || '')
      ? (viewAsVolunteerIdFromQuery || getViewAsVolunteerId())
      : null

  useEffect(() => {
    if (status !== 'authenticated') return
    const eventId = typeof router.query.eventId === 'string' ? router.query.eventId : null
    if (!eventId) {
      setError('Missing event selection. Please return to your dashboard.')
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events/${eventId}/chat/channels`, {
          headers: { ...getViewAsHeaders() }
        })
        const data = await response.json()
        if (!response.ok || !data.success) {
          setError(data.error || 'Unable to load chat channels.')
          setChannels([])
          return
        }
        setChannels(data.data?.channels || [])
        if (!selectedChannelId && (data.data?.channels || []).length > 0) {
          setSelectedChannelId(data.data.channels[0].id)
        }
      } catch (e) {
        setError('Unable to load chat channels.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [status, router.query.eventId, selectedChannelId])

  useEffect(() => {
    if (status !== 'authenticated') return
    const eventId = typeof router.query.eventId === 'string' ? router.query.eventId : null
    if (!eventId || !selectedChannelId) return

    let mounted = true
    let timer: NodeJS.Timeout | null = null

    const loadMessages = async () => {
      try {
        if (!mounted) return
        setMessagesLoading(true)
        const response = await fetch(
          `/api/events/${eventId}/chat/channels/${selectedChannelId}/messages?limit=50`,
          { headers: { ...getViewAsHeaders() } }
        )
        const data = await response.json()
        if (!mounted) return
        if (!response.ok || !data.success) {
          setError(data.error || 'Unable to load channel messages.')
          setMessages([])
          return
        }
        setMessages(data.data?.messages || [])
        setPinnedMessageId(data.data?.pinnedMessageId || null)
        setPinnedMessage(data.data?.pinnedMessage || null)
      } catch (e) {
        if (mounted) {
          setError('Unable to load channel messages.')
          setMessages([])
        }
      } finally {
        if (mounted) setMessagesLoading(false)
      }
    }

    loadMessages()
    timer = setInterval(loadMessages, 5000)

    return () => {
      mounted = false
      if (timer) clearInterval(timer)
    }
  }, [status, router.query.eventId, selectedChannelId])

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || null
  selectedChannelIdRef.current = selectedChannelId

  useEffect(() => {
    if (status !== 'authenticated') return
    const eventId = typeof router.query.eventId === 'string' ? router.query.eventId : null
    if (!eventId) return

    let cancelled = false

    const connect = async () => {
      try {
        const tokenRes = await fetch(`/api/events/${eventId}/chat/ws-token`, { headers: { ...getViewAsHeaders() } })
        const tokenJson = await tokenRes.json()
        if (!tokenRes.ok || !tokenJson.success) return
        const token = tokenJson.data?.token
        if (!token) return

        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
        const socket = new WebSocket(`${proto}://${window.location.host}/api/chat/ws?token=${encodeURIComponent(token)}`)
        wsRef.current = socket

        socket.onopen = () => {
          if (cancelled) return
          const ch = selectedChannelIdRef.current
          if (ch) {
            try {
              socket.send(JSON.stringify({ type: 'subscribe', channelId: ch }))
              subscribedChannelIdRef.current = ch
            } catch {
              // ignore
            }
          }
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
              const ch = selectedChannelIdRef.current
              if (!ch) return
              fetch(`/api/events/${eventId}/chat/channels/${ch}/messages?limit=1`, { headers: { ...getViewAsHeaders() } })
                .then((r) => r.json())
                .then((data) => {
                  if (data?.success) {
                    setPinnedMessageId(data.data?.pinnedMessageId || null)
                    setPinnedMessage(data.data?.pinnedMessage || null)
                  }
                })
                .catch(() => {})
            }
          } catch {
            // ignore
          }
        }

        socket.onclose = () => {
          if (cancelled) return
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
  }, [status, router.query.eventId])

  useEffect(() => {
    const ws = wsRef.current
    if (!ws || !selectedChannelId) return

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
  }, [selectedChannelId])

  const formatSender = (message: ChatMessage) => {
    if (message.senderUser) return `${message.senderUser.firstName} ${message.senderUser.lastName}`
    if (message.senderVolunteer) return `${message.senderVolunteer.firstName} ${message.senderVolunteer.lastName}`
    return 'Unknown sender'
  }

  const handleSend = async () => {
    const eventId = typeof router.query.eventId === 'string' ? router.query.eventId : null
    if (!eventId || !selectedChannelId || !composerValue.trim()) return

    try {
      setSending(true)
      const response = await fetch(`/api/events/${eventId}/chat/channels/${selectedChannelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getViewAsHeaders() },
        body: JSON.stringify({ body: composerValue.trim() })
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message')
      }
      setComposerValue('')
      setMessages((prev) => [...prev, data.data])
    } catch (e: any) {
      setError(e?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Head>
        <title>Event Chat | TheoShift</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">💬 Event Chat</h1>
              {effectiveViewAsVolunteerId ? (
                <p className="text-sm text-amber-700">View-as volunteer simulation is active.</p>
              ) : (
                <p className="text-sm text-gray-600">Magic-link session active for {session?.user?.email}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {effectiveViewAsVolunteerId && typeof router.query.eventId === 'string' && (
                <button
                  onClick={async () => {
                    try {
                      await fetch(`/api/admin/view-as?eventId=${router.query.eventId}`, { method: 'DELETE' })
                    } catch {
                      // ignore
                    } finally {
                      setViewAsVolunteerId(null)
                      router.push(`/events/${router.query.eventId}/chat`)
                    }
                  }}
                  className="text-sm px-3 py-1 rounded bg-amber-700 text-white hover:bg-amber-800"
                >
                  Exit Simulation
                </button>
              )}
              <Link
                href={typeof router.query.eventId === 'string' ? `/volunteer/dashboard?eventId=${router.query.eventId}` : '/volunteer/dashboard'}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {loading && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600">Loading chat channels...</p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && channels.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-700">No chat channels are currently available for this event.</p>
            </div>
          )}

          {!loading && !error && channels.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-2">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannelId(channel.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      channel.id === selectedChannelId
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      {channel.type.replace('_', ' ')}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{channel.name}</p>
                      {(channel.unreadCount || 0) > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
                          {channel.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
                {!selectedChannel ? (
                  <p className="text-gray-600">Select a channel.</p>
                ) : (
                  <>
                    <div className="border-b border-gray-200 pb-3 mb-3">
                      <h2 className="text-lg font-semibold text-gray-900">{selectedChannel.name}</h2>
                      <p className="text-xs text-gray-500">{selectedChannel.type.replace('_', ' ')}</p>
                    </div>

                    <div className="h-96 overflow-y-auto border border-gray-100 rounded-md p-3 bg-gray-50 mb-3 space-y-2">
                      {pinnedMessageId && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mb-2">
                          <p className="text-xs font-semibold text-amber-800 mb-1">Pinned message</p>
                          {pinnedMessage ? (
                            <div>
                              <p className="text-xs text-amber-700">
                                {formatSender(pinnedMessage)} · {new Date(pinnedMessage.createdAt).toLocaleTimeString()}
                              </p>
                              <p className="text-sm text-amber-900 mt-1 whitespace-pre-wrap">{pinnedMessage.body}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-amber-700">Pinned message is not available.</p>
                          )}
                        </div>
                      )}
                      {messagesLoading && <p className="text-sm text-gray-500">Loading messages...</p>}
                      {!messagesLoading && messages.length === 0 && (
                        <p className="text-sm text-gray-500">No messages yet. Start the conversation.</p>
                      )}
                      {messages.map((message) => (
                        <div key={message.id} className="bg-white border border-gray-200 rounded-md p-2">
                          <p className="text-xs text-gray-500">
                            {formatSender(message)} · {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                          <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{message.body}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <textarea
                        value={composerValue}
                        onChange={(e) => setComposerValue(e.target.value)}
                        placeholder="Type a message..."
                        rows={2}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={2000}
                      />
                      <button
                        onClick={handleSend}
                        disabled={sending || !composerValue.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {sending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {!loading && !error && channels.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500">
                Messages auto-refresh every 5 seconds. Live socket streaming is planned next.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps(context: any) {
  const { getServerSession } = await import('next-auth')
  const { authOptions } = await import('../api/auth/[...nextauth]')

  const session = await getServerSession(context.req, context.res, authOptions)
  const isVolunteer = session?.user?.role === 'VOLUNTEER'
  const isStaffViewAs =
    ['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER'].includes(session?.user?.role || '') &&
    typeof context.query.viewAsVolunteerId === 'string' &&
    context.query.viewAsVolunteerId.length > 0

  if (!session || (!isVolunteer && !isStaffViewAs)) {
    return {
      redirect: {
        destination: '/volunteer/login',
        permanent: false
      }
    }
  }

  return { props: {} }
}
