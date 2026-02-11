import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '../../../src/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    // Admin/Overseer login with email/password
    CredentialsProvider({
      id: 'credentials',
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('[AUTH] Login attempt started')
        
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.users.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.passwordHash) {
          return null
        }

        console.log('[AUTH] Comparing password...')
        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        }
      }
    }),
    // Volunteer login with PIN
    CredentialsProvider({
      id: 'volunteer-pin',
      name: 'Volunteer PIN Login',
      credentials: {
        firstName: { label: 'First Name', type: 'text' },
        lastName: { label: 'Last Name', type: 'text' },
        congregation: { label: 'Congregation', type: 'text' },
        pin: { label: 'PIN', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.firstName || !credentials?.lastName || !credentials?.congregation || !credentials?.pin) {
          return null
        }

        // Find volunteer by name and congregation
        const volunteer = await prisma.volunteers.findFirst({
          where: {
            firstName: { equals: credentials.firstName.trim(), mode: 'insensitive' },
            lastName: { equals: credentials.lastName.trim(), mode: 'insensitive' },
            congregation: { equals: credentials.congregation.trim(), mode: 'insensitive' }
          }
        })

        if (!volunteer) {
          return null
        }


        // Verify PIN using raw query
        const pinResult = await prisma.$queryRaw<Array<{ pinHash: string | null }>>`
          SELECT "pinHash" FROM volunteers WHERE id = ${volunteer.id}
        `
        
        const pinHash = pinResult[0]?.pinHash
        if (!pinHash) {
          return null
        }
        
        const isValidPin = await bcrypt.compare(credentials.pin, pinHash)
        if (!isValidPin) {
          return null
        }

        // Return volunteer as user
        return {
          id: volunteer.id,
          email: volunteer.email,
          name: `${volunteer.firstName} ${volunteer.lastName}`,
          role: 'VOLUNTEER'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.role = user.role
        token.congregation = (user as any).congregation
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.congregation = token.congregation as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If it's a default redirect (no specific callback), route based on the provider
      if (url === baseUrl || url === `${baseUrl}/`) {
        // Default to admin event selection
        return `${baseUrl}/events/select`
      }
      
      // If callback URL is provided and valid, use it
      if (url.startsWith(baseUrl)) {
        return url
      }
      
      // Fallback to base URL
      return baseUrl
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const logMsg = `[${new Date().toISOString()}] ${req.method} ${req.url} - Query: ${JSON.stringify(req.query)}\n`
  fs.appendFileSync('/tmp/nextauth-debug.log', logMsg)
  return await NextAuth(req, res, authOptions)
}
