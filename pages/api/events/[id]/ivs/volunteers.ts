import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { canViewIvsVolunteers, canManageIvsVolunteers } from '@/lib/eventAccess'
import { earlyCheckinInclude, mapVolunteerEarlyCheckinPayload } from '@/lib/ivsEarlyCheckin'
import { ivsPlaceholderEmail } from '@/lib/ivs'
import { findOrCreateVolunteer } from '@/lib/volunteerHelpers'
import { v4 as uuidv4 } from 'uuid'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    return handlePost(req, res)
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id: eventId } = req.query

    if (!(await canViewIvsVolunteers(session.user.id, eventId as string))) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    // Fetch IVS volunteers
    const eventVolunteers = await prisma.event_volunteers.findMany({
      where: {
        eventId: eventId as string,
        ivsImportBatchId: { not: null },
      },
      include: earlyCheckinInclude,
      orderBy: [
        { ivsRequestRound: 'asc' },
        { ivsSubmittedBy: 'asc' },
        { volunteer: { lastName: 'asc' } },
      ],
    })

    const volunteers = eventVolunteers.map((ev) => {
      const base = mapVolunteerEarlyCheckinPayload(ev)
      return {
        id: ev.id,
        firstName: base.firstName,
        lastName: base.lastName,
        congregation: base.congregation,
        approvalStatus: ev.ivsApprovalStatus || 'Pending',
        submittedBy: ev.ivsSubmittedBy || '',
        requestRound: ev.ivsRequestRound || 1,
        approvedAt:
          (ev.ivsApprovalStatus || 'Pending') === 'Approved' && ev.ivsApprovedAt
            ? formatDate(ev.ivsApprovedAt)
            : undefined,
        approvedBy:
          (ev.ivsApprovalStatus || 'Pending') === 'Approved'
            ? ev.ivsApprovedBy || undefined
            : undefined,
        notes: ev.ivsApprovalNotes || undefined,
        earlyEntry: base.earlyEntry,
        checkIns: base.checkIns,
        earlyCheckinEligible: base.earlyCheckinEligible,
      }
    })

    return res.status(200).json({ success: true, volunteers })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}

function formatDate(date: Date): string {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${month}/${day}/${year}`
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id: eventId } = req.query
    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ success: false, message: 'Event ID required' })
    }

    if (!(await canManageIvsVolunteers(session.user.id, eventId))) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — you need permission to manage IVS volunteers for this event',
      })
    }

    const b =
      req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? (req.body as Record<string, unknown>)
        : {}
    const firstName = String(b.firstName ?? '').trim()
    const lastName = String(b.lastName ?? '').trim()
    const congregation = String(b.congregation ?? '').trim()
    const requestRound = Math.max(1, parseInt(String(b.requestRound ?? '1'), 10) || 1)
    const departmentName =
      b.departmentName != null && String(b.departmentName).trim() !== ''
        ? String(b.departmentName).trim()
        : undefined

    if (!firstName || !congregation) {
      return res.status(400).json({
        success: false,
        message: 'First name and congregation are required',
      })
    }

    const existing = await prisma.event_volunteers.findFirst({
      where: {
        eventId,
        ivsImportBatchId: { not: null },
        volunteer: {
          email: {
            equals: ivsPlaceholderEmail(firstName, lastName),
            mode: 'insensitive',
          },
        },
      },
    })

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          'This volunteer is already on the IVS list for this event.',
      })
    }

    const globalVolunteer = await findOrCreateVolunteer({
      firstName,
      lastName,
      email: ivsPlaceholderEmail(firstName, lastName),
      congregation,
    })

    const fos = globalVolunteer.formsOfService
    const formsOfService = Array.isArray(fos) ? fos : typeof fos === 'string' ? [fos] : []
    const isElder = formsOfService.includes('Elder')
    const approvalStatus = isElder ? 'Approved' : 'Pending'
    const approvedAt = isElder ? new Date() : undefined
    const approvedBy = isElder ? 'Auto-approved (Elder)' : undefined

    const batchId = uuidv4()
    await prisma.ivs_import_batches.create({
      data: {
        id: batchId,
        eventId,
        requestRound,
        importedBy: session.user.id,
        fileName: 'Manual entry',
        departmentName,
        volunteerCount: 1,
        notes: 'Added manually (single volunteer)',
      },
    })

    const ev = await prisma.event_volunteers.create({
      data: {
        id: uuidv4(),
        eventId,
        volunteerId: globalVolunteer.id,
        userId: null,
        role: 'VOLUNTEER' as any,
        isActive: true,
        ivsApprovalStatus: approvalStatus,
        ivsSubmittedBy: departmentName,
        ivsRequestRound: requestRound,
        ivsImportBatchId: batchId,
        ivsApprovedAt: approvedAt,
        ivsApprovedBy: approvedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return res.status(201).json({
      success: true,
      id: ev.id,
      message: 'Volunteer added',
    })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'This volunteer already exists and could not be added again.',
      })
    }
    return res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    })
  }
}
