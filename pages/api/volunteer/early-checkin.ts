import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
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

    const { eventId } = req.query

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ success: false, message: 'Event ID required' })
    }

    // Verify user is an IVS team member (has position assignment) for this event
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: { eventType: true }
    })

    const isIVSEvent = event?.eventType === 'REGIONAL_CONVENTION'
    
    if (!isIVSEvent) {
      return res.status(403).json({ success: false, message: 'This is not an IVS event' })
    }

    const ivsTeamMember = await prisma.position_assignments.findFirst({
      where: {
        volunteerId: session.user.id,
        positions: {
          eventId: eventId
        }
      }
    })

    if (!ivsTeamMember) {
      return res.status(403).json({ success: false, message: 'Access denied - IVS team member access required' })
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
  }
}
