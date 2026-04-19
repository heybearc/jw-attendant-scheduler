import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '../../../src/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // Cannot use adapter with CredentialsProvider - handle everything in callbacks
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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.users.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.passwordHash) {
          return null
        }

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
        console.log('🔐 Volunteer PIN authorize called')
        
        if (!credentials?.firstName || !credentials?.lastName || !credentials?.congregation || !credentials?.pin) {
          console.log('❌ Missing credentials')
          return null
        }

        console.log('🔐 Looking up volunteer:', credentials.firstName, credentials.lastName, credentials.congregation)
        
        // Find volunteer by name and congregation
        const volunteer = await prisma.volunteers.findFirst({
          where: {
            firstName: { equals: credentials.firstName.trim(), mode: 'insensitive' },
            lastName: { equals: credentials.lastName.trim(), mode: 'insensitive' },
            congregation: { equals: credentials.congregation.trim(), mode: 'insensitive' }
          }
        })

        if (!volunteer) {
          console.log('❌ Volunteer not found')
          return null
        }

        console.log('✅ Volunteer found:', volunteer.id)

        // Verify PIN using raw query
        const pinResult = await prisma.$queryRaw<Array<{ pinHash: string | null }>>`
          SELECT "pinHash" FROM volunteers WHERE id = ${volunteer.id}
        `
        
        const pinHash = pinResult[0]?.pinHash
        if (!pinHash) {
          console.log('❌ No PIN hash found')
          return null
        }
        
        console.log('🔐 Verifying PIN...')
        const isValidPin = await bcrypt.compare(credentials.pin, pinHash)
        if (!isValidPin) {
          console.log('❌ Invalid PIN')
          return null
        }

        console.log('✅ PIN valid, returning user')
        
        // Return volunteer as user
        return {
          id: volunteer.id,
          email: volunteer.email,
          name: `${volunteer.firstName} ${volunteer.lastName}`,
          role: 'VOLUNTEER',
          congregation: volunteer.congregation
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
        ;(session.user as any).congregation = token.congregation as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If callback URL is provided and valid, use it (e.g., /volunteer/select-event)
      if (url.startsWith(baseUrl)) {
        return url
      }
      
      // If it's a default redirect (no specific callback), route to admin event selection
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/events/select`
      }
      
      // Fallback to base URL
      return baseUrl
    },
    async signIn({ user, account }) {
      // For email provider, verify user is a volunteer and add role info
      if (account?.provider === 'email') {
        const volunteer = await prisma.volunteers.findUnique({
          where: { email: user.email! }
        })
        
        if (!volunteer) {
          console.log('❌ Email provider: volunteer not found for', user.email)
          return false // Reject sign-in
        }
        
        // Add role and volunteer info to user object for JWT callback
        user.id = volunteer.id
        user.role = 'VOLUNTEER'
        ;(user as any).congregation = volunteer.congregation
        
        console.log('✅ Email provider: volunteer authenticated', volunteer.firstName, volunteer.lastName)
        return true
      }
      
      // Allow all other sign-ins (credentials providers)
      return true
    },
  },
  pages: {
    signIn: '/auth/signin', // Use our custom unified login page
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
