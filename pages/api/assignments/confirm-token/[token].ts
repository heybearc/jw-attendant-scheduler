import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../src/lib/prisma'

/**
 * Phase 4C: Token-Based Assignment Confirmation
 * Allow volunteers to confirm/decline via email link without login
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query
  const { method } = req

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Confirmation token required' })
  }

  try {
    // Find assignment by confirmation token
    const assignment = await prisma.assignments.findUnique({
      where: { confirmationToken: token },
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
            name: true,
            startDate: true,
            location: true
          }
        },
        event_positions: {
          select: {
            positionName: true,
            positionNumber: true
          }
        }
      }
    })

    if (!assignment) {
      return res.status(404).json({ 
        error: 'Invalid or expired confirmation token',
        message: 'This confirmation link is no longer valid. Please contact your coordinator.'
      })
    }

    // Check if already confirmed
    if (assignment.confirmationStatus === 'CONFIRMED') {
      return res.status(200).json({
        success: true,
        message: 'This assignment has already been confirmed',
        assignment: {
          id: assignment.id,
          eventName: assignment.events.name,
          positionName: assignment.event_positions.positionName,
          confirmationStatus: assignment.confirmationStatus,
          confirmedAt: assignment.confirmedAt
        }
      })
    }

    switch (method) {
      case 'GET':
        return handleGet(assignment, res)
      case 'POST':
        return handlePost(assignment, req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }

  } catch (error: any) {
    console.error('Token confirmation error:', error)
    return res.status(500).json({
      error: 'Failed to process confirmation',
      message: error.message
    })
  }
}

// GET: Retrieve assignment details for confirmation page
async function handleGet(assignment: any, res: NextApiResponse) {
  const eventDate = new Date(assignment.events.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return res.status(200).json({
    success: true,
    assignment: {
      id: assignment.id,
      volunteer: {
        firstName: assignment.users.firstName,
        lastName: assignment.users.lastName,
        email: assignment.users.email
      },
      event: {
        id: assignment.events.id,
        name: assignment.events.name,
        date: eventDate,
        location: assignment.events.location
      },
      position: {
        name: assignment.event_positions.positionName,
        number: assignment.event_positions.positionNumber
      },
      shift: {
        start: assignment.shiftStart,
        end: assignment.shiftEnd
      },
      confirmationStatus: assignment.confirmationStatus,
      confirmedAt: assignment.confirmedAt,
      notes: assignment.notes
    }
  })
}

// POST: Confirm or decline assignment via token
async function handlePost(assignment: any, req: NextApiRequest, res: NextApiResponse) {
  const { action, notes, declinedReason } = req.body

  // Validate action
  const validActions = ['confirm', 'decline', 'tentative']
  if (!action || !validActions.includes(action)) {
    return res.status(400).json({
      error: 'Invalid action',
      validActions
    })
  }

  // Map action to status
  const statusMap: Record<string, string> = {
    confirm: 'CONFIRMED',
    decline: 'DECLINED',
    tentative: 'TENTATIVE'
  }
  const status = statusMap[action]

  // Update assignment
  const updated = await prisma.assignments.update({
    where: { id: assignment.id },
    data: {
      confirmationStatus: status,
      confirmedAt: status === 'CONFIRMED' ? new Date() : null,
      confirmationNotes: notes || null,
      declinedReason: status === 'DECLINED' ? (declinedReason || 'No reason provided') : null,
      updatedAt: new Date()
    }
  })

  // Log the action
  console.log(`Assignment ${assignment.id} ${status} via token by ${assignment.users.email}`)

  return res.status(200).json({
    success: true,
    message: `Assignment ${action}ed successfully`,
    assignment: {
      id: updated.id,
      confirmationStatus: updated.confirmationStatus,
      confirmedAt: updated.confirmedAt
    }
  })
}
