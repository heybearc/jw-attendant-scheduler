import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import EventPageWrapper from '../../../components/EventPageWrapper'
import Link from 'next/link'
import { exportOversightToPDF, exportOversightToExcel } from '../../../src/lib/exportUtils'

interface OversightAssignment {
  assignmentId: string
  user: {
    id: string
    name: string
    email: string
  }
  position: {
    id: string
    name: string
    number: number
    department: string | null
  }
  shift: {
    start: string
    end: string
  }
  status: string
  notes: string | null
}

interface CoverageGap {
  id: string
  name: string
  number: number
  department: string | null
}

interface OversightData {
  event: {
    id: string
    name: string
    status: string
    eventType: string
    startDate: string
  }
  statistics: {
    totalPositions: number
    positionsWithOversight: number
    positionsWithoutOversight: number
    coveragePercentage: number
    overseerCount: number
    assistantOverseerCount: number
    keymanCount: number
  }
  overseers: OversightAssignment[]
  assistantOverseers: OversightAssignment[]
  keymen: OversightAssignment[]
  coverageGaps: CoverageGap[]
}

export default function EventOversightDashboard() {
  const router = useRouter()
  const { id: eventId } = router.query
  const { data: session, status } = useSession()
  const [oversightData, setOversightData] = useState<OversightData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId || typeof eventId !== 'string') return

    const fetchOversightData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events/${eventId}/oversight`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch oversight data')
        }

        const data = await response.json()
        setOversightData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchOversightData()
  }, [eventId])

  if (status === 'loading' || loading || error || !oversightData) {
    return null
  }

  const { event, statistics, overseers, assistantOverseers, keymen, coverageGaps } = oversightData

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <EventPageWrapper
      event={{
        id: event.id,
        name: event.name,
        status: event.status,
        eventType: event.eventType || 'ASSEMBLY',
        startDate: event.startDate || new Date().toISOString()
      }}
      currentPage="oversight"
      canEdit={false}
      canDelete={false}
      canManagePermissions={false}
    >
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Oversight Dashboard</h1>
            <p className="mt-2 text-gray-600">
              View oversight coverage and assignments for {event.name}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => exportOversightToPDF(oversightData)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              📄 Export PDF
            </button>
            <button
              onClick={() => exportOversightToExcel(oversightData)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              📊 Export Excel
            </button>
          </div>
        </div>

        {/* Coverage Statistics Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Coverage Statistics</h2>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Oversight Coverage</span>
              <span className="text-2xl font-bold text-blue-600">{statistics.coveragePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  statistics.coveragePercentage >= 90
                    ? 'bg-green-500'
                    : statistics.coveragePercentage >= 70
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${statistics.coveragePercentage}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {statistics.positionsWithOversight} of {statistics.totalPositions} positions have oversight assigned
            </p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Overseers</p>
                  <p className="text-3xl font-bold text-blue-900">{statistics.overseerCount}</p>
                </div>
                <div className="text-4xl">🔵</div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Assistant Overseers</p>
                  <p className="text-3xl font-bold text-green-900">{statistics.assistantOverseerCount}</p>
                </div>
                <div className="text-4xl">🟢</div>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Keymen</p>
                  <p className="text-3xl font-bold text-yellow-900">{statistics.keymanCount}</p>
                </div>
                <div className="text-4xl">🟡</div>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Gaps Warning */}
        {coverageGaps.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Coverage Gaps Detected
                </h3>
                <p className="mt-2 text-sm text-yellow-700">
                  {coverageGaps.length} position{coverageGaps.length !== 1 ? 's' : ''} without oversight assigned
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overseers Section */}
        {overseers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🔵</span>
              Overseers ({overseers.length})
            </h2>
            <div className="space-y-4">
              {overseers.map((assignment) => (
                <div key={assignment.assignmentId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.user.name}</h3>
                      <p className="text-sm text-gray-600">{assignment.user.email}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">
                          {assignment.position.name} (Post #{assignment.position.number})
                        </p>
                        {assignment.position.department && (
                          <p className="text-sm text-gray-600">Department: {assignment.position.department}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDateTime(assignment.shift.start)} - {formatDateTime(assignment.shift.end)}
                        </p>
                      </div>
                      {assignment.notes && (
                        <p className="mt-2 text-sm text-gray-600 italic">{assignment.notes}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      assignment.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800'
                        : assignment.status === 'ASSIGNED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assistant Overseers Section */}
        {assistantOverseers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🟢</span>
              Assistant Overseers ({assistantOverseers.length})
            </h2>
            <div className="space-y-4">
              {assistantOverseers.map((assignment) => (
                <div key={assignment.assignmentId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.user.name}</h3>
                      <p className="text-sm text-gray-600">{assignment.user.email}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">
                          {assignment.position.name} (Post #{assignment.position.number})
                        </p>
                        {assignment.position.department && (
                          <p className="text-sm text-gray-600">Department: {assignment.position.department}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDateTime(assignment.shift.start)} - {formatDateTime(assignment.shift.end)}
                        </p>
                      </div>
                      {assignment.notes && (
                        <p className="mt-2 text-sm text-gray-600 italic">{assignment.notes}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      assignment.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800'
                        : assignment.status === 'ASSIGNED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keymen Section */}
        {keymen.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🟡</span>
              Keymen ({keymen.length})
            </h2>
            <div className="space-y-4">
              {keymen.map((assignment) => (
                <div key={assignment.assignmentId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.user.name}</h3>
                      <p className="text-sm text-gray-600">{assignment.user.email}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">
                          {assignment.position.name} (Post #{assignment.position.number})
                        </p>
                        {assignment.position.department && (
                          <p className="text-sm text-gray-600">Department: {assignment.position.department}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDateTime(assignment.shift.start)} - {formatDateTime(assignment.shift.end)}
                        </p>
                      </div>
                      {assignment.notes && (
                        <p className="mt-2 text-sm text-gray-600 italic">{assignment.notes}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      assignment.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800'
                        : assignment.status === 'ASSIGNED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coverage Gaps Section */}
        {coverageGaps.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">⚠️</span>
              Coverage Gaps ({coverageGaps.length})
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-yellow-300 p-4">
              <p className="text-sm text-gray-600 mb-4">
                The following positions do not have oversight assigned:
              </p>
              <div className="space-y-2">
                {coverageGaps.map((gap) => (
                  <div key={gap.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        Post #{gap.number} - {gap.name}
                      </p>
                      {gap.department && (
                        <p className="text-sm text-gray-600">Department: {gap.department}</p>
                      )}
                    </div>
                    <Link
                      href={`/events/${eventId}/positions`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Assign →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {overseers.length === 0 && assistantOverseers.length === 0 && keymen.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Oversight Assignments Yet</h3>
            <p className="text-gray-600 mb-4">
              No overseers, assistant overseers, or keymen have been assigned to positions for this event.
            </p>
            <Link
              href={`/events/${eventId}/positions`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Positions
            </Link>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Link
            href={`/events/${eventId}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to Event
          </Link>
          <Link
            href={`/events/${eventId}/positions`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Manage Positions
          </Link>
        </div>
    </EventPageWrapper>
  )
}
