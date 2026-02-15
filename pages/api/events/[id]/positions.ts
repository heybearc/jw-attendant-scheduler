import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id: eventId } = req.query

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'Event ID is required' })
    }

    if (req.method === 'POST') {
      // Create a new position
      const { positionNumber, name, area, description } = req.body

      if (!positionNumber || !name) {
        return res.status(400).json({ error: 'Position number and name are required' })
      }

      const { v4: uuidv4 } = require('uuid')
      const now = new Date()

      const position = await prisma.positions.create({
        data: {
          id: uuidv4(),
          eventId: eventId,
          positionNumber: parseInt(positionNumber),
          name,
          area: area || null,
          description: description || null,
          sequence: parseInt(positionNumber),
          isActive: true,
          updatedAt: now
        }
      })

      return res.status(201).json({
        success: true,
        position
      })
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET', 'POST'])
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Fetch positions with all related data
    const positions = await prisma.positions.findMany({
      where: { eventId: eventId },
      include: {
        shifts: true,
        assignments: {
          include: {
            volunteer: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            shift: true
          }
        }
      },
      orderBy: { positionNumber: 'asc' }
    })

    // Fetch oversight data separately
    const oversightData = await prisma.position_oversight_assignments.findMany({
      where: {
        positionId: {
          in: positions.map(p => p.id)
        }
      },
      include: {
        overseer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        keyman: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Attach oversight data to positions
    const positionsWithOversight = positions.map((position: any) => {
      const positionOversight = oversightData
        .filter((oversight: any) => oversight.positionId === position.id)
        .map((oversight: any) => ({
          id: oversight.id,
          overseer: oversight.overseer,
          keyman: oversight.keyman
        }))
      
      return {
        ...position,
        oversight: positionOversight
      }
    })

    return res.status(200).json({
      success: true,
      positions: positionsWithOversight
    })

  } catch (error: any) {
    // Error logged by handleApiError
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
