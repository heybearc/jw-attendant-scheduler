import { format, parseISO } from 'date-fns'

/**
 * Serialize PostgreSQL @db.Date (JS Date at UTC midnight for the calendar row) to yyyy-MM-dd.
 * Use this in APIs — `date-fns/format` in the server TZ can turn May 9 into 2026-05-08 on US hosts.
 */
export function toDateOnlyStringUTC(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Format a calendar day for display (event start/end from API).
 * Prefers strict yyyy-MM-dd. Handles legacy full-ISO midnight UTC from old clients.
 */
export function formatCalendarDateLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const s = dateStr.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number)
    return format(new Date(y, m - 1, d), 'MMM d, yyyy')
  }
  const utcMidnight = /^(\d{4})-(\d{2})-(\d{2})T00:00:00(?:\.0+)?Z$/.exec(s)
  if (utcMidnight) {
    const y = Number(utcMidnight[1])
    const m = Number(utcMidnight[2])
    const d = Number(utcMidnight[3])
    return format(new Date(y, m - 1, d), 'MMM d, yyyy')
  }
  try {
    return format(parseISO(s), 'MMM d, yyyy')
  } catch {
    return 'Invalid date'
  }
}
