import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../src/lib/prisma'
import { findVolunteerByEmailCaseInsensitive } from '@/lib/volunteerEmailLookup'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { token, email: emailParam } = req.query

  if (!token || !emailParam || typeof token !== 'string' || typeof emailParam !== 'string') {
    return res.redirect('/auth/signin?error=InvalidToken')
  }

  try {
    const emailTrimmed = emailParam.trim()

    let verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: emailTrimmed,
          token
        }
      }
    })

    if (!verificationToken) {
      const vol = await findVolunteerByEmailCaseInsensitive(emailTrimmed)
      if (vol) {
        verificationToken = await prisma.verificationToken.findUnique({
          where: {
            identifier_token: {
              identifier: vol.email,
              token
            }
          }
        })
      }
    }

    if (!verificationToken) {
      return res.redirect('/auth/signin?error=InvalidToken')
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token
          }
        }
      })
      return res.redirect('/auth/signin?error=TokenExpired')
    }

    const volunteer = await prisma.volunteers.findUnique({
      where: { email: verificationToken.identifier }
    })

    if (!volunteer) {
      return res.redirect('/auth/signin?error=VolunteerNotFound')
    }

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token
        }
      }
    })

    const sessionToken = token.substring(0, 32)
    const emailForCallback = volunteer.email

    return res.redirect(
      `/api/auth/magic-link/callback?session=${sessionToken}&email=${encodeURIComponent(emailForCallback)}`
    )
    
  } catch (error) {
    console.error('Magic link verification error:', error)
    return res.redirect('/auth/signin?error=VerificationFailed')
  }
}
