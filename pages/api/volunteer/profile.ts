import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { handleApiError } from '@/lib/apiError'
import { normalizePhoneForStorage, unformatPhoneNumber } from '@/lib/formatPhone'

// Get last 4 digits of phone number
function getLastFourDigits(phone: string): string {
  return unformatPhoneNumber(phone).slice(-4)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { volunteerId, email, phone } = req.body

    if (!volunteerId) {
      return res.status(400).json({ success: false, error: 'Volunteer ID is required' })
    }

    // Format phone number
    const formattedPhone = phone ? normalizePhoneForStorage(phone) : ''
    
    // Get last 4 digits for new PIN
    const newPin = phone ? getLastFourDigits(phone) : null
    
    // Hash the new PIN if we have one
    let pinHash: string | null = null
    if (newPin) {
      pinHash = await bcrypt.hash(newPin, 10)
    }

    // Update volunteer profile, clear verification requirement, and update PIN
    if (pinHash) {
      await prisma.$executeRaw`
        UPDATE volunteers 
        SET email = ${email || ''}, 
            phone = ${formattedPhone}, 
            "pinHash" = ${pinHash},
            "profileVerificationRequired" = false,
            "profileVerifiedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE id = ${volunteerId}
      `
    } else {
      await prisma.$executeRaw`
        UPDATE volunteers 
        SET email = ${email || ''}, 
            phone = ${formattedPhone}, 
            "profileVerificationRequired" = false,
            "profileVerifiedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE id = ${volunteerId}
      `
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      newPin: newPin, // Return the new PIN to show the user
      formattedPhone: formattedPhone
    })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    })
  }
}
