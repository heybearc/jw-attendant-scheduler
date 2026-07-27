import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '../../../../../auth/[...nextauth]'
import { prisma } from '../../../../../../../src/lib/prisma'
import { canManagePosition } from '../../../../../../../src/lib/eventAccess'

// APEX GUARDIAN: Individual Shift Management API
// Handles update/deletion of individual shifts with proper cleanup

const updateShiftSchema = z.object({
  volunteersNeeded: z.number().int().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  isAllDay: z.boolean().optional()
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { id: eventId, positionId, shiftId } = req.query

    if (!eventId || typeof eventId !== 'string' || 
        !positionId || typeof positionId !== 'string' ||
        !shiftId || typeof shiftId !== 'string') {
      return res.status(400).json({ success: false, error: 'Event ID, Position ID, and Shift ID are required' })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user?.email || '' }
    })
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    if (!(await canManagePosition(user.id, eventId, positionId))) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' })
    }

    const event = await prisma.events.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    const position = await prisma.positions.findFirst({
      where: { 
        id: positionId,
        eventId: eventId
      }
    })

    if (!position) {
      return res.status(404).json({ success: false, error: 'Position not found' })
    }

    const shift = await prisma.position_shifts.findFirst({
      where: { 
        id: shiftId,
        positionId: positionId
      }
    })

    if (!shift) {
      return res.status(404).json({ success: false, error: 'Shift not found' })
    }

    if (req.method === 'PATCH') {
      return await handleUpdateShift(req, res, shiftId)
    }

    if (req.method === 'DELETE') {
      return await handleDeleteShift(req, res, eventId, positionId, shiftId, shift.name)
    }

    res.setHeader('Allow', ['PATCH', 'DELETE'])
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  } catch (error: any) {
    console.error('❌ SHIFT MANAGEMENT API ERROR:', error.message)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

async function handleUpdateShift(req: NextApiRequest, res: NextApiResponse, shiftId: string) {
  const validated = updateShiftSchema.parse(req.body)
  if (Object.keys(validated).length === 0) {
    return res.status(400).json({ success: false, error: 'No fields to update' })
  }

  const updated = await prisma.position_shifts.update({
    where: { id: shiftId },
    data: validated
  })

  return res.status(200).json({
    success: true,
    data: updated,
    message: 'Shift updated successfully'
  })
}

async function handleDeleteShift(req: NextApiRequest, res: NextApiResponse, eventId: string, positionId: string, shiftId: string, shiftName: string) {
  
  try {
    // Check if shift has assignments
    const assignments = await prisma.position_assignments.findMany({
      where: { shiftId: shiftId }
    })


    // Delete in transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // First, delete all assignments for this shift
      if (assignments.length > 0) {
        await tx.position_assignments.deleteMany({
          where: { shiftId: shiftId }
        })
      }

      // Then delete the shift itself
      await tx.position_shifts.delete({
        where: { id: shiftId }
      })
    })

    return res.status(200).json({
      success: true,
      message: `Shift "${shiftName}" deleted successfully`,
      data: {
        shiftId: shiftId,
        assignmentsRemoved: assignments.length
      }
    })

  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Shift not found'
      })
    }
    
    // Error logged by handleApiError
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to delete shift' 
    })
  }
}
