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
  type: 'EVENT_ANNOUNCEMENTS' | 'EVENT_GENERAL' | 'POSITION' | 'STAFF_INTERNAL' | 'VOLUNTEER_DM'
  name: string
  unreadCount?: number
  pinnedMessageId?: string | null
  dmVolunteerAId?: string | null
  dmVolunteerBId?: string | null
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
  canNotifyChatLaunch: boolean
  moduleConfig?: any
  terminology?: any
}

export default function EventStaffChatPage({
  event,
  canEdit,
  canDelete,
  canManagePermissions,
  canNotifyChatLaunch,
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
  const [typingActors, setTypingActors] = useState<Array<{ key: string; label: string; expiresAt: number }>>([])
  const [pushStatus, setPushStatus] = useState<'unknown' | 'enabled' | 'disabled' | 'unsupported'>('unknown')
  const [pushNotificationsEnabledForEvent, setPushNotificationsEnabledForEvent] = useState<boolean>(false)
  const [pushNotificationsToggleSaving, setPushNotificationsToggleSaving] = useState<boolean>(false)
  const [showEnablePushPrompt, setShowEnablePushPrompt] = useState<boolean>(false)
  const [linkedVolunteerId, setLinkedVolunteerId] = useState<string | null>(null)
  const [dmOpen, setDmOpen] = useState(false)
  const [dmVolunteers, setDmVolunteers] = useState<Array<{ id: string; name: string }>>([])
  const [dmPeerId, setDmPeerId] = useState('')
  const [dmBusy, setDmBusy] = useState(false)
  const [notifySending, setNotifySending] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const refreshPushStatus = async () => {
    try {
      if (typeof window === 'undefined') return
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPushStatus('unsupported')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) {
        setPushStatus('disabled')
        return
      }
      const r = await fetch('/api/chat/push/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint })
      })
      const j = await r.json()
      setPushStatus(j?.data?.enabled ? 'enabled' : 'disabled')
    } catch {
      setPushStatus('unsupported')
    }
  }

  const enablePush = async () => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return

    const cfgRes = await fetch('/api/chat/push/config')
    const cfgJson = await cfgRes.json()
    const vapidPublicKey: string | null = cfgJson?.data?.vapidPublicKey || null
    if (!vapidPublicKey) throw new Error('Missing VAPID public key')

    const toUint8 = (base64String: string) => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
      const raw = atob(base64)
      const output = new Uint8Array(raw.length)
      for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i)
      return output
    }

    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toUint8(vapidPublicKey)
    })
    await fetch('/api/chat/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub)
    })
    await refreshPushStatus()
  }

  const disablePush = async () => {
    try {
      if (typeof window === 'undefined') return
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) {
        await refreshPushStatus()
        return
      }
      await fetch('/api/chat/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint })
      })
      await sub.unsubscribe()
    } finally {
      await refreshPushStatus()
    }
  }

  useEffect(() => {
    refreshPushStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedChannelId || typeof window === 'undefined') return
    try {
      sessionStorage.setItem(staffChatStorageKey, selectedChannelId)
    } catch {
      // ignore
    }
  }, [selectedChannelId, staffChatStorageKey])

  useEffect(() => {
    fetch(`/api/events/${event.id}/chat/push-settings`)
      .then((r) => r.json())
      .then((j) => setPushNotificationsEnabledForEvent(!!j?.data?.enabled))
      .catch(() => setPushNotificationsEnabledForEvent(false))
  }, [event.id])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!pushNotificationsEnabledForEvent) return
    if (pushStatus !== 'disabled') return
    const key = `chatPushPromptSeen:${event.id}`
    if (window.localStorage.getItem(key)) return
    window.localStorage.setItem(key, '1')
    setShowEnablePushPrompt(true)
  }, [event.id, pushNotificationsEnabledForEvent, pushStatus])

  const selectedChannelIdRef = useRef<string | null>(null)
  const subscribedChannelIdRef = useRef<string | null>(null)
  const typingStopTimerRef = useRef<NodeJS.Timeout | null>(null)
  const typingStartedRef = useRef(false)

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || null
  selectedChannelIdRef.current = selectedChannelId

  const markChannelRead = async (channelId: string, lastReadMessageId?: string | null) => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
    try {
      await fetch(`/api/events/${event.id}/chat/channels/${channelId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastReadMessageId: lastReadMessageId || null })
      })
      setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c)))
    } catch {
      // ignore
    }
  }

  const staffChatStorageKey = `staffEventChat:${event.id}`

  const loadChannels = async () => {
    const res = await fetch(`/api/events/${event.id}/chat/channels`)
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || 'Unable to load channels')
    const nextChannels = data.data?.channels || []
    setLinkedVolunteerId(data.data?.linkedVolunteerId ?? null)
    setChannels(nextChannels)
    if (nextChannels.length > 0) {
      setSelectedChannelId((current) => {
        if (current && nextChannels.some((c: ChatChannel) => c.id === current)) return current
        try {
          if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem(staffChatStorageKey)
            if (stored && nextChannels.some((c: ChatChannel) => c.id === stored)) return stored
          }
        } catch {
          // ignore
        }
        const general = nextChannels.find((c: ChatChannel) => c.type === 'EVENT_GENERAL')
        return general?.id ?? nextChannels[0].id
      })
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

    const newest = (data.data?.messages || [])[(data.data?.messages || []).length - 1]
    await markChannelRead(selectedChannelId, newest?.id || null)
  }

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    const run = async (opts?: { showLoading?: boolean }) => {
      try {
        if (opts?.showLoading) setLoading(true)
        await loadChannels()
      } catch (e: any) {
        setError(e.message || 'Unable to load chat')
      } finally {
        if (opts?.showLoading) setLoading(false)
      }
    }
    run({ showLoading: true })
    timer = setInterval(() => run({ showLoading: false }), 7000)
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
    if (typingActors.length === 0) return
    const t = setInterval(() => {
      const now = Date.now()
      setTypingActors((prev) => prev.filter((a) => a.expiresAt > now))
    }, 1000)
    return () => clearInterval(t)
  }, [typingActors.length])

  useEffect(() => {
    let cancelled = false

    const connect = async () => {
      try {
        const tokenRes = await fetch(`/api/events/${event.id}/chat/ws-token`)
        const tokenJson = await tokenRes.json()
        if (!tokenRes.ok || !tokenJson.success) return
        const token = tokenJson.data?.token
        if (!token) return

        // Ensure the WS upgrade handler is initialized in the Node process.
        // (Next.js only attaches our upgrade listener after this API route is hit at least once.)
        try {
          await fetch('/api/chat/ws')
        } catch {
          // ignore
        }

        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
        const socket = new WebSocket(`${proto}://${window.location.host}/api/chat/ws?token=${encodeURIComponent(token)}`)
        wsRef.current = socket

        socket.onopen = () => {
          if (cancelled) return
          setWsReady(true)
          try {
            socket.send(JSON.stringify({ type: 'subscribeEvent' }))
          } catch {
            // ignore
          }
        }

        socket.onmessage = (ev) => {
          if (cancelled) return
          try {
            const msg = JSON.parse(ev.data)
            if (msg?.type === 'channel:activity' && msg.channelId) {
              const active = selectedChannelIdRef.current
              setChannels((prev) => {
                const existing = prev.find((c) => c.id === msg.channelId)
                if (!existing) return prev
                if (active && msg.channelId === active) return prev
                return prev.map((c) => {
                  if (c.id !== msg.channelId) return c
                  const nextUnread = (c.unreadCount || 0) + 1
                  return { ...c, unreadCount: nextUnread, lastMessageAt: msg.createdAt || c.lastMessageAt }
                })
              })
              return
            }
            if (msg?.type === 'typing' && msg.channelId && msg.actor) {
              if (msg.channelId !== selectedChannelIdRef.current) return
              const key = `${msg.actor.kind}:${msg.actor.id}`
              const label = msg.actor.label || 'Someone'
              const ttlMs = 8000
              setTypingActors((prev) => {
                const now = Date.now()
                const keep = prev.filter((a) => a.expiresAt > now && a.key !== key)
                if (!msg.isTyping) return keep
                return [...keep, { key, label, expiresAt: now + ttlMs }]
              })
              return
            }
            if (msg?.type === 'message:new' && msg.channelId && msg.message) {
              if (msg.channelId !== selectedChannelIdRef.current) return
              setMessages((prev) => [...prev, msg.message])
              setChannels((prev) =>
                prev.map((c) =>
                  c.id === msg.channelId ? { ...c, lastMessageAt: msg.message?.createdAt || c.lastMessageAt } : c
                )
              )
              markChannelRead(msg.channelId, msg.message?.id || null)
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
    try {
      sendTyping(false)
    } catch {}
  }

  const sendTyping = (isTyping: boolean) => {
    const ch = selectedChannelIdRef.current
    if (!ch) return
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    if (subscribedChannelIdRef.current !== ch) return
    try {
      ws.send(JSON.stringify({ type: isTyping ? 'typing:start' : 'typing:stop', channelId: ch }))
    } catch {}
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

  const handleNotifyChatLaunch = async () => {
    const note = typeof window !== 'undefined' ? window.prompt('Optional note for volunteers (leave blank to skip):') || '' : ''
    setNotifySending(true)
    try {
      const response = await fetch(`/api/events/${event.id}/chat/notify-volunteers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: note })
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send chat rollout emails')
      }
      alert(data.message || `Sent ${data.sent} email(s).`)
    } catch (err: any) {
      alert(err?.message || 'Failed to send chat rollout emails')
    } finally {
      setNotifySending(false)
    }
  }

  const openDmModal = async () => {
    if (!linkedVolunteerId) {
      setError('Add yourself as an active volunteer for this event to use direct messages.')
      return
    }
    setDmOpen(true)
    setDmPeerId('')
    try {
      const r = await fetch(`/api/events/${event.id}/volunteers`)
      const j = await r.json()
      const vols = (j.volunteers || []) as Array<{ id: string; name: string }>
      setDmVolunteers(vols.filter((v) => v.id !== linkedVolunteerId))
    } catch {
      setDmVolunteers([])
    }
  }

  const startDirectMessage = async () => {
    if (!dmPeerId) return
    setDmBusy(true)
    setError('')
    try {
      const r = await fetch(`/api/events/${event.id}/chat/direct-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerVolunteerId: dmPeerId })
      })
      const j = await r.json()
      if (!r.ok || !j.success) {
        throw new Error(j.error || 'Could not open direct message')
      }
      setDmOpen(false)
      await loadChannels()
      if (j.data?.channel?.id) {
        setSelectedChannelId(j.data.channel.id)
      }
    } catch (e: any) {
      setError(e?.message || 'Could not open direct message')
    } finally {
      setDmBusy(false)
    }
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Chat</h1>
              <p className="text-gray-600">Moderate and coordinate event communication channels.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canNotifyChatLaunch && (
                <button
                  type="button"
                  onClick={handleNotifyChatLaunch}
                  disabled={notifySending}
                  className="text-sm px-3 py-2 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 disabled:opacity-60"
                >
                  {notifySending ? 'Sending…' : '💬 Notify chat launch'}
                </button>
              )}
              {linkedVolunteerId && (
                <button
                  type="button"
                  onClick={openDmModal}
                  className="text-sm px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                >
                  New direct message
                </button>
              )}
              <button
                onClick={async () => {
                  try {
                    setPushNotificationsToggleSaving(true)
                    const next = !pushNotificationsEnabledForEvent
                    const r = await fetch(`/api/events/${event.id}/chat/push-settings`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ enabled: next })
                    })
                    const j = await r.json()
                    if (j?.success) setPushNotificationsEnabledForEvent(!!j?.data?.enabled)
                  } finally {
                    setPushNotificationsToggleSaving(false)
                  }
                }}
                disabled={pushNotificationsToggleSaving}
                className="text-sm px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-60"
              >
                {pushNotificationsEnabledForEvent ? 'Disable event notifications' : 'Enable event notifications'}
              </button>

              {pushNotificationsEnabledForEvent && pushStatus !== 'unsupported' && (
                <button
                  onClick={() => (pushStatus === 'enabled' ? disablePush() : enablePush())}
                  className="text-sm px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                >
                  {pushStatus === 'enabled' ? 'Disable my notifications' : 'Enable my notifications'}
                </button>
              )}
            </div>
          </div>
        </div>

        {dmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4">
              <h2 className="text-lg font-semibold text-gray-900">Direct message a volunteer</h2>
              <p className="text-sm text-gray-600 mt-1">Only active volunteers in this event. Chat is private to the two of you.</p>
              <label className="block mt-4 text-sm font-medium text-gray-700">Volunteer</label>
              <select
                value={dmPeerId}
                onChange={(e) => setDmPeerId(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select…</option>
                {dmVolunteers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDmOpen(false)}
                  className="px-3 py-2 text-sm rounded-md border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!dmPeerId || dmBusy}
                  onClick={startDirectMessage}
                  className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white disabled:bg-gray-400"
                >
                  {dmBusy ? 'Opening…' : 'Open chat'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showEnablePushPrompt && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-900">Enable chat notifications?</p>
              <p className="text-xs text-blue-800 mt-1">
                This event has chat notifications enabled. Turn them on for this device to get push alerts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await enablePush()
                  } finally {
                    setShowEnablePushPrompt(false)
                  }
                }}
                className="text-sm px-3 py-1 rounded bg-blue-700 text-white hover:bg-blue-800"
              >
                Enable
              </button>
              <button
                onClick={() => setShowEnablePushPrompt(false)}
                className="text-sm px-3 py-1 rounded border border-blue-300 text-blue-800 hover:bg-blue-100"
              >
                Not now
              </button>
            </div>
          </div>
        )}

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
                      {selectedChannel.type === 'VOLUNTEER_DM' && (
                        <p className="text-xs text-gray-500">Direct message — visible only to you and the other volunteer.</p>
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
                  {typingActors.length > 0 && (
                    <p className="text-xs text-gray-500 mb-1">
                      {typingActors.map((a) => a.label).join(', ')} typing…
                    </p>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      value={composer}
                      onChange={(e) => {
                        setComposer(e.target.value)
                        if (!typingStartedRef.current) {
                          typingStartedRef.current = true
                          sendTyping(true)
                        } else {
                          sendTyping(true)
                        }
                        if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current)
                        typingStopTimerRef.current = setTimeout(() => {
                          typingStartedRef.current = false
                          sendTyping(false)
                        }, 1500)
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter' || e.shiftKey) return
                        if (!composer.trim()) return
                        e.preventDefault()
                        void sendMessage()
                      }}
                      rows={2}
                      placeholder="Send a message… Enter to send, Shift+Enter for a new line."
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

  const notifyUser = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  })
  const canNotifyChatLaunch =
    !!notifyUser && ['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER', 'KEYMAN'].includes(notifyUser.role)

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
      canNotifyChatLaunch,
      moduleConfig: (eventSettings?.settings as any)?.modules || null,
      terminology: (eventSettings?.settings as any)?.terminology || null
    }
  }
}
