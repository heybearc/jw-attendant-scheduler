import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '../../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'

export const authOptions: NextAuthOptions = {
  // Use PrismaAdapter for EmailProvider
  // Note: This only works for EmailProvider, not CredentialsProvider
  adapter: PrismaAdapter(prisma),
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
    }),
    // Volunteer: Magic Link (NEW)
    EmailProvider({
      server: {
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: 'placeholder@gmail.com',
          pass: 'placeholder'
        }
      },
      from: process.env.EMAIL_FROM || 'TheoShift <noreply@theoshift.com>',
      async sendVerificationRequest({ identifier, url, provider }) {
        console.log('📧 Magic link requested for:', identifier)
        
        // Only allow volunteers with registered emails
        const volunteer = await prisma.volunteers.findUnique({
          where: { email: identifier }
        })
        
        if (!volunteer) {
          console.log('❌ Email not registered as volunteer:', identifier)
          throw new Error('Email not registered. Please contact your coordinator.')
        }
        
        console.log('✅ Volunteer found:', volunteer.firstName, volunteer.lastName)
        
        // Get email configuration from database (same as assignment emails)
        const emailConfig = await prisma.system_settings.findFirst({
          where: { key: 'email_config' }
        })

        if (!emailConfig) {
          console.error('❌ Email configuration not found in database')
          throw new Error('Email configuration not found')
        }

        const { authType, config } = JSON.parse(emailConfig.value as string)

        // Create transporter using database config
        let transporter
        if (authType === 'gmail') {
          transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
              user: config.gmailEmail,
              pass: config.gmailAppPassword
            }
          })
        } else {
          transporter = nodemailer.createTransport({
            host: config.smtpServer,
            port: parseInt(config.smtpPort || '587'),
            secure: config.smtpSecure || false,
            requireTLS: !config.smtpSecure,
            auth: {
              user: config.smtpUser,
              pass: config.smtpPassword
            }
          })
        }

        // Send magic link email
        await transporter.sendMail({
          from: `"TheoShift Team" <${config.fromEmail}>`,
          to: identifier,
          subject: 'Sign in to TheoShift',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background-color: #10b981; color: white; padding: 30px 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Sign in to TheoShift</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Click the button below to access your volunteer dashboard.</p>
                </div>

                <div style="padding: 30px 20px;">
                  <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${volunteer.firstName}!</h2>
                  
                  <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
                    You requested to sign in to your TheoShift volunteer dashboard. Click the button below to continue.
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${url}" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      🔐 Sign In to TheoShift
                    </a>
                  </div>

                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                    <p style="color: #92400e; margin: 0; line-height: 1.6; font-size: 14px;">
                      ⚡ <strong>Security Notice:</strong> This link will expire in 24 hours and can only be used once. If you didn't request this, you can safely ignore this email.
                    </p>
                  </div>

                  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="color: #6b7280; line-height: 1.6; margin: 0; font-size: 14px;">
                      <strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>
                      <a href="${url}" style="color: #3b82f6; word-break: break-all;">${url}</a>
                    </p>
                  </div>
                </div>

                <div style="background-color: #374151; color: #d1d5db; padding: 20px; text-align: center;">
                  <p style="margin: 0; font-size: 14px;">TheoShift - Supporting Theocratic Event Coordination</p>
                  <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.7;">This is an automated message. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `
        })
        
        console.log('✅ Magic link email sent to:', identifier)
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
