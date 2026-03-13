import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body
    
    console.log('[TEST-AUTH] Testing auth flow for:', email)
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' })
    }

    const user = await prisma.users.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('[TEST-AUTH] User not found')
      return res.status(401).json({ error: 'User not found' })
    }

    if (!user.passwordHash) {
      console.log('[TEST-AUTH] User has no password hash')
      return res.status(401).json({ error: 'No password set' })
    }

    console.log('[TEST-AUTH] Comparing password...')
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)

    if (!isValidPassword) {
      console.log('[TEST-AUTH] Invalid password')
      return res.status(401).json({ error: 'Invalid password' })
    }

    console.log('[TEST-AUTH] Password valid!')
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('[TEST-AUTH] Error:', error)
    return res.status(500).json({ 
      error: error.message 
    })
  }
}
