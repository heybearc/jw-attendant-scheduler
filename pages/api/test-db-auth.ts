import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('[TEST-DB] Testing database connection from auth context...')
    
    const user = await prisma.users.findUnique({
      where: { email: 'corylallen@gmail.com' }
    })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    console.log('[TEST-DB] User found:', user.email)
    
    return res.status(200).json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
        hasPassword: !!user.passwordHash,
        firstName: user.firstName,
        lastName: user.lastName
      }
    })
  } catch (error: any) {
    console.error('[TEST-DB] Error:', error)
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    })
  }
}
