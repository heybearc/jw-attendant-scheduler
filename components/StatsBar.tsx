import React from 'react'

interface Stats {
  totalPositions: number
  activePositions: number
  totalShifts: number
  totalAssignments: number
  unassignedShifts: number
}

interface StatsBarProps {
  stats: Stats
}

export default function StatsBar({ stats }: StatsBarProps) {
  const completionRate = stats.totalShifts > 0 
    ? Math.round(((stats.totalShifts - stats.unassignedShifts) / stats.totalShifts) * 100) 
    : 0

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-100">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalPositions}</div>
          <div className="text-xs text-gray-600">Total Positions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.activePositions}</div>
          <div className="text-xs text-gray-600">Active</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.totalShifts}</div>
          <div className="text-xs text-gray-600">Total Shifts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{stats.totalAssignments}</div>
          <div className="text-xs text-gray-600">Assignments</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{completionRate}%</div>
          <div className="text-xs text-gray-600">Completion</div>
        </div>
      </div>
    </div>
  )
}
