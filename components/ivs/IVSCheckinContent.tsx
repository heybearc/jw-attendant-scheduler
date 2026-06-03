import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useScrollRestoration } from '../../hooks/useScrollRestoration'
import { notifyAlert, toast } from '../../lib/ui/toast'
import { appConfirm, appConfirmMessage } from '../../lib/ui/confirm'

interface IVSVolunteer {
  id: string
  firstName: string
  lastName: string
  congregation: string
  earlyCheckinEligible: boolean
  checkedInAt?: string
}

interface IVSCheckinContentProps {
  event: any
}

export default function IVSCheckinContent({ event }: IVSCheckinContentProps) {
  const router = useRouter()
  const eventId = event.id
  const [volunteers, setVolunteers] = useState<IVSVolunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [exporting, setExporting] = useState(false)
  const [pendingCollapsed, setPendingCollapsed] = useState(false)
  const [checkedInCollapsed, setCheckedInCollapsed] = useState(false)

  useScrollRestoration(`${router.asPath}:ivs-checkin`, !loading)

  useEffect(() => {
    fetchVolunteers()

    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        fetchVolunteers(true)
      }
    }, 5000)

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchVolunteers(true)
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
        notifyAlert('Failed to check in volunteer')
      }
    } catch (error) {
      console.error('Error checking in:', error)
      notifyAlert('Error checking in volunteer')
    }
  }

  const handleUndoCheckIn = async (volunteerId: string) => {
    if (!(await appConfirmMessage('Undo check-in for this volunteer?'))) return

    try {
      const response = await fetch(`/api/events/${eventId}/ivs/volunteers/${volunteerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          checkedInAt: null, 
          checkedInBy: null, 
          checkinNotes: null 
        }),
      })

      if (response.ok) {
        fetchVolunteers()
      } else {
        notifyAlert('Failed to undo check-in')
      }
    } catch (error) {
      console.error('Error undoing check-in:', error)
      notifyAlert('Error undoing check-in')
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
        notifyAlert('Failed to export check-in report')
      }
    } catch (error) {
      console.error('Error exporting:', error)
      notifyAlert('Error exporting check-in report')
    } finally {
      setExporting(false)
    }
  }

  const searchLower = searchTerm.toLowerCase()

  const pendingVolunteers = volunteers
    .filter(v => {
      if (!v.earlyCheckinEligible) return false
      if (v.checkedInAt) return false
      
      const fullName = `${v.firstName} ${v.lastName}`.toLowerCase()
      const congregation = v.congregation.toLowerCase()
      
      return fullName.includes(searchLower) || congregation.includes(searchLower)
    })
    .sort((a, b) => {
      return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
    })

  const checkedInVolunteers = volunteers
    .filter(v => {
      if (!v.checkedInAt) return false
      
      const fullName = `${v.firstName} ${v.lastName}`.toLowerCase()
      const congregation = v.congregation.toLowerCase()
      
      return fullName.includes(searchLower) || congregation.includes(searchLower)
    })
    .sort((a, b) => {
      const aTime = new Date(a.checkedInAt!).getTime()
      const bTime = new Date(b.checkedInAt!).getTime()
      return bTime - aTime
    })

  return (
    <>
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-base font-medium"
        >
          {exporting ? 'Exporting...' : 'Export Check-In Report'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="search"
          enterKeyHint="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or congregation..."
          className="w-full min-h-[44px] px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-base"
        />
      </div>

      {/* Stats */}
      <div className="p-3 sm:p-4 bg-white border rounded-lg shadow-sm mb-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-orange-600 tabular-nums">
              {pendingVolunteers.length}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600 leading-tight">Pending</div>
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600 tabular-nums">
              {checkedInVolunteers.length}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600 leading-tight">Checked In</div>
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-gray-600 tabular-nums">
              {volunteers.filter(v => v.earlyCheckinEligible).length}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600 leading-tight">Eligible</div>
          </div>
        </div>
        <div className="mt-2 text-center text-xs text-gray-500">
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          <span className="ml-2 text-green-600">● Live</span>
        </div>
      </div>

      {/* Volunteer sections */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <>
          {/* Pending Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
            <button
              type="button"
              onClick={() => setPendingCollapsed(!pendingCollapsed)}
              className="w-full px-4 py-3 bg-orange-50 border-l-4 border-orange-500 flex items-center justify-between gap-2 hover:bg-orange-100 transition-colors text-left min-h-[48px]"
            >
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="text-lg shrink-0">{pendingCollapsed ? '▶' : '▼'}</span>
                <h2 className="font-bold text-base sm:text-lg text-orange-900">PENDING CHECK-IN</h2>
                <span className="px-2 py-1 bg-orange-200 text-orange-900 rounded-full text-sm font-semibold shrink-0">
                  {pendingVolunteers.length}
                </span>
              </div>
            </button>
            
            {!pendingCollapsed && (
              <div className="p-4">
                {pendingVolunteers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No pending volunteers found matching your search' : 'No volunteers pending check-in'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingVolunteers.map(volunteer => (
                      <div
                        key={volunteer.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-lg break-words">
                              {volunteer.firstName} {volunteer.lastName}
                            </div>
                            <div className="text-sm text-gray-600 break-words">
                              {volunteer.congregation}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCheckIn(volunteer.id)}
                            className="w-full sm:w-auto shrink-0 min-h-[48px] px-6 py-3 bg-green-600 text-white rounded-lg font-semibold text-base sm:text-lg hover:bg-green-700 active:bg-green-800 shadow-lg"
                          >
                            Check In
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checked In Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <button
              type="button"
              onClick={() => setCheckedInCollapsed(!checkedInCollapsed)}
              className="w-full px-4 py-3 bg-green-50 border-l-4 border-green-500 flex items-center justify-between gap-2 hover:bg-green-100 transition-colors text-left min-h-[48px]"
            >
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="text-lg shrink-0">{checkedInCollapsed ? '▶' : '▼'}</span>
                <h2 className="font-bold text-base sm:text-lg text-green-900">CHECKED IN</h2>
                <span className="px-2 py-1 bg-green-200 text-green-900 rounded-full text-sm font-semibold shrink-0">
                  {checkedInVolunteers.length}
                </span>
              </div>
            </button>
            
            {!checkedInCollapsed && (
              <div className="p-4">
                {checkedInVolunteers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No checked-in volunteers found matching your search' : 'No volunteers checked in yet'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {checkedInVolunteers.map(volunteer => (
                      <div
                        key={volunteer.id}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-lg break-words">
                              {volunteer.firstName} {volunteer.lastName}
                            </div>
                            <div className="text-sm text-gray-600 break-words">
                              {volunteer.congregation}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 break-words">
                              Checked in: {new Date(volunteer.checkedInAt!).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <div className="text-green-600 text-2xl" aria-hidden>
                              ✓
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUndoCheckIn(volunteer.id)}
                              className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 active:bg-red-300 sm:whitespace-nowrap"
                            >
                              Undo
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
