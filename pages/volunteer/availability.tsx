import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { AvailabilityStatusBadge } from '../../src/components/AssignmentStatusBadge'

/**
 * Phase 4C: Volunteer Availability Response Page
 * Allow volunteers to respond to availability requests
 */

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

export default function AvailabilityPage() {
  const router = useRouter()
  const { eventId } = router.query
  const [requests, setRequests] = useState<AvailabilityRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)

  useEffect(() => {
    fetchAvailabilityRequests()
  }, [])

  const fetchAvailabilityRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/attendant/availability-requests')
      const data = await response.json()
      
      if (data.success) {
        setRequests(data.requests)
        
        // If eventId in query, scroll to that request
        if (eventId) {
          setTimeout(() => {
            const element = document.getElementById(`request-${eventId}`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
      }
    } catch (error) {
      console.error('Failed to fetch availability requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const respondToRequest = async (requestId: string, status: 'AVAILABLE' | 'NOT_AVAILABLE' | 'PARTIAL', notes?: string) => {
    try {
      setResponding(true)
      setSelectedRequest(requestId)

      const response = await fetch(`/api/attendant/availability-requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      })

      if (response.ok) {
        await fetchAvailabilityRequests()
        alert('Response submitted successfully!')
      } else {
        alert('Failed to submit response')
      }
    } catch (error) {
      console.error('Response error:', error)
      alert('Failed to submit response')
    } finally {
      setResponding(false)
      setSelectedRequest(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/attendant/dashboard" className="text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                📅 Availability Requests
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading availability requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Availability Requests</h2>
            <p className="text-gray-600">
              You don't have any pending availability requests at this time.
            </p>
            <Link
              href="/attendant/dashboard"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800"
            >
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📋 How to Respond</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li><strong>Available:</strong> You can serve during the entire event</li>
                <li><strong>Partial:</strong> You can serve on specific dates or times</li>
                <li><strong>Not Available:</strong> You cannot serve at this event</li>
              </ul>
            </div>

            {/* Availability Requests */}
            {requests.map((request) => (
              <div
                key={request.id}
                id={`request-${request.eventId}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Request Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.event.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Requested: {formatDate(request.requestedAt)}
                      </p>
                    </div>
                    <AvailabilityStatusBadge status={request.status} size="lg" />
                  </div>
                </div>

                {/* Event Details */}
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="font-medium text-gray-900">{formatDate(request.event.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">End Date</p>
                      <p className="font-medium text-gray-900">{formatDate(request.event.endDate)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">{request.event.location || 'TBD'}</p>
                    </div>
                  </div>

                  {/* Response Buttons */}
                  {request.status === 'PENDING' || !request.respondedAt ? (
                    <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => respondToRequest(request.id, 'AVAILABLE')}
                        disabled={responding && selectedRequest === request.id}
                        className="flex-1 min-w-[150px] bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✅ I'm Available
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Please specify which dates/times you are available:')
                          if (notes) respondToRequest(request.id, 'PARTIAL', notes)
                        }}
                        disabled={responding && selectedRequest === request.id}
                        className="flex-1 min-w-[150px] bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ⚡ Partial Availability
                      </button>
                      <button
                        onClick={() => respondToRequest(request.id, 'NOT_AVAILABLE')}
                        disabled={responding && selectedRequest === request.id}
                        className="flex-1 min-w-[150px] bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ❌ Not Available
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        You responded on {formatDate(request.respondedAt!)}
                      </p>
                      <button
                        onClick={() => {
                          if (confirm('Do you want to change your response?')) {
                            // Allow changing response
                          }
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Change Response
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false
      }
    }
  }

  return {
    props: {}
  }
}
