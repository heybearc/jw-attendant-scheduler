import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
  } finally {
    await prisma.$disconnect()
  }
}
