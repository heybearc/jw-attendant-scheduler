import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../api/auth/[...nextauth]'
import { useRouter } from 'next/router'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface IVSVolunteer {
  id: string
  firstName: string
  lastName: string
  congregation: string
  earlyCheckinEligible: boolean
  checkedInAt?: string
}

interface Props {
  event: any
  canEdit: boolean
}

export default function IVSCheckInPage({ event, canEdit }: Props) {
  const router = useRouter()
  const eventId = event.id
  const [volunteers, setVolunteers] = useState<IVSVolunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [exporting, setExporting] = useState(false)

  // Auto-refresh every 5 seconds to prevent duplicate check-ins with multiple users
  useEffect(() => {
    fetchVolunteers()

    // Set up polling interval
    const pollInterval = setInterval(() => {
      // Only poll if page is visible (Page Visibility API)
      if (!document.hidden) {
        fetchVolunteers(true) // Silent refresh (no loading spinner)
      }
    }, 5000) // 5 seconds - industry standard for collaborative tools

    // Pause polling when tab is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchVolunteers(true) // Refresh immediately when tab becomes visible
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchVolunteers = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response = await fetch(`/api/events/${eventId}/ivs/volunteers`)
      if (response.ok) {
        const data = await response.json()
        setVolunteers(data.volunteers || [])
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleCheckIn = async (volunteerId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/ivs/volunteers/${volunteerId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        fetchVolunteers()
      } else {
        alert('Failed to check in volunteer')
      }
    } catch (error) {
      console.error('Error checking in:', error)
      alert('Error checking in volunteer')
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const response = await fetch(`/api/events/${eventId}/ivs/checkin-export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `IVS_Early_CheckIn_Report_${event.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to export check-in report')
      }
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Error exporting check-in report')
    } finally {
      setExporting(false)
    }
  }

  const filteredVolunteers = volunteers.filter(v => {
    if (!v.earlyCheckinEligible) return false
    if (v.checkedInAt) return false
    
    const searchLower = searchTerm.toLowerCase()
    const fullName = `${v.firstName} ${v.lastName}`.toLowerCase()
    const congregation = v.congregation.toLowerCase()
    
    return fullName.includes(searchLower) || congregation.includes(searchLower)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.back()}
            className="text-white hover:text-gray-200"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">Early Check-In</h1>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="text-white hover:text-gray-200 text-sm disabled:opacity-50"
          >
            {exporting ? '...' : '📊 Export'}
          </button>
        </div>
        
        {/* Search bar */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or congregation..."
          className="w-full px-4 py-3 rounded-lg text-gray-900 text-lg"
          autoFocus
        />
      </div>

      {/* Last updated indicator */}
      <div className="px-4 py-2 bg-gray-100 border-b text-center">
        <div className="text-xs text-gray-600">
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          <span className="ml-2 text-green-600">● Live</span>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 bg-white border-b">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {volunteers.filter(v => v.earlyCheckinEligible && !v.checkedInAt).length}
            </div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {volunteers.filter(v => v.checkedInAt).length}
            </div>
            <div className="text-xs text-gray-600">Checked In</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {volunteers.filter(v => v.earlyCheckinEligible).length}
            </div>
            <div className="text-xs text-gray-600">Total Eligible</div>
          </div>
        </div>
      </div>

      {/* Volunteer list */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No volunteers found matching your search' : 'No volunteers eligible for early check-in'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVolunteers.map(volunteer => (
              <div
                key={volunteer.id}
                className="bg-white rounded-lg shadow p-4 active:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">
                      {volunteer.firstName} {volunteer.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {volunteer.congregation}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCheckIn(volunteer.id)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 active:bg-green-800 shadow-lg"
                  >
                    Check In
                  </button>
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
  
  if (!session?.user?.id) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  const { id } = context.params as { id: string }

  const event = await prisma.events.findUnique({
    where: { id },
    include: {
      departmentTemplate: true,
    },
  })

  if (!event) {
    return {
      notFound: true,
    }
  }

  const eventPermission = await prisma.event_permissions.findFirst({
    where: {
      eventId: id,
      userId: session.user.id,
    },
  })

  if (!eventPermission) {
    return {
      redirect: {
        destination: '/events/select',
        permanent: false,
      },
    }
  }

  const canEdit = eventPermission.role === 'ADMIN'

  await prisma.$disconnect()

  return {
    props: {
      event: JSON.parse(JSON.stringify(event)),
      canEdit,
    },
  }
}
