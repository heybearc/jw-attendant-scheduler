import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import EventLayout from './EventLayout'
import { useModuleConfig } from '../contexts/TemplateContext'
import { VolunteerText } from './DynamicText'
import dynamic from 'next/dynamic'

const EventQRCode = dynamic(() => import('./EventQRCode'), { ssr: false })

interface EventPageLayoutProps {
  children: ReactNode
  event: {
    id: string
    name: string
    status: string
    eventType?: string
    startDate?: string
  }
  currentPage: 'overview' | 'positions' | 'volunteers' | 'oversight' | 'count-times' | 'lanyards' | 'documents' | 'announcements' | 'permissions' | 'edit'
  canEdit?: boolean
  canDelete?: boolean
  onStatusChange?: (status: string) => void
  onClone?: () => void
  onDelete?: () => void
}

export default function EventPageLayout({
  children,
  event,
  currentPage,
  canEdit = false,
  canDelete = false,
  onStatusChange,
  onClone,
  onDelete
}: EventPageLayoutProps) {
  const moduleConfig = useModuleConfig()
  const router = useRouter()
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const isCountTimesEnabled = moduleConfig?.countTimes === true
  const isLanyardsEnabled = moduleConfig?.lanyards === true

  const getStatusBadge = (status: string) => {
    const statusColors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      UPCOMING: 'bg-yellow-100 text-yellow-800',
      CURRENT: 'bg-green-100 text-green-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      ARCHIVED: 'bg-gray-100 text-gray-800'
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <EventLayout
      title={event.name}
      hideTitle={true}
      breadcrumbs={[
        { label: 'Events', href: '/events' },
        { label: event.name }
      ]}
      selectedEvent={{
        id: event.id,
        name: event.name,
        status: event.status.toLowerCase() as any
      }}
    >
      <div className="space-y-6">
        {/* Event Header */}
        <div>
          <div className="flex items-center flex-wrap gap-3 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
            <span className={`px-3 py-1 text-sm rounded-full ${getStatusBadge(event.status)}`}>
              {event.status}
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <EventQRCode eventId={event.id} eventName={event.name} />

          {/* Status Actions */}
          {event.status === 'UPCOMING' && onStatusChange && (
            <button
              onClick={() => onStatusChange('CURRENT')}
              className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              🚀 Start Event
            </button>
          )}
          {event.status === 'CURRENT' && onStatusChange && (
            <button
              onClick={() => onStatusChange('COMPLETED')}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              ✅ Complete Event
            </button>
          )}

          {canEdit && (
            <Link
              href={`/events/${event.id}/edit`}
              className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ⚙️ Settings
            </Link>
          )}

          {/* More Actions Dropdown */}
          <div className="relative inline-block ml-auto">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ⋯ More
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                {onClone && (
                  <button
                    onClick={() => { onClone(); setShowMoreMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>📋</span>
                    <span>Clone Event</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    router.push(`/events/${event.id}/permissions`);
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span>🔐</span>
                  <span>Permissions</span>
                </button>
                {event.status === 'COMPLETED' && onStatusChange && (
                  <button
                    onClick={() => { onStatusChange('ARCHIVED'); setShowMoreMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 flex items-center gap-2"
                  >
                    <span>📦</span>
                    <span>Archive Event</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { onDelete(); setShowMoreMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-200"
                  >
                    <span>🗑️</span>
                    <span>Delete Event</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex gap-1 min-w-max">
            <Link
              href={`/events/${event.id}`}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                currentPage === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              Overview
            </Link>
            <Link
              href={`/events/${event.id}/positions`}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                currentPage === 'positions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              📋 Positions
            </Link>
            <Link
              href={`/events/${event.id}/volunteers`}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                currentPage === 'volunteers'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              👥 <VolunteerText plural />
            </Link>
            <Link
              href={`/events/${event.id}/oversight`}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                currentPage === 'oversight'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              🔍 Oversight
            </Link>
            {isCountTimesEnabled && (
              <Link
                href={`/events/${event.id}/count-times`}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                  currentPage === 'count-times'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
                }`}
              >
                📊 Count Times
              </Link>
            )}
            {isLanyardsEnabled && (
              <Link
                href={`/events/${event.id}/lanyards`}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                  currentPage === 'lanyards'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
                }`}
              >
                🏷️ Lanyards
              </Link>
            )}
            <Link
              href={`/events/${event.id}/documents`}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                currentPage === 'documents'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              📄 Documents
            </Link>
            <Link
              href={`/events/${event.id}/announcements`}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                currentPage === 'announcements'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              📢 Announcements
            </Link>
            <Link
              href={`/events/${event.id}/permissions`}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                currentPage === 'permissions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              🔐 Permissions
            </Link>
          </nav>
        </div>

        {/* Page Content */}
        {children}
      </div>
    </EventLayout>
  )
}
