import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'
import { prisma } from '../../../../src/lib/prisma'
import { findVolunteerByEmailCaseInsensitive } from '@/lib/volunteerEmailLookup'
import { encode } from 'next-auth/jwt'
import { sessionTokenCookieName, useSecureCookies } from '@/lib/nextAuthCookieHelpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { session: sessionToken, email } = req.query

  if (!sessionToken || !email || typeof email !== 'string') {
    return res.redirect('/auth/signin?error=InvalidSession')
  }

  try {
    let volunteer = await prisma.volunteers.findUnique({
      where: { email }
    })
    if (!volunteer) {
      volunteer = await findVolunteerByEmailCaseInsensitive(email)
    }

    if (!volunteer) {
      return res.redirect('/auth/signin?error=VolunteerNotFound')
    }

    const secret = process.env.NEXTAUTH_SECRET
    
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET not configured')
    }

    // Create session token using NextAuth's encode function
    const token = await encode({
      token: {
        sub: volunteer.id,
        email: volunteer.email,
        name: `${volunteer.firstName} ${volunteer.lastName}`,
        role: 'VOLUNTEER',
        congregation: volunteer.congregation
      } as any,
      secret,
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })

    const secure = useSecureCookies(req)
    const cookieName = sessionTokenCookieName(req)
    const maxAge = 30 * 24 * 60 * 60

    res.setHeader(
      'Set-Cookie',
      serialize(cookieName, token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: secure,
        maxAge,
      })
    )

    // Redirect to volunteer dashboard
    return res.redirect('/volunteer/select-event')
    
  } catch (error) {
    console.error('Magic link callback error:', error)
    return res.redirect('/auth/signin?error=CallbackFailed')
  }
}
