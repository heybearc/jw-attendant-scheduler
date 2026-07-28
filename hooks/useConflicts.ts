/**
 * useConflicts - Client-side conflict detection for position assignments
 * Builds a volunteer → assigned shifts map from position data and detects
 * time overlaps before the user submits, enabling inline warnings.
 *
 * Multi-day: shifts only conflict when they share the same shiftDate
 * (or both are undated — legacy single-day behavior).
 */

import { shiftsConflict } from '../lib/shiftConflict'

export interface ShiftTime {
  id: string
  name: string
  startTime?: string | null
  endTime?: string | null
  isAllDay: boolean
  shiftDate?: string | Date | null
}

export interface ConflictDetail {
  positionName: string
  shiftName: string
  startTime?: string | null
  endTime?: string | null
  shiftDate?: string | Date | null
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
      volunteer?: { id: string } | null
      attendant?: { id: string } | null
      shift?: ShiftTime | null
      shiftId?: string
    }>
  }>
): Map<string, AssignmentEntry[]> {
  const map = new Map<string, AssignmentEntry[]>()

  for (const position of positions) {
    for (const assignment of position.assignments || []) {
      const volunteerId = (assignment.volunteer as any)?.id || (assignment.attendant as any)?.id
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

  const conflicting = existing.filter(e => shiftsConflict(targetShift, e.shift))

  if (conflicting.length === 0) {
    return { hasConflict: false, conflicts: [], message: '' }
  }

  const hasAllDay = targetShift.isAllDay || conflicting.some(e => e.shift.isAllDay)
  return {
    hasConflict: true,
    type: hasAllDay ? 'ALL_DAY_CONFLICT' : 'TIME_OVERLAP',
    conflicts: conflicting.map(e => ({
      positionName: e.positionName,
      shiftName: e.shift.name,
      startTime: e.shift.startTime,
      endTime: e.shift.endTime,
      shiftDate: e.shift.shiftDate
    })),
    message: hasAllDay
      ? `Conflicts with all-day or same-day shift at ${conflicting.map(e => e.positionName).join(', ')}`
      : `Time overlap with ${conflicting.map(e => `${e.positionName} (${e.shift.name})`).join(', ')}`
  }
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
