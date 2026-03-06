import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id: eventId } = req.query

    // Verify user has access to this event
    const eventPermission = await prisma.event_permissions.findFirst({
      where: {
        eventId: eventId as string,
        userId: session.user.id,
      },
    })

    if (!eventPermission) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    // Fetch IVS volunteers
    const eventVolunteers = await prisma.event_volunteers.findMany({
      where: {
        eventId: eventId as string,
        ivsImportBatchId: { not: null },
      },
      include: {
        volunteer: true,
      },
      orderBy: [
        { ivsRequestRound: 'asc' },
        { ivsSubmittedBy: 'asc' },
        { volunteer: { lastName: 'asc' } },
      ],
    })

    const volunteers = eventVolunteers.map(ev => ({
      id: ev.id, // Use event_volunteers primary key
      firstName: ev.volunteer?.firstName || '',
      lastName: ev.volunteer?.lastName || '',
      congregation: ev.volunteer?.congregation || '',
      approvalStatus: ev.ivsApprovalStatus || 'Pending',
      submittedBy: ev.ivsSubmittedBy || '',
      requestRound: ev.ivsRequestRound || 1,
      approvedAt: ev.ivsApprovedAt ? formatDate(ev.ivsApprovedAt) : undefined,
      approvedBy: ev.ivsApprovedBy || undefined,
      notes: ev.ivsApprovalNotes || undefined,
      earlyCheckinEligible: ev.earlyCheckinEligible || false,
      checkedInAt: ev.checkedInAt ? formatDate(ev.checkedInAt) : undefined,
      checkedInBy: ev.checkedInBy || undefined,
      checkinNotes: ev.checkinNotes || undefined,
    }))

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
