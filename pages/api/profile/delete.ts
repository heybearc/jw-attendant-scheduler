import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { deleteUserAccount, resolveAccountFromSession } from '../../../lib/deleteUserAccount'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
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
