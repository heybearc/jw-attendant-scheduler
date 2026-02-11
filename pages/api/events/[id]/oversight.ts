import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'

/**
 * Event Oversight Dashboard API
 * 
 * GET /api/events/[id]/oversight
 * Returns oversight assignments for a specific event using position_oversight_assignments
 * 
 * Response includes:
 * - List of overseers with their position assignments
 * - List of keymen with their position assignments
 * - Coverage statistics (% of positions with oversight)
 * - Coverage gaps (positions without oversight)
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id: eventId } = req.query

  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Event ID is required' })
  }

  if (req.method === 'GET') {
    try {
      // Verify event exists
      const event = await prisma.events.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          name: true,
          status: true,
          eventType: true,
          startDate: true
        }
      })

      if (!event) {
        return res.status(404).json({ error: 'Event not found' })
      }

      // Get all position oversight assignments for this event
      const oversightAssignments = await prisma.position_oversight_assignments.findMany({
        where: {
          eventId: eventId
        },
        include: {
          overseer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          keyman: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          positions: {
            select: {
              id: true,
              name: true,
              positionNumber: true,
              area: true
            }
          }
        }
      })

      // Get total positions for coverage calculation
      const totalPositions = await prisma.positions.count({
        where: { eventId: eventId }
      })

      // Get positions with oversight
      const positionsWithOversight = oversightAssignments.filter(
        oa => oa.overseerId || oa.keymanId
      )

      // Get positions without oversight (coverage gaps)
      const positionsWithOversightIds = new Set(
        oversightAssignments.map(oa => oa.positionId)
      )
      
      const allPositions = await prisma.positions.findMany({
        where: { eventId: eventId },
        select: {
          id: true,
          name: true,
          positionNumber: true,
          area: true
        }
      })

      const coverageGaps = allPositions.filter(
        p => !positionsWithOversightIds.has(p.id)
      )

      // Group by overseer and keyman
      const overseerMap = new Map<string, any[]>()
      const keymanMap = new Map<string, any[]>()

      oversightAssignments.forEach(oa => {
        if (oa.overseer) {
          const key = oa.overseer.id
          if (!overseerMap.has(key)) {
            overseerMap.set(key, [])
          }
          overseerMap.get(key)!.push({
            positionId: oa.positions.id,
            positionName: oa.positions.name,
            positionNumber: oa.positions.positionNumber,
            area: oa.positions.area
          })
        }

        if (oa.keyman) {
          const key = oa.keyman.id
          if (!keymanMap.has(key)) {
            keymanMap.set(key, [])
          }
          keymanMap.get(key)!.push({
            positionId: oa.positions.id,
            positionName: oa.positions.name,
            positionNumber: oa.positions.positionNumber,
            area: oa.positions.area
          })
        }
      })

      // Calculate coverage statistics
      const coverageCount = positionsWithOversight.length
      const coveragePercentage = totalPositions > 0 
        ? Math.round((coverageCount / totalPositions) * 100) 
        : 0

      // Build response
      const overseers = Array.from(overseerMap.entries()).map(([id, positions]) => {
        const overseer = oversightAssignments.find(oa => oa.overseer?.id === id)?.overseer
        return {
          user: {
            id: overseer?.id,
            name: `${overseer?.firstName} ${overseer?.lastName}`,
            email: overseer?.email
          },
          positions: positions
        }
      })

      const keymen = Array.from(keymanMap.entries()).map(([id, positions]) => {
        const keyman = oversightAssignments.find(oa => oa.keyman?.id === id)?.keyman
        return {
          user: {
            id: keyman?.id,
            name: `${keyman?.firstName} ${keyman?.lastName}`,
            email: keyman?.email
          },
          positions: positions
        }
      })

      return res.status(200).json({
        success: true,
        data: {
          event: {
            id: event.id,
            name: event.name,
            status: event.status,
            eventType: event.eventType,
            startDate: event.startDate
          },
          oversight: {
            overseers: overseers,
            assistantOverseers: [], // Not tracked in new system
            keymen: keymen,
            coverageGaps: coverageGaps.map(position => ({
              id: position.id,
              positionName: position.name,
              positionNumber: position.positionNumber,
              department: position.area
            }))
          },
          statistics: {
            totalPositions: totalPositions,
            positionsWithOversight: coverageCount,
            coveragePercentage: coveragePercentage,
            overseerCount: overseers.length,
            assistantOverseerCount: 0,
            keymanCount: keymen.length
          }
        }
      })
    } catch (error) {
      console.error('Oversight API error:', error)
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch oversight data',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
