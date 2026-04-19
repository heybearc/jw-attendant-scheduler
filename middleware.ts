import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if this is a volunteer route
  const isVolunteerRoute = pathname.startsWith('/volunteer/') && 
                          !pathname.startsWith('/volunteer/login')
  
  if (isVolunteerRoute) {
    // Check if user has a valid session
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    // If no token or not a volunteer, redirect to volunteer login
    if (!token || token.role !== 'VOLUNTEER') {
      const url = request.nextUrl.clone()
      url.pathname = '/volunteer/login'
      // Preserve the original URL as a callback
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/volunteer/:path*',
  ]
};
