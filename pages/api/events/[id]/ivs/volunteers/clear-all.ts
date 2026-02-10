import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    console.error('Clear all IVS volunteers error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  } finally {
    await prisma.$disconnect()
  }
}
