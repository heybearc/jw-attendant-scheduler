import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '../../../../../src/lib/prisma'
import { handleApiError } from '../../../../../src/lib/apiError'
import { sendEmail } from '../../../../../src/lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session || session.user?.role !== 'ADMIN') {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const { id } = req.query
  
  if (typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid feedback ID' })
  }

  if (req.method === 'PATCH') {
    try {
      const { status, resolutionComment } = req.body

      if (!status) {
        return res.status(400).json({ 
          success: false, 
          error: 'Status is required' 
        })
      }

      // Validate status value
      const validStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
      const upperStatus = status.toUpperCase()
      
      if (!validStatuses.includes(upperStatus)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid status value' 
        })
      }

      // Fetch current feedback (needed for validation + email)
      const existingFeedback = await prisma.feedback.findUnique({
        where: { id },
        include: {
          users: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      })

      if (!existingFeedback) {
        return res.status(404).json({ success: false, error: 'Feedback not found' })
      }

      // D-024: RESOLVED requires a resolution comment (existing OR new)
      if (upperStatus === 'RESOLVED') {
        const hasExisting = (existingFeedback as any).resolutionComment?.trim()
        const hasNew = resolutionComment?.trim()
        if (!hasExisting && !hasNew) {
          return res.status(400).json({
            success: false,
            error: 'A resolution comment is required when marking feedback as Resolved'
          })
        }
      }

      // Build update data — preserve existing resolutionComment if no new one provided
      const updateData: any = {
        status: upperStatus,
        updatedAt: new Date()
      }
      if (resolutionComment?.trim()) {
        updateData.resolutionComment = resolutionComment.trim()
      }

      const updatedFeedback = await prisma.feedback.update({
        where: { id },
        data: updateData,
        include: {
          users: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      })

      // D-024: Send status-changed email to submitter
      const submitter = (updatedFeedback as any).users
      const submitterEmail = submitter?.email
      const submitterFirstName = submitter?.firstName || 'there'
      const finalResolutionComment = (updatedFeedback as any).resolutionComment

      if (submitterEmail) {
        try {
          const statusLabel = upperStatus.charAt(0) + upperStatus.slice(1).toLowerCase().replace('_', ' ')
          const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f3f4f6;">
              <div style="max-width:600px;margin:0 auto;background-color:#ffffff;">
                <div style="background-color:#3b82f6;color:white;padding:30px 20px;text-align:center;">
                  <h1 style="margin:0;font-size:24px;font-weight:bold;">Feedback Status Updated</h1>
                  <p style="margin:10px 0 0 0;font-size:16px;opacity:0.9;">Your feedback has been reviewed.</p>
                </div>
                <div style="padding:30px 20px;">
                  <h2 style="color:#374151;margin:0 0 20px 0;">Hello ${submitterFirstName}!</h2>
                  <p style="color:#6b7280;line-height:1.6;margin:0 0 20px 0;">
                    The status of your feedback has been updated to <strong>${statusLabel}</strong>.
                  </p>
                  <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
                    <p style="color:#6b7280;font-weight:500;margin:0 0 6px 0;">Feedback:</p>
                    <p style="color:#374151;font-weight:bold;margin:0 0 16px 0;">${(existingFeedback as any).title}</p>
                    <p style="color:#6b7280;font-weight:500;margin:0 0 6px 0;">New Status:</p>
                    <p style="color:#374151;margin:0;">${statusLabel}</p>
                  </div>
                  ${finalResolutionComment ? `
                  <div style="background-color:#ecfdf5;border:1px solid #10b981;border-radius:8px;padding:20px;margin:20px 0;">
                    <p style="color:#065f46;font-weight:600;margin:0 0 10px 0;">Resolution:</p>
                    <p style="color:#065f46;line-height:1.6;margin:0;">${finalResolutionComment}</p>
                  </div>` : ''}
                  <div style="text-align:center;margin:30px 0;">
                    <a href="${process.env.NEXTAUTH_URL}/help/my-feedback" style="display:inline-block;background-color:#3b82f6;color:white;text-decoration:none;padding:15px 30px;border-radius:8px;font-weight:bold;font-size:16px;">View Your Feedback</a>
                  </div>
                </div>
                <div style="background-color:#374151;color:#d1d5db;padding:20px;text-align:center;">
                  <p style="margin:0;font-size:14px;">TheoShift</p>
                  <p style="margin:6px 0 0 0;font-size:12px;opacity:0.7;">This is an automated message.</p>
                </div>
              </div>
            </body>
            </html>
          `
          await sendEmail({
            to: submitterEmail,
            subject: `Your feedback has been ${statusLabel}: ${(existingFeedback as any).title}`,
            html
          })
        } catch (emailError) {
          // Email failure should not block the status update
          console.error('Failed to send feedback status email:', emailError)
        }
      }

      return res.json({
        success: true,
        data: {
          id: updatedFeedback.id,
          status: updatedFeedback.status.toLowerCase(),
          updatedAt: updatedFeedback.updatedAt.toISOString()
        }
      })
    } catch (error) {
      // Error logged by handleApiError
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update status' 
      })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
