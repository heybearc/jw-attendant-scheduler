import type { NextApiRequest } from 'next'
import { prisma } from '@/lib/prisma'
import { isEmailConfigured, sendFeedbackNotificationEmail } from '@/lib/email'

/** Sequential human-readable id (FB-001). Same allocation logic as legacy submit handler. */
export async function getNextFeedbackNumber(): Promise<string> {
  const lastFeedback = await prisma.feedback.findFirst({
    where: { feedbackNumber: { not: null } },
    orderBy: { feedbackNumber: 'desc' },
    select: { feedbackNumber: true }
  })

  let nextNumber = 1
  if (lastFeedback?.feedbackNumber) {
    const match = lastFeedback.feedbackNumber.match(/FB-(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  return `FB-${String(nextNumber).padStart(3, '0')}`
}

export function publicBaseUrl(req: NextApiRequest): string {
  return (
    process.env.NEXTAUTH_URL ||
    `${(req.headers['x-forwarded-proto'] as string) || 'https'}://${req.headers.host}`
  )
}

/**
 * Email all ADMIN users plus optional FEEDBACK_NOTIFY_EMAILS (comma-separated, server env only).
 * Fire-and-forget; failures are logged only.
 */
export function scheduleNotifyAdminsOfNewFeedback(args: {
  req: NextApiRequest
  feedback: { type: string; title: string; description: string; priority: string }
  submitterName: string
}): void {
  const { req, feedback, submitterName } = args

  ;(async () => {
    try {
      if (!(await isEmailConfigured())) {
        console.log('Email not configured, skipping feedback notifications')
        return
      }

      const admins = await prisma.users.findMany({
        where: { role: 'ADMIN' },
        select: { email: true }
      })

      const extra =
        process.env.FEEDBACK_NOTIFY_EMAILS?.split(',')
          .map((s) => s.trim())
          .filter(Boolean) ?? []

      const baseUrl = publicBaseUrl(req)
      const feedbackUrl = `${baseUrl}/admin/feedback`

      const recipients = new Set<string>()
      for (const a of admins) {
        if (a.email) recipients.add(a.email)
      }
      for (const e of extra) recipients.add(e)

      for (const adminEmail of recipients) {
        try {
          await sendFeedbackNotificationEmail({
            adminEmail,
            feedbackType: feedback.type,
            title: feedback.title,
            description: feedback.description,
            submittedBy: submitterName,
            priority: feedback.priority,
            feedbackUrl
          })
        } catch (err) {
          console.error(`Failed to send feedback notification to ${adminEmail}:`, err)
        }
      }
    } catch (e) {
      console.error('Failed to send feedback notifications:', e)
    }
  })()
}
