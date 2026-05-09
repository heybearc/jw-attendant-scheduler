export function toMinutesFromClock(clock: string | null | undefined): number {
  if (!clock || !clock.includes(':')) return Number.POSITIVE_INFINITY
  const [h, m] = clock.split(':').map(Number)
  return h * 60 + m
}

/** Minutes since midnight for count session time (local interpretation, matches existing APIs). */
export function countSessionToTargetMinutes(countTime: Date | null | undefined): number {
  if (!countTime) return Number.POSITIVE_INFINITY
  return countTime.getHours() * 60 + countTime.getMinutes()
}

type ShiftLike = {
  startTime: string | null
  endTime: string | null
  isAllDay: boolean
} | null

/**
 * Rank lower = better. Compare tuples with compareSuggestionRank.
 *
 * Order: (1) timed shift where count time falls inside [start,end], including overnight shifts;
 * (2) nearest timed shift outside that window; (3) all-day; (4) missing/invalid shift.
 */
export function suggestionRankForAssignment(
  targetMinutes: number,
  shift: ShiftLike
): { bucket: number; distance: number } {
  if (!shift) {
    return { bucket: 3, distance: Number.POSITIVE_INFINITY }
  }
  if (shift.isAllDay) {
    return { bucket: 2, distance: 0 }
  }

  const start = toMinutesFromClock(shift.startTime)
  const end = toMinutesFromClock(shift.endTime)
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return { bucket: 3, distance: Number.POSITIVE_INFINITY }
  }

  const inside =
    end >= start
      ? targetMinutes >= start && targetMinutes <= end
      : targetMinutes >= start || targetMinutes <= end

  if (inside) {
    return { bucket: 0, distance: 0 }
  }

  const dist = distanceFromTargetToShiftInterval(targetMinutes, start, end)
  return { bucket: 1, distance: dist }
}

/** Lexicographic: bucket asc, distance asc */
export function compareSuggestionRank(
  a: { bucket: number; distance: number },
  b: { bucket: number; distance: number }
): number {
  if (a.bucket !== b.bucket) return a.bucket - b.bucket
  return a.distance - b.distance
}

function distanceFromTargetToShiftInterval(target: number, start: number, end: number): number {
  if (end >= start) {
    if (target >= start && target <= end) return 0
    if (target < start) return start - target
    return target - end
  }
  // Overnight shift (e.g. 22:00–06:00)
  if (target >= start || target <= end) return 0
  return Math.min(target - end, start - target)
}
