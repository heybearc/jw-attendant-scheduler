import React from 'react'

interface Volunteer {
  id: string
  firstName: string
  lastName: string
  formsOfService?: string | string[]
}

interface FilterControlsProps {
  showInactive: boolean
  onToggleInactive: (show: boolean) => void
  selectedOverseer: string
  onOverseerChange: (overseerId: string) => void
  attendants: Attendant[]
  viewMode: 'list' | 'grid'
  onViewModeChange: (mode: 'list' | 'grid') => void
}

export default function FilterControls({
  showInactive,
  onToggleInactive,
  selectedOverseer,
  onOverseerChange,
  attendants,
  viewMode,
  onViewModeChange
}: FilterControlsProps) {
  const overseers = attendants?.filter(att => {
    const formsOfService = Array.isArray(att.formsOfService) 
      ? att.formsOfService 
      : (typeof att.formsOfService === 'string' ? att.formsOfService.split(',').map(s => s.trim()) : [])
    return formsOfService.some(form => form.toLowerCase() === 'overseer')
  }) || []

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      {/* View Mode Toggle */}
      <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
        <button
          onClick={() => onViewModeChange('list')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          📋 List
        </button>
        <button
          onClick={() => onViewModeChange('grid')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            viewMode === 'grid'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          🎯 Grid
        </button>
      </div>

      {/* Show Inactive Toggle */}
      <label className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(e) => onToggleInactive(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <span className="text-sm font-medium text-gray-700">Show Inactive</span>
      </label>

      {/* Overseer Filter */}
      <div className="flex items-center space-x-2">
        <label htmlFor="overseer-filter" className="text-sm font-medium text-gray-700">
          Filter by Overseer:
        </label>
        <select
          id="overseer-filter"
          value={selectedOverseer}
          onChange={(e) => onOverseerChange(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Overseers</option>
          {overseers.map(overseer => (
            <option key={overseer.id} value={overseer.id}>
              {overseer.firstName} {overseer.lastName}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
