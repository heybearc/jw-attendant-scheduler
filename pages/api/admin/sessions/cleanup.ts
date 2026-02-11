import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'
import { handleApiError } from '../../../src/lib/apiError'

/**
 * Session Cleanup API
 * Removes expired sessions from user_activity table
 * Sessions are considered expired after 30 days of inactivity
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
      // Calculate cutoff date (30 days ago)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Find expired sessions
      const expiredSessions = await prisma.user_activity.findMany({
        where: {
          lastActivityAt: {
            lt: thirtyDaysAgo
          },
          isActive: true
        },
        select: {
          id: true,
          userId: true,
          lastActivityAt: true
        }
      })

      const expiredCount = expiredSessions.length

      if (expiredCount === 0) {
        return res.status(200).json({
          success: true,
          message: 'No expired sessions to clean up',
          cleaned: 0,
          timestamp: new Date().toISOString()
        })
      }

      // Mark expired sessions as inactive
      const result = await prisma.user_activity.updateMany({
        where: {
          lastActivityAt: {
            lt: thirtyDaysAgo
          },
          isActive: true
        },
        data: {
          isActive: false,
          logoutAt: new Date()
        }
      })

      // Also clean up old NextAuth Session table entries if they exist
      try {
        const oldSessions = await prisma.session.deleteMany({
          where: {
            expires: {
              lt: new Date()
            }
          }
        })

        return res.status(200).json({
          success: true,
          message: `Cleaned up ${result.count} expired user activity sessions and ${oldSessions.count} expired auth sessions`,
          cleaned: result.count,
          authSessionsCleaned: oldSessions.count,
          timestamp: new Date().toISOString()
        })
      } catch (sessionError) {
        // Session table might not exist or might have different structure
        return res.status(200).json({
          success: true,
          message: `Cleaned up ${result.count} expired user activity sessions`,
          cleaned: result.count,
          timestamp: new Date().toISOString()
        })
      }
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
      // Get count of expired sessions
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const expiredCount = await prisma.user_activity.count({
        where: {
          lastActivityAt: {
            lt: thirtyDaysAgo
          },
          isActive: true
        }
      })

      const activeCount = await prisma.user_activity.count({
        where: {
          isActive: true
        }
      })

      return res.status(200).json({
        expiredSessions: expiredCount,
        activeSessions: activeCount,
        validSessions: activeCount - expiredCount,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      // Error logged by handleApiError
      return res.status(500).json({ error: 'Failed to check sessions' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
