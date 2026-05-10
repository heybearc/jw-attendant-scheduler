import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { canManageIvsVolunteers } from '@/lib/eventAccess'

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

    const { id: eventId, volunteerId } = req.query
    const { notes } = req.body

    if (!(await canManageIvsVolunteers(session.user.id, eventId as string))) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — you need permission to manage IVS volunteers for this event',
      })
    }

    // Find volunteer by event_volunteers primary key
    const volunteer = await prisma.event_volunteers.findUnique({
      where: { 
        id: volunteerId as string
      },
    })

    if (!volunteer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Volunteer not found in event' 
      })
    }

    if (!volunteer?.earlyCheckinEligible) {
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

    // Check in volunteer
    await prisma.event_volunteers.update({
      where: { id: volunteer.id },
      data: {
        checkedInAt: new Date(),
        checkedInBy: `${session.user.name || session.user.email}`,
        checkinNotes: notes || null,
        updatedAt: new Date(),
      },
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}
