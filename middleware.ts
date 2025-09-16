import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'staging-jwt-secret-2024';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  if (pathname === '/' || 
      pathname.startsWith('/auth/') || 
      pathname.startsWith('/api/auth/') ||
      pathname === '/unauthorized' ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.endsWith('.html') ||
      pathname.startsWith('/test-')) {
    return NextResponse.next()
  }

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value

  console.log('[MIDDLEWARE] Token exists:', !!token);
  console.log('[MIDDLEWARE] JWT_SECRET exists:', !!JWT_SECRET);
  
  if (!token) {
    console.log('[MIDDLEWARE] No token found, redirecting to signin');
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  try {
    console.log('[MIDDLEWARE] Verifying JWT token with jose, length:', token.length);
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    console.log('[MIDDLEWARE] JWT verification successful, payload:', { userId: payload.userId, email: payload.email, role: payload.role });
    
    const jwtPayload = payload as JWTPayload;
    
    // Role-based access control
    if (pathname.startsWith('/admin') && jwtPayload.role !== 'ADMIN') {
      console.log('[MIDDLEWARE] Access denied: insufficient role for admin area');
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    if (pathname.startsWith('/oversight') && !['ADMIN', 'OVERSIGHT'].includes(jwtPayload.role)) {
      console.log('[MIDDLEWARE] Access denied: insufficient role for oversight area');
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    console.log('[MIDDLEWARE] Access granted for path:', pathname);
    return NextResponse.next();
  } catch (error) {
    console.error('[MIDDLEWARE] Token verification failed:', error);
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)'
  ]
}
