import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : null
  if (!endpoint) {
    return res.status(400).json({ success: false, error: 'endpoint is required' })
  }

  await prisma.event_chat_push_subscriptions.deleteMany({
    where: { endpoint }
  })

  return res.status(200).json({ success: true })
}

