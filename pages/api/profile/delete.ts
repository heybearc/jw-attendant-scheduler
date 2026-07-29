import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'
import { sendAccountDeletionConfirmation } from '../../../lib/accountDeletionConfirmation'
import { deleteUserAccount, resolveAccountFromSession } from '../../../lib/deleteUserAccount'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  if (typeof req.headers['x-view-as-volunteer-id'] === 'string') {
    return res.status(403).json({
      success: false,
      error: 'Exit Admin View As before managing or deleting an account'
    })
  }

  const confirmation = String(req.body?.confirmation || '').trim().toUpperCase()
  if (confirmation !== 'DELETE') {
    return res.status(400).json({
      success: false,
      error: 'Type DELETE to confirm permanent account removal'
    })
  }

  try {
    const account = await resolveAccountFromSession(session.user)
    if (!account.user && !account.volunteer) {
      return res.status(404).json({ success: false, error: 'Profile not found' })
    }

    // Volunteer accounts confirm ownership through their registered email.
    if (String(session.user.role || '').toUpperCase() === 'VOLUNTEER') {
      await sendAccountDeletionConfirmation(req, account)
      return res.status(200).json({
        success: true,
        requiresEmailConfirmation: true,
        message:
          'A confirmation link was sent to your email. Your account has not been deleted yet.'
      })
    }

    // Staff accounts must re-enter their current password.
    const currentPassword = String(req.body?.currentPassword || '')
    if (!account.user || !currentPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password is required to delete this account'
      })
    }
    const fullUser = await prisma.users.findUnique({
      where: { id: account.user.id },
      select: { passwordHash: true }
    })
    if (
      !fullUser?.passwordHash ||
      !(await bcrypt.compare(currentPassword, fullUser.passwordHash))
    ) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      })
    }

    const result = await deleteUserAccount(account)

    return res.status(200).json({
      success: true,
      message: 'Your account and personal information have been permanently deleted',
      data: result
    })
  } catch (error: any) {
    console.error('Account delete error:', error)
    const message = error?.message || 'Failed to delete account'
    const status = message.includes('last active admin') ? 400 : 500
    return res.status(status).json({ success: false, error: message })
  }
}
