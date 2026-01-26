import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth/[...nextauth]'
import prisma from '../../../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id: eventId, attendantId } = req.query

  if (typeof eventId !== 'string' || typeof attendantId !== 'string') {
    return res.status(400).json({ error: 'Invalid event or attendant ID' })
  }

  // Check permissions
  const hasPermission = await prisma.event_permissions.findFirst({
    where: {
      eventId,
      userId: session.user.id,
      role: { in: ['MANAGER', 'EDITOR'] }
    }
  })

  if (!hasPermission && session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  if (req.method === 'GET') {
    return handleGet(eventId, attendantId, res)
  } else if (req.method === 'PUT') {
    return handleUpdate(eventId, attendantId, req.body, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGet(eventId: string, attendantId: string, res: NextApiResponse) {
  try {
    const availability = await prisma.volunteer_availability.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: attendantId
        }
      }
    })

    return res.status(200).json({ availability })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return res.status(500).json({ error: 'Failed to fetch availability' })
  }
}

async function handleUpdate(
  eventId: string, 
  attendantId: string, 
  body: { status: string; notes?: string }, 
  res: NextApiResponse
) {
  try {
    const { status, notes } = body

    if (!['AVAILABLE', 'NOT_AVAILABLE', 'PARTIAL', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // If status is PARTIAL, notes are required
    if (status === 'PARTIAL' && !notes) {
      return res.status(400).json({ error: 'Notes are required for partial availability' })
    }

    const availability = await prisma.volunteer_availability.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId: attendantId
        }
      },
      update: {
        status,
        notes: notes || null,
        respondedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        eventId,
        userId: attendantId,
        status,
        notes: notes || null,
        requestedAt: new Date(),
        respondedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return res.status(200).json({ success: true, availability })
  } catch (error) {
    console.error('Error updating availability:', error)
    return res.status(500).json({ error: 'Failed to update availability' })
  }
}
