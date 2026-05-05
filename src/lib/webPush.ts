import webpush from 'web-push'

export type WebPushSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

let configured = false

function ensureConfigured() {
  if (configured) return
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT

  if (!publicKey || !privateKey || !subject) {
    throw new Error('WebPush not configured (missing VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT)')
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null
}

export async function sendWebPush(
  subscription: WebPushSubscription,
  payload: unknown
) {
  ensureConfigured()
  return await webpush.sendNotification(subscription as any, JSON.stringify(payload))
}

