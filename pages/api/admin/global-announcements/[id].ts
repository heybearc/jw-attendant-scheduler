import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'ID required' })
  }

  if (req.method === 'PATCH') {
    const { title, message, type, isActive, startDate, endDate } = req.body
    const updateData: any = { updatedAt: new Date() }
    if (title !== undefined) updateData.title = title.trim()
    if (message !== undefined) updateData.message = message.trim()
    if (type !== undefined) updateData.type = type
    if (isActive !== undefined) updateData.isActive = isActive
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null

    const announcement = await prisma.global_announcements.update({
      where: { id },
      data: updateData,
      include: { users: { select: { firstName: true, lastName: true } } }
    })
    return res.json({ success: true, data: announcement })
  }

  if (req.method === 'DELETE') {
    await prisma.global_announcements.delete({ where: { id } })
    return res.json({ success: true })
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
