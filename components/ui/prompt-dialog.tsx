'use client'

import { useEffect, useState } from 'react'

type PromptDialogProps = {
  open: boolean
  title: string
  message: string
  defaultValue?: string
  placeholder?: string
  confirmLabel?: string
  cancelLabel?: string
  requiredValue?: string
  inputLabel?: string
  tone?: 'danger' | 'default'
  loading?: boolean
  onConfirm: (value: string) => void
  onCancel: () => void
}

export function PromptDialog({
  open,
  title,
  message,
  defaultValue = '',
  placeholder,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  requiredValue,
  inputLabel,
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    if (open) setValue(defaultValue)
  }, [open, defaultValue])

  if (!open) return null

  const confirmClass =
    tone === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-indigo-600 hover:bg-indigo-700 text-white'

  const requiredMismatch =
    requiredValue !== undefined && value.trim() !== requiredValue

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel()
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 id="prompt-dialog-title" className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{message}</p>
        <label className="mt-4 block text-sm font-medium text-gray-700">
          {inputLabel ?? 'Enter value'}
          <input
            type="text"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={value}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </label>
        {requiredValue !== undefined && (
          <p className="mt-1 text-xs text-gray-500">
            Type <span className="font-mono font-semibold">{requiredValue}</span> to confirm.
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(value)}
            disabled={loading || requiredMismatch}
            className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
