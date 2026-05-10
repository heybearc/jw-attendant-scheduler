import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/apiError'
import { canManageIvsVolunteers } from '@/lib/eventAccess'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id: eventId } = req.query

    if (!(await canManageIvsVolunteers(session.user.id, eventId as string))) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — you need permission to manage volunteers for this event',
      })
    }

    // Delete all IVS volunteers for this event
    const result = await prisma.event_volunteers.deleteMany({
      where: {
        eventId: eventId as string,
        ivsImportBatchId: { not: null } as any
      }
    })

    return res.status(200).json({
      success: true,
      deleted: result.count,
      message: `Deleted ${result.count} IVS volunteer(s)`
    })

  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}
