import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '../../../../utils/auth'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const isActive = searchParams.get('isActive')
    
    const skip = (page - 1) * limit
    
    // Build where clause for filtering
    const where: any = {}
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (role) {
      where.role = role
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          phone: true,
          inviteToken: true,
          inviteExpiry: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.users.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, lastName, role, phone, sendInvite = true } = body

    // Validate required fields
    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER', 'KEYMAN', 'ATTENDANT']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Generate invitation token if sending invite
    let inviteToken = null
    let inviteExpiry = null
    
    if (sendInvite) {
      inviteToken = crypto.randomBytes(32).toString('hex')
      inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }

    const newUser = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email,
        firstName,
        lastName,
        phone: phone || null,
        role,
        passwordHash: null, // Will be set when user accepts invitation
        isActive: true,
        inviteToken,
        inviteExpiry,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        inviteToken: true,
        inviteExpiry: true,
        createdAt: true,
      }
    })

    // Send invitation email
    const { EmailService } = await import('../../../../utils/email')
    const emailSent = await EmailService.sendInvitationEmail(
      email,
      `${firstName} ${lastName}`,
      inviteToken
    )

    if (!emailSent) {
      console.warn(`[USER_CREATION] Failed to send invitation email to ${email}`)
    }

    console.log(`[USER_CREATION] Invitation token generated: ${inviteToken}`)
    console.log(`[USER_CREATION] Invitation URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/auth/accept-invite?token=${inviteToken}`)

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
