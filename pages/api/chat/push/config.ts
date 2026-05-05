import type { NextApiRequest, NextApiResponse } from 'next'
import { getVapidPublicKey } from '@/lib/webPush'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const key = getVapidPublicKey()
  if (!key) {
    return res.status(200).json({ success: true, data: { vapidPublicKey: null } })
  }
  return res.status(200).json({ success: true, data: { vapidPublicKey: key } })
}

