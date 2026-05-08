import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import EventLayout from './EventLayout'
import { useModuleConfig } from '../contexts/TemplateContext'
import { VolunteerText } from './DynamicText'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { getViewAsVolunteerId, setViewAsVolunteerId } from '@/lib/viewAsClient'

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
  currentPage:
    | 'overview'
    | 'positions'
    | 'volunteers'
    | 'count-times'
    | 'lanyards'
    | 'ivs'
    | 'documents'
    | 'chat'
    | 'permissions'
    | 'edit'
  canEdit?: boolean
  canDelete?: boolean
  canManagePermissions?: boolean
  onStatusChange?: (status: string) => void
  onExport?: () => void
}

export default function EventPageLayout({
  children,
  event,
  currentPage,
  canEdit = false,
  canDelete = false,
  canManagePermissions = false,
  onStatusChange,
  onExport
}: EventPageLayoutProps) {
  const moduleConfig = useModuleConfig()
  const router = useRouter()
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const { data: session } = useSession()
  const [viewAsVolunteerId, setViewAsVolunteerIdState] = useState<string | null>(null)
  const [viewAsSelection, setViewAsSelection] = useState('')
  const [eventVolunteers, setEventVolunteers] = useState<Array<{ id: string; name: string }>>([])

  const isCountTimesEnabled = moduleConfig?.countTimes === true
  const isLanyardsEnabled = moduleConfig?.lanyards === true
  const isIVSEnabled = moduleConfig?.ivsModule === true
  const isPositionsEnabled = moduleConfig?.positions !== false
  const isDocumentsEnabled = moduleConfig?.documents !== false
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

  useEffect(() => {
    setViewAsVolunteerIdState(getViewAsVolunteerId())
  }, [])

  useEffect(() => {
    const canViewAs = ['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER'].includes(session?.user?.role || '')
    if (!canViewAs) return
    fetch(`/api/events/${event.id}/volunteers`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setEventVolunteers((data.volunteers || []).map((v: any) => ({ id: v.id, name: v.name })))
        }
      })
      .catch(() => undefined)
  }, [event.id, session?.user?.role])

  return (
    <EventLayout
      title={event.name}
      hideTitle={true}
      selectedEvent={{
        id: event.id,
        name: event.name,
        status: (event.status || 'DRAFT').toLowerCase() as any
      }}
    >
      <div className="space-y-6">
        {viewAsVolunteerId && (
          <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-900 font-medium min-w-0">
              View-as-volunteer simulation is active (read-only mode). All write actions are blocked.
            </p>
            <button
              type="button"
              onClick={async () => {
                await fetch(`/api/admin/view-as?eventId=${event.id}`, { method: 'DELETE' })
                setViewAsVolunteerId(null)
                setViewAsVolunteerIdState(null)
              }}
              className="w-full sm:w-auto shrink-0 px-3 py-2 min-h-[44px] bg-amber-700 text-white rounded text-sm"
            >
              Exit Simulation
            </button>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-start">
          <div className="flex flex-wrap items-center gap-2">
          <EventQRCode eventId={event.id} eventName={event.name} />

          {/* Status Actions */}
          {event.status === 'UPCOMING' && onStatusChange && (
            <button
              type="button"
              onClick={() => onStatusChange('CURRENT')}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 min-h-[44px] bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors touch-manipulation"
            >
              🚀 Start Event
            </button>
          )}
          {event.status === 'CURRENT' && onStatusChange && (
            <button
              type="button"
              onClick={() => onStatusChange('COMPLETED')}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors touch-manipulation"
            >
              ✅ Complete Event
            </button>
          )}

          {canEdit && (
            <Link
              href={`/events/${event.id}/edit`}
              className="inline-flex items-center justify-center px-3 py-2 min-h-[44px] bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation"
            >
              ⚙️ Settings
            </Link>
          )}
          </div>

          {['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER'].includes(session?.user?.role || '') && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto lg:max-w-xl min-w-0">
              <select
                value={viewAsSelection}
                onChange={(e) => setViewAsSelection(e.target.value)}
                className="w-full sm:w-auto min-w-0 flex-1 sm:flex-initial px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg text-sm"
              >
                <option value="">View as volunteer...</option>
                {eventVolunteers.map((volunteer) => (
                  <option key={volunteer.id} value={volunteer.id}>
                    {volunteer.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={async () => {
                  if (!viewAsSelection) return
                  const response = await fetch('/api/admin/view-as', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ volunteerId: viewAsSelection, eventId: event.id })
                  })
                  const data = await response.json()
                  if (response.ok && data.success) {
                    setViewAsVolunteerId(viewAsSelection)
                    setViewAsVolunteerIdState(viewAsSelection)
                    router.push(`/volunteer/dashboard?eventId=${event.id}&viewAsVolunteerId=${viewAsSelection}`)
                  }
                }}
                className="w-full sm:w-auto shrink-0 px-3 py-2 min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm touch-manipulation"
              >
                Start View-As
              </button>
            </div>
          )}

          {/* More Actions Dropdown - Only show if there are actions available */}
          {(onExport || (event.status === 'COMPLETED' && onStatusChange)) && (
            <div className="relative w-full sm:w-auto lg:ml-auto flex justify-end min-w-0">
              <button
                type="button"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 min-h-[44px] w-full sm:w-auto bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation"
              >
                ⋯ More
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  {onExport && (
                    <button
                      type="button"
                      onClick={() => {
                        onExport()
                        setShowMoreMenu(false)
                      }}
                      className="w-full text-left px-4 py-3 min-h-[44px] text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 touch-manipulation"
                    >
                      <span>📥</span>
                      <span>Export Data</span>
                    </button>
                  )}
                  {event.status === 'COMPLETED' && onStatusChange && (
                    <button
                      type="button"
                      onClick={() => {
                        onStatusChange('ARCHIVED')
                        setShowMoreMenu(false)
                      }}
                      className="w-full text-left px-4 py-3 min-h-[44px] text-sm text-yellow-700 hover:bg-yellow-50 flex items-center gap-2 touch-manipulation"
                    >
                      <span>📦</span>
                      <span>Archive Event</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab Navigation - Workflow Order */}
        <div className="-mx-3 sm:mx-0 border-b border-gray-200 overflow-x-auto theoshift-x-scroll">
          <nav className="flex gap-1 min-w-max px-3 sm:px-0 pb-0.5" aria-label="Event sections">
            <Link
              href={`/events/${event.id}`}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap min-h-[44px] flex items-center touch-manipulation ${
                currentPage === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              Overview
            </Link>
            {isPositionsEnabled && (
              <Link
                href={`/events/${event.id}/positions`}
                className={`flex-shrink-0 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap min-h-[44px] flex items-center touch-manipulation ${
                  currentPage === 'positions'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
                }`}
              >
                📋 Positions
              </Link>
            )}
            <Link
              href={`/events/${event.id}/volunteers`}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap min-h-[44px] flex items-center touch-manipulation ${
                currentPage === 'volunteers'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              👥 <VolunteerText plural />
            </Link>
            {isCountTimesEnabled && (
              <Link
                href={`/events/${event.id}/count-times`}
                className={`flex-shrink-0 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap min-h-[44px] flex items-center touch-manipulation ${
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
                className={`flex-shrink-0 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap min-h-[44px] flex items-center touch-manipulation ${
                  currentPage === 'lanyards'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
                }`}
              >
                🏷️ Lanyards
              </Link>
            )}
            {isIVSEnabled && (
              <Link
                href={`/events/${event.id}/ivs`}
                className={`flex-shrink-0 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap min-h-[44px] flex items-center touch-manipulation ${
                  currentPage === 'ivs'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
                }`}
              >
                IVS Module
              </Link>
            )}
            {isDocumentsEnabled && (
              <Link
                href={`/events/${event.id}/documents`}
                className={`flex-shrink-0 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap min-h-[44px] flex items-center touch-manipulation ${
                  currentPage === 'documents'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
                }`}
              >
                📄 Documents
              </Link>
            )}
            <Link
              href={`/events/${event.id}/chat`}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap min-h-[44px] flex items-center touch-manipulation ${
                currentPage === 'chat'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              💬 Chat
            </Link>
            {canManagePermissions && (
              <Link
                href={`/events/${event.id}/permissions`}
                className={`flex-shrink-0 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap min-h-[44px] flex items-center touch-manipulation ${
                  currentPage === 'permissions'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
                }`}
              >
                🔐 Permissions
              </Link>
            )}
          </nav>
        </div>

        {/* Page Content */}
        {children}
      </div>
    </EventLayout>
  )
}
