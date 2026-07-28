import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  
  // Check if this is a volunteer route
  const isVolunteerRoute = pathname.startsWith('/volunteer/') && 
                          !pathname.startsWith('/volunteer/login')
  
  if (isVolunteerRoute) {
    // Check if user has a valid session
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    const isVolunteer = token?.role === 'VOLUNTEER'
    const canStaffViewAs = ['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER'].includes((token?.role as string) || '')
    const isStaffViewAsDashboard =
      canStaffViewAs &&
      pathname === '/volunteer/dashboard' &&
      !!searchParams.get('viewAsVolunteerId')
    const isStaffViewAsChat =
      canStaffViewAs &&
      pathname === '/volunteer/chat' &&
      !!searchParams.get('viewAsVolunteerId')
    // Early Check-In has its own page/API gates; staff need the route for IVS ops + mobile nav.
    const isStaffEarlyCheckin =
      canStaffViewAs && pathname === '/volunteer/early-checkin'

    // Allow real volunteer sessions, plus staff preview / early-checkin routes.
    if (!token || (!isVolunteer && !isStaffViewAsDashboard && !isStaffViewAsChat && !isStaffEarlyCheckin)) {
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
