import { useEffect } from 'react'
import { useRouter } from 'next/router'

/**
 * Volunteer Login Redirect
 * 
 * This page redirects to the unified login page (/auth/signin) with role=volunteer.
 * Maintains backward compatibility with old volunteer login links in emails and bookmarks.
 */
export default function VolunteerLoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    const callbackUrl = router.query.callbackUrl as string
    const params = new URLSearchParams()
    
    // Set role to volunteer
    params.set('role', 'volunteer')
    
    // Preserve callback URL if present
    if (callbackUrl) {
      params.set('callbackUrl', callbackUrl)
    }
    
    // Redirect to unified login page
    router.replace(`/auth/signin?${params.toString()}`)
  }, [router.query.callbackUrl])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecting to login...</p>
      </div>
    </div>
  )
}
