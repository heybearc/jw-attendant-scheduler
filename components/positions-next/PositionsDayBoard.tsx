import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import {
  countShiftAssignments,
  getShiftVolunteersNeeded,
} from '../../lib/shiftCapacity'
import { formatEventDayLabel } from '../../lib/eventDates'
import { toDateKey } from '../../lib/shiftConflict'
import { sortShiftsByTime } from '../../lib/shiftSort'
import { notifyAlert } from '../../lib/ui/toast'

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
  shift?: { id: string } | null
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

  const dayTabs: DayKey[] = useMemo(() => {
    const keys = [...eventDateKeys]
    const hasUndated = positions.some((p) =>
      (p.shifts || []).some((s) => !toDateKey(s.shiftDate))
    )
    if (hasUndated || keys.length === 0) keys.push('undated')
    return keys
  }, [eventDateKeys, positions])

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
        out.push({ position, shift })
      }
    }
    return out
  }, [filteredPositions, activeDay])

  const handleAssign = async (volunteerId: string) => {
    if (!assignTarget) return
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
        notifyAlert(data.message || data.error || 'Failed to assign')
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
      .slice(0, 40)
  }, [attendants, assignSearch, assignTarget])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {dayTabs.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(day)}
              className={`px-3 py-2 min-h-[44px] rounded-md text-sm font-medium touch-manipulation ${
                activeDay === day
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {day === 'undated' ? 'No day set' : formatEventDayLabel(day)}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter stations…"
          className="w-full sm:w-64 px-3 py-2 min-h-[44px] text-base sm:text-sm border border-gray-300 rounded-md"
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
          No shifts for this day. Set a day on shifts in classic Positions, or pick another day.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ position, shift }) => {
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

            return (
              <article
                key={`${position.id}-${shift.id}`}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
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
                    </p>
                  </div>
                  <div className="text-sm text-gray-700">
                    <span
                      className={`font-medium ${
                        filled >= needed ? 'text-green-700' : 'text-amber-700'
                      }`}
                    >
                      {filled}/{needed} filled
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

                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Shift overseer
                    </p>
                    <p className="text-gray-900">
                      {overseer
                        ? personName(overseer)
                        : positionOverseer
                          ? `${positionOverseer.firstName} ${positionOverseer.lastName} (position)`
                          : '—'}
                    </p>
                    {keyman && (
                      <p className="text-xs text-gray-600">
                        Keyman: {personName(keyman)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Assigned
                    </p>
                    {volunteers.length === 0 ? (
                      <p className="text-gray-500">None yet</p>
                    ) : (
                      <ul className="space-y-0.5">
                        {volunteers.map((v) => (
                          <li key={v.id} className="text-gray-900">
                            {personName(v)}
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
                  </div>
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
                {assignCandidates.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    disabled={assigning}
                    onClick={() => handleAssign(a.id)}
                    className="flex w-full min-h-[44px] items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-blue-50 touch-manipulation disabled:opacity-50"
                  >
                    <span>
                      {a.firstName} {a.lastName}
                    </span>
                    {a.congregation && (
                      <span className="text-xs text-gray-500">{a.congregation}</span>
                    )}
                  </button>
                ))}
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
    </div>
  )
}
