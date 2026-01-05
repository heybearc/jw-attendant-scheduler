/**
 * PHASE 4: Conflict Detection Utilities
 * Prevents double-booking and detects scheduling conflicts
 */

export interface TimeSlot {
  startTime: string // ISO string or time string
  endTime: string
  isAllDay: boolean
}

export interface Assignment {
  id: string
  attendantId: string
  positionId: string
  eventId: string
  shift?: TimeSlot
  attendant?: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface ConflictResult {
  hasConflict: boolean
  conflictType?: 'time_overlap' | 'double_booking' | 'same_event'
  conflictingAssignment?: Assignment
  message?: string
}

/**
 * Check if two time slots overlap
 */
export function doTimeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  // If either is all-day, they overlap
  if (slot1.isAllDay || slot2.isAllDay) {
    return true
  }

  const start1 = new Date(slot1.startTime).getTime()
  const end1 = new Date(slot1.endTime).getTime()
  const start2 = new Date(slot2.startTime).getTime()
  const end2 = new Date(slot2.endTime).getTime()

  // Check for overlap: start1 < end2 AND start2 < end1
  return start1 < end2 && start2 < end1
}

/**
 * Check if an attendant has a conflict with a proposed assignment
 */
export function checkAttendantConflict(
  attendantId: string,
  proposedShift: TimeSlot,
  proposedEventId: string,
  existingAssignments: Assignment[]
): ConflictResult {
  // Filter assignments for this attendant
  const attendantAssignments = existingAssignments.filter(
    a => a.attendantId === attendantId
  )

  for (const assignment of attendantAssignments) {
    // Check if already assigned to same event
    if (assignment.eventId === proposedEventId) {
      return {
        hasConflict: true,
        conflictType: 'same_event',
        conflictingAssignment: assignment,
        message: `Already assigned to this event at position ${assignment.positionId}`
      }
    }

    // Check for time overlap with other events
    if (assignment.shift && proposedShift) {
      if (doTimeSlotsOverlap(proposedShift, assignment.shift)) {
        return {
          hasConflict: true,
          conflictType: 'time_overlap',
          conflictingAssignment: assignment,
          message: `Time conflict with another event assignment`
        }
      }
    }
  }

  return { hasConflict: false }
}

/**
 * Get all conflicts for an attendant across multiple events
 */
export function getAttendantConflicts(
  attendantId: string,
  allAssignments: Assignment[]
): Assignment[] {
  const attendantAssignments = allAssignments.filter(
    a => a.attendantId === attendantId
  )

  const conflicts: Assignment[] = []

  for (let i = 0; i < attendantAssignments.length; i++) {
    for (let j = i + 1; j < attendantAssignments.length; j++) {
      const a1 = attendantAssignments[i]
      const a2 = attendantAssignments[j]

      if (a1.shift && a2.shift && doTimeSlotsOverlap(a1.shift, a2.shift)) {
        if (!conflicts.find(c => c.id === a1.id)) conflicts.push(a1)
        if (!conflicts.find(c => c.id === a2.id)) conflicts.push(a2)
      }
    }
  }

  return conflicts
}

/**
 * Find alternative attendants who don't have conflicts
 */
export function findAlternativeAttendants(
  proposedShift: TimeSlot,
  proposedEventId: string,
  allAttendants: Array<{ id: string; firstName: string; lastName: string }>,
  allAssignments: Assignment[]
): Array<{ id: string; firstName: string; lastName: string; reason: string }> {
  const alternatives: Array<{ id: string; firstName: string; lastName: string; reason: string }> = []

  for (const attendant of allAttendants) {
    const conflict = checkAttendantConflict(
      attendant.id,
      proposedShift,
      proposedEventId,
      allAssignments
    )

    if (!conflict.hasConflict) {
      alternatives.push({
        ...attendant,
        reason: 'Available - no conflicts'
      })
    }
  }

  return alternatives
}

/**
 * Get conflict summary for a position
 */
export function getPositionConflictSummary(
  positionId: string,
  assignments: Assignment[]
): {
  totalAssignments: number
  conflictCount: number
  conflicts: Assignment[]
} {
  const positionAssignments = assignments.filter(a => a.positionId === positionId)
  const conflicts: Assignment[] = []

  for (let i = 0; i < positionAssignments.length; i++) {
    for (let j = i + 1; j < positionAssignments.length; j++) {
      const a1 = positionAssignments[i]
      const a2 = positionAssignments[j]

      if (a1.shift && a2.shift && doTimeSlotsOverlap(a1.shift, a2.shift)) {
        if (!conflicts.find(c => c.id === a1.id)) conflicts.push(a1)
        if (!conflicts.find(c => c.id === a2.id)) conflicts.push(a2)
      }
    }
  }

  return {
    totalAssignments: positionAssignments.length,
    conflictCount: conflicts.length,
    conflicts
  }
}
