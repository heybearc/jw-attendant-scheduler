import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  if (pathname === '/' || 
      pathname.startsWith('/auth/') || 
      pathname.startsWith('/api/auth/') ||
      pathname === '/unauthorized' ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico')) {
    return NextResponse.next()
  }

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-for-development'
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload

    // Admin routes require ADMIN role
    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Leadership routes require ADMIN, OVERSEER, or ASSISTANT_OVERSEER roles
    if (pathname.startsWith('/oversight') && 
        !['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER'].includes(payload.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    // Invalid token, redirect to login
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)'
  ]
}
