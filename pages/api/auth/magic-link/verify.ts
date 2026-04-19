import type { NextApiRequest, NextApiResponse} from 'next'
import { prisma } from '../../../../src/lib/prisma'
import { signIn } from 'next-auth/react'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { token, email } = req.query

  if (!token || !email || typeof token !== 'string' || typeof email !== 'string') {
    return res.redirect('/auth/signin?error=InvalidToken')
  }

  try {
    // Find and verify token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token
        }
      }
    })

    if (!verificationToken) {
      return res.redirect('/auth/signin?error=InvalidToken')
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token
          }
        }
      })
      return res.redirect('/auth/signin?error=TokenExpired')
    }

    // Verify volunteer exists
    const volunteer = await prisma.volunteers.findUnique({
      where: { email }
    })

    if (!volunteer) {
      return res.redirect('/auth/signin?error=VolunteerNotFound')
    }

    // Delete token (one-time use)
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token
        }
      }
    })

    // Create a temporary session token for the callback
    const sessionToken = token.substring(0, 32) // Use part of the token as session identifier
    
    // Redirect to callback page that will handle the sign-in
    return res.redirect(`/api/auth/magic-link/callback?session=${sessionToken}&email=${encodeURIComponent(email)}`)
    
  } catch (error) {
    console.error('Magic link verification error:', error)
    return res.redirect('/auth/signin?error=VerificationFailed')
  }
}
