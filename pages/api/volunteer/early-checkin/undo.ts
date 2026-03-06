import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { eventId, volunteerId } = req.body

    if (!eventId || !volunteerId) {
      return res.status(400).json({ success: false, message: 'Event ID and Volunteer ID required' })
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

    // Undo check-in by clearing the fields
    await prisma.event_volunteers.update({
      where: { id: volunteerId },
      data: {
        checkedInAt: null,
        checkedInBy: null,
        checkinNotes: null,
        updatedAt: new Date(),
      },
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error undoing check-in:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}
