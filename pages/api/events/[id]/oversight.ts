import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'

/**
 * Phase 5B: Event Oversight Dashboard API
 * 
 * GET /api/events/[id]/oversight
 * Returns oversight assignments for a specific event
 * 
 * Response includes:
 * - List of overseers with their position assignments
 * - List of assistant overseers with their position assignments
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
          startDate: true,
          departmentTemplate: {
            select: {
              id: true,
              name: true,
              moduleConfig: true,
              terminology: true,
              positionTemplates: true
            }
          }
        }
      })

      if (!event) {
        return res.status(404).json({ error: 'Event not found' })
      }

      // Get all assignments for this event where user has oversight role
      const oversightAssignments = await prisma.assignments.findMany({
        where: {
          eventId: eventId
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          event_positions: {
            select: {
              id: true,
              positionName: true,
              positionNumber: true,
              department: true
            }
          }
        }
      })

      // Filter for oversight roles only
      const filteredOversightAssignments = oversightAssignments.filter(
        a => a.users.role === 'OVERSEER' || 
             a.users.role === 'ASSISTANT_OVERSEER' || 
             a.users.role === 'KEYMAN'
      )

      // Get total positions for coverage calculation
      const totalPositions = await prisma.event_positions.count({
        where: { eventId: eventId }
      })

      // Get positions with at least one oversight assignment
      const positionsWithOversight = await prisma.event_positions.findMany({
        where: {
          eventId: eventId,
          assignments: {
            some: {
              users: {
                role: {
                  in: ['OVERSEER', 'ASSISTANT_OVERSEER', 'KEYMAN']
                }
              }
            }
          }
        },
        select: { id: true }
      })

      // Get positions without oversight (coverage gaps)
      const positionsWithoutOversight = await prisma.event_positions.findMany({
        where: {
          eventId: eventId,
          NOT: {
            assignments: {
              some: {
                users: {
                  role: {
                    in: ['OVERSEER', 'ASSISTANT_OVERSEER', 'KEYMAN']
                  }
                }
              }
            }
          }
        },
        select: {
          id: true,
          positionName: true,
          positionNumber: true,
          department: true
        },
        orderBy: { positionNumber: 'asc' }
      })

      // Group assignments by role
      const overseers = filteredOversightAssignments.filter(a => a.users.role === 'OVERSEER')
      const assistantOverseers = filteredOversightAssignments.filter(a => a.users.role === 'ASSISTANT_OVERSEER')
      const keymen = filteredOversightAssignments.filter(a => a.users.role === 'KEYMAN')

      // Calculate coverage statistics
      const coverageCount = positionsWithOversight.length
      const coveragePercentage = totalPositions > 0 
        ? Math.round((coverageCount / totalPositions) * 100) 
        : 0

      // Check event-specific permissions
      const { canManageEvent, canDeleteEvent, canManagePermissions } = await import('../../../../src/lib/eventAccess')
      const userId = session.user?.id || ''
      const canEdit = await canManageEvent(userId, eventId)
      const canDelete = await canDeleteEvent(userId, eventId)
      const canManagePerms = await canManagePermissions(userId, eventId)

      // Format response
      const response = {
        event: {
          id: event.id,
          name: event.name,
          status: event.status,
          eventType: event.eventType,
          startDate: event.startDate?.toISOString() || '',
          departmentTemplate: event.departmentTemplate
        },
        permissions: {
          canEdit,
          canDelete,
          canManagePermissions: canManagePerms
        },
        statistics: {
          totalPositions,
          positionsWithOversight: coverageCount,
          positionsWithoutOversight: positionsWithoutOversight.length,
          coveragePercentage,
          overseerCount: overseers.length,
          assistantOverseerCount: assistantOverseers.length,
          keymanCount: keymen.length
        },
        overseers: overseers.map(assignment => ({
          assignmentId: assignment.id,
          user: {
            id: assignment.users.id,
            name: assignment.users.name,
            email: assignment.users.email
          },
          position: {
            id: assignment.event_positions.id,
            name: assignment.event_positions.positionName,
            number: assignment.event_positions.positionNumber,
            department: assignment.event_positions.department
          },
          shift: {
            start: assignment.shiftStart,
            end: assignment.shiftEnd
          },
          status: assignment.status,
          notes: assignment.notes
        })),
        assistantOverseers: assistantOverseers.map(assignment => ({
          assignmentId: assignment.id,
          user: {
            id: assignment.users.id,
            name: assignment.users.name,
            email: assignment.users.email
          },
          position: {
            id: assignment.event_positions.id,
            name: assignment.event_positions.positionName,
            number: assignment.event_positions.positionNumber,
            department: assignment.event_positions.department
          },
          shift: {
            start: assignment.shiftStart,
            end: assignment.shiftEnd
          },
          status: assignment.status,
          notes: assignment.notes
        })),
        keymen: keymen.map(assignment => ({
          assignmentId: assignment.id,
          user: {
            id: assignment.users.id,
            name: assignment.users.name,
            email: assignment.users.email
          },
          position: {
            id: assignment.event_positions.id,
            name: assignment.event_positions.positionName,
            number: assignment.event_positions.positionNumber,
            department: assignment.event_positions.department
          },
          shift: {
            start: assignment.shiftStart,
            end: assignment.shiftEnd
          },
          status: assignment.status,
          notes: assignment.notes
        })),
        coverageGaps: positionsWithoutOversight.map(position => ({
          id: position.id,
          name: position.positionName,
          number: position.positionNumber,
          department: position.department
        }))
      }

      return res.status(200).json(response)
    } catch (error) {
      console.error('Error fetching oversight data:', error)
      return res.status(500).json({ 
        error: 'Failed to fetch oversight data',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
