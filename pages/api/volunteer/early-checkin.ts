import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    const { eventId } = req.query

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ success: false, message: 'Event ID required' })
    }

    // Verify user is an IVS volunteer for this event
    const ivsVolunteer = await prisma.event_volunteers.findFirst({
      where: {
        eventId: eventId,
        userId: session.user.id,
        ivsSubmittedBy: 'IVS',
        ivsApprovalStatus: 'Approved',
      },
    })

    if (!ivsVolunteer) {
      return res.status(403).json({ success: false, message: 'Access denied - IVS volunteer access required' })
    }

    // Fetch all volunteers eligible for early check-in
    const eventVolunteers = await prisma.event_volunteers.findMany({
      where: {
        eventId: eventId,
        earlyCheckinEligible: true,
      },
      include: {
        volunteer: true,
      },
      orderBy: [
        { checkedInAt: 'desc' },
        { volunteer: { lastName: 'asc' } },
      ],
    })

    const volunteers = eventVolunteers.map(ev => ({
      id: ev.id,
      firstName: ev.volunteer?.firstName || '',
      lastName: ev.volunteer?.lastName || '',
      congregation: ev.volunteer?.congregation || '',
      earlyCheckinEligible: ev.earlyCheckinEligible || false,
      checkedInAt: ev.checkedInAt ? ev.checkedInAt.toISOString() : null,
      checkedInBy: ev.checkedInBy || null,
    }))

    return res.status(200).json({ success: true, volunteers })
  } catch (error) {
    console.error('Error fetching volunteers:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  } finally {
    await prisma.$disconnect()
  }
}
