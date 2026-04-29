import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import dynamic from 'next/dynamic'
import AnnouncementBanner from '../../components/AnnouncementBanner'
import EarlyCheckinPanel from '../../components/EarlyCheckinPanel'
import { getViewAsHeaders, getViewAsVolunteerId } from '@/lib/viewAsClient'

// Lazy load mobile dashboard (only loaded on mobile devices)
const MobileVolunteerDashboard = dynamic(() => import('../../components/MobileVolunteerDashboard'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  )
})

interface Volunteer {
  id: string
  firstName: string
  lastName: string
  congregation: string
  email: string
  phone: string
  profileVerificationRequired?: boolean
  profileVerifiedAt?: string
}

interface Event {
  id: string
  name: string
  eventType: string
  startDate: string
  endDate: string
  status: string
}

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
  completeSchedule?: Array<{
    volunteerName: string
    isCurrentUser: boolean
    shiftName: string
    startTime: string
    endTime: string
    isAllDay: boolean
  }>
}

interface Document {
  id: string
  title: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  description?: string
  publishedAt: string
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
  positionIds?: string[]
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

interface DashboardData {
  volunteer: Volunteer
  event: Event
  assignments: Assignment[]
  documents: Document[]
  oversightContacts: OversightContact[]
  activeCountSessions?: CountSession[]
  isIVSTeamMember?: boolean
}

interface VolunteerDashboardProps {
  initialEventId?: string
}

export default function VolunteerDashboard({ initialEventId }: VolunteerDashboardProps) {
  const router = useRouter()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      // Redirect to volunteer login, not admin login
      router.push('/volunteer/login')
    },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [showProfileVerification, setShowProfileVerification] = useState(false)
  const [profileData, setProfileData] = useState({ email: '', phone: '' })
  const [pinUpdateMessage, setPinUpdateMessage] = useState('')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editProfileData, setEditProfileData] = useState({ email: '', phone: '' })
  const [countValues, setCountValues] = useState<Map<string, string>>(new Map())
  const [countNotes, setCountNotes] = useState<Map<string, string>>(new Map())
  const [submittingCount, setSubmittingCount] = useState(false)
  const [countSuccess, setCountSuccess] = useState('')
  const [submittedCounts, setSubmittedCounts] = useState<Map<string, {count: number, notes?: string}>>(new Map())
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [availabilityRequests, setAvailabilityRequests] = useState<AvailabilityRequest[]>([])
  const [respondingToRequest, setRespondingToRequest] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'checkin'>('dashboard')
  const simulatedVolunteerIdFromQuery = typeof router.query.viewAsVolunteerId === 'string' ? router.query.viewAsVolunteerId : null

  useEffect(() => {
    // Detect mobile on mount and window resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Session is guaranteed to exist due to server-side check and useSession({ required: true })
    if (status === 'loading') {
      console.log('⏳ Waiting for session to load...')
      return
    }
    
    if (session) {
      console.log('✅ Session ready, loading dashboard for volunteer:', session.user.id)
      loadDashboard()
    }
  }, [status, session, simulatedVolunteerIdFromQuery])

  const fetchAvailabilityRequests = async (eventId: string) => {
    try {
      const response = await fetch(`/api/volunteer/availability?eventId=${eventId}`)
      const data = await response.json()
      
      if (data.success) {
        setAvailabilityRequests(data.requests)
      }
    } catch (error) {
      console.error('Failed to fetch availability requests:', error)
    }
  }

  const handleAvailabilityResponse = async (requestId: string, status: string, notes?: string) => {
    try {
      setRespondingToRequest(requestId)
      
      const response = await fetch(`/api/volunteer/availability?eventId=${selectedEventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status, notes })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh availability requests
        if (selectedEventId) {
          await fetchAvailabilityRequests(selectedEventId)
        }
      } else {
        alert('Failed to submit response')
      }
    } catch (error) {
      console.error('Failed to submit availability response:', error)
      alert('Failed to submit response')
    } finally {
      setRespondingToRequest(null)
    }
  }

  const loadDashboard = async () => {
    try {
      if (!session?.user?.id) {
        console.error('❌ loadDashboard called without session.user.id')
        setError('Session not ready. Please wait...')
        setLoading(false)
        return
      }
      
      const simulatedVolunteerId = session.user.role === 'ADMIN'
        ? (simulatedVolunteerIdFromQuery || getViewAsVolunteerId())
        : null
      const effectiveVolunteerId = simulatedVolunteerId || session.user.id

      console.log('📊 Loading dashboard for volunteer:', effectiveVolunteerId)
      
      // Get selected event from query param or localStorage fallback
      const eventId = router.query.eventId as string || localStorage.getItem('selectedEventId')
      
      if (!eventId) {
        console.log('📊 No eventId found, redirecting to select-event')
        // Need to select an event first
        router.push('/volunteer/select-event')
        return
      }
      
      console.log('📊 Using eventId:', eventId)
      setSelectedEventId(eventId)

      // Fetch dashboard data
      console.log('📊 Fetching dashboard data from API...')
      const response = await fetch(
        `/api/volunteer/dashboard?volunteerId=${effectiveVolunteerId}&eventId=${eventId}`,
        { headers: { ...getViewAsHeaders() } }
      )
      
      if (!response.ok) {
        console.error('❌ API response not OK:', response.status, response.statusText)
        throw new Error(`API error: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('📊 API response:', result)

      if (result.success) {
        console.log('✅ Dashboard data loaded successfully')
        setDashboardData(result.data)
        setVolunteer(result.data.volunteer)
        
        // Fetch availability requests for this event
        await fetchAvailabilityRequests(eventId)
        
        // Check if profile verification is needed
        // Show verification if: 1) email/phone missing OR 2) profileVerificationRequired flag is set
        const needsVerification = !result.data.volunteer.email || 
                                  !result.data.volunteer.phone || 
                                  result.data.volunteer.profileVerificationRequired
        
        if (needsVerification) {
          // Pre-fill with existing data
          setProfileData({
            email: result.data.volunteer.email || '',
            phone: result.data.volunteer.phone || ''
          })
          setShowProfileVerification(true)
        }
      } else {
        setError(result.error || 'Failed to load dashboard')
      }
    } catch (error) {
      console.error('Dashboard loading error:', error)
      setError('An error occurred while loading your dashboard')
    } finally {
      setLoading(false)
    }
  }
  
  // Format phone number as user types
  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value)
    setProfileData({ ...profileData, phone: formatted })
  }

  const handleProfileVerification = async () => {
    try {
      // Validate phone number (must be 10 digits)
      const cleaned = profileData.phone.replace(/\D/g, '')
      if (cleaned.length !== 10) {
        alert('Please enter a valid 10-digit phone number')
        return
      }

      // Update profile via API
      const response = await fetch(`/api/volunteer/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: volunteer?.id,
          email: profileData.email,
          phone: profileData.phone
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.newPin) {
        // Show PIN update message
        setPinUpdateMessage(`Your PIN has been updated to the last 4 digits of your phone: ${result.newPin}`)
        setShowProfileVerification(false)
        
        // Reload dashboard to get updated data
        setTimeout(() => {
          loadDashboard()
          // Clear message after showing dashboard
          setTimeout(() => setPinUpdateMessage(''), 8000)
        }, 100)
      } else if (response.ok) {
        setShowProfileVerification(false)
        loadDashboard()
      }
    } catch (error) {
      console.error('Profile update failed:', error)
    }
  }

  const handleEditProfile = () => {
    setEditProfileData({
      email: dashboardData?.volunteer.email || '',
      phone: dashboardData?.volunteer.phone || ''
    })
    setIsEditingProfile(true)
  }

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`/api/volunteer/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: volunteer?.id,
          email: editProfileData.email,
          phone: editProfileData.phone
        })
      })
      
      if (response.ok) {
        setIsEditingProfile(false)
        // Reload dashboard to get updated data
        loadDashboard()
      } else {
        alert('Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update failed:', error)
      alert('Failed to update profile')
    }
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setEditProfileData({ email: '', phone: '' })
  }

  const handleLogout = async () => {
    // Clear localStorage
    localStorage.removeItem('volunteerSession')
    localStorage.removeItem('selectedEventId')
    localStorage.removeItem('profileVerified')
    
    // CRITICAL: Sign out from NextAuth to clear the session cookie
    await signOut({ redirect: false })
    
    // Redirect to volunteer login
    router.push('/volunteer/login')
  }

  const handleSwitchEvent = () => {
    router.push('/volunteer/select-event')
  }

  const handleSubmitCount = async (sessionId: string) => {
    const countValue = countValues.get(sessionId) || ''
    const sessionMeta = dashboardData?.activeCountSessions?.find((s) => s.id === sessionId)
    const targetPositionId = sessionMeta?.positionIds?.[0] || dashboardData?.assignments?.[0]?.positionId
    if (!countValue || !targetPositionId) {
      return
    }

    setSubmittingCount(true)
    setCountSuccess('')

    try {
      const notes = countNotes.get(sessionId) || ''
      
      const response = await fetch(`/api/events/${selectedEventId}/count-sessions/${sessionId}/counts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId: targetPositionId,
          attendeeCount: parseInt(countValue),
          notes: notes || undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        setCountSuccess('Count submitted successfully!')
        setSubmittedCounts(prev => new Map(prev).set(sessionId, {
          count: parseInt(countValue),
          notes: notes || undefined
        }))
        setTimeout(() => setCountSuccess(''), 3000)
      } else {
        alert(result.error || 'Failed to submit count')
      }
    } catch (error) {
      console.error('Count submission error:', error)
      alert('An error occurred while submitting the count')
    } finally {
      setSubmittingCount(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      // Use date-fns for consistent SSR/client formatting
      return format(parseISO(dateString), 'MMM d, yyyy')
    } catch {
      return 'Invalid date'
    }
  }

  const formatTime = (timeString: string) => {
    // If the time string already includes AM/PM, return it as-is
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString
    }
    
    // Otherwise, try to parse it as a 24-hour format
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      // If parsing fails, return the original string
      return timeString
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('video')) return '🎥'
    if (fileType.includes('audio')) return '🎵'
    if (fileType.includes('text')) return '📝'
    return '📎'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    if (!dashboardData) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">No dashboard data available</p>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin?role=volunteer' })}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  // Mobile View
  if (isMobile) {
    return (
      <>
        <Head>
          <title>My Dashboard - {dashboardData.event.name}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        <MobileVolunteerDashboard
          volunteer={dashboardData.volunteer}
          event={dashboardData.event}
          assignments={dashboardData.assignments}
          oversightContacts={dashboardData.oversightContacts}
          activeCountSessions={dashboardData.activeCountSessions}
          documents={dashboardData.documents}
          availabilityRequests={availabilityRequests}
          onAvailabilityResponse={handleAvailabilityResponse}
          onRefresh={loadDashboard}
          onSignOut={() => signOut({ callbackUrl: '/volunteer/login' })}
        />
      </>
    )
  }

  // Desktop View
  return (
    <>
      <Head>
        <title>Volunteer Dashboard | TheoShift</title>
      </Head>

      {/* Profile Verification Modal */}
      {showProfileVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Information</h2>
              <p className="text-sm text-gray-600">
                Please confirm or update your contact information. This helps us keep you informed about your assignments.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                  maxLength={14}
                />
                <p className="text-xs text-gray-500 mt-1">Format: (XXX) XXX-XXXX</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Your PIN will be automatically updated to the last 4 digits of your phone number.
                </p>
              </div>

              <button
                onClick={handleProfileVerification}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Confirm Information
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">📋</span>
                <span className="ml-2 text-xl font-semibold text-gray-900">
                  TheoShift
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {volunteer?.firstName} {volunteer?.lastName}
                </span>
                <button
                  onClick={handleSwitchEvent}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Switch Event
                </button>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Announcements Banner */}
        {dashboardData?.event?.id && <AnnouncementBanner eventId={dashboardData.event.id} />}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* PIN Update Message */}
          {pinUpdateMessage && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {pinUpdateMessage}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Please use this PIN for your next login.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {dashboardData.volunteer.firstName}!
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              {dashboardData.event.name}
            </p>
            <p className="text-sm text-gray-500">
              {formatDate(dashboardData.event.startDate)} - {formatDate(dashboardData.event.endDate)}
            </p>
          </div>

          {/* Tab Navigation for IVS Team Members */}
          {dashboardData.isIVSTeamMember && (
            <div className="mb-6 border-b border-gray-200">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                    activeTab === 'dashboard'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('checkin')}
                  className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                    activeTab === 'checkin'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ✅ Early Check-In
                </button>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* My Assignments */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-xl mr-2">📋</span>
                    My Assignments
                  </h2>
                </div>
                <div className="p-6">
                  {!dashboardData.assignments || dashboardData.assignments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">📝</div>
                      <p className="text-gray-600">No assignments yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Check back later or contact your overseer
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.assignments?.map((assignment) => (
                        <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="w-full">
                              <h3 className="font-medium text-gray-900">{assignment.positionName}</h3>
                              {assignment.location && (
                                <p className="text-sm text-gray-600 mt-1">📍 {assignment.location}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>🕐 {assignment.startTime === 'All Day' ? 'All Day' : `${formatTime(assignment.startTime)}${assignment.endTime ? ` - ${formatTime(assignment.endTime)}` : ''}`}</span>
                              </div>
                              {assignment.instructions && (
                                <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                                  {assignment.instructions}
                                </p>
                              )}
                              
                              {/* Complete Schedule (FB-003) */}
                              {assignment.completeSchedule && assignment.completeSchedule.length > 1 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <p className="text-xs font-medium text-gray-700 mb-2">📅 Complete Position Schedule:</p>
                                  <div className="space-y-1">
                                    {assignment.completeSchedule.map((schedule, idx) => (
                                      <div 
                                        key={idx} 
                                        className={`text-xs p-2 rounded ${
                                          schedule.isCurrentUser 
                                            ? 'bg-blue-50 border border-blue-200 font-medium text-blue-900' 
                                            : 'bg-gray-50 text-gray-700'
                                        }`}
                                      >
                                        <span className="font-medium">{schedule.volunteerName}</span>
                                        {schedule.isCurrentUser && <span className="ml-1 text-blue-600">(You)</span>}
                                        <span className="mx-2">•</span>
                                        <span>
                                          {schedule.isAllDay ? 'All Day' : `${formatTime(schedule.startTime)}${schedule.endTime ? ` - ${formatTime(schedule.endTime)}` : ''}`}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {(assignment.overseer || assignment.keyman) && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <p className="text-xs text-gray-500 mb-1">Position Oversight:</p>
                                  <div className="flex flex-wrap gap-3 text-sm">
                                    {assignment.overseer && (
                                      <span className="text-blue-600">
                                        👤 Overseer: {assignment.overseer}
                                      </span>
                                    )}
                                    {assignment.keyman && (
                                      <span className="text-green-600">
                                        🔑 Keyman: {assignment.keyman}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Availability Requests */}
              {availabilityRequests.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg rounded-lg">
                  <div className="px-6 py-4 border-b border-blue-200 bg-white bg-opacity-60">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                      <span className="text-xl mr-2">📅</span>
                      Availability Requests
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Please respond to confirm your availability
                    </p>
                  </div>
                  <div className="p-6 space-y-4">
                    {availabilityRequests.map((request) => (
                      <div key={request.id} className="bg-white rounded-lg border border-blue-200 p-4">
                        <div className="mb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{request.event.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                📍 {request.event.location}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                📅 {format(parseISO(request.event.startDate), 'MMM d, yyyy')} - {format(parseISO(request.event.endDate), 'MMM d, yyyy')}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                Requested: {format(parseISO(request.requestedAt), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                            {request.status !== 'PENDING' && (
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                request.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                                request.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {request.status === 'AVAILABLE' ? '✅ Available' :
                                 request.status === 'PARTIAL' ? '⚡ Partial' :
                                 '❌ Not Available'}
                              </div>
                            )}
                          </div>
                          {request.respondedAt && (
                            <p className="text-xs text-gray-400 mt-2">
                              Responded: {format(parseISO(request.respondedAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          )}
                        </div>
                        
                        {request.status === 'PENDING' ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleAvailabilityResponse(request.id, 'AVAILABLE')}
                              disabled={respondingToRequest === request.id}
                              className="flex-1 min-w-[150px] bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ✅ Available
                            </button>
                            <button
                              onClick={() => handleAvailabilityResponse(request.id, 'PARTIAL')}
                              disabled={respondingToRequest === request.id}
                              className="flex-1 min-w-[150px] bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ⚡ Partial Availability
                            </button>
                            <button
                              onClick={() => handleAvailabilityResponse(request.id, 'NOT_AVAILABLE')}
                              disabled={respondingToRequest === request.id}
                              className="flex-1 min-w-[150px] bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ❌ Not Available
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">Want to change your response?</p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleAvailabilityResponse(request.id, 'AVAILABLE')}
                                disabled={respondingToRequest === request.id}
                                className="flex-1 min-w-[150px] bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                ✅ Available
                              </button>
                              <button
                                onClick={() => handleAvailabilityResponse(request.id, 'PARTIAL')}
                                disabled={respondingToRequest === request.id}
                                className="flex-1 min-w-[150px] bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                ⚡ Partial Availability
                              </button>
                              <button
                                onClick={() => handleAvailabilityResponse(request.id, 'NOT_AVAILABLE')}
                                disabled={respondingToRequest === request.id}
                                className="flex-1 min-w-[150px] bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                ❌ Not Available
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {respondingToRequest === request.id && (
                          <div className="mt-3 text-center">
                            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            <p className="text-sm text-gray-600 mt-1">Submitting response...</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Count Entry Widget */}
              {dashboardData.activeCountSessions && dashboardData.activeCountSessions.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 shadow-lg rounded-lg">
                  <div className="px-6 py-4 border-b border-green-200 bg-white bg-opacity-60">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                      <span className="text-xl mr-2">📊</span>
                      Submit Attendance Count
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Visible only for sessions/stations explicitly assigned to you.</p>
                  </div>
                  <div className="p-6">
                    {countSuccess && (
                      <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        ✓ {countSuccess}
                      </div>
                    )}
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <strong>Note:</strong> Only submit a count if requested by your overseer or keyman. You may enter a combined count for multiple stations in your area using the notes field.
                          </p>
                        </div>
                      </div>
                    </div>

                    {dashboardData.activeCountSessions.map((session) => {
                      const hasSubmitted = submittedCounts.has(session.id)
                      const isEditing = editingSession === session.id
                      const submittedData = submittedCounts.get(session.id)
                      
                      return (
                        <div key={session.id} className="bg-white rounded-lg p-4 shadow-sm mb-4">
                          <div className="mb-3">
                            <h3 className="font-medium text-gray-900">{session.sessionName}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(session.countTime).toLocaleString()}
                            </p>
                          </div>
                          
                          {hasSubmitted && !isEditing ? (
                            // Show submitted count with edit button
                            <div className="space-y-3">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    ✓ Submitted
                                  </span>
                                  <button
                                    onClick={() => setEditingSession(session.id)}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                  >
                                    Edit
                                  </button>
                                </div>
                                <div className="mt-2">
                                  <p className="text-lg font-bold text-gray-900">Count: {submittedData?.count}</p>
                                  {submittedData?.notes && (
                                    <p className="text-sm text-gray-600 mt-1">Notes: {submittedData.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Show input form
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Attendance Count *
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={countValues.get(session.id) || ''}
                                  onChange={(e) => setCountValues(prev => new Map(prev).set(session.id, e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter count"
                                  disabled={submittingCount}
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Notes (optional)
                                </label>
                                <textarea
                                  value={countNotes.get(session.id) || ''}
                                  onChange={(e) => setCountNotes(prev => new Map(prev).set(session.id, e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="e.g., Combined count for Stations 2 and 3"
                                  rows={2}
                                  disabled={submittingCount}
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSubmitCount(session.id)}
                                  disabled={submittingCount || !countValues.get(session.id)}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {submittingCount ? 'Submitting...' : hasSubmitted ? 'Update Count' : 'Submit Count'}
                                </button>
                                {isEditing && (
                                  <button
                                    onClick={() => {
                                      setEditingSession(null)
                                      setCountValues(prev => new Map(prev).set(session.id, submittedData?.count.toString() || ''))
                                      setCountNotes(prev => new Map(prev).set(session.id, submittedData?.notes || ''))
                                    }}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-xl mr-2">📄</span>
                    My Documents
                  </h2>
                </div>
                <div className="p-6">
                  {!dashboardData.documents || dashboardData.documents.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">📄</div>
                      <p className="text-gray-600">No documents available</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Documents will appear here when published by your overseer
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.documents?.map((document) => (
                        <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="text-2xl">{getFileIcon(document.fileType)}</div>
                              <div>
                                <h3 className="font-medium text-gray-900">{document.title}</h3>
                                {document.description && (
                                  <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span>📁 {document.fileName}</span>
                                  <span>📏 {formatFileSize(document.fileSize)}</span>
                                  <span>📅 {formatDate(document.publishedAt)}</span>
                                </div>
                              </div>
                            </div>
                            <a
                              href={document.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                            >
                              👁️ View
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Personal Info */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="text-xl mr-2">👤</span>
                    My Information
                  </h3>
                  {!isEditingProfile && (
                    <button
                      onClick={handleEditProfile}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-500 text-sm">Name:</span>
                      <p className="font-medium text-gray-400">{dashboardData.volunteer.firstName} {dashboardData.volunteer.lastName} (cannot be changed)</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Congregation:</span>
                      <p className="font-medium text-gray-400">{dashboardData.volunteer.congregation} (cannot be changed)</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Email:</label>
                      <input
                        type="email"
                        value={editProfileData.email}
                        onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Phone:</label>
                      <input
                        type="tel"
                        value={editProfileData.phone}
                        onChange={(e) => setEditProfileData({ ...editProfileData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={handleSaveProfile}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <p className="font-medium">{dashboardData.volunteer.firstName} {dashboardData.volunteer.lastName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Congregation:</span>
                      <p className="font-medium">{dashboardData.volunteer.congregation}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">{dashboardData.volunteer.email || <span className="text-gray-400">Not provided</span>}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium">{dashboardData.volunteer.phone || <span className="text-gray-400">Not provided</span>}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Oversight Contacts */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <span className="text-xl mr-2">👥</span>
                  My Oversight
                </h3>
                {!dashboardData.oversightContacts || dashboardData.oversightContacts.length === 0 ? (
                  <p className="text-sm text-gray-600">No oversight contacts assigned</p>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.oversightContacts?.map((contact, index) => (
                      <div key={index} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          <p className="text-gray-600">{contact.role}</p>
                          {contact.phone && (
                            <p className="text-gray-600">📞 {contact.phone}</p>
                          )}
                          {contact.email && (
                            <p className="text-gray-600">📧 {contact.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Event Information</h3>
                <div className="text-xs text-blue-700 space-y-1">
                  <p><strong>Type:</strong> {dashboardData.event.eventType}</p>
                  <p><strong>Status:</strong> {dashboardData.event.status}</p>
                  <p><strong>Dates:</strong> {formatDate(dashboardData.event.startDate)} - {formatDate(dashboardData.event.endDate)}</p>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Early Check-In Tab */}
          {activeTab === 'checkin' && dashboardData.isIVSTeamMember && (
            <div className="bg-white shadow rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 300px)' }}>
              <EarlyCheckinPanel 
                eventId={dashboardData.event.id}
                eventName={dashboardData.event.name}
                showHeader={false}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps(context: any) {
  const { getServerSession } = await import('next-auth')
  const { authOptions } = await import('../api/auth/[...nextauth]')
  
  const session = await getServerSession(context.req, context.res, authOptions)
  
  const isVolunteer = session?.user?.role === 'VOLUNTEER'
  const isAdminViewAs =
    session?.user?.role === 'ADMIN'
    && typeof context.query.viewAsVolunteerId === 'string'
    && context.query.viewAsVolunteerId.length > 0

  // Allow volunteers normally, and ADMIN only when previewing a selected volunteer.
  if (!session || (!isVolunteer && !isAdminViewAs)) {
    return {
      redirect: {
        destination: '/volunteer/login',
        permanent: false,
      },
    }
  }
  
  return {
    props: {
      initialEventId: context.query.eventId || null
    }
  }
}
