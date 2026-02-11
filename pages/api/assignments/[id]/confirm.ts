import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'
import { randomBytes } from 'crypto'
import { handleApiError } from '../../../src/lib/apiError'

/**
 * Phase 4C: Assignment Confirmation API
 * Allow volunteers to confirm or decline assignments
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

    const { id: assignmentId } = req.query
    const { status, notes, declinedReason } = req.body

    if (!assignmentId || typeof assignmentId !== 'string') {
      return res.status(400).json({ error: 'Assignment ID required' })
    }

    // Validate status
    const validStatuses = ['CONFIRMED', 'DECLINED', 'TENTATIVE']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses
      })
    }

    // Fetch assignment
    const assignment = await prisma.assignments.findUnique({
      where: { id: assignmentId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        events: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    // Verify user is assigned to this assignment
    if (assignment.userId !== session.user.id) {
      return res.status(403).json({ error: 'You can only confirm your own assignments' })
    }

    // Update assignment confirmation status
    const updated = await prisma.assignments.update({
      where: { id: assignmentId },
      data: {
        confirmationStatus: status,
        confirmedAt: status === 'CONFIRMED' ? new Date() : null,
        confirmationNotes: notes || null,
        declinedReason: status === 'DECLINED' ? (declinedReason || 'No reason provided') : null,
        updatedAt: new Date()
      }
    })

    // Log the confirmation action
    console.log(`Assignment ${assignmentId} ${status} by ${session.user.email}`)

    return res.status(200).json({
      success: true,
      message: `Assignment ${status.toLowerCase()} successfully`,
      assignment: {
        id: updated.id,
        confirmationStatus: updated.confirmationStatus,
        confirmedAt: updated.confirmedAt,
        confirmationNotes: updated.confirmationNotes
      }
    })

  } catch (error: any) {
    // Error logged by handleApiError
    return res.status(500).json({
      error: 'Failed to confirm assignment',
      message: error.message
    })
  }
}
