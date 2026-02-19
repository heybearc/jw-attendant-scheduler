import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'
import { canManageAttendants } from '../../../src/lib/eventAccess'
import bcrypt from 'bcryptjs'
import { handleApiError } from '../../src/lib/apiError'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions)
    if (!session || !session.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { volunteerId, eventId, pin, autoGenerate } = req.body

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Event ID is required' })
    }

    // Get current user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    // Check if user can manage attendants (OVERSEER+ permission)
    const canManage = await canManageAttendants(user.id, eventId)
    if (!canManage) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to set PINs. Requires OVERSEER+ role.' 
      })
    }

    if (!volunteerId) {
      return res.status(400).json({ success: false, error: 'Volunteer ID is required' })
    }

    let finalPin = pin

    // Auto-generate PIN from phone number if requested
    if (autoGenerate) {
      const volunteer = await prisma.volunteers.findUnique({
        where: { id: volunteerId },
        select: { phone: true }
      })

      if (!volunteer?.phone) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot auto-generate PIN: No phone number on file' 
        })
      }

      // Extract last 4 digits from phone number
      const digits = volunteer.phone.replace(/\D/g, '')
      if (digits.length < 4) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone number must have at least 4 digits' 
        })
      }
      finalPin = digits.slice(-4)
    }

    if (!finalPin || finalPin.length !== 4 || !/^\d{4}$/.test(finalPin)) {
      return res.status(400).json({ 
        success: false, 
        error: 'PIN must be exactly 4 digits' 
      })
    }

    // Hash the PIN
    const pinHash = await bcrypt.hash(finalPin, 10)

    // Update volunteer with PIN
    await prisma.$executeRaw`
      UPDATE volunteers 
      SET "pinHash" = ${pinHash}, "updatedAt" = NOW() 
      WHERE id = ${volunteerId}
    `

    return res.status(200).json({
      success: true,
      message: 'PIN set successfully',
      pin: finalPin // Return PIN so admin can communicate it to volunteer
    })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({
      success: false,
      error: 'Failed to set PIN'
    })
  }
}
