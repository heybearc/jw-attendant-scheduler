import { PrismaClient } from '@prisma/client';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';

// Global Prisma instance to avoid connection issues
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('NextAuth: Missing credentials');
          return null;
        }

        try {
          console.log('NextAuth: Attempting to authenticate user:', credentials.email);
          
          const user = await prisma.users.findUnique({
            where: { email: credentials.email as string }
          });

          if (!user) {
            console.log('NextAuth: User not found:', credentials.email);
            return null;
          }

          console.log('NextAuth: User found, checking password');

          // Simple password check for staging - replace with proper bcrypt in production
          const isValid = credentials.password === 'AdminPass123!' && 
                          user.email === 'admin@jwscheduler.local';

          if (!isValid) {
            console.log('NextAuth: Invalid credentials for user:', credentials.email);
            return null;
          }

          console.log('NextAuth: Authentication successful, updating last login');

          // Update last login
          await prisma.users.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          });

          const authUser = {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role
          };

          console.log('NextAuth: Returning authenticated user:', authUser);
          return authUser;
        } catch (error) {
          console.error('NextAuth: Database error during authentication:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log('NextAuth JWT: Adding user to token:', user);
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        console.log('NextAuth Session: Creating session from token:', token);
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'staging-nextauth-secret-2024',
  debug: process.env.NODE_ENV === 'development'
};
