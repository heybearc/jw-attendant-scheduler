import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'
import { randomUUID } from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const { eventName, positions } = req.body

    if (!eventName || !positions) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Find the event by name
    const event = await prisma.events.findFirst({
      where: {
        name: {
          contains: eventName,
          mode: 'insensitive'
        }
      }
    })

    if (!event) {
      return res.status(404).json({ error: `Event not found: ${eventName}` })
    }

    // Get the highest position number currently in the event
    const highestPosition = await prisma.positions.findFirst({
      where: { eventId: event.id },
      orderBy: { positionNumber: 'desc' },
      select: { positionNumber: true }
    })

    let nextPositionNumber = (highestPosition?.positionNumber || 0) + 1
    let nextSequence = 1
    let positionsCreated = 0

    // Create positions from the extracted data
    for (const [area, areaPositions] of Object.entries(positions)) {
      for (const pos of areaPositions as any[]) {
        await prisma.positions.create({
          data: {
            id: randomUUID(),
            eventId: event.id,
            positionNumber: nextPositionNumber++,
            name: pos.name,
            description: pos.description || null,
            area: area,
            sequence: nextSequence++,
            isActive: true,
            updatedAt: new Date()
          }
        })
        positionsCreated++
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Positions applied to event successfully',
      eventId: event.id,
      eventName: event.name,
      positionsCreated
    })
  } catch (error) {
    console.error('Error applying positions to event:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
