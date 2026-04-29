import { NextApiRequest, NextApiResponse } from 'next'
import { getSessionUser } from '@/lib/countAssignments'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sessionUser = await getSessionUser(req, res)
  if (!sessionUser) return res.status(401).json({ success: false, error: 'Unauthorized' })
  if (sessionUser.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Only ADMIN can use view-as-volunteer' })
  }

  if (req.method === 'POST') {
    const { volunteerId, eventId } = req.body || {}
    if (!volunteerId || typeof volunteerId !== 'string') {
      return res.status(400).json({ success: false, error: 'volunteerId is required' })
    }

    await prisma.admin_view_as_audit_logs.create({
      data: {
        adminUserId: sessionUser.id,
        targetVolunteerId: volunteerId,
        eventId: typeof eventId === 'string' ? eventId : null,
        action: 'START'
      }
    })

    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const eventId = typeof req.query.eventId === 'string' ? req.query.eventId : null
    await prisma.admin_view_as_audit_logs.create({
      data: {
        adminUserId: sessionUser.id,
        eventId,
        action: 'STOP'
      }
    })

    return res.status(200).json({ success: true })
  }

  res.setHeader('Allow', ['POST', 'DELETE'])
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
