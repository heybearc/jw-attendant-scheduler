import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { normalizePhoneOrNull } from '@/lib/formatPhone'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid user ID' })
    }

    switch (req.method) {
      case 'GET':
        return await handleGetUser(req, res, id)
      case 'PUT':
        return await handleUpdateUser(req, res, id)
      case 'DELETE':
        return await handleDeleteUser(req, res, id)
      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' })
    }
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

async function handleGetUser(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const user = await prisma.users.findUnique({
      where: { id },
      include: {
        volunteer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    return res.status(200).json({
      success: true,
      data: { user }
    })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ success: false, error: 'Failed to fetch user' })
  }
}

async function handleUpdateUser(req: NextApiRequest, res: NextApiResponse, id: string) {
  const { firstName, lastName, email, phone, role, isActive, linkedVolunteerId, newPassword, sendResetEmail } = req.body

  try {
    // Handle volunteer linking/unlinking
    let linkedVolunteer: any = null
    if (linkedVolunteerId !== undefined) {
      // First, unlink any volunteers currently linked to this user
      await prisma.volunteers.updateMany({
        where: { userId: id },
        data: { userId: null }
      })

      if (linkedVolunteerId) {
        // Then link the new volunteer to this user
        // Also unlink this volunteer from any other user first
        linkedVolunteer = await prisma.volunteers.update({
          where: { id: linkedVolunteerId },
          data: { userId: id }
        })
      }
    }

    // Handle password change if provided
    let passwordHash: string | undefined = undefined
    if (newPassword) {
      passwordHash = await bcrypt.hash(newPassword, 12)
    }

    // Build update data
    const updateData: any = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(phone !== undefined && { phone: normalizePhoneOrNull(phone) }),
      ...(role && { role }),
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(passwordHash && { passwordHash }),
      updatedAt: new Date()
    }

    // If linking to a volunteer and user doesn't have a phone, pull from volunteer
    if (linkedVolunteer && !phone && linkedVolunteer.phone) {
      updateData.phone = normalizePhoneOrNull(linkedVolunteer.phone)
    }

    const user = await prisma.users.update({
      where: { id },
      data: updateData,
      include: {
        volunteer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Send password change notification email if sendResetEmail is true
    if (newPassword && sendResetEmail) {
      try {
        const { sendPasswordResetEmail } = require('../../../../src/lib/email')
        const loginUrl = `${process.env.NEXTAUTH_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`}/auth/signin`
        
        await sendPasswordResetEmail({
          firstName: user.name?.split(' ')[0] || 'User',
          email: user.email || '',
          newPassword: newPassword,
          loginUrl: loginUrl
        })
        
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return res.status(200).json({
      success: true,
      data: { user },
      message: newPassword ? 'User updated and password changed' : 'User updated successfully'
    })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ success: false, error: 'Failed to update user' })
  }
}

async function handleDeleteUser(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    // Check if user has associated attendants
    const attendantCount = await prisma.volunteers.count({
      where: { userId: id }
    })

    if (attendantCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete user with associated volunteers' 
      })
    }

    await prisma.users.delete({
      where: { id }
    })

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ success: false, error: 'Failed to delete user' })
  }
}
