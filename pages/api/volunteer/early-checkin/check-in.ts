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

    // Find the volunteer to check in
    const volunteer = await prisma.event_volunteers.findUnique({
      where: { id: volunteerId },
    })

    if (!volunteer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Volunteer not found' 
      })
    }

    if (!volunteer.earlyCheckinEligible) {
      return res.status(400).json({ 
        success: false, 
        message: 'Volunteer is not marked as early entry eligible' 
      })
    }

    if (volunteer.checkedInAt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Volunteer is already checked in' 
      })
    }

    // Check in the volunteer
    await prisma.event_volunteers.update({
      where: { id: volunteerId },
      data: {
        checkedInAt: new Date(),
        checkedInBy: `${session.user.name || session.user.email}`,
        updatedAt: new Date(),
      },
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error checking in volunteer:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  } finally {
    await prisma.$disconnect()
  }
}
