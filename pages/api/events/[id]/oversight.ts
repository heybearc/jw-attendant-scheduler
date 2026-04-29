import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).json({ success: false, error: 'Method not allowed' })
    }

    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { id: eventId } = req.query
    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ success: false, error: 'Event ID is required' })
    }

    const [event, totalPositions, oversightRows] = await Promise.all([
      prisma.events.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          departmentOverseerAssistants: true
        }
      }),
      prisma.positions.count({
        where: {
          eventId,
          isActive: true
        }
      }),
      prisma.position_oversight_assignments.findMany({
        where: { eventId },
        select: {
          positionId: true,
          overseerId: true,
          keymanId: true
        }
      })
    ])

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    const coveredPositionIds = new Set(oversightRows.map((row) => row.positionId))
    const uniqueOverseerIds = new Set(oversightRows.map((row) => row.overseerId).filter(Boolean))
    const uniqueKeymanIds = new Set(oversightRows.map((row) => row.keymanId).filter(Boolean))

    const assistants = Array.isArray(event.departmentOverseerAssistants)
      ? event.departmentOverseerAssistants
      : []

    const positionsWithOversight = coveredPositionIds.size
    const positionsWithoutOversight = Math.max(totalPositions - positionsWithOversight, 0)
    const coveragePercentage = totalPositions > 0
      ? Math.round((positionsWithOversight / totalPositions) * 100)
      : 0

    return res.status(200).json({
      success: true,
      statistics: {
        totalPositions,
        positionsWithOversight,
        positionsWithoutOversight,
        coveragePercentage,
        overseerCount: uniqueOverseerIds.size,
        assistantOverseerCount: assistants.length,
        keymanCount: uniqueKeymanIds.size
      }
    })
  } catch (error) {
    console.error('Oversight stats API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
