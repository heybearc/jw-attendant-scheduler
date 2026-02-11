import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '../../../../../src/lib/prisma'
import { handleApiError } from '../../../../src/lib/apiError'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id: eventId } = req.query

  if (req.method === 'POST') {
    try {
      // Delete all volunteer assignments for this event
      const result = await prisma.position_assignments.deleteMany({
        where: {
          positions: {
            eventId: eventId as string
          },
          role: 'VOLUNTEER'
        }
      })

      return res.status(200).json({
        success: true,
        deletedCount: result.count,
        message: `Cleared ${result.count} assignments`
      })
    } catch (error) {
      // Error logged by handleApiError
      return res.status(500).json({ error: 'Failed to clear assignments' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
