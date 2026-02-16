import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Find the completed circuit assembly event
    const event = await prisma.events.findFirst({
      where: {
        eventType: 'CIRCUIT_ASSEMBLY'
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    if (!event) {
      return res.status(404).json({ error: 'No circuit assembly event found' })
    }

    // Get all positions for this event
    const positions = await prisma.positions.findMany({
      where: {
        eventId: event.id,
        isActive: true
      },
      orderBy: [
        { area: 'asc' },
        { sequence: 'asc' }
      ]
    })

    // Group positions by area (department)
    const positionsByArea: Record<string, any[]> = {}
    positions.forEach(pos => {
      const area = pos.area || 'General'
      if (!positionsByArea[area]) {
        positionsByArea[area] = []
      }
      positionsByArea[area].push({
        id: pos.id,
        name: pos.name,
        description: pos.description,
        area: pos.area,
        positionNumber: pos.positionNumber,
        sequence: pos.sequence
      })
    })

    return res.status(200).json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
        totalPositions: positions.length
      },
      positionsByArea
    })
  } catch (error) {
    console.error('Error extracting positions:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
