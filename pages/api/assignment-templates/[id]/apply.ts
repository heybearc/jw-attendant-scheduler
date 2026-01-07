import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'
import { randomUUID } from 'crypto'

/**
 * Phase 4C Week 2: Apply Assignment Template to Event
 * Creates positions based on template pattern
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id: templateId } = req.query
    const { eventId, startDate, sendNotifications, overwriteExisting } = req.body

    if (!templateId || typeof templateId !== 'string') {
      return res.status(400).json({ error: 'Template ID required' })
    }

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID required' })
    }

    // Fetch template with assignments
    const template = await (prisma as any).assignment_templates.findUnique({
      where: { id: templateId },
      include: {
        template_assignments: {
          orderBy: { sequence: 'asc' }
        }
      }
    })

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    if (!template.isActive) {
      return res.status(400).json({ error: 'Template is inactive' })
    }

    // Verify event exists
    const event = await prisma.events.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Check if positions already exist
    if (!overwriteExisting) {
      const existingPositions = await prisma.positions.count({
        where: { eventId }
      })

      if (existingPositions > 0) {
        return res.status(400).json({
          error: 'Event already has positions',
          message: 'Set overwriteExisting=true to replace existing positions',
          existingCount: existingPositions
        })
      }
    }

    // Parse start date for shift calculations
    const eventStartDate = startDate ? new Date(startDate) : new Date(event.startDate)
    const dateStr = eventStartDate.toISOString().split('T')[0]

    const createdPositions: any[] = []
    const createdShifts: any[] = []

    // Apply template in transaction
    await (prisma as any).$transaction(async (tx: any) => {
      // If overwriting, delete existing positions (cascades to shifts and assignments)
      if (overwriteExisting) {
        await tx.positions.deleteMany({
          where: { eventId }
        })
      }

      // Create positions and shifts from template
      for (const templateAssignment of template.template_assignments) {
        // Create position
        const positionId = randomUUID()
        const position = await tx.positions.create({
          data: {
            id: positionId,
            eventId,
            positionNumber: templateAssignment.positionNumber,
            positionName: templateAssignment.positionName,
            area: templateAssignment.area,
            isActive: true
          }
        })

        createdPositions.push(position)

        // Create shift for this position
        const shiftId = randomUUID()
        const shiftStartTime = `${dateStr}T${templateAssignment.shiftStart}:00.000Z`
        const shiftEndTime = `${dateStr}T${templateAssignment.shiftEnd}:00.000Z`

        const shift = await tx.position_shifts.create({
          data: {
            id: shiftId,
            positionId,
            shiftName: `${templateAssignment.positionName} - ${templateAssignment.shiftStart} to ${templateAssignment.shiftEnd}`,
            startTime: shiftStartTime,
            endTime: shiftEndTime,
            sequence: 0,
            isActive: true
          }
        })

        createdShifts.push(shift)
      }

      // Log template usage
      await tx.template_usage_log.create({
        data: {
          id: randomUUID(),
          templateId,
          eventId,
          appliedBy: session.user.id,
          positionsCreated: createdPositions.length
        }
      })

      // Increment usage count
      await tx.assignment_templates.update({
        where: { id: templateId },
        data: {
          usageCount: { increment: 1 }
        }
      })
    })

    return res.status(200).json({
      success: true,
      message: `Template applied successfully`,
      template: {
        id: template.id,
        name: template.name
      },
      event: {
        id: event.id,
        name: event.name
      },
      created: {
        positions: createdPositions.length,
        shifts: createdShifts.length
      },
      positions: createdPositions.map(p => ({
        id: p.id,
        number: p.positionNumber,
        name: p.positionName
      }))
    })

  } catch (error: any) {
    console.error('Apply template error:', error)
    return res.status(500).json({
      error: 'Failed to apply template',
      message: error.message
    })
  }
}
