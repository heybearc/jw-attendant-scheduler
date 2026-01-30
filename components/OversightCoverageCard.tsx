import { useEffect, useState } from 'react'
import Link from 'next/link'

interface OversightCoverageCardProps {
  eventId: string
}

interface OversightStatistics {
  totalPositions: number
  positionsWithOversight: number
  positionsWithoutOversight: number
  coveragePercentage: number
  overseerCount: number
  assistantOverseerCount: number
  keymanCount: number
}

export default function OversightCoverageCard({ eventId }: OversightCoverageCardProps) {
  const [statistics, setStatistics] = useState<OversightStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOversightStats = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events/${eventId}/oversight`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch oversight data')
        }

        const data = await response.json()
        setStatistics(data.statistics)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchOversightStats()
    }
  }, [eventId])

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error || !statistics) {
    return null // Silently fail - oversight is optional
  }

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCoverageBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-50 border-green-200'
    if (percentage >= 70) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <div className={`shadow-lg rounded-xl p-6 border ${getCoverageBgColor(statistics.coveragePercentage)}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-xl">🔍</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Oversight Coverage</h3>
        </div>
      </div>

      {/* Coverage Percentage */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Coverage</span>
          <span className={`text-3xl font-bold ${getCoverageColor(statistics.coveragePercentage)}`}>
            {statistics.coveragePercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              statistics.coveragePercentage >= 90
                ? 'bg-green-500'
                : statistics.coveragePercentage >= 70
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${statistics.coveragePercentage}%` }}
          ></div>
        </div>
        <p className="mt-2 text-xs text-gray-600">
          {statistics.positionsWithOversight} of {statistics.totalPositions} positions
        </p>
      </div>

      {/* Oversight Counts */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-white rounded-lg">
          <div className="text-lg font-bold text-blue-600">{statistics.overseerCount}</div>
          <div className="text-xs text-gray-600">Overseers</div>
        </div>
        <div className="text-center p-2 bg-white rounded-lg">
          <div className="text-lg font-bold text-green-600">{statistics.assistantOverseerCount}</div>
          <div className="text-xs text-gray-600">Assistants</div>
        </div>
        <div className="text-center p-2 bg-white rounded-lg">
          <div className="text-lg font-bold text-yellow-600">{statistics.keymanCount}</div>
          <div className="text-xs text-gray-600">Keymen</div>
        </div>
      </div>

      {/* Coverage Gaps Warning */}
      {statistics.positionsWithoutOversight > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
          <p className="text-sm font-medium text-yellow-800">
            ⚠️ {statistics.positionsWithoutOversight} position{statistics.positionsWithoutOversight !== 1 ? 's' : ''} without oversight
          </p>
        </div>
      )}

      {/* View Details Link */}
      <Link
        href={`/events/${eventId}/oversight`}
        className="block w-full text-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        View Details →
      </Link>
    </div>
  )
}
