import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface MobileNavProps {
  selectedEvent?: {
    id: string
    name: string
    status?: string
  }
}

export default function MobileNav({ selectedEvent }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    setIsOpen(false)
  }, [router.pathname])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSignOut = () => {
    signOut({ redirect: true }).then(() => {
      window.location.href = '/auth/signin'
    })
  }

  const navigationItems = [
    {
      label: 'Event Selection',
      href: '/events/select',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      roles: ['ADMIN', 'OVERSEER', 'ATTENDANT']
    },
    {
      label: 'Help',
      href: '/help',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      roles: ['ADMIN', 'OVERSEER', 'ATTENDANT', 'VOLUNTEER']
    }
  ]

  if (session?.user?.role === 'ADMIN' || session?.user?.role === 'admin') {
    navigationItems.push({
      label: 'Admin Portal',
      href: '/admin',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      roles: ['ADMIN', 'admin']
    })
  }

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(session?.user?.role || '')
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden tap-target inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        aria-expanded={isOpen}
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 md:hidden shadow-2xl safe-top safe-bottom">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <img src="/logo.svg" alt="TheoShift Logo" className="h-10 w-10" />
                  <span className="ml-3 text-lg font-semibold text-gray-900">
                    TheoShift
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="tap-target p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  aria-label="Close menu"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Selected Event */}
              {selectedEvent && (
                <div className="p-4 bg-blue-50 border-b border-blue-100">
                  <div className="text-xs font-medium text-blue-600 mb-1">Current Event</div>
                  <div className="text-sm font-semibold text-gray-900">{selectedEvent.name}</div>
                  {selectedEvent.status && (
                    <div className="text-xs text-gray-600 mt-1">{selectedEvent.status}</div>
                  )}
                </div>
              )}

              {/* User Info */}
              {session?.user && (
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{session.user.name || 'User'}</div>
                      <div className="text-xs text-gray-600">{session.user.email}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto py-4">
                <div className="space-y-1 px-2">
                  {filteredNavigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`tap-target flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                        router.pathname.startsWith(item.href)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Footer Actions */}
              <div className="border-t border-gray-200 p-4 space-y-2">
                <button
                  onClick={handleSignOut}
                  className="tap-target w-full flex items-center justify-center px-4 py-3 rounded-lg text-base font-medium text-red-700 hover:bg-red-50 transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
