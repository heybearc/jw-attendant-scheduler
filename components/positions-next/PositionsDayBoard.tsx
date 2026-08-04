import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import {
  countShiftAssignments,
  getShiftVolunteersNeeded,
} from '../../lib/shiftCapacity'
import { formatEventDayLabel } from '../../lib/eventDates'
import { toDateKey } from '../../lib/shiftConflict'
import { sortShiftsByTime } from '../../lib/shiftSort'
import { createPositionService } from '../../lib/positionService'
import { notifyAlert, toast } from '../../lib/ui/toast'
import { appConfirm } from '../../lib/ui/confirm'
import {
  abortEventBulkEmail,
  formatBulkEmailConfirmMessage,
} from '../../lib/bulkEmailClient'
import ShiftInlineEditor from '../ShiftInlineEditor'
import CreatePositionModal from '../CreatePositionModal'
import DayBoardAssignModal from './DayBoardAssignModal'
import DayBoardAddShiftModal from './DayBoardAddShiftModal'
import {
  type AssignTarget,
  type DayKey,
  type Position,
  type Shift,
  type Volunteer,
  personName,
  shiftLabel,
} from './types'

type Props = {
  eventId: string
  eventStart: string | null
  eventEnd: string | null
  positions: Position[]
  attendants: Volunteer[]
  canManageContent: boolean
  eventDateKeys: string[]
}

type StationGroup = {
  position: Position
  shifts: Shift[]
  filled: number
  needed: number
}

