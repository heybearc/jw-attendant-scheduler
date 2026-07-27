import React, { useState } from 'react'

export type ShiftEditValues = {
  name: string
  startTime: string
  endTime: string
  isAllDay: boolean
  volunteersNeeded: number
}

type ShiftInlineEditorProps = {
  initial: ShiftEditValues
  saving?: boolean
  onCancel: () => void
  onSave: (values: ShiftEditValues) => Promise<void> | void
}

export default function ShiftInlineEditor({
  initial,
  saving = false,
  onCancel,
  onSave
}: ShiftInlineEditorProps) {
  const [values, setValues] = useState<ShiftEditValues>(initial)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = values.name.trim() || (values.isAllDay ? 'All Day' : 'Shift')
    await onSave({
      ...values,
      name,
      startTime: values.isAllDay ? '' : values.startTime,
      endTime: values.isAllDay ? '' : values.endTime,
      volunteersNeeded: Math.max(1, Math.min(50, Number(values.volunteersNeeded) || 1))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 border-t border-gray-200 pt-2">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Morning, Afternoon…"
          disabled={saving}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
          <input
            type="time"
            value={values.startTime}
            onChange={(e) => setValues({ ...values, startTime: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving || values.isAllDay}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
          <input
            type="time"
            value={values.endTime}
            onChange={(e) => setValues({ ...values, endTime: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving || values.isAllDay}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center text-xs text-gray-700">
          <input
            type="checkbox"
            checked={values.isAllDay}
            onChange={(e) =>
              setValues({
                ...values,
                isAllDay: e.target.checked,
                startTime: e.target.checked ? '' : values.startTime,
                endTime: e.target.checked ? '' : values.endTime
              })
            }
            className="mr-1.5"
            disabled={saving}
          />
          All Day
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-700">
          Need
          <input
            type="number"
            min={1}
            max={50}
            value={values.volunteersNeeded}
            onChange={(e) =>
              setValues({
                ...values,
                volunteersNeeded: Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1))
              })
            }
            className="w-14 px-1 py-1 border border-gray-300 rounded text-xs"
            disabled={saving}
          />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-2.5 py-1 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
