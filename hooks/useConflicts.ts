/**
 * useConflicts - Client-side conflict detection for position assignments
 * Builds a volunteer → assigned shifts map from position data and detects
 * time overlaps before the user submits, enabling inline warnings.
 */

export interface ShiftTime {
  id: string
  name: string
  startTime?: string | null
  endTime?: string | null
  isAllDay: boolean
}

export interface ConflictDetail {
  positionName: string
  shiftName: string
  startTime?: string | null
  endTime?: string | null
}

export type ConflictType = 'TIME_OVERLAP' | 'ALL_DAY_CONFLICT' | 'DUPLICATE_SHIFT'

export interface ConflictResult {
  hasConflict: boolean
  type?: ConflictType
  conflicts: ConflictDetail[]
  message: string
}

interface AssignmentEntry {
  shiftId: string
  shift: ShiftTime
  positionName: string
}

/**
 * Build a map of volunteerId → list of their current assignments (with shift times)
 * from the positions array already loaded on the page.
 */
export function buildVolunteerAssignmentMap(
  positions: Array<{
    name: string
    assignments?: Array<{
      attendant?: { id: string } | null
      shift?: ShiftTime | null
      shiftId?: string
    }>
  }>
): Map<string, AssignmentEntry[]> {
  const map = new Map<string, AssignmentEntry[]>()

  for (const position of positions) {
    for (const assignment of position.assignments || []) {
      const volunteerId = assignment.attendant?.id
      const shift = assignment.shift
      if (!volunteerId || !shift) continue

      const existing = map.get(volunteerId) || []
      existing.push({
        shiftId: shift.id,
        shift,
        positionName: position.name
      })
      map.set(volunteerId, existing)
    }
  }

  return map
}

/**
 * Check if two time strings overlap.
 * Times are HH:MM strings (24h). Returns true if they overlap.
 */
function timesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aEnd > bStart && aStart < bEnd
}

/**
 * Given a volunteer and a target shift, determine if there is a conflict
 * with their existing assignments.
 */
export function detectConflict(
  volunteerId: string,
  targetShift: ShiftTime,
  assignmentMap: Map<string, AssignmentEntry[]>
): ConflictResult {
  const existing = assignmentMap.get(volunteerId) || []

  // Duplicate shift check
  if (existing.some(e => e.shiftId === targetShift.id)) {
    return {
      hasConflict: true,
      type: 'DUPLICATE_SHIFT',
      conflicts: [],
      message: 'Already assigned to this shift'
    }
  }

  // All-day conflict: volunteer has all-day shift, or target is all-day and they have others
  const hasAllDay = existing.some(e => e.shift.isAllDay)
  if (hasAllDay) {
    const conflict = existing.find(e => e.shift.isAllDay)!
    return {
      hasConflict: true,
      type: 'ALL_DAY_CONFLICT',
      conflicts: [{ positionName: conflict.positionName, shiftName: conflict.shift.name }],
      message: `Already has an all-day shift at ${conflict.positionName}`
    }
  }

  if (targetShift.isAllDay && existing.length > 0) {
    return {
      hasConflict: true,
      type: 'ALL_DAY_CONFLICT',
      conflicts: existing.map(e => ({ positionName: e.positionName, shiftName: e.shift.name })),
      message: 'Has existing shifts — cannot assign all-day shift'
    }
  }

  // Time overlap check
  if (!targetShift.isAllDay && targetShift.startTime && targetShift.endTime) {
    const overlapping = existing.filter(e => {
      const s = e.shift
      if (!s || s.isAllDay || !s.startTime || !s.endTime) return false
      return timesOverlap(targetShift.startTime!, targetShift.endTime!, s.startTime, s.endTime)
    })

    if (overlapping.length > 0) {
      return {
        hasConflict: true,
        type: 'TIME_OVERLAP',
        conflicts: overlapping.map(e => ({
          positionName: e.positionName,
          shiftName: e.shift.name,
          startTime: e.shift.startTime,
          endTime: e.shift.endTime
        })),
        message: `Time overlap with ${overlapping.map(e => `${e.positionName} (${e.shift.name})`).join(', ')}`
      }
    }
  }

  return { hasConflict: false, conflicts: [], message: '' }
}

/**
 * Get conflict status for every volunteer for a given target shift.
 * Returns a Map<volunteerId, ConflictResult>.
 */
export function getConflictsForShift(
  volunteerIds: string[],
  targetShift: ShiftTime | null,
  assignmentMap: Map<string, AssignmentEntry[]>
): Map<string, ConflictResult> {
  const result = new Map<string, ConflictResult>()
  if (!targetShift) return result

  for (const id of volunteerIds) {
    result.set(id, detectConflict(id, targetShift, assignmentMap))
  }

  return result
}
