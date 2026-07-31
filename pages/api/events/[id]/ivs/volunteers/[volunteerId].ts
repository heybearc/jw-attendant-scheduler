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
      email,
      phone,
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

    // Update global volunteer record if identity/contact fields changed
    if (
      (firstName || lastName || congregation || email !== undefined || phone !== undefined) &&
      eventVolunteer.volunteerId
    ) {
      const volunteer = await prisma.volunteers.findUnique({
        where: { id: eventVolunteer.volunteerId }
      })

      if (volunteer) {
        const { normalizePhoneOrNull, isValidPhoneNumber } = await import('@/lib/formatPhone')
        const phoneUpdate =
          phone !== undefined
            ? (() => {
                const raw = String(phone ?? '').trim()
                if (!raw) return null
                if (!isValidPhoneNumber(raw)) {
                  throw Object.assign(new Error('Enter a valid 10-digit phone number'), {
                    statusCode: 400,
                  })
                }
                return normalizePhoneOrNull(raw)
              })()
            : undefined

        const emailUpdate =
          email !== undefined
            ? (() => {
                const normalized = String(email ?? '').trim().toLowerCase()
                if (!normalized || !normalized.includes('@')) {
                  throw Object.assign(new Error('Enter a valid email address'), {
                    statusCode: 400,
                  })
                }
                return normalized
              })()
            : undefined

        await prisma.volunteers.update({
          where: { id: eventVolunteer.volunteerId },
          data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(congregation && { congregation }),
            ...(emailUpdate !== undefined && { email: emailUpdate }),
            ...(phoneUpdate !== undefined && { phone: phoneUpdate }),
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
        updateData.ivsDeniedReason = null
      } else if (ivsApprovalStatus === 'Not Approved') {
        // Match bulk setStatus: approval stamp only applies while Approved
        updateData.ivsApprovedAt = null
        updateData.ivsApprovedBy = null
        if (ivsDeniedReason !== undefined) {
          const reason =
            typeof ivsDeniedReason === 'string' ? ivsDeniedReason.trim() : ''
          updateData.ivsDeniedReason = reason === '' ? null : reason
        }
      } else {
        // Pending, Requested, or any other non-Approved status
        updateData.ivsApprovedAt = null
        updateData.ivsApprovedBy = null
        updateData.ivsDeniedReason = null
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

  } catch (error: any) {
    if (error?.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid request',
      })
    }
    // Error logged by handleApiError
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}
