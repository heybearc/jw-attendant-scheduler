import { ReactNode, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import packageJson from '../package.json'
import MobileNav from './MobileNav'
import BottomNav from './BottomNav'
import FloatingActionButton from './FloatingActionButton'
import QuickVolunteerLookup from './QuickVolunteerLookup'
import QuickAssignmentForm from './QuickAssignmentForm'
import QRScanner from './QRScanner'

interface EventLayoutProps {
  children: ReactNode
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  selectedEvent?: {
    id: string
    name: string
    status?: string
  }
}

export default function EventLayout({ 
  children, 
  title = 'Theocratic Shift Scheduler',
  breadcrumbs = [],
  selectedEvent
}: EventLayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [showVolunteerLookup, setShowVolunteerLookup] = useState(false)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)

  const handleSignOut = () => {
    // Don't specify callbackUrl - let next-auth use the current origin
    signOut({ redirect: true }).then(() => {
      window.location.href = '/auth/signin'
    })
  }

  const navigationItems = [
    {
      label: 'Events',
      href: '/events',
      icon: '📅',
      roles: ['ADMIN', 'OVERSEER', 'ATTENDANT']
    },
    {
      label: 'Event Selection',
      href: '/events/select',
      icon: '🎯',
      roles: ['ADMIN', 'OVERSEER', 'ATTENDANT']
    }
  ]


  // Add admin navigation for admin users
  if (session?.user?.role === 'ADMIN' || session?.user?.role === 'admin') {
    navigationItems.push({
      label: 'Admin Portal',
      href: '/admin',
      icon: '🛡️',
      roles: ['ADMIN', 'admin']
    })
  }

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(session?.user?.role || '')
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center">
              <Link href="/events/select" className="flex items-center">
                <img src="/logo.svg" alt="TheoShift Logo" className="h-12 w-12" />
                <span className="ml-3 text-xl font-semibold text-gray-900">
                  TheoShift
                </span>
              </Link>
              
              {/* Navigation Items */}
              <div className="hidden md:ml-8 md:flex md:space-x-4">
                {filteredNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      router.pathname.startsWith(item.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side - Mobile Menu and User Menu */}
            <div className="flex items-center space-x-4">
              {/* Mobile Navigation Button */}
              <MobileNav selectedEvent={selectedEvent} />
              {/* Selected Event Indicator */}
              {selectedEvent && (
                <div className="hidden md:flex items-center bg-blue-50 px-3 py-1 rounded-lg">
                  <span className="text-sm text-blue-600 font-medium">
                    📅 {selectedEvent.name}
                  </span>
                  {selectedEvent.status && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      selectedEvent.status === 'current' 
                        ? 'bg-green-100 text-green-800'
                        : selectedEvent.status === 'upcoming'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedEvent.status}
                    </span>
                  )}
                </div>
              )}

              {/* User Menu */}
              {session?.user && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    {session.user.name}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    session.user.role === 'ADMIN' 
                      ? 'bg-red-100 text-red-800'
                      : session.user.role === 'OVERSEER'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {session.user.role}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && (
                      <svg className="w-4 h-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {crumb.href ? (
                      <Link href={crumb.href} className="text-sm text-blue-600 hover:text-blue-800">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-500">{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {title && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
            <p>© 2024 TheoShift. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Version {packageJson.version}</p>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation for Mobile */}
      <BottomNav selectedEventId={selectedEvent?.id} />

      {/* Floating Action Button with Quick Actions */}
      {selectedEvent && (
        <>
          <FloatingActionButton
            primaryAction={{
              id: 'main',
              label: 'Quick Actions',
              icon: '+',
              onClick: () => {}
            }}
            actions={[
              {
                id: 'scan-qr',
                label: 'Scan QR Code',
                icon: '📱',
                onClick: () => setShowQRScanner(true),
                color: 'bg-indigo-600 hover:bg-indigo-700'
              },
              {
                id: 'find-volunteer',
                label: 'Find Volunteer',
                icon: '🔍',
                onClick: () => setShowVolunteerLookup(true),
                color: 'bg-purple-600 hover:bg-purple-700'
              },
              {
                id: 'create-assignment',
                label: 'Create Assignment',
                icon: '➕',
                onClick: () => setShowAssignmentForm(true),
                color: 'bg-green-600 hover:bg-green-700'
              },
              {
                id: 'view-positions',
                label: 'View Positions',
                icon: '📋',
                onClick: () => router.push(`/events/${selectedEvent.id}/positions`),
                color: 'bg-orange-600 hover:bg-orange-700'
              },
              {
                id: 'view-volunteers',
                label: 'View Volunteers',
                icon: '👥',
                onClick: () => router.push(`/events/${selectedEvent.id}/volunteers`),
                color: 'bg-blue-600 hover:bg-blue-700'
              }
            ]}
          />

          <QuickVolunteerLookup
            isOpen={showVolunteerLookup}
            onClose={() => setShowVolunteerLookup(false)}
            eventId={selectedEvent.id}
            onSelect={(volunteer) => {
              setShowVolunteerLookup(false)
              // Could open assignment form with preselected volunteer
            }}
          />

          <QuickAssignmentForm
            isOpen={showAssignmentForm}
            onClose={() => setShowAssignmentForm(false)}
            eventId={selectedEvent.id}
            onSuccess={() => {
              // Refresh the page or show success message
              router.reload()
            }}
          />

          <QRScanner
            isOpen={showQRScanner}
            onClose={() => setShowQRScanner(false)}
          />
        </>
      )}
    </div>
  )
}
