import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'
import { handleApiError } from '../../../src/lib/apiError'

/**
 * Cleanup excessive sessions per user
 * Keep only the N most recent sessions per user
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Check if user is admin
  const user = await prisma.users.findUnique({
    where: { email: session.user.email! },
    select: { role: true }
  })

  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' })
  }

  if (req.method === 'POST') {
    try {
      const { maxSessionsPerUser = 5 } = req.body

      // Get all users with active sessions
      const usersWithSessions = await prisma.$queryRaw<Array<{ userId: string, sessionCount: bigint }>>`
        SELECT "userId", COUNT(*) as "sessionCount"
        FROM user_activity
        WHERE "isActive" = true
        GROUP BY "userId"
        HAVING COUNT(*) > ${maxSessionsPerUser}
      `

      let totalCleaned = 0

      for (const userSession of usersWithSessions) {
        const userId = userSession.userId
        const excessCount = Number(userSession.sessionCount) - maxSessionsPerUser

        // Get all sessions for this user, ordered by most recent
        const userSessions = await prisma.user_activity.findMany({
          where: {
            userId,
            isActive: true
          },
          orderBy: {
            lastActivityAt: 'desc'
          },
          select: {
            id: true
          }
        })

        // Keep the most recent N sessions, mark the rest as inactive
        const sessionsToDeactivate = userSessions.slice(maxSessionsPerUser).map(s => s.id)

        if (sessionsToDeactivate.length > 0) {
          await prisma.user_activity.updateMany({
            where: {
              id: { in: sessionsToDeactivate }
            },
            data: {
              isActive: false,
              logoutAt: new Date()
            }
          })

          totalCleaned += sessionsToDeactivate.length
        }
      }

      return res.status(200).json({
        success: true,
        message: `Cleaned up ${totalCleaned} excessive sessions`,
        cleaned: totalCleaned,
        usersAffected: usersWithSessions.length,
        maxSessionsPerUser,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      // Error logged by handleApiError
      return res.status(500).json({ 
        error: 'Failed to clean up sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  if (req.method === 'GET') {
    try {
      // Get stats on sessions per user
      const stats = await prisma.$queryRaw<Array<{ userId: string, sessionCount: bigint, email: string }>>`
        SELECT ua."userId", COUNT(*) as "sessionCount", u.email
        FROM user_activity ua
        JOIN users u ON ua."userId" = u.id
        WHERE ua."isActive" = true
        GROUP BY ua."userId", u.email
        ORDER BY "sessionCount" DESC
        LIMIT 10
      `

      return res.status(200).json({
        topUsers: stats.map(s => ({
          email: s.email,
          sessionCount: Number(s.sessionCount)
        })),
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      // Error logged by handleApiError
      return res.status(500).json({ error: 'Failed to get session stats' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
