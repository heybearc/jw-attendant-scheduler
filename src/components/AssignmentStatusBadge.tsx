import React from 'react'

/**
 * Phase 4C: Assignment Status Badge Component
 * Visual indicator for assignment confirmation status
 */

interface AssignmentStatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export default function AssignmentStatusBadge({ 
  status, 
  size = 'md',
  showIcon = true 
}: AssignmentStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return {
          label: 'Confirmed',
          icon: '✅',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300'
        }
      case 'DECLINED':
        return {
          label: 'Declined',
          icon: '❌',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-300'
        }
      case 'TENTATIVE':
        return {
          label: 'Tentative',
          icon: '⏳',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300'
        }
      case 'PENDING':
        return {
          label: 'Pending',
          icon: '⏱️',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300'
        }
      case 'COMPLETED':
        return {
          label: 'Completed',
          icon: '🎉',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300'
        }
      case 'NO_SHOW':
        return {
          label: 'No Show',
          icon: '⚠️',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-300'
        }
      default:
        return {
          label: status || 'Unknown',
          icon: '❓',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300'
        }
    }
  }

  const config = getStatusConfig(status)

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  )
}

// Export availability status badge variant
export function AvailabilityStatusBadge({ 
  status, 
  size = 'md',
  showIcon = true 
}: AssignmentStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
        return {
          label: 'Available',
          icon: '✅',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300'
        }
      case 'NOT_AVAILABLE':
        return {
          label: 'Not Available',
          icon: '❌',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-300'
        }
      case 'PARTIAL':
        return {
          label: 'Partial',
          icon: '⚡',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300'
        }
      case 'PENDING':
        return {
          label: 'Pending Response',
          icon: '⏱️',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300'
        }
      default:
        return {
          label: 'Unknown',
          icon: '❓',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300'
        }
    }
  }

  const config = getStatusConfig(status)

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  )
}
