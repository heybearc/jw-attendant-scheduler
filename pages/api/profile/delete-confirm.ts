import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import {
  parseDeletionIdentifier
} from '../../../lib/accountDeletionConfirmation'
import {
  deleteUserAccount,
  resolveAccountFromSession
} from '../../../lib/deleteUserAccount'

async function resolveToken(token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token }
  })
  if (!record || record.expires < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({ where: { token } })
    }
    return null
  }

  const ids = parseDeletionIdentifier(record.identifier)
  if (!ids) return null

  const account = ids.volunteerId
    ? await resolveAccountFromSession({
        id: ids.volunteerId,
        role: 'VOLUNTEER'
      })
    : await resolveAccountFromSession({
        id: ids.userId,
        role: 'ADMIN'
      })

  if (!account.user && !account.volunteer) return null
  return { record, account }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token =
    typeof req.query.token === 'string'
      ? req.query.token
      : typeof req.body?.token === 'string'
        ? req.body.token
        : ''

  if (!token) {
    return res.status(400).json({ success: false, error: 'Missing confirmation token' })
  }

  try {
    const resolved = await resolveToken(token)
    if (!resolved) {
      return res.status(400).json({
        success: false,
        error: 'This confirmation link is invalid or has expired'
      })
    }

    if (req.method === 'GET') {
      const target = resolved.account.volunteer || resolved.account.user
      return res.status(200).json({
        success: true,
        data: {
          name: `${target?.firstName || ''} ${target?.lastName || ''}`.trim(),
          assignmentCount: resolved.account.volunteer
            ? await prisma.position_assignments.count({
                where: { volunteerId: resolved.account.volunteer.id }
              })
            : 0
        }
      })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' })
    }

    if (String(req.body?.confirmation || '').trim().toUpperCase() !== 'DELETE') {
      return res.status(400).json({
        success: false,
        error: 'Type DELETE to confirm permanent account removal'
      })
    }

    const result = await deleteUserAccount(resolved.account)
    await prisma.verificationToken.deleteMany({
      where: { identifier: resolved.record.identifier }
    })

    return res.status(200).json({
      success: true,
      message: 'Your account and personal information have been permanently deleted',
      data: result
    })
  } catch (error) {
    console.error('Account deletion confirmation error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    })
  }
}
