'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Unauthorized() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            You don't have permission to access this resource.
          </div>
          {session && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Signed in as: {session.user?.email} ({session.user?.role})
            </div>
          )}
          <div className="mt-6 space-y-4 text-center">
            <Link
              href="/"
              className="block text-blue-600 hover:text-blue-500 font-medium"
            >
              Return to Home
            </Link>
            {session && (
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="block w-full text-red-600 hover:text-red-500 font-medium"
              >
                Sign out and try different account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
