import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'
import { handleApiError } from '@/lib/apiError'

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

  if (req.method === 'GET') {
    try {
      // Check if user_activity table exists
      let tableExists = false
      try {
        const result = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'user_activity'
          );
        `
        tableExists = (result as any)[0]?.exists || false
      } catch (error) {
        // Error logged by handleApiError
      }
      
      if (!tableExists) {
        console.log('[SESSIONS] user_activity table does not exist yet')
        return res.status(200).json({
          sessions: [],
          total: 0,
          timestamp: new Date().toISOString(),
          message: 'Session tracking not available yet - migration pending'
        })
      }

      // Fetch all active sessions from user_activity table
      let sessions
      try {
        // First, get all active sessions
        const allSessions = await prisma.user_activity.findMany({
          where: {
            isActive: true
          },
          orderBy: {
            lastActivityAt: 'desc'
          }
        })

        // Then fetch user data separately to handle orphaned sessions
        const userIds = [...new Set(allSessions.map(s => s.userId))]
        const users = await prisma.users.findMany({
          where: {
            id: { in: userIds }
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            isActive: true
          }
        })

        const userMap = new Map(users.map(u => [u.id, u]))

        // Filter out orphaned sessions (where user no longer exists)
        sessions = allSessions
          .filter(s => userMap.has(s.userId))
          .map(s => ({
            ...s,
            users: userMap.get(s.userId)!
          }))

        // Mark orphaned sessions as inactive
        const orphanedSessionIds = allSessions
          .filter(s => !userMap.has(s.userId))
          .map(s => s.id)

        if (orphanedSessionIds.length > 0) {
          await prisma.user_activity.updateMany({
            where: {
              id: { in: orphanedSessionIds }
            },
            data: {
              isActive: false,
              logoutAt: new Date()
            }
          })
        }
      } catch (queryError) {
        console.error('[SESSIONS] Error fetching sessions:', queryError)
        throw queryError
      }

      // Transform sessions to include useful metadata
      const now = new Date()
      const activeSessions = sessions.map((s, index) => {
        try {
          const minutesSinceActivity = Math.floor((now.getTime() - new Date(s.lastActivityAt).getTime()) / (1000 * 60))
          const isOnline = minutesSinceActivity < 15 // Online if active within 15 minutes
          
          return {
            id: s.id,
            userId: s.userId,
            userName: s.users.name || `${s.users.firstName || ''} ${s.users.lastName || ''}`.trim() || 'Unknown',
            userEmail: s.users.email,
            userRole: s.users.role,
            isUserActive: s.users.isActive,
            sessionToken: s.sessionId.substring(0, 8) + '...', // Truncated for security
            loginAt: s.loginAt,
            lastActivityAt: s.lastActivityAt,
            minutesSinceActivity,
            isOnline,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent,
            serverNode: s.serverNode || 'UNKNOWN',
            // Calculate expiry based on 30 days from last activity
            expires: new Date(new Date(s.lastActivityAt).getTime() + (30 * 24 * 60 * 60 * 1000)),
            daysUntilExpiry: Math.ceil((new Date(s.lastActivityAt).getTime() + (30 * 24 * 60 * 60 * 1000) - now.getTime()) / (1000 * 60 * 60 * 24))
          }
        } catch (transformError) {
          console.error(`[SESSIONS] Error transforming session ${index}:`, transformError, 'Session data:', JSON.stringify(s, null, 2))
          throw transformError
        }
      })

      return res.status(200).json({
        sessions: activeSessions,
        total: activeSessions.length,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      // Error logged by handleApiError
      return res.status(500).json({ error: 'Failed to fetch sessions' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
