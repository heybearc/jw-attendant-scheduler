import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../src/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../[...nextauth]'
import { getToken } from 'next-auth/jwt'

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
    // Verify volunteer exists
    const volunteer = await prisma.volunteers.findUnique({
      where: { email }
    })

    if (!volunteer) {
      return res.redirect('/auth/signin?error=VolunteerNotFound')
    }

    // Create a signed JWT token manually
    const jwt = require('jsonwebtoken')
    const secret = process.env.NEXTAUTH_SECRET
    
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET not configured')
    }

    // Create session token
    const token = jwt.sign(
      {
        sub: volunteer.id,
        email: volunteer.email,
        name: `${volunteer.firstName} ${volunteer.lastName}`,
        role: 'VOLUNTEER',
        congregation: volunteer.congregation,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
      },
      secret
    )

    // Set the session cookie
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token'
    
    res.setHeader('Set-Cookie', [
      `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    ])

    // Redirect to volunteer dashboard
    return res.redirect('/volunteer/select-event')
    
  } catch (error) {
    console.error('Magic link callback error:', error)
    return res.redirect('/auth/signin?error=CallbackFailed')
  }
}
