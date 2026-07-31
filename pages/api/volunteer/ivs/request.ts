import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { findOrCreateVolunteer } from '@/lib/volunteerHelpers'
import { isValidPhoneNumber, normalizePhoneOrNull } from '@/lib/formatPhone'
import { scheduleToPrismaUpdate, type EarlyEntrySchedule } from '@/lib/ivsEarlyCheckin'
import {
  ivsRequestByMarker,
  verifyVolunteerOnIvsRoster,
} from '@/lib/ivsVolunteerEarlyCheckinAccess'
import { v4 as uuidv4 } from 'uuid'

async function resolveBatchImportedByUserId(
  submitterVolunteerId: string,
  eventId: string,
): Promise<string | null> {
  const vol = await prisma.volunteers.findUnique({
    where: { id: submitterVolunteerId },
    select: { userId: true },
  })
  if (vol?.userId) return vol.userId

  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: { createdBy: true },
  })
  if (event?.createdBy) {
    const creator = await prisma.users.findUnique({
      where: { id: event.createdBy },
      select: { id: true },
    })
    if (creator) return creator.id
  }

  const admin = await prisma.users.findFirst({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })
  return admin?.id ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const eventId =
    typeof req.query.eventId === 'string'
      ? req.query.eventId
      : typeof req.body?.eventId === 'string'
        ? req.body.eventId
        : null

  if (!eventId) {
    return res.status(400).json({ success: false, message: 'eventId is required' })
  }

  const access = await verifyVolunteerOnIvsRoster(
    req,
    session.user.id,
    session.user.role,
    eventId,
  )
  if (!access.ok) {
    return res.status(access.status).json({ success: false, message: access.message })
  }

  if (req.method === 'GET') {
    return handleGet(res, eventId, access.volunteerId)
  }

  if (req.method === 'POST') {
    return handlePost(req, res, eventId, access.volunteerId)
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' })
}

async function handleGet(res: NextApiResponse, eventId: string, submitterVolunteerId: string) {
  const marker = ivsRequestByMarker(submitterVolunteerId)
  const rows = await prisma.event_volunteers.findMany({
    where: {
      eventId,
      ivsImportBatchId: { not: null },
      ivsApprovalNotes: { contains: marker },
    },
    include: {
      volunteer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          congregation: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return res.status(200).json({
    success: true,
    submissions: rows.map((ev) => ({
      id: ev.id,
      firstName: ev.volunteer?.firstName || '',
      lastName: ev.volunteer?.lastName || '',
      email: ev.volunteer?.email || '',
      phone: ev.volunteer?.phone || '',
      congregation: ev.volunteer?.congregation || '',
      department: ev.ivsSubmittedBy || '',
      approvalStatus: ev.ivsApprovalStatus || 'Pending',
      submittedAt: ev.createdAt.toISOString(),
    })),
  })
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  eventId: string,
  submitterVolunteerId: string,
) {
  try {
    const b =
      req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? (req.body as Record<string, unknown>)
        : {}

    const firstName = String(b.firstName ?? '').trim()
    const lastName = String(b.lastName ?? '').trim()
    const congregation = String(b.congregation ?? '').trim()
    const email = String(b.email ?? '').trim().toLowerCase()
    const phoneRaw = String(b.phone ?? '').trim()
    const department =
      b.department != null && String(b.department).trim() !== ''
        ? String(b.department).trim()
        : undefined
    const notes =
      b.notes != null && String(b.notes).trim() !== '' ? String(b.notes).trim() : ''
    const earlyEntry =
      b.earlyEntry && typeof b.earlyEntry === 'object' && !Array.isArray(b.earlyEntry)
        ? (b.earlyEntry as EarlyEntrySchedule)
        : null

    if (!firstName || !lastName || !congregation || !email || !phoneRaw) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, congregation, email, and phone are required',
      })
    }

    if (!email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' })
    }

    if (!isValidPhoneNumber(phoneRaw)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid 10-digit phone number',
      })
    }

    const phone = normalizePhoneOrNull(phoneRaw)

    const alreadyOnIvs = await prisma.event_volunteers.findFirst({
      where: {
        eventId,
        ivsImportBatchId: { not: null },
        volunteer: {
          email: { equals: email, mode: 'insensitive' },
        },
      },
      select: { id: true },
    })

    if (alreadyOnIvs) {
      return res.status(409).json({
        success: false,
        message: 'This person is already on the IVS list for this event',
      })
    }

    const submitter = await prisma.volunteers.findUnique({
      where: { id: submitterVolunteerId },
      select: { firstName: true, lastName: true },
    })
    const submitterName = submitter
      ? `${submitter.firstName} ${submitter.lastName}`.trim()
      : 'IVS volunteer'

    const importedBy = await resolveBatchImportedByUserId(submitterVolunteerId, eventId)
    if (!importedBy) {
      return res.status(500).json({
        success: false,
        message: 'Could not record request (no system user available)',
      })
    }

    let globalVolunteer = await findOrCreateVolunteer({
      firstName,
      lastName,
      email,
      congregation,
      phone: phone || undefined,
    })

    if (phone && globalVolunteer.phone !== phone) {
      globalVolunteer = await prisma.volunteers.update({
        where: { id: globalVolunteer.id },
        data: { phone, updatedAt: new Date() },
      })
    }

    // Also refresh name/congregation if this email already existed
    if (
      globalVolunteer.firstName !== firstName ||
      globalVolunteer.lastName !== lastName ||
      globalVolunteer.congregation !== congregation
    ) {
      globalVolunteer = await prisma.volunteers.update({
        where: { id: globalVolunteer.id },
        data: {
          firstName,
          lastName,
          congregation,
          updatedAt: new Date(),
        },
      })
    }

    const batchId = uuidv4()
    await prisma.ivs_import_batches.create({
      data: {
        id: batchId,
        eventId,
        requestRound: 1,
        importedBy,
        fileName: 'Volunteer dashboard request',
        departmentName: department,
        volunteerCount: 1,
        notes: `Requested by ${submitterName} (${submitterVolunteerId})`,
      },
    })

    const marker = ivsRequestByMarker(submitterVolunteerId)
    const approvalNotes = [marker, `Requested by ${submitterName}`, notes]
      .filter(Boolean)
      .join(' ')
      .trim()

    const earlyData =
      earlyEntry != null
        ? scheduleToPrismaUpdate({
            friday: earlyEntry.friday === true,
            saturday: earlyEntry.saturday === true,
            sunday: earlyEntry.sunday === true,
          })
        : {}

    const ev = await prisma.event_volunteers.create({
      data: {
        id: uuidv4(),
        eventId,
        volunteerId: globalVolunteer.id,
        userId: null,
        role: 'VOLUNTEER' as any,
        isActive: true,
        onVolunteerRoster: false,
        ivsApprovalStatus: 'Pending',
        ivsSubmittedBy: department,
        ivsRequestRound: 1,
        ivsImportBatchId: batchId,
        ivsApprovalNotes: approvalNotes,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...earlyData,
      },
    })

    return res.status(201).json({
      success: true,
      id: ev.id,
      message: 'Volunteer request submitted for approval',
    })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'This volunteer could not be added (duplicate record)',
      })
    }
    console.error('IVS volunteer request error:', error)
    return res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    })
  }
}
