import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth/[...nextauth]'
import { prisma } from '../../../../../../src/lib/prisma'
import { handleApiError } from '@/lib/apiError'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id: eventId, volunteerId } = req.query

  if (typeof eventId !== 'string' || typeof volunteerId !== 'string') {
    return res.status(400).json({ error: 'Invalid event or volunteer ID' })
  }

  // Check if caller has permission to manage events
  // Similar to verification - only checking caller's role, not the volunteer being updated
  const isAdmin = session.user.role === 'ADMIN'
  const isOverseer = ['OVERSEER', 'ASSISTANT_OVERSEER', 'KEYMAN'].includes(session.user.role || '')

  if (!isAdmin && !isOverseer) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  // Update availability for the volunteer (volunteer_availability references volunteers table)
  if (req.method === 'GET') {
    return handleGet(eventId, volunteerId, res)
  } else if (req.method === 'PUT') {
    return handleUpdate(eventId, volunteerId, req.body, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGet(eventId: string, volunteerId: string, res: NextApiResponse) {
  try {
    const availability = await prisma.volunteer_availability.findUnique({
      where: {
        eventId_volunteerId: {
          eventId,
          volunteerId
        }
      }
    })

    return res.status(200).json({ availability })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ error: 'Failed to fetch availability' })
  }
}

async function handleUpdate(
  eventId: string, 
  volunteerId: string, 
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
        eventId_volunteerId: {
          eventId,
          volunteerId
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
        volunteerId,
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
    // Error logged by handleApiError
    return res.status(500).json({ error: 'Failed to update availability' })
  }
}
