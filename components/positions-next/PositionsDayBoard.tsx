import React, { useMemo, useState } from 'react'
import Link from 'next/link'
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
  buildVolunteerAssignmentMap,
  getConflictsForShift,
} from '../../hooks/useConflicts'
import ShiftInlineEditor from '../ShiftInlineEditor'
import CreatePositionModal from '../CreatePositionModal'

function formatTime12Hour(time24: string): string {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${hour12}:${minutes} ${ampm}`
}

type DayKey = string | 'undated'

type Assignment = {
  id: string
  role: string
  volunteer?: { id: string; firstName: string; lastName: string } | null
  attendant?: { id: string; firstName: string; lastName: string } | null
  shift?: {
    id: string
    name: string
    startTime?: string | null
    endTime?: string | null
    isAllDay: boolean
    shiftDate?: string | Date | null
  } | null
}

type Shift = {
  id: string
  name: string
  startTime?: string | null
  endTime?: string | null
  isAllDay: boolean
  volunteersNeeded?: number
  shiftDate?: string | null
}

type Position = {
  id: string
  name: string
  positionName?: string
  positionNumber: number
  isActive: boolean
  area?: string | null
  shifts?: Shift[]
  assignments?: Assignment[]
  oversight?: Array<{
    overseer?: { firstName: string; lastName: string } | null
    keyman?: { firstName: string; lastName: string } | null
  }>
}

type Volunteer = {
  id: string
  firstName: string
  lastName: string
  congregation?: string | null
}

type Props = {
  eventId: string
  eventStart: string | null
  eventEnd: string | null
  positions: Position[]
  attendants: Volunteer[]
  canManageContent: boolean
  eventDateKeys: string[]
}

function personName(a: Assignment): string {
  const p = a.volunteer || a.attendant
  return p ? `${p.firstName} ${p.lastName}` : 'Unknown'
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
  const [assignTarget, setAssignTarget] = useState<{
    position: Position
    shift: Shift
    role: 'VOLUNTEER' | 'OVERSEER' | 'KEYMAN'
  } | null>(null)
  const [assignSearch, setAssignSearch] = useState('')
  const [assigning, setAssigning] = useState(false)
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
    const hasUndated = undatedShiftCount > 0
    if (hasUndated || keys.length === 0) keys.push('undated')
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

  const rows = useMemo(() => {
    const out: Array<{ position: Position; shift: Shift }> = []
    for (const position of filteredPositions) {
      const shifts = sortShiftsByTime(position.shifts || [])
      for (const shift of shifts) {
        const key = toDateKey(shift.shiftDate) || 'undated'
        if (key !== activeDay) continue
        const filled = countShiftAssignments(position.assignments, shift.id)
        const needed = getShiftVolunteersNeeded(shift)
        if (underfilledOnly && filled >= needed) continue
        out.push({ position, shift })
      }
    }
    return out
  }, [filteredPositions, activeDay, underfilledOnly])

  const dayCoverage = useMemo(() => {
    let filled = 0
    let needed = 0
    let shifts = 0
    for (const position of filteredPositions) {
      for (const shift of position.shifts || []) {
        const key = toDateKey(shift.shiftDate) || 'undated'
        if (key !== activeDay) continue
        shifts++
        filled += countShiftAssignments(position.assignments, shift.id)
        needed += getShiftVolunteersNeeded(shift)
      }
    }
    return { filled, needed, shifts, open: Math.max(0, needed - filled) }
  }, [filteredPositions, activeDay])

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

  const toggleUndatedSelect = (rowKey: string) => {
    setSelectedUndated((prev) => {
      const next = new Set(prev)
      if (next.has(rowKey)) next.delete(rowKey)
      else next.add(rowKey)
      return next
    })
  }

  const selectAllUndatedVisible = () => {
    setSelectedUndated(new Set(rows.map(({ position, shift }) => `${position.id}:${shift.id}`)))
  }

  const assignmentMap = useMemo(
    () => buildVolunteerAssignmentMap(positions),
    [positions]
  )

  const conflictMap = useMemo(() => {
    if (!assignTarget) return new Map()
    return getConflictsForShift(
      attendants.map((a) => a.id),
      assignTarget.shift,
      assignmentMap
    )
  }, [assignTarget, attendants, assignmentMap])

  const nextPositionNumber = useMemo(() => {
    const max = positions.reduce(
      (acc, p) => Math.max(acc, p.positionNumber || 0),
      0
    )
    return max + 1
  }, [positions])

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

  const handleAssign = async (volunteerId: string) => {
    if (!assignTarget) return
    const conflict = conflictMap.get(volunteerId)
    if (conflict?.hasConflict) {
      const confirmed = await appConfirm({
        title: 'Scheduling conflict',
        message: `${conflict.message}\n\nAssign anyway? Coordinators can override conflicts.`,
        confirmLabel: 'Assign anyway',
        cancelLabel: 'Cancel',
      })
      if (!confirmed) return
    }
    setAssigning(true)
    try {
      const res = await fetch(`/api/events/${eventId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId: assignTarget.position.id,
          volunteerId,
          shiftId: assignTarget.shift.id,
          role: assignTarget.role,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 409) {
          const details = data.conflicts
            ?.map((c: { positionName?: string; shiftName?: string }) =>
              `${c.positionName || ''} — ${c.shiftName || ''}`.trim()
            )
            .filter(Boolean)
            .join(', ')
          notifyAlert(
            data.message ||
              data.error ||
              (details
                ? `Time conflict: already assigned to ${details}`
                : 'Assignment conflict')
          )
        } else {
          notifyAlert(data.message || data.error || 'Failed to assign')
        }
        return
      }
      setAssignTarget(null)
      setAssignSearch('')
      router.reload()
    } catch {
      notifyAlert('Failed to assign')
    } finally {
      setAssigning(false)
    }
  }

  const handleRemove = async (assignment: Assignment) => {
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

  const assignCandidates = useMemo(() => {
    if (!assignTarget) return []
    const q = assignSearch.trim().toLowerCase()
    return attendants
      .filter((a) => {
        if (!q) return true
        return `${a.firstName} ${a.lastName} ${a.congregation || ''}`
          .toLowerCase()
          .includes(q)
      })
      .sort((a, b) => {
        const ac = conflictMap.get(a.id)?.hasConflict ? 1 : 0
        const bc = conflictMap.get(b.id)?.hasConflict ? 1 : 0
        if (ac !== bc) return ac - bc
        return `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`
        )
      })
      .slice(0, 40)
  }, [attendants, assignSearch, assignTarget, conflictMap])

  return (
    <div className="space-y-4">
      {eventDateKeys.length > 1 && undatedShiftCount > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">
            {undatedShiftCount} shift{undatedShiftCount === 1 ? '' : 's'} still have no day set
          </p>
          <p className="mt-1">
            On multi-day events, undated shifts land on the <strong>No day set</strong> tab and
            can look like time conflicts. Open classic Positions, edit each shift, and choose the
            correct day.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveDay('undated')}
              className="inline-flex min-h-[44px] items-center rounded-md border border-amber-400 bg-white px-3 py-2 text-sm font-medium touch-manipulation"
            >
              Show undated shifts
            </button>
            <Link
              href={`/events/${eventId}/positions`}
              className="inline-flex min-h-[44px] items-center rounded-md border border-amber-400 bg-white px-3 py-2 text-sm font-medium touch-manipulation"
            >
              Fix days in classic Positions
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex flex-wrap gap-2 justify-end">
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
                  const first = filteredPositions[0] || null
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
          coverage
        </p>
        <p className="mt-1">
          {dayCoverage.filled}/{dayCoverage.needed} slots filled · {dayCoverage.open} open ·{' '}
          {dayCoverage.shifts} shift{dayCoverage.shifts === 1 ? '' : 's'}
          {underfilledOnly ? ' · showing underfilled only' : ''}
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

      {activeDay === 'undated' && canManageContent && eventDateKeys.length > 0 && rows.length > 0 && (
        <div className="flex flex-col gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={selectAllUndatedVisible}
            className="inline-flex min-h-[44px] items-center rounded-md border border-indigo-300 bg-white px-3 py-2 text-sm touch-manipulation"
          >
            Select all visible ({rows.length})
          </button>
          <select
            value={bulkDay}
            onChange={(e) => setBulkDay(e.target.value)}
            className="min-h-[44px] rounded-md border border-indigo-300 bg-white px-3 py-2 text-sm"
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
              : `Set day on ${selectedUndated.size || 0} selected`}
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
          {activeDay === 'undated'
            ? 'No undated shifts. All shifts have a day set.'
            : 'No shifts for this day. Set a day on shifts in classic Positions, or pick another day.'}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ position, shift }) => {
            const rowKey = `${position.id}:${shift.id}`
            const filled = countShiftAssignments(position.assignments, shift.id)
            const needed = getShiftVolunteersNeeded(shift)
            const shiftAssignments = (position.assignments || []).filter(
              (a) => a.shift?.id === shift.id
            )
            const volunteers = shiftAssignments.filter(
              (a) => a.role === 'VOLUNTEER' || a.role === 'ATTENDANT'
            )
            const overseer = shiftAssignments.find((a) => a.role === 'OVERSEER')
            const keyman = shiftAssignments.find((a) => a.role === 'KEYMAN')
            const positionOverseer = position.oversight?.[0]?.overseer
            const pct = Math.min(100, Math.round((filled / Math.max(needed, 1)) * 100))
            const isEditing = editingShiftKey === rowKey

            return (
              <article
                key={rowKey}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    {activeDay === 'undated' && canManageContent && (
                      <label className="mt-1 inline-flex min-h-[44px] min-w-[44px] items-start touch-manipulation">
                        <input
                          type="checkbox"
                          checked={selectedUndated.has(rowKey)}
                          onChange={() => toggleUndatedSelect(rowKey)}
                          className="mt-1 h-4 w-4"
                          aria-label="Select undated shift"
                        />
                      </label>
                    )}
                    <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      #{position.positionNumber}{' '}
                      {position.name || position.positionName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {shift.name}
                      {!shift.isAllDay && shift.startTime
                        ? ` · ${formatTime12Hour(shift.startTime)} – ${formatTime12Hour(
                            shift.endTime || ''
                          )}`
                        : shift.isAllDay
                          ? ' · All day'
                          : ''}
                      {position.area ? ` · ${position.area}` : ''}
                      {!toDateKey(shift.shiftDate) && eventDateKeys.length > 1 ? (
                        <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">
                          No day
                        </span>
                      ) : null}
                    </p>
                    {canManageContent &&
                      !toDateKey(shift.shiftDate) &&
                      eventDateKeys.length > 0 &&
                      !isEditing && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <select
                            defaultValue=""
                            disabled={settingDayKey === rowKey}
                            onChange={async (e) => {
                              const day = e.target.value
                              if (!day) return
                              const ok = await setShiftDay(position.id, shift.id, day)
                              if (ok) {
                                toast.success(`Set to ${formatEventDayLabel(day)}`)
                                router.reload()
                              }
                            }}
                            className="min-h-[44px] rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-sm"
                          >
                            <option value="">Set day…</option>
                            {eventDateKeys.map((key) => (
                              <option key={key} value={key}>
                                {formatEventDayLabel(key)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <span
                      className={`font-medium ${
                        filled >= needed ? 'text-green-700' : 'text-amber-700'
                      }`}
                    >
                      {filled}/{needed} filled
                      {filled < needed ? ` · ${needed - filled} open` : ''}
                    </span>
                  </div>
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${
                      pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-amber-400' : 'bg-gray-300'
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
                          } on this shift. Continue?`,
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
                            startTime: values.isAllDay ? null : values.startTime || null,
                            endTime: values.isAllDay ? null : values.endTime || null,
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
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Shift overseer
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-gray-900">
                            {overseer
                              ? personName(overseer)
                              : positionOverseer
                                ? `${positionOverseer.firstName} ${positionOverseer.lastName} (position)`
                                : '—'}
                          </p>
                          {canManageContent && overseer && (
                            <button
                              type="button"
                              disabled={removingId === overseer.id}
                              onClick={() => handleRemove(overseer)}
                              className="text-xs text-red-600 hover:text-red-800 min-h-[44px] px-2 touch-manipulation"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        {keyman && (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p className="text-xs text-gray-600">
                              Keyman: {personName(keyman)}
                            </p>
                            {canManageContent && (
                              <button
                                type="button"
                                disabled={removingId === keyman.id}
                                onClick={() => handleRemove(keyman)}
                                className="text-xs text-red-600 hover:text-red-800 min-h-[44px] px-2 touch-manipulation"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Assigned
                        </p>
                        {volunteers.length === 0 ? (
                          <p className="text-gray-500">None yet</p>
                        ) : (
                          <ul className="space-y-1">
                            {volunteers.map((v) => (
                              <li
                                key={v.id}
                                className="flex flex-wrap items-center gap-2 text-gray-900"
                              >
                                <span>{personName(v)}</span>
                                {canManageContent && (
                                  <button
                                    type="button"
                                    disabled={removingId === v.id}
                                    onClick={() => handleRemove(v)}
                                    className="text-xs text-red-600 hover:text-red-800 min-h-[44px] px-2 touch-manipulation"
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
                      <div className="mt-3 flex flex-wrap gap-2">
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
                          Assign volunteer
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setAssignTarget({
                              position,
                              shift,
                              role: 'OVERSEER',
                            })
                          }
                          className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 touch-manipulation"
                        >
                          Set shift overseer
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setAssignTarget({
                              position,
                              shift,
                              role: 'KEYMAN',
                            })
                          }
                          className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 touch-manipulation"
                        >
                          Set keyman
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingShiftKey(rowKey)}
                          className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 touch-manipulation"
                        >
                          Edit times
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddShiftPosition(position)}
                          className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 touch-manipulation"
                        >
                          Add shift
                        </button>
                      </div>
                    )}
                  </>
                )}
              </article>
            )
          })}
        </div>
      )}

      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {assignTarget.role === 'OVERSEER'
                  ? 'Set shift overseer'
                  : assignTarget.role === 'KEYMAN'
                    ? 'Set keyman'
                    : 'Assign volunteer'}
              </h3>
              <p className="text-sm text-gray-600">
                {assignTarget.position.name} · {assignTarget.shift.name}
              </p>
            </div>
            <div className="px-4 py-3">
              <input
                type="search"
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                placeholder="Search name or congregation…"
                className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 min-h-[44px] text-base sm:text-sm"
                autoFocus
              />
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {assignCandidates.map((a) => {
                  const conflict = conflictMap.get(a.id)
                  const hasConflict = conflict?.hasConflict
                  return (
                    <button
                      key={a.id}
                      type="button"
                      disabled={assigning}
                      onClick={() => handleAssign(a.id)}
                      className="flex w-full min-h-[44px] items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-blue-50 touch-manipulation disabled:opacity-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-gray-900">
                          {a.firstName} {a.lastName}
                        </span>
                        {a.congregation && (
                          <span className="block text-xs text-gray-500">
                            {a.congregation}
                          </span>
                        )}
                        {hasConflict && (
                          <span className="mt-0.5 block text-xs text-amber-700">
                            {conflict!.message}
                          </span>
                        )}
                      </span>
                      {hasConflict && (
                        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                          Conflict
                        </span>
                      )}
                    </button>
                  )
                })}
                {assignCandidates.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-500">No matches</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setAssignTarget(null)
                  setAssignSearch('')
                }}
                className="min-h-[44px] rounded-md border border-gray-300 px-4 py-2 text-sm touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900">Add shift</h3>
              <p className="text-sm text-gray-600">{addShiftPosition.name}</p>
            </div>
            <div className="px-4 py-3">
              {filteredPositions.length > 1 && (
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Position
                  </label>
                  <select
                    value={addShiftPosition.id}
                    onChange={(e) => {
                      const next = filteredPositions.find(
                        (p) => p.id === e.target.value
                      )
                      if (next) setAddShiftPosition(next)
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 min-h-[44px] text-base sm:text-sm"
                  >
                    {filteredPositions.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.positionNumber} {p.name || p.positionName}
                      </option>
                    ))}
                    {!filteredPositions.some((p) => p.id === addShiftPosition.id) && (
                      <option value={addShiftPosition.id}>
                        #{addShiftPosition.positionNumber} {addShiftPosition.name}
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
                  shiftDate:
                    activeDay !== 'undated'
                      ? activeDay
                      : eventDateKeys[0] || null,
                }}
                eventDateKeys={eventDateKeys}
                saving={savingNewShift}
                onCancel={() => setAddShiftPosition(null)}
                onSave={handleCreateShift}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
