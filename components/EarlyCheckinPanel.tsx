import { useState, useEffect } from 'react'

interface Volunteer {
  id: string
  firstName: string
  lastName: string
  congregation: string
  earlyCheckinEligible: boolean
  checkedInAt: string | null
  checkedInBy: string | null
}

interface EarlyCheckinPanelProps {
  eventId: string
  eventName: string
  showHeader?: boolean
  onBack?: () => void
}

export default function EarlyCheckinPanel({ eventId, eventName, showHeader = true, onBack }: EarlyCheckinPanelProps) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchVolunteers()
    
    // Auto-polling every 5 seconds
    const interval = setInterval(() => {
      fetchVolunteers(true)
    }, 5000)

    // Pause polling when page is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval)
      } else {
        fetchVolunteers(true)
        const newInterval = setInterval(() => {
          fetchVolunteers(true)
        }, 5000)
        return () => clearInterval(newInterval)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [eventId])

  const fetchVolunteers = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response = await fetch(`/api/volunteer/early-checkin?eventId=${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setVolunteers(data.volunteers || [])
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleCheckIn = async (volunteerId: string) => {
    try {
      const response = await fetch(`/api/volunteer/early-checkin/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId,
          volunteerId 
        }),
      })

      if (response.ok) {
        fetchVolunteers()
      } else {
        const data = await response.json()
        alert(data.message || 'Failed to check in volunteer')
      }
    } catch (error) {
      console.error('Error checking in:', error)
      alert('Error checking in volunteer')
    }
  }

  const handleUndoCheckIn = async (volunteerId: string) => {
    if (!confirm('Undo check-in for this volunteer?')) return

    try {
      const response = await fetch(`/api/volunteer/early-checkin/undo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId,
          volunteerId 
        }),
      })

      if (response.ok) {
        fetchVolunteers()
      } else {
        alert('Failed to undo check-in')
      }
    } catch (error) {
      console.error('Error undoing check-in:', error)
      alert('Error undoing check-in')
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const response = await fetch(`/api/volunteer/early-checkin/export?eventId=${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `IVS_Early_CheckIn_Report_${eventName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
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

  const pendingVolunteers = volunteers.filter(v => {
    if (!v.earlyCheckinEligible) return false
    if (v.checkedInAt) return false
    
    const searchLower = searchTerm.toLowerCase()
    const fullName = `${v.firstName} ${v.lastName}`.toLowerCase()
    const congregation = v.congregation.toLowerCase()
    
    return fullName.includes(searchLower) || congregation.includes(searchLower)
  })

  const checkedInVolunteers = volunteers.filter(v => {
    if (!v.checkedInAt) return false
    
    const searchLower = searchTerm.toLowerCase()
    const fullName = `${v.firstName} ${v.lastName}`.toLowerCase()
    const congregation = v.congregation.toLowerCase()
    
    return fullName.includes(searchLower) || congregation.includes(searchLower)
  }).sort((a, b) => {
    const aTime = new Date(a.checkedInAt!).getTime()
    const bTime = new Date(b.checkedInAt!).getTime()
    return bTime - aTime
  })

  const filteredVolunteers = activeTab === 'pending' ? pendingVolunteers : checkedInVolunteers

  return (
    <div className="h-full flex flex-col">
      {showHeader && (
        <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            {onBack && (
              <button
                onClick={onBack}
                className="text-white hover:text-gray-200"
              >
                ← Back
              </button>
            )}
            <h2 className="text-xl font-bold flex-1 text-center">IVS Early Check-In</h2>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="text-white hover:text-gray-200 text-sm disabled:opacity-50"
            >
              {exporting ? '...' : '📊 Export'}
            </button>
          </div>
          
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or congregation..."
            className="w-full px-4 py-3 rounded-lg text-gray-900 text-lg"
          />
        </div>
      )}

      <div className="bg-white border-b sticky top-[140px] z-10">
        <div className="flex">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-4 text-center font-semibold text-lg transition-colors ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending ({pendingVolunteers.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 text-center font-semibold text-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            History ({checkedInVolunteers.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {activeTab === 'pending'
              ? (searchTerm ? 'No pending volunteers found matching your search' : 'No volunteers pending check-in')
              : (searchTerm ? 'No checked-in volunteers found matching your search' : 'No volunteers checked in yet')}
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === 'pending' ? (
              filteredVolunteers.map(volunteer => (
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
              ))
            ) : (
              filteredVolunteers.map(volunteer => (
                <div
                  key={volunteer.id}
                  className="bg-white rounded-lg shadow p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">
                        {volunteer.firstName} {volunteer.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {volunteer.congregation}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Checked in: {new Date(volunteer.checkedInAt!).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-green-600 text-2xl">
                        ✓
                      </div>
                      <button
                        onClick={() => handleUndoCheckIn(volunteer.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200 active:bg-red-300"
                      >
                        Undo
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
