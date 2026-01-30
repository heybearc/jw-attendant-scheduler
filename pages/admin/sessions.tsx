import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

interface SessionData {
  id: string
  userId?: string
  userName: string
  userEmail: string
  userRole: string
  isUserActive: boolean
  sessionToken?: string
  expires?: string
  isExpired?: boolean
  daysUntilExpiry?: number
  createdAt?: string
  lastActivityAt?: string
  loginAt?: string
  daysSinceCreated?: number
  minutesSinceActivity?: number
  isOnline?: boolean
  ipAddress?: string
  userAgent?: string
}

interface SessionsResponse {
  sessions?: SessionData[]
  users?: SessionData[]
  total: number
  timestamp: string
}

export default function SessionsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expiredCount, setExpiredCount] = useState<number>(0)
  const [cleaning, setCleaning] = useState(false)
  const [cleanupMessage, setCleanupMessage] = useState('')
  const [cleaningUsers, setCleaningUsers] = useState(false)
  const [userCleanupMessage, setUserCleanupMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const fetchSessions = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/sessions')
      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied - Admin privileges required')
          return
        }
        throw new Error('Failed to fetch sessions')
      }
      const data: SessionsResponse = await response.json()
      setSessions(data.sessions || [])
      setLastUpdated(new Date(data.timestamp).toLocaleString())
      
      // Fetch expired session count
      const cleanupResponse = await fetch('/api/admin/sessions/cleanup')
      if (cleanupResponse.ok) {
        const cleanupData = await cleanupResponse.json()
        setExpiredCount(cleanupData.expiredSessions || 0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const cleanupExpiredSessions = async () => {
    setCleaning(true)
    setCleanupMessage('')
    try {
      const response = await fetch('/api/admin/sessions/cleanup', {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error('Failed to cleanup sessions')
      }
      const data = await response.json()
      setCleanupMessage(`✅ ${data.message}`)
      // Refresh sessions list
      await fetchSessions()
    } catch (err) {
      setCleanupMessage(`❌ ${err instanceof Error ? err.message : 'Failed to cleanup sessions'}`)
    } finally {
      setCleaning(false)
    }
  }

  const cleanupExcessiveSessions = async () => {
    setCleaningUsers(true)
    setUserCleanupMessage('')
    try {
      const response = await fetch('/api/admin/sessions/cleanup-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxSessionsPerUser: 5 })
      })
      if (!response.ok) {
        throw new Error('Failed to cleanup excessive sessions')
      }
      const data = await response.json()
      setUserCleanupMessage(`✅ ${data.message} (${data.usersAffected} users affected)`)
      // Refresh sessions list
      await fetchSessions()
    } catch (err) {
      setUserCleanupMessage(`❌ ${err instanceof Error ? err.message : 'Failed to cleanup sessions'}`)
    } finally {
      setCleaningUsers(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSessions()
    }
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sessions...</p>
        </div>
      </div>
    )
  }

  if (error && error.includes('Access denied')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl">🔒</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Access Denied</h1>
          <p className="text-gray-600 mt-2">{error}</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Filter sessions
  const filteredSessions = sessions.filter(s => {
    const matchesRole = filterRole === 'all' || s.userRole === filterRole
    const matchesSearch = searchTerm === '' || 
      s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesSearch
  })

  // Get unique roles for filter
  const roles = Array.from(new Set(sessions.map(s => s.userRole)))

  // Group by role for stats
  const statsByRole = roles.map(role => ({
    role,
    count: sessions.filter(s => s.userRole === role).length
  }))

  return (
    <>
      <Head>
        <title>Session Management | Theocratic Shift Scheduler</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
                <p className="text-gray-600 mt-2">
                  Monitor and manage active user sessions
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={cleanupExcessiveSessions}
                  disabled={cleaningUsers}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  title="Keep only 5 most recent sessions per user"
                >
                  {cleaningUsers ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Cleaning...</span>
                    </>
                  ) : (
                    <>
                      <span>🧹</span>
                      <span>Cleanup Excessive</span>
                    </>
                  )}
                </button>
                <button
                  onClick={fetchSessions}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>🔄</span>
                  <span>Refresh</span>
                </button>
                <Link
                  href="/admin"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-2">
                Last updated: {lastUpdated}
              </p>
            )}
            {userCleanupMessage && (
              <p className="text-sm mt-2">{userCleanupMessage}</p>
            )}
          </div>

          {/* Cleanup Warning */}
          {expiredCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">⚠️</span>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Expired Sessions Detected</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      {expiredCount} session{expiredCount !== 1 ? 's' : ''} expired (inactive for 30+ days). Click cleanup to remove.
                    </p>
                  </div>
                </div>
                <button
                  onClick={cleanupExpiredSessions}
                  disabled={cleaning}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {cleaning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Cleaning...</span>
                    </>
                  ) : (
                    <>
                      <span>🧹</span>
                      <span>Cleanup Expired</span>
                    </>
                  )}
                </button>
              </div>
              {cleanupMessage && (
                <p className="text-sm mt-2 ml-11">{cleanupMessage}</p>
              )}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Active Sessions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{sessions.length}</p>
                  {expiredCount > 0 && (
                    <p className="text-xs text-yellow-600 mt-1">{expiredCount} expired</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>

            {statsByRole.map(stat => (
              <div key={stat.role} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.role}s</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.count}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">
                      {stat.role === 'ADMIN' ? '👑' : stat.role === 'OVERSEER' ? '📋' : '👤'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by name or email
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by role
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role === 'KEYMAN' ? 'KEYMEN' : role}S</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Server
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session Token
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Left
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        {searchTerm || filterRole !== 'all' ? 'No sessions match your filters' : 'No active sessions'}
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{session.userName}</div>
                            <div className="text-sm text-gray-500">{session.userEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            session.userRole === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                            session.userRole === 'OVERSEER' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {session.userRole}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              session.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {session.isOnline ? '🟢 Online' : '⚪ Idle'}
                            </span>
                            {session.minutesSinceActivity !== undefined && (
                              <span className="text-xs text-gray-500 mt-1">
                                {session.minutesSinceActivity < 1 ? 'Just now' : 
                                 session.minutesSinceActivity < 60 ? `${session.minutesSinceActivity}m ago` :
                                 `${Math.floor(session.minutesSinceActivity / 60)}h ago`}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            (session as any).serverNode === 'BLUE' ? 'bg-blue-100 text-blue-800' :
                            (session as any).serverNode === 'GREEN' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {(session as any).serverNode || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {session.sessionToken}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.expires ? new Date(session.expires).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            (session.daysUntilExpiry || 0) < 7 ? 'text-red-600' :
                            (session.daysUntilExpiry || 0) < 14 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {session.daysUntilExpiry || 0} days
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">ℹ️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">About Sessions</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Sessions are automatically created when users log in</li>
                    <li>Sessions expire after 30 days of inactivity</li>
                    <li>Users can have multiple active sessions (different devices/browsers)</li>
                    <li>Sessions are stored in the database for tracking and management</li>
                    <li>Expired sessions are automatically cleaned up by the system</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
