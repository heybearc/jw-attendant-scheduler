import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { canManageIvsVolunteers } from '@/lib/eventAccess'
import { isValidIvsApprovalStatus } from '@/lib/ivs'
import {
  EarlyEntrySchedule,
  scheduleToPrismaUpdate,
} from '@/lib/ivsEarlyCheckin'

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
      earlyCheckinFriday,
      earlyCheckinSaturday,
      earlyCheckinSunday,
      earlyEntry,
      ivsRequestRound,
      ivsSubmittedBy,
      ivsDeniedReason,
      congregation,
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
          case 'setStatus': {
            if (typeof ivsApprovalStatus !== 'string' || !isValidIvsApprovalStatus(ivsApprovalStatus)) {
              errors.push(`Invalid status for volunteer ${volunteerId}`)
              continue
            }
            updateData.ivsApprovalStatus = ivsApprovalStatus
            if (ivsApprovalStatus === 'Approved') {
              updateData.ivsApprovedAt = new Date()
              updateData.ivsApprovedBy = session.user.email || session.user.id
              updateData.ivsDeniedReason = null
            } else if (ivsApprovalStatus === 'Not Approved') {
              updateData.ivsApprovedAt = null
              updateData.ivsApprovedBy = null
              if (ivsDeniedReason !== undefined) {
                const reason =
                  typeof ivsDeniedReason === 'string' ? ivsDeniedReason.trim() : ''
                updateData.ivsDeniedReason = reason === '' ? null : reason
              }
            } else {
              updateData.ivsApprovedAt = null
              updateData.ivsApprovedBy = null
              updateData.ivsDeniedReason = null
            }
            break
          }

          case 'setEarlyEntry': {
            let schedule: EarlyEntrySchedule | null = null
            if (earlyEntry && typeof earlyEntry === 'object' && !Array.isArray(earlyEntry)) {
              const e = earlyEntry as Record<string, unknown>
              schedule = {
                friday: e.friday === true,
                saturday: e.saturday === true,
                sunday: e.sunday === true,
              }
            } else if (
              earlyCheckinFriday !== undefined ||
              earlyCheckinSaturday !== undefined ||
              earlyCheckinSunday !== undefined
            ) {
              schedule = {
                friday: earlyCheckinFriday === true,
                saturday: earlyCheckinSaturday === true,
                sunday: earlyCheckinSunday === true,
              }
            } else if (earlyCheckinEligible !== undefined) {
              const all = earlyCheckinEligible === true
              schedule = { friday: all, saturday: all, sunday: all }
            }
            if (!schedule) {
              errors.push(`Early entry schedule required for volunteer ${volunteerId}`)
              continue
            }
            Object.assign(updateData, scheduleToPrismaUpdate(schedule))
            break
          }

          case 'changeRound':
            if (ivsRequestRound !== undefined) {
              updateData.ivsRequestRound = ivsRequestRound
            }
            break

          case 'changeDepartment':
            if (ivsSubmittedBy !== undefined) {
              updateData.ivsSubmittedBy =
                typeof ivsSubmittedBy === 'string' ? ivsSubmittedBy.trim() : ivsSubmittedBy
            }
            break

          case 'changeCongregation': {
            const cong =
              typeof congregation === 'string' ? congregation.trim() : ''
            if (!cong) {
              errors.push(`Congregation required for volunteer ${volunteerId}`)
              continue
            }
            if (!eventVolunteer.volunteerId) {
              errors.push(`Volunteer ${volunteerId} has no linked volunteer record`)
              continue
            }
            await prisma.volunteers.update({
              where: { id: eventVolunteer.volunteerId },
              data: { congregation: cong, updatedAt: new Date() },
            })
            await prisma.event_volunteers.update({
              where: { id: eventVolunteer.id },
              data: { updatedAt: new Date() },
            })
            updated++
            continue
          }

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
        errors.push(
          `Error updating volunteer ${volunteerId}: ${error instanceof Error ? error.message : String(error)}`
        )
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
