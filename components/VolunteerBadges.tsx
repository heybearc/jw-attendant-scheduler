import React from 'react'

interface VolunteerBadgesProps {
  isActive: boolean
  profileVerificationRequired?: boolean
  profileVerifiedAt?: string | null
  availabilityStatus?: 'AVAILABLE' | 'NOT_AVAILABLE' | 'PARTIAL' | 'PENDING' | null
  availabilityNotes?: string | null
  formsOfService: any
  onAvailabilityClick?: () => void
}

export function VolunteerBadges({
  isActive,
  profileVerificationRequired,
  profileVerifiedAt,
  availabilityStatus,
  availabilityNotes,
  formsOfService,
  onAvailabilityClick
}: VolunteerBadgesProps) {
  
  const getStatusBadge = () => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          🟢 Active
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        🔴 Inactive
      </span>
    )
  }

  const getVerificationBadge = () => {
    // Show verified badge if verified
    if (profileVerifiedAt) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          ✅ Verified
        </span>
      )
    }
    
    // Show needs verification badge if required but not verified
    if (profileVerificationRequired) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          ⚠️ Needs Verification
        </span>
      )
    }
    
    // Don't show badge if not required and not verified
    return null
  }

  const getAvailabilityBadge = () => {
    // Always show a clickable badge - default to placeholder if no status
    if (!availabilityStatus) {
      return (
        <span 
          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200 border border-dashed border-gray-400"
          onClick={onAvailabilityClick}
          title="Click to set availability status"
        >
          📋 Set Status
        </span>
      )
    }

    const badges = {
      AVAILABLE: (
        <span 
          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 cursor-pointer hover:bg-green-200"
          onClick={onAvailabilityClick}
          title="Click to change availability status"
        >
          ✅ Available
        </span>
      ),
      NOT_AVAILABLE: (
        <span 
          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 cursor-pointer hover:bg-red-200"
          onClick={onAvailabilityClick}
          title="Click to change availability status"
        >
          ❌ Not Available
        </span>
      ),
      PARTIAL: (
        <span 
          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
          onClick={onAvailabilityClick}
          title={availabilityNotes ? `Partial: ${availabilityNotes}` : 'Click to view details'}
        >
          💬 Partial
        </span>
      ),
      PENDING: (
        <span 
          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 cursor-pointer hover:bg-gray-200"
          onClick={onAvailabilityClick}
          title="Click to change availability status"
        >
          ⏳ Pending
        </span>
      )
    }

    return badges[availabilityStatus]
  }

  const getFormsOfServiceBadges = () => {
    const services = Array.isArray(formsOfService) 
      ? formsOfService 
      : (formsOfService || '').toString().split(', ').filter((s: string) => s.trim())

    if (services.length === 0) return null

    return services.map((service: string, index: number) => {
      const colorMap: Record<string, string> = {
        'Overseer': 'bg-purple-100 text-purple-800',
        'Keyman': 'bg-blue-100 text-blue-800',
        'Elder': 'bg-yellow-100 text-yellow-800',
        'Ministerial Servant': 'bg-green-100 text-green-800',
        'Exemplary': 'bg-teal-100 text-teal-800',
        'Regular Pioneer': 'bg-pink-100 text-pink-800'
      }

      const colorClass = colorMap[service] || 'bg-gray-100 text-gray-800'

      return (
        <span 
          key={index}
          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}
        >
          {service}
        </span>
      )
    })
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {getStatusBadge()}
      {getVerificationBadge()}
      {getAvailabilityBadge()}
      {getFormsOfServiceBadges()}
    </div>
  )
}
