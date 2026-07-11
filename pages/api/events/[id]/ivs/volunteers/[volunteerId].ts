import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { canManageIvsVolunteers } from '@/lib/eventAccess'
import { EarlyEntrySchedule, scheduleToPrismaUpdate } from '@/lib/ivsEarlyCheckin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT' && req.method !== 'PATCH' && req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id: eventId, volunteerId } = req.query

    if (!(await canManageIvsVolunteers(session.user.id, eventId as string))) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — you need permission to manage IVS volunteers for this event',
      })
    }

    // Handle DELETE request
    if (req.method === 'DELETE') {
      const eventVolunteer = await prisma.event_volunteers.findUnique({
        where: {
          id: volunteerId as string
        }
      })

      if (!eventVolunteer) {
        return res.status(404).json({ success: false, message: 'IVS volunteer not found in event' })
      }

      await prisma.event_volunteers.delete({
        where: { id: eventVolunteer.id }
      })

      return res.status(200).json({
        success: true,
        message: 'Volunteer deleted successfully'
      })
    }

    const {
      firstName,
      lastName,
      congregation,
      ivsApprovalStatus,
      ivsApprovalNotes,
      ivsDeniedReason,
      earlyCheckinEligible,
      earlyEntry,
      ivsRequestRound,
      ivsSubmittedBy
    } = req.body

    // Get the event_volunteers record first to get the actual volunteerId
    const eventVolunteer = await prisma.event_volunteers.findUnique({
      where: {
        id: volunteerId as string
      }
    })

    if (!eventVolunteer) {
      return res.status(404).json({ success: false, message: 'IVS volunteer not found in event' })
    }

    // Update global volunteer record if name/congregation changed
    if ((firstName || lastName || congregation) && eventVolunteer.volunteerId) {
      const volunteer = await prisma.volunteers.findUnique({
        where: { id: eventVolunteer.volunteerId }
      })

      if (volunteer) {
        await prisma.volunteers.update({
          where: { id: eventVolunteer.volunteerId },
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

    if (earlyEntry && typeof earlyEntry === 'object') {
      Object.assign(updateData, scheduleToPrismaUpdate({
        friday: earlyEntry.friday === true,
        saturday: earlyEntry.saturday === true,
        sunday: earlyEntry.sunday === true,
      }))
    } else if (earlyCheckinEligible !== undefined) {
      const all = earlyCheckinEligible === true
      Object.assign(updateData, scheduleToPrismaUpdate({
        friday: all,
        saturday: all,
        sunday: all,
      }))
    }

    if (ivsRequestRound !== undefined) {
      updateData.ivsRequestRound = ivsRequestRound
    }

    if (ivsSubmittedBy !== undefined) {
      updateData.ivsSubmittedBy = ivsSubmittedBy
    }

    // Update the event_volunteers record
    await prisma.event_volunteers.update({
      where: { id: eventVolunteer.id },
      data: updateData
    })

    return res.status(200).json({
      success: true,
      message: 'Volunteer updated successfully'
    })

  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}
