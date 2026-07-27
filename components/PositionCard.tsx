import React from 'react'
import {
  countShiftAssignments,
  getPositionSlotFillRatio,
  getShiftVolunteersNeeded
} from '../lib/shiftCapacity'
import { sortShiftsByTime } from '../lib/shiftSort'

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  isAllDay: boolean
  volunteersNeeded?: number
}

interface Assignment {
  id: string
  role: 'ATTENDANT' | 'VOLUNTEER' | 'OVERSEER' | 'KEYMAN'
  shift?: { id: string }
  attendant?: {
    id: string
    firstName: string
    lastName: string
  }
}

interface Position {
  id: string
  positionNumber: number
  name: string
  area?: string
  description?: string
  isActive: boolean
  shifts?: Shift[]
  assignments?: Assignment[]
  positionOversight?: any[]
}

interface PositionCardProps {
  position: Position
  isSelected: boolean
  canManageContent: boolean
  onToggleSelection: (positionId: string, checked: boolean) => void
  onDeleteShift: (positionId: string, shiftId: string, shiftName: string) => void
  onRemoveAssignment: (assignmentId: string) => void
  onAssignVolunteer: (position: Position, shift: Shift) => void
  onEdit: (position: Position) => void
  onDelete: (positionId: string) => void
  onActivate: (positionId: string) => void
  onDeactivate: (positionId: string) => void
  onAddShift: (position: Position) => void
  onAssignOversight: (position: Position) => void
  formatTime12Hour: (time: string) => string
}

export default function PositionCard({
  position,
  isSelected,
  canManageContent,
  onToggleSelection,
  onDeleteShift,
  onRemoveAssignment,
  onAssignVolunteer,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onAddShift,
  onAssignOversight,
  formatTime12Hour
}: PositionCardProps) {
  // Slot-based completion (respects volunteersNeeded)
  const { filled: assignedShifts, needed: totalShifts, percentage: completionPercentage } =
    getPositionSlotFillRatio(position.shifts, position.assignments)

  return (
    <div className={`group relative rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
      position.isActive 
        ? 'bg-white border border-gray-200 hover:border-blue-300' 
        : 'bg-gray-50 border-2 border-dashed border-gray-300'
    } ${completionPercentage === 100 ? 'ring-2 ring-green-200' : ''}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            {canManageContent && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onToggleSelection(position.id, e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            )}
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`text-lg font-semibold mb-0 ${
                  position.isActive ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {position.name}
                </h3>
                {!position.isActive && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </div>
              {position.area && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {position.area}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              position.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {position.isActive ? 'Active' : 'Inactive'}
            </span>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              completionPercentage === 100 
                ? 'bg-green-100 text-green-800' 
                : completionPercentage > 0 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600'
            }`}>
              <span className="text-xs">
                {completionPercentage === 100 ? '✅' : completionPercentage > 0 ? '⏳' : '⭕'}
              </span>
              <span>{completionPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Assignment Progress</span>
            <span>{assignedShifts}/{totalShifts} shifts filled</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                completionPercentage === 100 
                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                  : completionPercentage > 0 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                    : 'bg-gray-300'
              }`}
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        {position.description && (
          <p className="text-sm text-gray-600 mb-3">{position.description}</p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>Position #{position.positionNumber}</span>
          <span>{position.shifts?.length || 0} shifts • {position.assignments?.filter(a => a.role === 'ATTENDANT').length || 0} attendants</span>
        </div>

        {/* Shifts */}
        {position.shifts && position.shifts.length > 0 ? (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">🕐 Shift Assignments</p>
            <div className="space-y-2">
              {sortShiftsByTime(position.shifts).map(shift => {
                const shiftSpecificAssignments = position.assignments?.filter(
                  assignment => assignment.shift?.id === shift.id
                ) || []
                
                const attendantAssignments = shiftSpecificAssignments.filter(
                  assignment => assignment.role === 'ATTENDANT' || assignment.role === 'VOLUNTEER'
                )
                const shiftLeadershipAssignments = shiftSpecificAssignments.filter(
                  assignment => assignment.role === 'OVERSEER' || assignment.role === 'KEYMAN'
                )
                const filledCount = countShiftAssignments(position.assignments, shift.id)
                const neededCount = getShiftVolunteersNeeded(shift)
                
                return (
                  <div key={shift.id} className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-xs font-medium text-gray-700">
                          {shift.name}
                        </span>
                        {!shift.isAllDay && (
                          <span className="text-xs text-gray-500">
                            {formatTime12Hour(shift.startTime || '')} - {formatTime12Hour(shift.endTime || '')}
                          </span>
                        )}
                        {shift.isAllDay && (
                          <span className="text-xs text-blue-600 bg-blue-100 px-1 rounded">
                            All Day
                          </span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          filledCount >= neededCount
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {filledCount}/{neededCount}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onDeleteShift(position.id, shift.id, shift.name)}
                          className="text-xs text-red-600 hover:text-red-800 hover:bg-red-100 rounded px-1 py-0.5 transition-colors"
                          title={`Delete ${shift.name} shift`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    {/* Leadership Assignments */}
                    {shiftLeadershipAssignments.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Oversight:</p>
                        <div className="space-y-1">
                          {shiftLeadershipAssignments.map(assignment => {
                            const roleColor = assignment.role === 'OVERSEER' ? 'text-blue-700' : 'text-purple-700'
                            const bgColor = assignment.role === 'OVERSEER' ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100'
                            
                            return (
                              <div key={assignment.id} className={`flex items-center justify-between ${bgColor} border rounded px-2 py-1`}>
                                <div className="flex items-center">
                                  <span className={`text-xs font-medium ${roleColor}`}>
                                    {assignment.attendant?.firstName} {assignment.attendant?.lastName}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({assignment.role})
                                  </span>
                                </div>
                                {canManageContent && (
                                  <button
                                    onClick={() => onRemoveAssignment(assignment.id)}
                                    className="text-xs text-red-600 hover:text-red-800"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Volunteer Assignments */}
                    {attendantAssignments.length > 0 ? (
                      <div className="space-y-1">
                        {attendantAssignments.map(assignment => (
                          <div key={assignment.id} className="flex items-center justify-between bg-white border border-gray-200 rounded px-2 py-1">
                            <span className="text-xs text-gray-700">
                              {assignment.attendant?.firstName} {assignment.attendant?.lastName}
                            </span>
                            {canManageContent && (
                              <button
                                onClick={() => onRemoveAssignment(assignment.id)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic">No attendants assigned</div>
                    )}
                    
                    {canManageContent && (
                      <button
                        onClick={() => onAssignVolunteer(position, shift)}
                        className="mt-2 w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded py-1 transition-colors"
                      >
                        + Assign Volunteer
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mb-4 text-sm text-gray-400 italic">No shifts created yet</div>
        )}

        {/* Action Buttons */}
        {canManageContent && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => onEdit(position)}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md transition-colors"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => onAddShift(position)}
              className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-md transition-colors"
            >
              ➕ Add Shift
            </button>
            <button
              onClick={() => onAssignOversight(position)}
              className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-md transition-colors"
            >
              👤 Assign Oversight
            </button>
            {position.isActive ? (
              <button
                onClick={() => onDeactivate(position.id)}
                className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-md transition-colors"
              >
                ⏸️ Deactivate
              </button>
            ) : (
              <button
                onClick={() => onActivate(position.id)}
                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-md transition-colors"
              >
                ▶️ Activate
              </button>
            )}
            <button
              onClick={() => onDelete(position.id)}
              className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-md transition-colors"
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
