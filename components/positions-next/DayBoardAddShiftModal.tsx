import React from 'react'
import ShiftInlineEditor from '../ShiftInlineEditor'
import type { Position } from './types'

type Props = {
  position: Position
  positions: Position[]
  eventDateKeys: string[]
  defaultDay: string | null
  saving: boolean
  onPositionChange: (position: Position) => void
  onCancel: () => void
  onSave: (values: {
    name: string
    startTime: string
    endTime: string
    isAllDay: boolean
    volunteersNeeded: number
    shiftDate: string | null
  }) => Promise<void>
}

export default function DayBoardAddShiftModal({
  position,
  positions,
  eventDateKeys,
  defaultDay,
  saving,
  onPositionChange,
  onCancel,
  onSave,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-lg font-semibold text-gray-900">Add shift</h3>
          <p className="text-sm text-gray-600">{position.name}</p>
        </div>
        <div className="px-4 py-3">
          {positions.length > 1 && (
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Position
              </label>
              <select
                value={position.id}
                onChange={(e) => {
                  const next = positions.find((p) => p.id === e.target.value)
                  if (next) onPositionChange(next)
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 min-h-[44px] text-base sm:text-sm"
              >
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.positionNumber} {p.name || p.positionName}
                  </option>
                ))}
                {!positions.some((p) => p.id === position.id) && (
                  <option value={position.id}>
                    #{position.positionNumber} {position.name}
                  </option>
                )}
              </select>
            </div>
          )}
          <ShiftInlineEditor
            initial={{
              name: 'All Day',
              startTime: '',
              endTime: '',
              isAllDay: true,
              volunteersNeeded: 1,
              shiftDate: defaultDay,
            }}
            eventDateKeys={eventDateKeys}
            saving={saving}
            onCancel={onCancel}
            onSave={onSave}
          />
        </div>
      </div>
    </div>
  )
}
