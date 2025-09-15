import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Admin routes require ADMIN role
    if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Leadership routes require ADMIN, OVERSEER, or ASSISTANT_OVERSEER roles
    if (pathname.startsWith('/oversight') && 
        !['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Public routes
        if (pathname === '/' || 
            pathname.startsWith('/auth/') || 
            pathname.startsWith('/api/auth/') ||
            pathname === '/unauthorized') {
          return true
        }

        // All other routes require authentication
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)'
  ]
}
