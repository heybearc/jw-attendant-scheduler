import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'
import { handleApiError } from '../../src/lib/apiError'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== FEEDBACK SUBMISSION DEBUG ===')
  
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || !session.user?.email) {
      console.log('❌ No session or email')
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    if (req.method === 'POST') {
      const { type, title, description, priority } = req.body

      // Find user
      let user = await prisma.users.findUnique({
        where: { email: session.user.email }
      })

      if (!user) {
        user = await prisma.users.create({
          data: {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: session.user.email,
            firstName: session.user.name?.split(' ')[0] || 'Unknown',
            lastName: session.user.name?.split(' ').slice(1).join(' ') || 'User',
            role: (session.user.role as any) || 'ADMIN',
            isActive: true,
            updatedAt: new Date()
          }
        })
      }

      // Create feedback
      const feedback = await prisma.feedback.create({
        data: {
          type: type.toUpperCase(),
          title: title.trim(),
          description: description.trim(),
          priority: (priority || 'MEDIUM').toUpperCase(),
          submittedBy: user.id
        }
      })

      return res.json({
        success: true,
        data: {
          id: feedback.id,
          message: 'Feedback submitted successfully'
        }
      })
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
