import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { canManageIvsVolunteers } from '@/lib/eventAccess'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id: eventId } = req.query

    if (!(await canManageIvsVolunteers(session.user.id, eventId as string))) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — you need permission to manage volunteers for this event',
      })
    }

    const {
      volunteerIds,
      action,
      ivsApprovalStatus,
      earlyCheckinEligible,
      ivsRequestRound,
      ivsSubmittedBy,
      ivsDeniedReason
    } = req.body

    if (!volunteerIds || !Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No volunteers selected' })
    }

    if (!action) {
      return res.status(400).json({ success: false, message: 'No action specified' })
    }

    let updated = 0
    const errors: string[] = []

    for (const volunteerId of volunteerIds) {
      try {
        const eventVolunteer = await prisma.event_volunteers.findUnique({
          where: {
            id: volunteerId
          }
        })

        if (!eventVolunteer) {
          errors.push(`Volunteer ${volunteerId} not found in event`)
          continue
        }

        const updateData: any = {
          updatedAt: new Date()
        }

        switch (action) {
          case 'approve':
            updateData.ivsApprovalStatus = 'Approved'
            updateData.ivsApprovedAt = new Date()
            updateData.ivsApprovedBy = session.user.email || session.user.id
            break
          
          case 'deny':
            updateData.ivsApprovalStatus = 'Not Approved'
            if (ivsDeniedReason) {
              updateData.ivsDeniedReason = ivsDeniedReason
            }
            break
          
          case 'setEarlyEntry':
            updateData.earlyCheckinEligible = earlyCheckinEligible
            break
          
          case 'changeRound':
            if (ivsRequestRound !== undefined) {
              updateData.ivsRequestRound = ivsRequestRound
            }
            break
          
          case 'changeDepartment':
            if (ivsSubmittedBy !== undefined) {
              updateData.ivsSubmittedBy = ivsSubmittedBy
            }
            break
          
          default:
            errors.push(`Unknown action: ${action}`)
            continue
        }

        await prisma.event_volunteers.update({
          where: { id: eventVolunteer.id },
          data: updateData
        })

        updated++
      } catch (error) {
        // Error logged by handleApiError
        errors.push(`Error updating volunteer ${volunteerId}: ${error.message}`)
      }
    }

    return res.status(200).json({
      success: true,
      updated,
      errors: errors.length > 0 ? errors : undefined,
      message: `Updated ${updated} volunteer(s)`
    })

  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}
