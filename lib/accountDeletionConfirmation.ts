import crypto from 'crypto'
import type { NextApiRequest } from 'next'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import type { ResolvedAccount } from './deleteUserAccount'

const PREFIX = 'account-delete'
export const ACCOUNT_DELETE_TOKEN_MINUTES = 30

export function deletionIdentifier(account: ResolvedAccount): string {
  return `${PREFIX}:${account.volunteer?.id || '-'}:${account.user?.id || '-'}`
}

export function parseDeletionIdentifier(identifier: string): {
  volunteerId: string | null
  userId: string | null
} | null {
  const [prefix, volunteerId, userId] = identifier.split(':')
  if (prefix !== PREFIX || !volunteerId || !userId) return null
  return {
    volunteerId: volunteerId === '-' ? null : volunteerId,
    userId: userId === '-' ? null : userId
  }
}

function baseUrl(req: NextApiRequest): string {
  const envBase = process.env.NEXTAUTH_URL?.replace(/\/$/, '')
  if (envBase) return envBase

  const forwardedProto = req.headers['x-forwarded-proto']
  const proto =
    typeof forwardedProto === 'string'
      ? forwardedProto.split(',')[0].trim()
      : 'https'
  const forwardedHost = req.headers['x-forwarded-host']
  const host =
    (typeof forwardedHost === 'string' ? forwardedHost.split(',')[0].trim() : '') ||
    req.headers.host ||
    'theoshift.com'
  return `${proto}://${host}`
}

export async function sendAccountDeletionConfirmation(
  req: NextApiRequest,
  account: ResolvedAccount
): Promise<void> {
  const target = account.volunteer || account.user
  if (!target?.email) throw new Error('This account has no email address')

  const identifier = deletionIdentifier(account)
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(
    Date.now() + ACCOUNT_DELETE_TOKEN_MINUTES * 60 * 1000
  )

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: { identifier, token, expires }
    })
  ])

  const confirmUrl = `${baseUrl(req)}/account/delete-confirm?token=${encodeURIComponent(token)}`
  const firstName = target.firstName || 'there'

  await sendEmail({
    to: target.email,
    subject: 'Confirm deletion of your TheoShift account',
    text: [
      `Hello ${firstName},`,
      '',
      'You requested permanent deletion of your TheoShift account and personal information.',
      `Open this link to review and confirm: ${confirmUrl}`,
      '',
      `This one-time link expires in ${ACCOUNT_DELETE_TOKEN_MINUTES} minutes.`,
      'If you did not request this, ignore this email and your account will remain unchanged.'
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#374151">
        <h1 style="color:#b91c1c">Confirm account deletion</h1>
        <p>Hello ${firstName},</p>
        <p>You requested permanent deletion of your TheoShift account and personal information.</p>
        <p style="margin:28px 0">
          <a href="${confirmUrl}" style="background:#dc2626;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold">
            Review and confirm deletion
          </a>
        </p>
        <p><strong>This link expires in ${ACCOUNT_DELETE_TOKEN_MINUTES} minutes and can only be used once.</strong></p>
        <p>If you did not request this, ignore this email. Nothing will be deleted.</p>
      </div>
    `
  })
}
