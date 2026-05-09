/**
 * Browser-side chat web push helpers (shared by volunteer dashboard and chat UI).
 */

export type ChatPushSetupStatus = 'unknown' | 'enabled' | 'disabled' | 'unsupported'

export function vapidPublicKeyToUint8(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i)
  return output
}

export async function fetchChatPushVapidConfigured(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    const cfgRes = await fetch('/api/chat/push/config')
    const cfgJson = await cfgRes.json()
    return !!cfgJson?.data?.vapidPublicKey
  } catch {
    return false
  }
}

type HeadersFn = () => Record<string, string>

export async function getChatPushSetupStatus(getViewAsHeaders: HeadersFn): Promise<ChatPushSetupStatus> {
  if (typeof window === 'undefined') return 'unsupported'
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return 'unsupported'
    }
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return 'disabled'
    const r = await fetch('/api/chat/push/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getViewAsHeaders() },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return 'unsupported'
    return j?.data?.enabled ? 'enabled' : 'disabled'
  } catch {
    return 'unsupported'
  }
}

export async function disableChatPushSubscription(getViewAsHeaders: HeadersFn): Promise<void> {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  await fetch('/api/chat/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getViewAsHeaders() },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  })
  await sub.unsubscribe()
}

export async function enableChatPushSubscription(getViewAsHeaders: HeadersFn): Promise<void> {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser.')
  }
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') {
    throw new Error('Notification permission was not granted.')
  }

  const cfgRes = await fetch('/api/chat/push/config')
  const cfgJson = await cfgRes.json()
  const vapidPublicKey: string | null = cfgJson?.data?.vapidPublicKey || null
  if (!vapidPublicKey) {
    throw new Error('Push is not configured on the server (missing VAPID keys).')
  }

  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidPublicKeyToUint8(vapidPublicKey),
  })
  const res = await fetch('/api/chat/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getViewAsHeaders() },
    body: JSON.stringify(sub),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || 'Failed to save notification subscription.')
  }
}
