import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'
import { handleApiError } from '@/lib/apiError'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session || session.user?.role !== 'ADMIN') {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      // Get all users to debug the issue
      const users = await prisma.users.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        },
        orderBy: {
          email: 'asc'
        }
      })

      return res.json({
        success: true,
        data: {
          sessionUser: session.user,
          users: users,
          totalUsers: users.length
        }
      })
    } catch (error) {
      // Error logged by handleApiError
      return res.status(500).json({ success: false, error: 'Failed to fetch users' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
