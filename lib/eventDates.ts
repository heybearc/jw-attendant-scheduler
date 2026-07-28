import { parseDateKey, toDateKey } from './shiftConflict'

/** All calendar days from event start through end (inclusive), as YYYY-MM-DD. */
export function enumerateEventDateKeys(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): string[] {
  const startKey = toDateKey(startDate)
  const endKey = toDateKey(endDate)
  if (!startKey) return []
  const lastKey = endKey || startKey

  const keys: string[] = []
  let cursor = parseDateKey(startKey)
  const end = parseDateKey(lastKey)
  // Cap runaway ranges (bad data)
  for (let i = 0; i < 60 && cursor.getTime() <= end.getTime(); i++) {
    keys.push(cursor.toISOString().slice(0, 10))
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  }
  return keys
}

export function formatEventDayLabel(dateKey: string): string {
  const d = parseDateKey(dateKey)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(d)
}

export function isMultiDayEvent(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): boolean {
  const keys = enumerateEventDateKeys(startDate, endDate)
  return keys.length > 1
}
