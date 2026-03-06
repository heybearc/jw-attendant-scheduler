import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id: eventId, volunteerId } = req.query
    const { earlyCheckinEligible } = req.body

    // Verify user has admin access to this event
    const eventPermission = await prisma.event_permissions.findFirst({
      where: {
        eventId: eventId as string,
        userId: session.user.id,
        role: 'ADMIN' as any,
      },
    })

    if (!eventPermission) {
      return res.status(403).json({ success: false, message: 'Forbidden - Admin access required' })
    }

    // Check if volunteer is already checked in
    const volunteer = await prisma.event_volunteers.findUnique({
      where: { id: volunteerId as string },
    })

    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer not found' })
    }

    // Prevent unchecking early entry flag if volunteer is already checked in
    if (earlyCheckinEligible === false && volunteer.checkedInAt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot remove early entry eligibility - volunteer is already checked in. Please undo check-in first.' 
      })
    }

    // Update early entry flag
    await prisma.event_volunteers.update({
      where: { id: volunteerId as string },
      data: {
        earlyCheckinEligible: earlyCheckinEligible === true,
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
