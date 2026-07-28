/**
 * Sort position shifts AM → PM by start time.
 * All-day shifts sort last (they cover the whole day).
 */

export type ShiftTimeLike = {
  id: string
  name?: string
  startTime?: string | null
  endTime?: string | null
  isAllDay?: boolean
  sequence?: number
  volunteersNeeded?: number | null
  shiftDate?: string | Date | null
}

/** Normalize "7:50" / "07:50" / "07:50:00" → minutes from midnight for compare. */
export function shiftStartMinutes(shift: ShiftTimeLike): number | null {
  if (shift.isAllDay) return null
  const raw = (shift.startTime || '').trim()
  if (!raw) return null
  const parts = raw.split(':')
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1] || '0', 10)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function shiftDateKey(shift: ShiftTimeLike): string {
  if (!shift.shiftDate) return ''
  if (typeof shift.shiftDate === 'string') {
    return shift.shiftDate.slice(0, 10)
  }
  return shift.shiftDate.toISOString().slice(0, 10)
}

export function compareShiftsByTime(a: ShiftTimeLike, b: ShiftTimeLike): number {
  const dateCmp = shiftDateKey(a).localeCompare(shiftDateKey(b))
  if (dateCmp !== 0) return dateCmp

  const aAllDay = !!a.isAllDay
  const bAllDay = !!b.isAllDay
  if (aAllDay && !bAllDay) return 1
  if (!aAllDay && bAllDay) return -1
  if (aAllDay && bAllDay) {
    return (a.sequence ?? 0) - (b.sequence ?? 0) || (a.name || '').localeCompare(b.name || '')
  }

  const aMin = shiftStartMinutes(a)
  const bMin = shiftStartMinutes(b)
  if (aMin !== null && bMin !== null && aMin !== bMin) return aMin - bMin
  if (aMin !== null && bMin === null) return -1
  if (aMin === null && bMin !== null) return 1

  const aEnd = (a.endTime || '').trim()
  const bEnd = (b.endTime || '').trim()
  if (aEnd && bEnd && aEnd !== bEnd) return aEnd.localeCompare(bEnd)

  return (a.sequence ?? 0) - (b.sequence ?? 0) || (a.name || '').localeCompare(b.name || '')
}

export function sortShiftsByTime<T extends ShiftTimeLike>(shifts: T[] | null | undefined): T[] {
  if (!shifts?.length) return []
  return [...shifts].sort(compareShiftsByTime)
}
