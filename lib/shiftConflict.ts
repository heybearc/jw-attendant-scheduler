/**
 * Day-aware shift conflict helpers for multi-day events.
 * Shifts only conflict when they share the same calendar day (or both lack a day — legacy).
 */

export type ShiftConflictLike = {
  startTime?: string | null
  endTime?: string | null
  isAllDay?: boolean
  shiftDate?: string | Date | null
}

/** Normalize to YYYY-MM-DD, or null when unset. */
export function toDateKey(value: string | Date | null | undefined): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed.toISOString().slice(0, 10)
  }
  if (Number.isNaN(value.getTime())) return null
  return value.toISOString().slice(0, 10)
}

/** Prisma @db.Date-safe Date from YYYY-MM-DD (noon UTC). */
export function parseDateKey(key: string): Date {
  return new Date(`${key}T12:00:00.000Z`)
}

/**
 * Same scheduling day?
 * - Both dated → compare keys
 * - Neither dated → treat as same day (legacy single-day events)
 * - Only one dated → different days (no clock-time conflict)
 */
export function sameShiftDay(a: ShiftConflictLike, b: ShiftConflictLike): boolean {
  const aKey = toDateKey(a.shiftDate)
  const bKey = toDateKey(b.shiftDate)
  if (aKey && bKey) return aKey === bKey
  if (!aKey && !bKey) return true
  return false
}

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aEnd > bStart && aStart < bEnd
}

/**
 * True when two shifts cannot both be staffed by the same person.
 */
export function shiftsConflict(a: ShiftConflictLike, b: ShiftConflictLike): boolean {
  if (!sameShiftDay(a, b)) return false

  if (a.isAllDay || b.isAllDay) return true

  const aStart = a.startTime || ''
  const aEnd = a.endTime || ''
  const bStart = b.startTime || ''
  const bEnd = b.endTime || ''
  if (!aStart || !aEnd || !bStart || !bEnd) return false

  return timesOverlap(aStart, aEnd, bStart, bEnd)
}
