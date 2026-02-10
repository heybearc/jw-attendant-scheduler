import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    const { id: eventId, volunteerId } = req.query

    // Verify user has admin access to this event
    const eventPermission = await prisma.event_permissions.findFirst({
      where: {
        eventId: eventId as string,
        userId: session.user.id,
        role: 'ADMIN' as any,
      },
    })

    if (!eventPermission) {
      return res.status(403).json({ success: false, message: 'Forbidden - Admin access required' })
    }

    const {
      firstName,
      lastName,
      congregation,
      ivsApprovalStatus,
      ivsApprovalNotes,
      ivsDeniedReason,
      earlyCheckinEligible,
      checkedInAt,
      checkedInBy,
      checkinNotes,
      ivsRequestRound,
      ivsSubmittedBy
    } = req.body

    // Update global volunteer record if name/congregation changed
    if (firstName || lastName || congregation) {
      const volunteer = await prisma.volunteers.findUnique({
        where: { id: volunteerId as string }
      })

      if (volunteer) {
        await prisma.volunteers.update({
          where: { id: volunteerId as string },
          data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(congregation && { congregation }),
            updatedAt: new Date()
          }
        })
      }
    }

    // Update event_volunteers record with IVS fields
    const updateData: any = {
      updatedAt: new Date()
    }

    if (ivsApprovalStatus !== undefined) {
      updateData.ivsApprovalStatus = ivsApprovalStatus
      
      if (ivsApprovalStatus === 'Approved') {
        updateData.ivsApprovedAt = new Date()
        updateData.ivsApprovedBy = session.user.email || session.user.id
      } else if (ivsApprovalStatus === 'Not Approved' && ivsDeniedReason) {
        updateData.ivsDeniedReason = ivsDeniedReason
      }
    }

    if (ivsApprovalNotes !== undefined) {
      updateData.ivsApprovalNotes = ivsApprovalNotes
    }

    if (ivsDeniedReason !== undefined) {
      updateData.ivsDeniedReason = ivsDeniedReason
    }

    if (earlyCheckinEligible !== undefined) {
      updateData.earlyCheckinEligible = earlyCheckinEligible
    }

    if (checkedInAt !== undefined) {
      updateData.checkedInAt = checkedInAt
    }

    if (checkedInBy !== undefined) {
      updateData.checkedInBy = checkedInBy
    }

    if (checkinNotes !== undefined) {
      updateData.checkinNotes = checkinNotes
    }

    if (ivsRequestRound !== undefined) {
      updateData.ivsRequestRound = ivsRequestRound
    }

    if (ivsSubmittedBy !== undefined) {
      updateData.ivsSubmittedBy = ivsSubmittedBy
    }

    // Find the event_volunteers record by volunteerId (the volunteer's global ID)
    const eventVolunteer = await prisma.event_volunteers.findFirst({
      where: {
        eventId: eventId as string,
        volunteerId: volunteerId as string,
        ivsImportBatchId: { not: null } as any // Ensure it's an IVS volunteer
      }
    })

    if (!eventVolunteer) {
      return res.status(404).json({ success: false, message: 'IVS volunteer not found in event' })
    }

    await prisma.event_volunteers.update({
      where: { id: eventVolunteer.id },
      data: updateData
    })

    return res.status(200).json({
      success: true,
      message: 'Volunteer updated successfully'
    })

  } catch (error) {
    console.error('IVS volunteer update error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  } finally {
    await prisma.$disconnect()
  }
}
