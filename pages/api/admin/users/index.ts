import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { handleApiError } from '../../../src/lib/apiError'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    switch (req.method) {
      case 'GET':
        return await handleGetUsers(req, res)
      case 'POST':
        return await handleCreateUser(req, res)
      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' })
    }
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

async function handleGetUsers(req: NextApiRequest, res: NextApiResponse) {
  const { page = '1', limit = '10', search = '', role = '' } = req.query
  
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where: any = {}
  
  if (search) {
    where.OR = [
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } }
    ]
  }
  
  if (role) {
    where.role = role
  }

  try {
    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          attendants: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.users.count({ where })
    ])

    const pages = Math.ceil(total / limitNum)

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages
        }
      }
    })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ success: false, error: 'Failed to fetch users' })
  }
}

async function handleCreateUser(req: NextApiRequest, res: NextApiResponse) {
  const { 
    firstName, 
    lastName, 
    email, 
    role = 'VOLUNTEER', 
    isActive = true, 
    linkedAttendantId, 
    passwordOption = 'invitation',
    password,
    sendInvitation = false 
  } = req.body

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ success: false, error: 'Missing required fields' })
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' })
    }

    // Handle password setup based on option
    let passwordHash: string | null = null
    let inviteToken: string | null = null
    let inviteExpiry: Date | null = null
    let generatedPassword: string | null = null
    
    if (passwordOption === 'manual' && password) {
      // Hash the provided password
      passwordHash = await bcrypt.hash(password, 12)
    } else if (passwordOption === 'generate') {
      // Generate a temporary password
      generatedPassword = crypto.randomBytes(8).toString('hex')
      passwordHash = await bcrypt.hash(generatedPassword, 12)
    } else if (passwordOption === 'invitation' || sendInvitation) {
      // Generate invitation token
      inviteToken = crypto.randomBytes(32).toString('hex')
      inviteExpiry = new Date()
      inviteExpiry.setDate(inviteExpiry.getDate() + 7) // 7 days expiration
    }

    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        firstName,
        lastName,
        email,
        role,
        isActive,
        passwordHash,
        inviteToken,
        inviteExpiry,
        updatedAt: new Date()
      }
    })

    // Handle attendant linking if provided
    if (linkedAttendantId) {
      try {
        await prisma.volunteers.update({
          where: { id: linkedAttendantId },
          data: { userId: user.id }
        })
      } catch (linkError) {
        console.error('Failed to link attendant:', linkError)
        // Don't fail the user creation, just log the error
      }
    }

    // Send invitation email if sendInvitation is true
    if (sendInvitation && generatedPassword) {
      try {
        const { sendInvitationEmail } = require('../../../../src/lib/email')
        const loginUrl = `${process.env.NEXTAUTH_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`}/auth/signin`
        
        await sendInvitationEmail({
          firstName: user.name?.split(' ')[0] || user.name || 'User',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email || email,
          role: role,
          tempPassword: generatedPassword,
          loginUrl: loginUrl
        })
        
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError)
        // Don't fail the request if email fails
      }
    }

    let message = 'User created successfully'
    if (passwordOption === 'invitation' || sendInvitation) {
      message = 'User created and invitation sent'
    } else if (passwordOption === 'generate') {
      message = `User created with temporary password: ${generatedPassword}`
    }

    return res.status(201).json({
      success: true,
      data: { 
        user,
        ...(generatedPassword && { temporaryPassword: generatedPassword })
      },
      message
    })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ success: false, error: 'Failed to create user' })
  }
}
