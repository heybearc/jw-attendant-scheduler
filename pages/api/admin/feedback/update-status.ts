import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.email) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  // Check if user is admin
  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  })

  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Forbidden - Admin access required' })
  }

  if (req.method === 'PUT') {
    try {
      const { feedbackId, status, resolutionComment } = req.body

      if (!feedbackId || !status) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: feedbackId, status' 
        })
      }

      // Validate status
      const validStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid status value' 
        })
      }

      // Get admin user ID for comment authorship
      const adminUser = await prisma.users.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })

      if (!adminUser) {
        return res.status(500).json({ 
          success: false, 
          error: 'Admin user not found' 
        })
      }

      // Update feedback status and resolution comment
      const updatedFeedback = await prisma.feedback.update({
        where: { id: feedbackId },
        data: {
          status: status.toUpperCase(),
          resolutionComment: resolutionComment || null,
          updatedAt: new Date()
        },
        include: {
          users: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      // If marking as RESOLVED and resolution comment provided, also add as a regular comment
      // This ensures email notifications will include the resolution details
      if (status.toUpperCase() === 'RESOLVED' && resolutionComment?.trim()) {
        await prisma.feedback_comments.create({
          data: {
            id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            feedbackId: feedbackId,
            authorId: adminUser.id,
            content: `Resolution: ${resolutionComment.trim()}`,
            createdAt: new Date()
          }
        })
      }

      return res.json({
        success: true,
        data: updatedFeedback
      })
    } catch (error) {
      console.error('Error updating feedback status:', error)
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update feedback status' 
      })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
