import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../../../../src/lib/prisma'
import { handleApiError } from '@/lib/apiError'
import { blockSimulatedMutation, getSessionUser, isPrivilegedCounterRole } from '@/lib/countAssignments'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sessionUser = await getSessionUser(req, res)
    if (!sessionUser) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id: eventId, sessionId, positionId } = req.query
    if (!eventId || typeof eventId !== 'string' || !sessionId || typeof sessionId !== 'string' || !positionId || typeof positionId !== 'string') {
      return res.status(400).json({ error: 'Event ID, Session ID, and Position ID are required' })
    }

    switch (req.method) {
      case 'DELETE':
        if (blockSimulatedMutation(req, res)) return
        if (!isPrivilegedCounterRole(sessionUser.role)) {
          return res.status(403).json({ error: 'Only ADMIN/OVERSEER/KEYMAN may delete counts' })
        }
        // Delete the position count for this session
        await prisma.position_counts.deleteMany({
          where: {
            countSessionId: sessionId,
            positionId: positionId
          }
        })

        return res.status(200).json({
          success: true,
          message: 'Count deleted successfully'
        })

      default:
        res.setHeader('Allow', ['DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ error: 'Internal server error' })
  }
}
