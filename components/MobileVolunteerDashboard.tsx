import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

interface Assignment {
  id: string
  positionId: string
  positionName: string
  startTime: string
  endTime: string
  location?: string
  instructions?: string
  overseer?: string
  keyman?: string
}

interface Event {
  id: string
  name: string
  eventType: string
  startDate: string
  endDate: string
  status: string
}

interface Volunteer {
  id: string
  firstName: string
  lastName: string
  congregation: string
  email: string
  phone: string
}

interface OversightContact {
  name: string
  role: string
  phone?: string
  email?: string
}

interface CountSession {
  id: string
  sessionName: string
  countTime: string
  status: string
}

interface AvailabilityRequest {
  id: string
  eventId: string
  status: string
  requestedAt: string
  respondedAt: string | null
  event: {
    id: string
    name: string
    startDate: string
    endDate: string
    location: string
  }
}

interface MobileVolunteerDashboardProps {
  volunteer: Volunteer
  event: Event
  assignments: Assignment[]
  oversightContacts: OversightContact[]
  activeCountSessions?: CountSession[]
  availabilityRequests: AvailabilityRequest[]
  onAvailabilityResponse: (requestId: string, status: string) => Promise<void>
  onRefresh?: () => Promise<void>
}

export default function MobileVolunteerDashboard({
  volunteer,
  event,
  assignments,
  oversightContacts,
  activeCountSessions = [],
  availabilityRequests,
  onAvailabilityResponse,
  onRefresh
}: MobileVolunteerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'assignments' | 'availability' | 'contacts'>('assignments')
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [respondingToRequest, setRespondingToRequest] = useState<string | null>(null)

  const formatTime = (time: string) => {
    if (!time || time === 'All Day') return 'All Day'
    try {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${ampm}`
    } catch {
      return time
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy')
    } catch {
      return dateString
    }
  }

  const handlePullToRefresh = async () => {
    if (!onRefresh || refreshing) return
    
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  const handleAvailabilityResponseWrapper = async (requestId: string, status: string) => {
    setRespondingToRequest(requestId)
    try {
      await onAvailabilityResponse(requestId, status)
    } finally {
      setRespondingToRequest(null)
    }
  }

  const pendingRequests = availabilityRequests.filter(r => r.status === 'PENDING')
  const respondedRequests = availabilityRequests.filter(r => r.status !== 'PENDING')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">Hi, {volunteer.firstName}! 👋</h1>
              <p className="text-sm text-blue-100 mt-1">{volunteer.congregation}</p>
            </div>
            <button
              onClick={handlePullToRefresh}
              disabled={refreshing}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all disabled:opacity-50"
              aria-label="Refresh"
            >
              <svg 
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          {/* Event Info Card */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 border border-white border-opacity-20">
            <p className="font-medium text-sm">{event.name}</p>
            <p className="text-xs text-blue-100 mt-1">
              📅 {formatDate(event.startDate)} - {formatDate(event.endDate)}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-white border-opacity-20">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 py-3 text-sm font-medium transition-all ${
              activeTab === 'assignments'
                ? 'bg-white bg-opacity-20 border-b-2 border-white'
                : 'text-blue-100 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            📋 Assignments
            {assignments.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-white bg-opacity-30 rounded-full text-xs">
                {assignments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`flex-1 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'availability'
                ? 'bg-white bg-opacity-20 border-b-2 border-white'
                : 'text-blue-100 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            📅 Availability
            {pendingRequests.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-500 rounded-full text-xs font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 py-3 text-sm font-medium transition-all ${
              activeTab === 'contacts'
                ? 'bg-white bg-opacity-20 border-b-2 border-white'
                : 'text-blue-100 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            👥 Contacts
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-3">
            {assignments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-5xl mb-3">📝</div>
                <p className="text-gray-600 font-medium">No assignments yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Check back later or contact your overseer
                </p>
              </div>
            ) : (
              assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden touch-manipulation"
                >
                  <button
                    onClick={() => setExpandedAssignment(
                      expandedAssignment === assignment.id ? null : assignment.id
                    )}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base">
                          {assignment.positionName}
                        </h3>
                        {assignment.location && (
                          <p className="text-sm text-gray-600 mt-1 flex items-center">
                            <span className="mr-1">📍</span>
                            <span className="truncate">{assignment.location}</span>
                          </p>
                        )}
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <span className="mr-1">🕐</span>
                          <span>
                            {assignment.startTime === 'All Day' 
                              ? 'All Day' 
                              : `${formatTime(assignment.startTime)}${assignment.endTime ? ` - ${formatTime(assignment.endTime)}` : ''}`
                            }
                          </span>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
                          expandedAssignment === assignment.id ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedAssignment === assignment.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                      {assignment.instructions && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs font-medium text-blue-900 mb-1">📝 Instructions:</p>
                          <p className="text-sm text-gray-700">{assignment.instructions}</p>
                        </div>
                      )}
                      
                      {(assignment.overseer || assignment.keyman) && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <p className="text-xs font-medium text-purple-900 mb-2">Position Oversight:</p>
                          <div className="space-y-1">
                            {assignment.overseer && (
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">👤 Overseer:</span> {assignment.overseer}
                              </p>
                            )}
                            {assignment.keyman && (
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">🔑 Keyman:</span> {assignment.keyman}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <div className="space-y-4">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  ⚠️ Needs Response ({pendingRequests.length})
                </h3>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg shadow-md overflow-hidden">
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900">{request.event.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">📍 {request.event.location}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          📅 {formatDate(request.event.startDate)} - {formatDate(request.event.endDate)}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Requested: {format(parseISO(request.requestedAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-white bg-opacity-60 space-y-2">
                        <button
                          onClick={() => handleAvailabilityResponseWrapper(request.id, 'AVAILABLE')}
                          disabled={respondingToRequest === request.id}
                          className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[44px]"
                        >
                          ✅ I'm Available
                        </button>
                        <button
                          onClick={() => handleAvailabilityResponseWrapper(request.id, 'PARTIAL')}
                          disabled={respondingToRequest === request.id}
                          className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[44px]"
                        >
                          ⚡ Partially Available
                        </button>
                        <button
                          onClick={() => handleAvailabilityResponseWrapper(request.id, 'NOT_AVAILABLE')}
                          disabled={respondingToRequest === request.id}
                          className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[44px]"
                        >
                          ❌ Not Available
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Responded Requests */}
            {respondedRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  ✓ Previous Responses
                </h3>
                <div className="space-y-3">
                  {respondedRequests.map((request) => (
                    <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 flex-1">{request.event.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                            request.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                            request.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status === 'AVAILABLE' ? '✅ Available' :
                             request.status === 'PARTIAL' ? '⚡ Partial' :
                             '❌ Not Available'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">📍 {request.event.location}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          📅 {formatDate(request.event.startDate)} - {formatDate(request.event.endDate)}
                        </p>
                        {request.respondedAt && (
                          <p className="text-xs text-gray-400 mt-2">
                            Responded: {format(parseISO(request.respondedAt), 'MMM d, h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availabilityRequests.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-5xl mb-3">📅</div>
                <p className="text-gray-600 font-medium">No availability requests</p>
                <p className="text-sm text-gray-500 mt-2">
                  You'll be notified when there are new requests
                </p>
              </div>
            )}
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="space-y-3">
            {oversightContacts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-5xl mb-3">👥</div>
                <p className="text-gray-600 font-medium">No contacts available</p>
              </div>
            ) : (
              oversightContacts.map((contact, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                      <p className="text-sm text-gray-600">{contact.role}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center justify-center w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors touch-manipulation min-h-[44px]"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Call {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center justify-center w-full bg-gray-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors touch-manipulation min-h-[44px]"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Count Sessions */}
            {activeCountSessions && activeCountSessions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  📊 Active Count Sessions
                </h3>
                <div className="space-y-3">
                  {activeCountSessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/events/${event.id}/count-times/${session.id}/enter-count`}
                      className="block bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow touch-manipulation"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{session.sessionName}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            🕐 {formatTime(session.countTime)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Status: <span className="font-medium">{session.status}</span>
                          </p>
                        </div>
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
