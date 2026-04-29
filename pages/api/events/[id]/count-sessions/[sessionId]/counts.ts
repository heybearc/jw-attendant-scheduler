import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../../../src/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'
import { handleApiError } from '@/lib/apiError'
import {
  blockSimulatedMutation,
  getSessionUser,
  hasSessionPositionAssignees,
  isPrivilegedCounterRole,
  isVolunteerAssignedToSessionPosition,
  resolveVolunteerIdForSessionUser
} from '@/lib/countAssignments'

// Validation schema for position count
const positionCountSchema = z.object({
  positionId: z.string().uuid('Invalid position ID'),
  attendeeCount: z.number().int().min(0).optional(),
  notes: z.string().optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: eventId, sessionId } = req.query

  if (!eventId || typeof eventId !== 'string' || !sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Event ID and Session ID are required' })
  }

  const sessionUser = await getSessionUser(req, res)
  if (!sessionUser) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, eventId, sessionId)
      case 'POST':
        if (blockSimulatedMutation(req, res)) return
        return await handlePost(req, res, eventId, sessionId, sessionUser.id, sessionUser.role)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, eventId: string, sessionId: string) {
  // Fetch all counts for this session
  const counts = await prisma.position_counts.findMany({
    where: {
      countSessionId: sessionId
    },
    include: {
      position: {
        select: {
          id: true,
          positionNumber: true,
          name: true,
          area: true
        }
      }
    },
    orderBy: {
      position: {
        positionNumber: 'asc'
      }
    }
  })

  return res.status(200).json({
    success: true,
    data: counts
  })
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  eventId: string,
  sessionId: string,
  userId: string,
  role: string
) {
  // Validate request body
  const validation = positionCountSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors
    })
  }

  const data = validation.data

  // Verify count session exists and belongs to event
  const countSession = await prisma.count_sessions.findUnique({
    where: { id: sessionId },
    select: { eventId: true, status: true }
  })

  if (!countSession) {
    return res.status(404).json({ error: 'Count session not found' })
  }

  if (countSession.eventId !== eventId) {
    return res.status(400).json({ error: 'Count session does not belong to this event' })
  }

  if (countSession.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Count session is not active' })
  }

  // Verify position exists and belongs to event
  const position = await prisma.positions.findUnique({
    where: { id: data.positionId },
    select: { eventId: true }
  })

  if (!position) {
    return res.status(404).json({ error: 'Position not found' })
  }

  if (position.eventId !== eventId) {
    return res.status(400).json({ error: 'Position does not belong to this event' })
  }

  if (!isPrivilegedCounterRole(role)) {
    const volunteerId = await resolveVolunteerIdForSessionUser(userId, role)
    if (!volunteerId) {
      return res.status(403).json({ error: 'No volunteer identity found for this user' })
    }

    const hasExplicitAssignees = await hasSessionPositionAssignees(sessionId, data.positionId)
    let canEnter = false

    if (hasExplicitAssignees) {
      canEnter = await isVolunteerAssignedToSessionPosition(sessionId, data.positionId, volunteerId)
    } else if (process.env.COUNT_ASSIGNMENTS_FALLBACK === 'true') {
      const legacyAssignment = await prisma.position_assignments.findFirst({
        where: {
          positionId: data.positionId,
          volunteerId
        },
        select: { id: true }
      })
      canEnter = !!legacyAssignment
    }

    if (!canEnter) {
      return res.status(403).json({ error: 'You are not assigned to enter a count for this station/session' })
    }
  }

  // Check if count already exists for this position in this session
  const existingCount = await prisma.position_counts.findUnique({
    where: {
      countSessionId_positionId: {
        countSessionId: sessionId,
        positionId: data.positionId
      }
    }
  })

  let positionCount

  if (existingCount) {
    // Update existing count
    positionCount = await prisma.position_counts.update({
      where: { id: existingCount.id },
      data: {
        attendeeCount: data.attendeeCount ?? null,
        notes: data.notes,
        countedBy: userId,
        countedAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        position: {
          select: {
            id: true,
            positionNumber: true,
            name: true,
            area: true
          }
        }
      }
    })
  } else {
    // Create new count
    positionCount = await prisma.position_counts.create({
      data: {
        id: crypto.randomUUID(),
        countSessionId: sessionId,
        positionId: data.positionId,
        attendeeCount: data.attendeeCount ?? null,
        notes: data.notes,
        countedBy: userId,
        countedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        position: {
          select: {
            id: true,
            positionNumber: true,
            name: true,
            area: true
          }
        }
      }
    })
  }

  return res.status(existingCount ? 200 : 201).json({
    success: true,
    data: positionCount,
    message: existingCount ? 'Count updated successfully' : 'Count submitted successfully'
  })
}
