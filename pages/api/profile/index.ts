import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { normalizePhoneOrNull } from '@/lib/formatPhone'
import { resolveAccountFromSession } from '../../../lib/deleteUserAccount'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  try {
    if (req.method === 'GET') {
      return await handleGet(req, res, session.user)
    }
    if (req.method === 'PUT') {
      return await handlePut(req, res, session.user)
    }
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  } catch (error) {
    console.error('Profile API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

async function handleGet(
  _req: NextApiRequest,
  res: NextApiResponse,
  sessionUser: { id?: string; email?: string | null; role?: string }
) {
  const account = await resolveAccountFromSession(sessionUser)
  if (!account.user && !account.volunteer) {
    return res.status(404).json({ success: false, error: 'Profile not found' })
  }

  const source = account.user || account.volunteer!
  const assignmentCount = account.volunteer
    ? await prisma.position_assignments.count({ where: { volunteerId: account.volunteer.id } })
    : 0

  return res.status(200).json({
    success: true,
    data: {
      firstName: source.firstName,
      lastName: source.lastName,
      email: source.email,
      phone: source.phone || '',
      congregation: ('congregation' in source ? source.congregation : '') || '',
      role: account.user?.role || sessionUser.role || 'VOLUNTEER',
      hasPassword: Boolean(account.user),
      hasVolunteerRecord: Boolean(account.volunteer),
      assignmentCount,
      canChangePassword: Boolean(account.user?.id)
    }
  })
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  sessionUser: { id?: string; email?: string | null; role?: string }
) {
  const account = await resolveAccountFromSession(sessionUser)
  if (!account.user && !account.volunteer) {
    return res.status(404).json({ success: false, error: 'Profile not found' })
  }

  const { firstName, lastName, email, phone, congregation, currentPassword, newPassword } = req.body || {}

  if (!firstName?.trim() || !lastName?.trim()) {
    return res.status(400).json({ success: false, error: 'First and last name are required' })
  }
  if (!email?.trim()) {
    return res.status(400).json({ success: false, error: 'Email is required' })
  }

  const nextEmail = String(email).trim().toLowerCase()
  const nextPhone = normalizePhoneOrNull(phone)
  const nextCongregation = congregation != null ? String(congregation).trim() : undefined

  // Email uniqueness
  if (account.user && nextEmail !== account.user.email.toLowerCase()) {
    const taken = await prisma.users.findFirst({
      where: { email: { equals: nextEmail, mode: 'insensitive' }, id: { not: account.user.id } }
    })
    if (taken) {
      return res.status(400).json({ success: false, error: 'That email is already in use' })
    }
  }
  if (account.volunteer && nextEmail !== account.volunteer.email.toLowerCase()) {
    const taken = await prisma.volunteers.findFirst({
      where: {
        email: { equals: nextEmail, mode: 'insensitive' },
        id: { not: account.volunteer.id }
      }
    })
    if (taken) {
      return res.status(400).json({ success: false, error: 'That email is already in use on another volunteer' })
    }
  }

  let passwordHash: string | undefined
  if (newPassword) {
    if (!account.user) {
      return res.status(400).json({
        success: false,
        error: 'Password changes require a staff login account. Contact an admin if you need one.'
      })
    }
    if (!currentPassword) {
      return res.status(400).json({ success: false, error: 'Current password is required to set a new password' })
    }
    const fullUser = await prisma.users.findUnique({ where: { id: account.user.id } })
    if (!fullUser?.passwordHash) {
      return res.status(400).json({ success: false, error: 'No password is set on this account' })
    }
    const ok = await bcrypt.compare(String(currentPassword), fullUser.passwordHash)
    if (!ok) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' })
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' })
    }
    passwordHash = await bcrypt.hash(String(newPassword), 12)
  }

  await prisma.$transaction(async (tx) => {
    if (account.user) {
      await tx.users.update({
        where: { id: account.user.id },
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: nextEmail,
          phone: nextPhone,
          ...(nextCongregation !== undefined && { congregation: nextCongregation || null }),
          ...(passwordHash && { passwordHash }),
          updatedAt: new Date()
        }
      })
    }

    if (account.volunteer) {
      await tx.volunteers.update({
        where: { id: account.volunteer.id },
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: nextEmail,
          phone: nextPhone,
          ...(nextCongregation !== undefined && nextCongregation !== '' && { congregation: nextCongregation }),
          updatedAt: new Date()
        }
      })
    }
  })

  return res.status(200).json({
    success: true,
    message: 'Profile updated'
  })
}
