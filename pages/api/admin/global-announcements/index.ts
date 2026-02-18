import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'
import crypto from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    const announcements = await prisma.global_announcements.findMany({
      include: { users: { select: { firstName: true, lastName: true } } },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }]
    })
    return res.json({ success: true, data: announcements })
  }

  if (req.method === 'POST') {
    const { title, message, type, startDate, endDate } = req.body
    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, error: 'Title and message are required' })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    })
    if (!user) return res.status(401).json({ success: false, error: 'User not found' })

    const announcement = await prisma.global_announcements.create({
      data: {
        id: crypto.randomUUID(),
        title: title.trim(),
        message: message.trim(),
        type: type || 'INFO',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdBy: user.id,
        updatedAt: new Date()
      },
      include: { users: { select: { firstName: true, lastName: true } } }
    })
    return res.status(201).json({ success: true, data: announcement })
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