export default function PositionsDayBoard({
  eventId,
  positions,
  attendants,
  canManageContent,
  eventDateKeys,
}: Props) {
  const router = useRouter()
  const positionService = useMemo(() => createPositionService(eventId), [eventId])
  const [activeDay, setActiveDay] = useState<DayKey>(
    eventDateKeys[0] || 'undated'
  )
  const [search, setSearch] = useState('')
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null)
  const [editingShiftKey, setEditingShiftKey] = useState<string | null>(null)
  const [savingShiftKey, setSavingShiftKey] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [underfilledOnly, setUnderfilledOnly] = useState(false)
  const [selectedUndated, setSelectedUndated] = useState<Set<string>>(new Set())
  const [bulkDay, setBulkDay] = useState(eventDateKeys[0] || '')
  const [settingDayKey, setSettingDayKey] = useState<string | null>(null)
  const [bulkSettingDay, setBulkSettingDay] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    positionNumber: 1,
    name: '',
    area: '',
    description: '',
  })
  const [creatingPosition, setCreatingPosition] = useState(false)
  const [addShiftPosition, setAddShiftPosition] = useState<Position | null>(null)
  const [savingNewShift, setSavingNewShift] = useState(false)
  const [notifySending, setNotifySending] = useState(false)
  const [notifyJobActive, setNotifyJobActive] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  const undatedShiftCount = useMemo(() => {
    let n = 0
    for (const p of positions) {
      for (const s of p.shifts || []) {
        if (!toDateKey(s.shiftDate)) n++
      }
    }
    return n
  }, [positions])

  const dayTabs: DayKey[] = useMemo(() => {
    const keys = [...eventDateKeys]
    if (undatedShiftCount > 0 || keys.length === 0) keys.push('undated')
    return keys
  }, [eventDateKeys, undatedShiftCount])

  const filteredPositions = useMemo(() => {
    const q = search.trim().toLowerCase()
    return positions.filter((p) => {
      if (!p.isActive) return false
      if (!q) return true
      const name = (p.name || p.positionName || '').toLowerCase()
      const area = (p.area || '').toLowerCase()
      return (
        name.includes(q) ||
        area.includes(q) ||
        String(p.positionNumber).includes(q)
      )
    })
  }, [positions, search])

  const stations = useMemo((): StationGroup[] => {
    const out: StationGroup[] = []
    for (const position of filteredPositions) {
      const dayShifts = sortShiftsByTime(position.shifts || []).filter((shift) => {
        const key = toDateKey(shift.shiftDate) || 'undated'
        if (key !== activeDay) return false
        const filled = countShiftAssignments(position.assignments, shift.id)
        const needed = getShiftVolunteersNeeded(shift)
        if (underfilledOnly && filled >= needed) return false
        return true
      })
      if (dayShifts.length === 0) continue
      let filled = 0
      let needed = 0
      for (const shift of dayShifts) {
        filled += countShiftAssignments(position.assignments, shift.id)
        needed += getShiftVolunteersNeeded(shift)
      }
      out.push({ position, shifts: dayShifts, filled, needed })
    }
    return out
  }, [filteredPositions, activeDay, underfilledOnly])

  const dayCoverage = useMemo(() => {
    let filled = 0
    let needed = 0
    let shifts = 0
    for (const s of stations) {
      filled += s.filled
      needed += s.needed
      shifts += s.shifts.length
    }
    return { filled, needed, shifts, open: Math.max(0, needed - filled) }
  }, [stations])

  const nextPositionNumber = useMemo(() => {
    return (
      positions.reduce((acc, p) => Math.max(acc, p.positionNumber || 0), 0) + 1
    )
  }, [positions])

  const setShiftDay = async (
    positionId: string,
    shiftId: string,
    shiftDate: string
  ) => {
    const rowKey = `${positionId}:${shiftId}`
    setSettingDayKey(rowKey)
    try {
      const ok = await positionService.updateShift(positionId, shiftId, {
        shiftDate,
      })
      if (!ok) {
        notifyAlert('Failed to set day')
        return false
      }
      return true
    } catch {
      notifyAlert('Failed to set day')
      return false
    } finally {
      setSettingDayKey(null)
    }
  }

  const handleBulkSetDay = async () => {
    if (!bulkDay || selectedUndated.size === 0) return
    const confirmed = await appConfirm({
      title: 'Set day for shifts',
      message: `Set ${selectedUndated.size} undated shift${
        selectedUndated.size === 1 ? '' : 's'
      } to ${formatEventDayLabel(bulkDay)}?`,
      confirmLabel: 'Set day',
      cancelLabel: 'Cancel',
    })
    if (!confirmed) return
    setBulkSettingDay(true)
    try {
      let okCount = 0
      for (const key of selectedUndated) {
        const [positionId, shiftId] = key.split(':')
        const ok = await positionService.updateShift(positionId, shiftId, {
          shiftDate: bulkDay,
        })
        if (ok) okCount++
      }
      toast.success(`Updated ${okCount} of ${selectedUndated.size} shifts`)
      setSelectedUndated(new Set())
      router.reload()
    } catch {
      notifyAlert('Bulk set day failed')
    } finally {
      setBulkSettingDay(false)
    }
  }

  const openCreatePosition = () => {
    setCreateForm({
      positionNumber: nextPositionNumber,
      name: '',
      area: '',
      description: '',
    })
    setShowCreateModal(true)
  }

  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name.trim()) {
      notifyAlert('Position name is required')
      return
    }
    setCreatingPosition(true)
    try {
      const res = await fetch(`/api/events/${eventId}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        notifyAlert(data.error || 'Failed to create position')
        return
      }
      const created = data.data || data.position || data
      toast.success('Position created')
      setShowCreateModal(false)
      if (created?.id) {
        setAddShiftPosition({
          id: created.id,
          name: created.name || createForm.name,
          positionNumber: created.positionNumber || createForm.positionNumber,
          isActive: true,
          area: createForm.area || null,
          shifts: [],
          assignments: [],
        })
      } else {
        router.reload()
      }
    } catch {
      notifyAlert('Failed to create position')
    } finally {
      setCreatingPosition(false)
    }
  }

  const handleCreateShift = async (values: {
    name: string
    startTime: string
    endTime: string
    isAllDay: boolean
    volunteersNeeded: number
    shiftDate: string | null
  }) => {
    if (!addShiftPosition) return
    setSavingNewShift(true)
    try {
      const ok = await positionService.createShift(addShiftPosition.id, {
        name: values.name,
        startTime: values.isAllDay ? null : values.startTime || null,
        endTime: values.isAllDay ? null : values.endTime || null,
        isAllDay: values.isAllDay,
        volunteersNeeded: values.volunteersNeeded,
        shiftDate: values.shiftDate,
      })
      if (!ok) {
        notifyAlert('Failed to create shift')
        return
      }
      toast.success('Shift added')
      setAddShiftPosition(null)
      router.reload()
    } catch {
      notifyAlert('Failed to create shift')
    } finally {
      setSavingNewShift(false)
    }
  }

  const handleRemove = async (
    assignment: Parameters<typeof personName>[0]
  ) => {
    const ok = await appConfirm({
      title: 'Remove assignment',
      message: `Remove ${personName(assignment)} from this shift?`,
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
    })
    if (!ok) return
    setRemovingId(assignment.id)
    try {
      const res = await fetch(
        `/api/events/${eventId}/assignments/${assignment.id}`,
        { method: 'DELETE', credentials: 'include' }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        notifyAlert(data.error || data.message || 'Failed to remove')
        return
      }
      toast.success('Assignment removed')
      router.reload()
    } catch {
      notifyAlert('Failed to remove assignment')
    } finally {
      setRemovingId(null)
    }
  }

  const handleDeleteShift = async (
    positionId: string,
    shiftId: string,
    shiftName: string
  ) => {
    const ok = await appConfirm({
      title: 'Delete shift',
      message: `Delete "${shiftName}"? This also removes anyone assigned to it.`,
      confirmLabel: 'Delete shift',
      cancelLabel: 'Cancel',
    })
    if (!ok) return
    const key = `${positionId}:${shiftId}`
    setDeletingKey(key)
    try {
      const success = await positionService.deleteShift(positionId, shiftId)
      if (!success) {
        notifyAlert('Failed to delete shift')
        return
      }
      toast.success('Shift deleted')
      router.reload()
    } catch {
      notifyAlert('Failed to delete shift')
    } finally {
      setDeletingKey(null)
    }
  }

  const handleDeactivatePosition = async (position: Position) => {
    const ok = await appConfirm({
      title: 'Deactivate position',
      message: `Deactivate "#${position.positionNumber} ${
        position.name || position.positionName
      }"? It can be reactivated later in classic Positions.`,
      confirmLabel: 'Deactivate',
      cancelLabel: 'Cancel',
    })
    if (!ok) return
    setDeletingKey(position.id)
    try {
      const success = await positionService.deletePosition(position.id)
      if (!success) {
        notifyAlert('Failed to deactivate position')
        return
      }
      toast.success('Position deactivated')
      router.reload()
    } catch {
      notifyAlert('Failed to deactivate position')
    } finally {
      setDeletingKey(null)
    }
  }

  const runShiftMoreAction = async (
    action: string,
    position: Position,
    shift: Shift
  ) => {
    if (!action) return
    if (action === 'overseer') {
      setAssignTarget({ position, shift, role: 'OVERSEER' })
      return
    }
    if (action === 'keyman') {
      setAssignTarget({ position, shift, role: 'KEYMAN' })
      return
    }
    if (action === 'edit') {
      setEditingShiftKey(`${position.id}:${shift.id}`)
      return
    }
    if (action === 'delete') {
      await handleDeleteShift(position.id, shift.id, shift.name || 'Shift')
    }
  }

  const handleSendNotifications = async () => {
    if (notifySending || notifyJobActive) {
      notifyAlert('An assignment notification send is already in progress.')
      return
    }
    try {
      const previewRes = await fetch(
        `/api/events/${eventId}/assignments/send-notifications`,
        { credentials: 'include' }
      )
      const preview = await previewRes.json().catch(() => ({}))
      const count =
        typeof preview.recipientCount === 'number' ? preview.recipientCount : 0
      if (!previewRes.ok) {
        notifyAlert(preview.error || preview.message || 'Could not preview recipients')
        return
      }
      if (count === 0) {
        notifyAlert('No assigned volunteers with an email address to notify.')
        return
      }
      const confirmed = await appConfirm({
        title: 'Send assignment notifications',
        message: formatBulkEmailConfirmMessage({
          recipientCount: count,
          estimatedSeconds:
            typeof preview.estimatedSeconds === 'number'
              ? preview.estimatedSeconds
              : Math.ceil(count * 1.2),
          scopeNote:
            'Assigned volunteers with email only (one email per person).',
        }),
        confirmLabel: 'Queue emails',
        cancelLabel: 'Cancel',
      })
      if (!confirmed) return

      setNotifySending(true)
      setNotifyJobActive(true)
      const response = await fetch(
        `/api/events/${eventId}/assignments/send-notifications`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      )
      const data = await response.json().catch(() => ({}))
      if (response.ok && data.success) {
        notifyAlert(data.message || `Queued ${count} notification(s)`)
        if (!data.async) setNotifyJobActive(false)
      } else {
        setNotifyJobActive(false)
        notifyAlert(data.error || data.message || 'Failed to send notifications')
      }
    } catch (error: unknown) {
      setNotifyJobActive(false)
      notifyAlert(
        `Failed to send notifications: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    } finally {
      setNotifySending(false)
    }
  }

  const handleAbortNotifications = async () => {
    const result = await abortEventBulkEmail(
      eventId,
      'assignment-notifications'
    )
    notifyAlert(result.message)
    if (result.ok) setNotifyJobActive(false)
  }

  const selectAllUndatedVisible = () => {
    const keys = new Set<string>()
    for (const station of stations) {
      for (const shift of station.shifts) {
        keys.add(`${station.position.id}:${shift.id}`)
      }
    }
    setSelectedUndated(keys)
  }

  return (
    <div className="space-y-4">
      {eventDateKeys.length > 1 && undatedShiftCount > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>
            <span className="font-medium">
              {undatedShiftCount} undated shift
              {undatedShiftCount === 1 ? '' : 's'}
            </span>
            {' — '}set a day here, or open the No day set tab.
          </p>
          <button
            type="button"
            onClick={() => setActiveDay('undated')}
            className="mt-2 inline-flex min-h-[44px] items-center rounded-md border border-amber-400 bg-white px-3 py-2 text-sm font-medium touch-manipulation"
          >
            Show undated
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {dayTabs.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => {
                setActiveDay(day)
                setSelectedUndated(new Set())
              }}
              className={`px-3 py-2 min-h-[44px] rounded-md text-sm font-medium touch-manipulation ${
                activeDay === day
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {day === 'undated'
                ? `No day set${undatedShiftCount ? ` (${undatedShiftCount})` : ''}`
                : formatEventDayLabel(day)}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          {canManageContent && (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={openCreatePosition}
                className="inline-flex min-h-[44px] items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 touch-manipulation"
              >
                Create position
              </button>
              <button
                type="button"
                onClick={() => {
                  const first = filteredPositions[0]
                  if (!first) {
                    notifyAlert('Create a position first')
                    return
                  }
                  setAddShiftPosition(first)
                }}
                className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 touch-manipulation"
              >
                Add shift
              </button>
              <button
                type="button"
                disabled={notifySending}
                onClick={handleSendNotifications}
                className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
              >
                {notifySending ? 'Queuing…' : 'Send notifications'}
              </button>
              {notifyJobActive && (
                <button
                  type="button"
                  onClick={handleAbortNotifications}
                  className="inline-flex min-h-[44px] items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 touch-manipulation"
                >
                  Abort send
                </button>
              )}
            </div>
          )}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter stations…"
            className="w-full sm:w-64 px-3 py-2 min-h-[44px] text-base sm:text-sm border border-gray-300 rounded-md"
          />
          <label className="inline-flex min-h-[44px] items-center gap-2 text-sm text-gray-700 touch-manipulation">
            <input
              type="checkbox"
              checked={underfilledOnly}
              onChange={(e) => setUnderfilledOnly(e.target.checked)}
              className="h-4 w-4"
            />
            Underfilled only
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800">
        <p className="font-medium text-gray-900">
          {activeDay === 'undated'
            ? 'Undated shifts'
            : formatEventDayLabel(activeDay)}{' '}
          · {stations.length} station{stations.length === 1 ? '' : 's'}
        </p>
        <p className="mt-1">
          {dayCoverage.filled}/{dayCoverage.needed} slots · {dayCoverage.open} open ·{' '}
          {dayCoverage.shifts} shift{dayCoverage.shifts === 1 ? '' : 's'}
          {underfilledOnly ? ' · underfilled only' : ''}
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-2 rounded-full ${
              dayCoverage.needed > 0 && dayCoverage.filled >= dayCoverage.needed
                ? 'bg-green-500'
                : dayCoverage.filled > 0
                  ? 'bg-amber-400'
                  : 'bg-gray-300'
            }`}
            style={{
              width: `${
                dayCoverage.needed > 0
                  ? Math.min(
                      100,
                      Math.round((dayCoverage.filled / dayCoverage.needed) * 100)
                    )
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {activeDay === 'undated' && canManageContent && stations.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2">
          <button
            type="button"
            onClick={selectAllUndatedVisible}
            className="min-h-[44px] rounded-md border border-indigo-300 bg-white px-3 py-2 text-sm touch-manipulation"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setSelectedUndated(new Set())}
            className="min-h-[44px] rounded-md border border-indigo-300 bg-white px-3 py-2 text-sm touch-manipulation"
          >
            Clear
          </button>
          <select
            value={bulkDay}
            onChange={(e) => setBulkDay(e.target.value)}
            className="min-h-[44px] rounded-md border border-indigo-300 bg-white px-2 py-1.5 text-sm"
          >
            {eventDateKeys.map((key) => (
              <option key={key} value={key}>
                {formatEventDayLabel(key)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={bulkSettingDay || selectedUndated.size === 0 || !bulkDay}
            onClick={handleBulkSetDay}
            className="inline-flex min-h-[44px] items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-300 touch-manipulation"
          >
            {bulkSettingDay
              ? 'Updating…'
              : `Set day on ${selectedUndated.size || 0}`}
          </button>
        </div>
      )}

      {stations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
          {activeDay === 'undated'
            ? 'No undated shifts. All shifts have a day set.'
            : canManageContent
              ? 'No shifts for this day. Add a shift or pick another day.'
              : 'No shifts for this day.'}
        </div>
      ) : (
        <div className="space-y-4">
          {stations.map(({ position, shifts, filled: stationFilled, needed: stationNeeded }) => {
            const positionOverseer = position.oversight?.[0]?.overseer
            return (
              <section
                key={position.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <header className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      #{position.positionNumber}{' '}
                      {position.name || position.positionName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {position.area ? `${position.area} · ` : ''}
                      <span
                        className={
                          stationFilled >= stationNeeded
                            ? 'text-green-700'
                            : 'text-amber-700'
                        }
                      >
                        {stationFilled}/{stationNeeded} filled
                      </span>
                      {positionOverseer
                        ? ` · Overseer ${positionOverseer.firstName} ${positionOverseer.lastName}`
                        : ''}
                    </p>
                  </div>
                  {canManageContent && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setAddShiftPosition(position)}
                        className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 touch-manipulation"
                      >
                        Add shift
                      </button>
                      <button
                        type="button"
                        disabled={deletingKey === position.id}
                        onClick={() => handleDeactivatePosition(position)}
                        className="inline-flex min-h-[44px] items-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 touch-manipulation"
                      >
                        Deactivate
                      </button>
                    </div>
                  )}
                </header>

                <div className="divide-y divide-gray-100">
                  {shifts.map((shift) => {
                    const rowKey = `${position.id}:${shift.id}`
                    const filled = countShiftAssignments(
                      position.assignments,
                      shift.id
                    )
                    const needed = getShiftVolunteersNeeded(shift)
                    const shiftAssignments = (position.assignments || []).filter(
                      (a) => a.shift?.id === shift.id
                    )
                    const volunteers = shiftAssignments.filter(
                      (a) => a.role === 'VOLUNTEER' || a.role === 'ATTENDANT'
                    )
                    const overseer = shiftAssignments.find(
                      (a) => a.role === 'OVERSEER'
                    )
                    const keyman = shiftAssignments.find(
                      (a) => a.role === 'KEYMAN'
                    )
                    const isEditing = editingShiftKey === rowKey
                    const pct = Math.min(
                      100,
                      Math.round((filled / Math.max(needed, 1)) * 100)
                    )

                    return (
                      <div key={rowKey} className="px-4 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex gap-3">
                            {activeDay === 'undated' && canManageContent && (
                              <label className="mt-1 inline-flex min-h-[44px] min-w-[44px] items-start touch-manipulation">
                                <input
                                  type="checkbox"
                                  checked={selectedUndated.has(rowKey)}
                                  onChange={() => {
                                    setSelectedUndated((prev) => {
                                      const next = new Set(prev)
                                      if (next.has(rowKey)) next.delete(rowKey)
                                      else next.add(rowKey)
                                      return next
                                    })
                                  }}
                                  className="mt-1 h-4 w-4"
                                  aria-label="Select undated shift"
                                />
                              </label>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {shiftLabel(shift)}
                                {!toDateKey(shift.shiftDate) &&
                                eventDateKeys.length > 1 ? (
                                  <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-900">
                                    No day
                                  </span>
                                ) : null}
                              </p>
                              <p
                                className={`text-sm ${
                                  filled >= needed
                                    ? 'text-green-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {filled}/{needed}
                                {filled < needed
                                  ? ` · ${needed - filled} open`
                                  : ''}
                              </p>
                              {canManageContent &&
                                !toDateKey(shift.shiftDate) &&
                                eventDateKeys.length > 0 &&
                                !isEditing && (
                                  <select
                                    defaultValue=""
                                    disabled={settingDayKey === rowKey}
                                    onChange={async (e) => {
                                      const day = e.target.value
                                      if (!day) return
                                      const ok = await setShiftDay(
                                        position.id,
                                        shift.id,
                                        day
                                      )
                                      if (ok) {
                                        toast.success(
                                          `Set to ${formatEventDayLabel(day)}`
                                        )
                                        router.reload()
                                      }
                                    }}
                                    className="mt-2 min-h-[44px] rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-sm"
                                  >
                                    <option value="">Set day…</option>
                                    {eventDateKeys.map((key) => (
                                      <option key={key} value={key}>
                                        {formatEventDayLabel(key)}
                                      </option>
                                    ))}
                                  </select>
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-1.5 rounded-full ${
                              pct >= 100
                                ? 'bg-green-500'
                                : pct > 0
                                  ? 'bg-amber-400'
                                  : 'bg-gray-300'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {isEditing && canManageContent ? (
                          <ShiftInlineEditor
                            initial={{
                              name: shift.name || '',
                              startTime: shift.startTime || '',
                              endTime: shift.endTime || '',
                              isAllDay: !!shift.isAllDay,
                              volunteersNeeded: needed,
                              shiftDate: toDateKey(shift.shiftDate),
                            }}
                            eventDateKeys={eventDateKeys}
                            saving={savingShiftKey === rowKey}
                            onCancel={() => setEditingShiftKey(null)}
                            onSave={async (values) => {
                              if (filled > 0) {
                                const confirmed = await appConfirm({
                                  title: 'Update shift times',
                                  message: `This updates times for ${filled} assigned volunteer${
                                    filled === 1 ? '' : 's'
                                  }. Continue?`,
                                  confirmLabel: 'Update times',
                                  cancelLabel: 'Cancel',
                                })
                                if (!confirmed) return
                              }
                              setSavingShiftKey(rowKey)
                              try {
                                const ok = await positionService.updateShift(
                                  position.id,
                                  shift.id,
                                  {
                                    name: values.name,
                                    startTime: values.isAllDay
                                      ? null
                                      : values.startTime || null,
                                    endTime: values.isAllDay
                                      ? null
                                      : values.endTime || null,
                                    isAllDay: values.isAllDay,
                                    volunteersNeeded: values.volunteersNeeded,
                                    shiftDate: values.shiftDate,
                                  }
                                )
                                if (!ok) {
                                  notifyAlert('Failed to update shift')
                                  return
                                }
                                setEditingShiftKey(null)
                                toast.success('Shift updated')
                                router.reload()
                              } catch {
                                notifyAlert('Failed to update shift')
                              } finally {
                                setSavingShiftKey(null)
                              }
                            }}
                          />
                        ) : (
                          <>
                            <div className="mt-2 space-y-1 text-sm text-gray-800">
                              <p>
                                <span className="text-gray-500">Overseer · </span>
                                {overseer
                                  ? personName(overseer)
                                  : positionOverseer
                                    ? `${positionOverseer.firstName} ${positionOverseer.lastName} (position)`
                                    : '—'}
                                {canManageContent && overseer && (
                                  <button
                                    type="button"
                                    disabled={removingId === overseer.id}
                                    onClick={() => handleRemove(overseer)}
                                    className="ml-2 text-xs text-red-600 hover:text-red-800 min-h-[44px] px-1 touch-manipulation"
                                  >
                                    Remove
                                  </button>
                                )}
                              </p>
                              {(keyman || canManageContent) && (
                                <p>
                                  <span className="text-gray-500">Keyman · </span>
                                  {keyman ? personName(keyman) : '—'}
                                  {canManageContent && keyman && (
                                    <button
                                      type="button"
                                      disabled={removingId === keyman.id}
                                      onClick={() => handleRemove(keyman)}
                                      className="ml-2 text-xs text-red-600 hover:text-red-800 min-h-[44px] px-1 touch-manipulation"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </p>
                              )}
                              <div>
                                <span className="text-gray-500">Assigned · </span>
                                {volunteers.length === 0 ? (
                                  <span className="text-gray-500">None</span>
                                ) : (
                                  <ul className="mt-1 space-y-0.5">
                                    {volunteers.map((v) => (
                                      <li
                                        key={v.id}
                                        className="flex flex-wrap items-center gap-2"
                                      >
                                        <span>{personName(v)}</span>
                                        {canManageContent && (
                                          <button
                                            type="button"
                                            disabled={removingId === v.id}
                                            onClick={() => handleRemove(v)}
                                            className="text-xs text-red-600 hover:text-red-800 min-h-[44px] px-1 touch-manipulation"
                                          >
                                            Remove
                                          </button>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>

                            {canManageContent && (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAssignTarget({
                                      position,
                                      shift,
                                      role: 'VOLUNTEER',
                                    })
                                  }
                                  className="inline-flex min-h-[44px] items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 touch-manipulation"
                                >
                                  Assign
                                </button>
                                <select
                                  key={`${rowKey}-more`}
                                  defaultValue=""
                                  disabled={deletingKey === rowKey}
                                  onChange={async (e) => {
                                    const action = e.target.value
                                    e.target.value = ''
                                    await runShiftMoreAction(
                                      action,
                                      position,
                                      shift
                                    )
                                  }}
                                  className="min-h-[44px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 touch-manipulation"
                                  aria-label="More shift actions"
                                >
                                  <option value="">More…</option>
                                  <option value="overseer">Set overseer</option>
                                  <option value="keyman">Set keyman</option>
                                  <option value="edit">Edit times</option>
                                  <option value="delete">Delete shift</option>
                                </select>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {assignTarget && (
        <DayBoardAssignModal
          eventId={eventId}
          target={assignTarget}
          positions={positions}
          attendants={attendants}
          onClose={() => setAssignTarget(null)}
          onAssigned={() => {
            setAssignTarget(null)
            router.reload()
          }}
        />
      )}

      <CreatePositionModal
        isOpen={showCreateModal}
        editingPosition={null}
        formData={createForm}
        onClose={() => {
          if (creatingPosition) return
          setShowCreateModal(false)
        }}
        onSubmit={handleCreatePosition}
        onFormDataChange={setCreateForm}
      />

      {addShiftPosition && (
        <DayBoardAddShiftModal
          position={addShiftPosition}
          positions={filteredPositions}
          eventDateKeys={eventDateKeys}
          defaultDay={
            activeDay !== 'undated' ? activeDay : eventDateKeys[0] || null
          }
          saving={savingNewShift}
          onPositionChange={setAddShiftPosition}
          onCancel={() => setAddShiftPosition(null)}
          onSave={handleCreateShift}
        />
      )}
    </div>
  )
}
