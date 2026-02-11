import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '../../../../../src/lib/prisma'
import { handleApiError } from '../../../../src/lib/apiError'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check user permissions
    const user = await prisma.users.findUnique({
      where: { email: session.user?.email || '' }
    })

    if (!user || !['ADMIN', 'OVERSEER', 'admin', 'overseer'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const { id } = req.query
    const eventId = Array.isArray(id) ? id[0] : id

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'Event ID is required' })
    }


    // Get all assignments for this event through positions
    const assignments = await prisma.position_assignments.findMany({
      where: { 
        positions: {
          eventId: eventId
        }
      }
    })


    // Delete all assignments for this event
    const deleteResult = await prisma.position_assignments.deleteMany({
      where: { 
        positions: {
          eventId: eventId
        }
      }
    })


    return res.status(200).json({
      success: true,
      message: `Successfully cleared ${deleteResult.count} assignments`,
      deletedCount: deleteResult.count
    })

  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
