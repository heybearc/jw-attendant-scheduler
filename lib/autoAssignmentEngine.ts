/**
 * Auto-Assignment Engine for Theoshift
 * APEX GUARDIAN OVERSIGHT-AWARE VERSION v3.0
 * 
 * This module handles the complex logic for automatically assigning attendants
 * to position shifts while respecting oversight boundaries and preventing conflicts.
 * 
 * Extracted from positions.tsx as part of gradual refactoring (Week 1, Step 1)
 */

import { getOpenShiftSlots, getShiftVolunteersNeeded } from './shiftCapacity'
import { shiftsConflict } from './shiftConflict'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Shift {
  id: string
  name: string
  startTime?: string
  endTime?: string
  isAllDay: boolean
  volunteersNeeded?: number
  shiftDate?: string | Date | null
}

export interface Volunteer {
  id: string
  firstName: string
  lastName: string
  isActive: boolean
  overseerId?: string | null
  keymanId?: string | null
  overseer?: {
    id: string
    firstName: string
    lastName: string
  } | null
  keyman?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

export interface Assignment {
  id: string
  role: string
  attendant?: {
    id: string
    firstName: string
    lastName: string
  }
  volunteer?: {
    id: string
    firstName: string
    lastName: string
  }
  overseer?: {
    id: string
    firstName: string
    lastName: string
  }
  keyman?: {
    id: string
    firstName: string
    lastName: string
  }
  shift?: Shift
}

export interface Position {
  id: string
  positionNumber: number
  name: string
  isActive: boolean
  shifts?: Shift[]
  assignments?: Assignment[]
  oversight?: Array<{
    id: string
    overseer?: {
      id: string
      firstName: string
      lastName: string
    }
    keyman?: {
      id: string
      firstName: string
      lastName: string
    }
  }>
}

/** Alias — engine historically used "attendant" naming */
export type Attendant = Volunteer

type UnfilledShiftSlot = {
  position: Position
  shift: Shift
  positionName: string
  shiftName: string
  slotKey: string
}

function getAssignmentPersonId(assignment: Assignment | undefined): string | undefined {
  return assignment?.attendant?.id || assignment?.volunteer?.id
}

export interface AssignmentProgress {
  phase: string
  current: number
  total: number
  message: string
  assignments: Array<{attendant: string, position: string, shift: string}> | string[]
}

export interface AutoAssignmentResult {
  success: boolean
  totalAssignments: number
  hierarchyMatches: number
  fallbackAssignments: number
  attendantsUsed: number
  distribution: {
    with1Shift: number
    with2Shifts: number
    with3PlusShifts: number
  }
  unfilledShifts: number
  message: string
}

export interface AutoAssignmentOptions {
  eventId: string
  positions: Position[]
  attendants: Attendant[]
  onProgress?: (progress: AssignmentProgress) => void
  onLog?: (message: string) => void
}

// ============================================================================
// AUTO-ASSIGNMENT ENGINE CLASS
// ============================================================================

export class AutoAssignmentEngine {
  private eventId: string
  private positions: Position[]
  private attendants: Attendant[]
  private onProgress?: (progress: AssignmentProgress) => void
  private onLog: (message: string) => void
  private logs: string[] = []

  constructor(options: AutoAssignmentOptions) {
    this.eventId = options.eventId
    this.positions = options.positions
    this.attendants = options.attendants
    this.onProgress = options.onProgress
    this.onLog = options.onLog || ((msg) => console.log(msg))
  }

  /**
   * Main execution method for auto-assignment
   */
  async execute(): Promise<AutoAssignmentResult> {
    this.clearLogs()
    this.log('🚨🚨🚨 OVERSIGHT-AWARE v5.0 - TIMESTAMP: ' + Date.now() + ' 🚨🚨🚨')
    this.log('🎯 OVERSIGHT-AWARE AUTO-ASSIGN v5.0 RUNNING!')
    this.log(`📊 Total Positions: ${this.positions.length}`)
    this.log(`📊 Total Attendants: ${this.attendants.length}`)

    try {
      // Calculate total shifts for progress tracking
      const totalShifts = this.positions
        .filter(p => p.isActive)
        .reduce((sum, pos) => sum + (pos.shifts?.length || 0), 0)

      this.updateProgress({
        phase: 'Initializing Smart Auto-Assignment...',
        current: 0,
        total: totalShifts,
        message: `Analyzing ${totalShifts} shifts across ${this.positions.filter(p => p.isActive).length} positions...`,
        assignments: []
      })

      // Filter event-specific attendants
      const eventSpecificAttendants = this.attendants.filter(
        att => att.overseerId || att.keymanId
      )
      this.log(`📊 Event-specific attendants (with oversight): ${eventSpecificAttendants.length}`)

      // Get leadership IDs to avoid assigning them as regular attendants
      const leadershipAttendantIds = this.getLeadershipAttendantIds()

      // Find available attendants (not in leadership roles)
      const availableAttendants = eventSpecificAttendants.filter(
        att => att.isActive && !leadershipAttendantIds.has(att.id)
      )

      this.log(`👥 Available attendants for assignment: ${availableAttendants.length}`)

      // Group attendants by their assigned leadership
      const attendantsByLeadership = this.groupAttendantsByLeadership(availableAttendants)
      this.log(`📊 Attendant leadership groups: ${attendantsByLeadership.size}`)

      // Group positions by their leadership
      const positionsByLeadership = this.groupPositionsByLeadership()

      let assignmentCount = 0
      let hierarchyMatches = 0
      let progressCount = 0

      // Phase 2: Balanced shift assignment with round-robin
      this.log('📅 Phase 3: Filling ALL remaining shifts with balanced round-robin assignment...')

      const allAttendantsByOversight = this.groupAllAttendantsByOversight(
        eventSpecificAttendants
      )

      // Collect all unfilled shifts grouped by oversight
      const unfilledShiftsByOversight = this.collectUnfilledShifts()

      this.log(`📅 Unfilled shifts by oversight:`)
      unfilledShiftsByOversight.forEach((shifts, key) => {
        this.log(`   ${key}: ${shifts.length} unfilled shifts`)
      })

      // Round-robin assignment for each oversight group (primary match)
      for (const [leadershipKey, unfilledShifts] of unfilledShiftsByOversight.entries()) {
        const availableAttendantsInGroup = allAttendantsByOversight.get(leadershipKey) || []

        if (availableAttendantsInGroup.length === 0) {
          this.log(`⚠️ No matched attendants for oversight group: ${leadershipKey} (will try cross-oversight fallback)`)
          continue
        }

        this.log(
          `🔄 Round-robin assignment for ${leadershipKey}: ${unfilledShifts.length} shifts, ${availableAttendantsInGroup.length} attendants`
        )

        const result = await this.performRoundRobinAssignment(
          leadershipKey,
          unfilledShifts,
          availableAttendantsInGroup,
          progressCount
        )

        assignmentCount += result.assignmentCount
        hierarchyMatches += result.assignmentCount
        progressCount = result.progressCount
      }

      // Cross-oversight fallback: fill leftover capacity from any free volunteer
      this.log('📅 Phase 4: Cross-oversight fallback for remaining slots...')
      const remainingByOversight = this.collectUnfilledShifts()
      const remainingSlots: UnfilledShiftSlot[] = []
      remainingByOversight.forEach(slots => {
        remainingSlots.push(...slots)
      })

      let fallbackAssignments = 0
      if (remainingSlots.length > 0) {
        const fallbackPool = this.getAssignableAttendants(eventSpecificAttendants)
        this.log(
          `🔄 Fallback: ${remainingSlots.length} open slot(s), ${fallbackPool.length} attendant(s) available across oversight`
        )

        if (fallbackPool.length > 0) {
          const fallbackResult = await this.performRoundRobinAssignment(
            'cross-oversight-fallback',
            remainingSlots,
            fallbackPool,
            progressCount
          )
          fallbackAssignments = fallbackResult.assignmentCount
          assignmentCount += fallbackAssignments
          progressCount = fallbackResult.progressCount
          this.log(`✅ Fallback assigned ${fallbackAssignments} slot(s) across oversight`)
        } else {
          this.log('⚠️ Fallback skipped — no assignable attendants left')
        }
      } else {
        this.log('✅ No remaining slots — fallback not needed')
      }

      // Calculate final statistics
      return this.calculateFinalStatistics(
        assignmentCount,
        hierarchyMatches,
        fallbackAssignments,
        positionsByLeadership
      )
    } catch (error) {
      this.log(`❌ Auto-assign error: ${error}`)
      throw error
    }
  }

  /**
   * Get IDs of attendants in leadership roles (overseers/keymen)
   */
  private getLeadershipAttendantIds(): Set<string> {
    const leadershipIds = new Set<string>()

    this.positions.forEach(position => {
      position.assignments?.forEach(assignment => {
        if (assignment.overseer?.id) {
          leadershipIds.add(assignment.overseer.id)
        }
        if (assignment.keyman?.id) {
          leadershipIds.add(assignment.keyman.id)
        }
      })
    })

    return leadershipIds
  }

  /**
   * Group attendants by their oversight (overseer/keyman combination)
   */
  private groupAttendantsByLeadership(attendants: Attendant[]): Map<string, Attendant[]> {
    const grouped = new Map<string, Attendant[]>()

    attendants.forEach(attendant => {
      // Exclude overseers and keymen from being assigned as attendants
      const isOverseer = this.positions.some(pos =>
        pos.oversight?.some(o => o.overseer?.id === attendant.id)
      )
      const isKeyman = this.positions.some(pos =>
        pos.oversight?.some(o => o.keyman?.id === attendant.id)
      )

      if (isOverseer || isKeyman) {
        this.log(
          `🚫 EXCLUDING ${attendant.firstName} ${attendant.lastName} - is ${isOverseer ? 'Overseer' : 'Keyman'}`
        )
        return
      }

      const overseerId = attendant.overseerId || 'none'
      const keymanId = attendant.keymanId || 'none'
      const leadershipKey = `${overseerId}-${keymanId}`

      if (!grouped.has(leadershipKey)) {
        grouped.set(leadershipKey, [])
      }
      grouped.get(leadershipKey)!.push(attendant)
    })

    return grouped
  }

  /**
   * Group positions by their oversight
   */
  private groupPositionsByLeadership(): Map<string, Position[]> {
    const grouped = new Map<string, Position[]>()
    const positionsNeedingAttendants = this.positions.filter(pos => pos.isActive)

    positionsNeedingAttendants.forEach(position => {
      const oversight = position.oversight && position.oversight.length > 0 ? position.oversight[0] : null
      const overseerId = oversight?.overseer?.id || 'none'
      const keymanId = oversight?.keyman?.id || 'none'
      const leadershipKey = `${overseerId}-${keymanId}`

      if (!grouped.has(leadershipKey)) {
        grouped.set(leadershipKey, [])
      }
      grouped.get(leadershipKey)!.push(position)
    })

    return grouped
  }

  /**
   * Active attendants who are not position overseers/keymen (eligible for volunteer slots).
   */
  private getAssignableAttendants(attendants: Attendant[]): Attendant[] {
    return attendants.filter(attendant => {
      if (!attendant.isActive) return false
      const isOverseer = this.positions.some(pos =>
        pos.oversight?.some(o => o.overseer?.id === attendant.id)
      )
      const isKeyman = this.positions.some(pos =>
        pos.oversight?.some(o => o.keyman?.id === attendant.id)
      )
      return !isOverseer && !isKeyman
    })
  }

  /**
   * Group all attendants by oversight (including those already assigned)
   */
  private groupAllAttendantsByOversight(attendants: Attendant[]): Map<string, Attendant[]> {
    const grouped = new Map<string, Attendant[]>()
    const excludedAttendants: string[] = []

    attendants.forEach(attendant => {
      // Skip overseers/keymen
      const isOverseer = this.positions.some(pos =>
        pos.oversight?.some(o => o.overseer?.id === attendant.id)
      )
      const isKeyman = this.positions.some(pos =>
        pos.oversight?.some(o => o.keyman?.id === attendant.id)
      )

      if (isOverseer || isKeyman) {
        excludedAttendants.push(
          `${attendant.firstName} ${attendant.lastName} (${isOverseer ? 'Overseer' : 'Keyman'})`
        )
        return
      }

      const overseerId = attendant.overseer?.id || attendant.overseerId || 'none'
      const keymanId = attendant.keyman?.id || attendant.keymanId || 'none'
      const leadershipKey = `${overseerId}-${keymanId}`

      if (!grouped.has(leadershipKey)) {
        grouped.set(leadershipKey, [])
      }
      grouped.get(leadershipKey)!.push(attendant)
    })

    this.log(`🚫 TOTAL EXCLUDED: ${excludedAttendants.length} attendants`)
    return grouped
  }

  /**
   * Collect open shift slots grouped by effective oversight.
   * Prefers shift-level OVERSEER/KEYMAN when present; falls back to position oversight.
   * Emits one entry per open capacity slot (volunteersNeeded, default 1).
   */
  private collectUnfilledShifts(): Map<string, UnfilledShiftSlot[]> {
    const unfilledShifts = new Map<string, UnfilledShiftSlot[]>()

    this.positions.forEach(position => {
      if (!position.shifts || position.shifts.length === 0) return

      const positionOversight = position.oversight?.[0]
      const hasOversight = positionOversight?.overseer || positionOversight?.keyman

      // Include All Day shifts ONLY if position has oversight
      const shiftsToFill = hasOversight
        ? position.shifts
        : position.shifts?.filter(shift => !shift.isAllDay) || []

      shiftsToFill.forEach(shift => {
        const shiftAssignments = position.assignments?.filter(a => a.shift?.id === shift.id) || []
        const shiftOverseer = shiftAssignments.find(a => a.role === 'OVERSEER')
        const shiftKeyman = shiftAssignments.find(a => a.role === 'KEYMAN')

        const overseerId =
          getAssignmentPersonId(shiftOverseer) ||
          positionOversight?.overseer?.id ||
          'none'
        const keymanId =
          getAssignmentPersonId(shiftKeyman) ||
          positionOversight?.keyman?.id ||
          'none'
        const leadershipKey = `${overseerId}-${keymanId}`

        const openSlots = getOpenShiftSlots(shift, position.assignments)
        const filled = getShiftVolunteersNeeded(shift) - openSlots

        for (let i = 0; i < openSlots; i++) {
          if (!unfilledShifts.has(leadershipKey)) {
            unfilledShifts.set(leadershipKey, [])
          }
          unfilledShifts.get(leadershipKey)!.push({
            position,
            shift,
            positionName: position.name,
            shiftName: shift.name,
            slotKey: `${shift.id}#${filled + i}`
          })
        }
      })
    })

    return unfilledShifts
  }

  /**
   * Perform round-robin assignment for a specific oversight group
   */
  private async performRoundRobinAssignment(
    leadershipKey: string,
    unfilledShifts: UnfilledShiftSlot[],
    availableAttendants: Attendant[],
    initialProgressCount: number
  ): Promise<{assignmentCount: number, progressCount: number}> {
    let progressCount = initialProgressCount

    // Track assignments per attendant
    const attendantAssignments = new Map<string, Shift[]>()
    availableAttendants.forEach(att => {
      const existingShifts = this.positions
        .flatMap(pos => pos.assignments || [])
        .filter(a => getAssignmentPersonId(a) === att.id)
        .map(a => a.shift)
        .filter((s): s is Shift => s !== undefined)

      attendantAssignments.set(att.id, existingShifts)
    })

    // Cap per person from remaining work + existing load (multi-day needs 3+).
    const totalShiftsToFill = unfilledShifts.length
    const totalAttendants = availableAttendants.length
    const existingAssignmentTotal = availableAttendants.reduce(
      (sum, att) => sum + (attendantAssignments.get(att.id)?.length || 0),
      0
    )
    const projectedTotal = existingAssignmentTotal + totalShiftsToFill
    const maxShiftsPerAttendant =
      totalAttendants === 0 ? 0 : Math.max(1, Math.ceil(projectedTotal / totalAttendants))

    this.log(`📊 Smart Distribution for ${leadershipKey}:`)
    this.log(`   Total slots to fill: ${totalShiftsToFill}`)
    this.log(`   Total attendants: ${totalAttendants}`)
    this.log(`   Existing assignments: ${existingAssignmentTotal}`)
    this.log(`   Max slots per attendant: ${maxShiftsPerAttendant}`)

    // Sort shifts by day, then position number, then time (fill earlier days first)
    const sortedShifts = [...unfilledShifts].sort((a, b) => {
      const aDay = a.shift.shiftDate ? String(a.shift.shiftDate) : ''
      const bDay = b.shift.shiftDate ? String(b.shift.shiftDate) : ''
      if (aDay !== bDay) return aDay.localeCompare(bDay)

      const posNumDiff = (a.position.positionNumber || 0) - (b.position.positionNumber || 0)
      if (posNumDiff !== 0) return posNumDiff

      const aTime = a.shift.startTime || '00:00'
      const bTime = b.shift.startTime || '00:00'
      return aTime.localeCompare(bTime)
    })

    const assignedSlotKeys = new Set<string>()
    let totalAssignments = 0
    let attendantIndex = 0

    // Pass N: give attendants their Nth shift (supports 3+ day events)
    for (let targetCount = 1; targetCount <= maxShiftsPerAttendant; targetCount++) {
      const remainingShifts = sortedShifts.filter(shiftInfo => !assignedSlotKeys.has(shiftInfo.slotKey))
      if (remainingShifts.length === 0) break

      this.log(`📍 PASS ${targetCount}: Assigning shift #${targetCount}...`)
      let passAssignments = 0

      for (const shiftInfo of remainingShifts) {
        let assigned = false
        let attempts = 0

        while (!assigned && attempts < availableAttendants.length * 2) {
          const attendant = availableAttendants[attendantIndex % availableAttendants.length]
          const attendantCurrentAssignments = attendantAssignments.get(attendant.id) || []

          // This pass only bumps attendants who currently have (targetCount - 1) shifts
          if (attendantCurrentAssignments.length !== targetCount - 1) {
            attendantIndex++
            attempts++
            continue
          }

          // Avoid stacking multiple shifts on the same position (variety across days/positions)
          if (targetCount > 1) {
            const alreadyAtPosition = this.positions
              .filter(p => p.id === shiftInfo.position.id)
              .flatMap(p => p.assignments || [])
              .some(a => getAssignmentPersonId(a) === attendant.id)

            if (alreadyAtPosition) {
              attendantIndex++
              attempts++
              continue
            }
          }

          const hasConflict = this.checkTimeConflict(attendantCurrentAssignments, shiftInfo.shift)

          if (!hasConflict) {
            const success = await this.assignAttendantToShift(
              shiftInfo.position.id,
              attendant.id,
              shiftInfo.shift.id,
              attendant
            )

            if (success) {
              passAssignments++
              totalAssignments++
              progressCount++
              attendantCurrentAssignments.push(shiftInfo.shift)
              attendantAssignments.set(attendant.id, attendantCurrentAssignments)
              assignedSlotKeys.add(shiftInfo.slotKey)
              assigned = true

              this.updateProgress({
                phase: `Phase 2: Pass ${targetCount} - Shift #${targetCount}`,
                current: progressCount,
                total: 0,
                message: `Assigning shift #${targetCount} (${passAssignments} this pass)...`,
                assignments: [
                  `${attendant.firstName} ${attendant.lastName} → ${shiftInfo.positionName} (${shiftInfo.shiftName})`
                ]
              })
            }
          }

          attendantIndex++
          attempts++
        }
      }

      this.log(`✅ Pass ${targetCount} complete: ${passAssignments} assignments`)
    }

    return {
      assignmentCount: totalAssignments,
      progressCount
    }
  }

  /**
   * Check if a shift conflicts with existing assignments
   */
  private checkTimeConflict(existingShifts: Shift[], newShift: Shift): boolean {
    return existingShifts.some(existingShift => shiftsConflict(existingShift, newShift))
  }

  /**
   * Assign an attendant to a shift via API
   */
  private async assignAttendantToShift(
    positionId: string,
    attendantId: string,
    shiftId: string,
    attendant?: Attendant
  ): Promise<boolean> {
    try {
      const response = await fetch(`/api/events/${this.eventId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId,
          volunteerId: attendantId,
          shiftId,
          role: 'VOLUNTEER'
        })
      })

      if (!response.ok) return false

      // Keep in-memory assignments in sync for Pass 2 / stats
      const position = this.positions.find(p => p.id === positionId)
      const shift = position?.shifts?.find(s => s.id === shiftId)
      if (position && attendant) {
        if (!position.assignments) position.assignments = []
        position.assignments.push({
          id: `local-${Date.now()}-${attendantId}`,
          role: 'VOLUNTEER',
          attendant: {
            id: attendant.id,
            firstName: attendant.firstName,
            lastName: attendant.lastName
          },
          volunteer: {
            id: attendant.id,
            firstName: attendant.firstName,
            lastName: attendant.lastName
          },
          shift
        })
      }

      return true
    } catch (error) {
      this.log(`❌ Assignment API error: ${error}`)
      return false
    }
  }

  /**
   * Calculate final statistics and build result message
   */
  private calculateFinalStatistics(
    assignmentCount: number,
    hierarchyMatches: number,
    fallbackAssignments: number,
    positionsByLeadership: Map<string, Position[]>
  ): AutoAssignmentResult {
    // Calculate distribution statistics
    const allAssignedAttendants = new Map<string, number>()
    this.positions.forEach(pos => {
      pos.assignments?.forEach(a => {
        const person = a.attendant || a.volunteer
        if (person) {
          const name = `${person.firstName} ${person.lastName}`
          allAssignedAttendants.set(name, (allAssignedAttendants.get(name) || 0) + 1)
        }
      })
    })

    const distributionCounts = new Map<number, number>()
    allAssignedAttendants.forEach(count => {
      distributionCounts.set(count, (distributionCounts.get(count) || 0) + 1)
    })

    const with1Shift = distributionCounts.get(1) || 0
    const with2Shifts = distributionCounts.get(2) || 0
    const with3PlusShifts = Array.from(distributionCounts.keys())
      .filter(k => k >= 3)
      .reduce((sum, k) => sum + (distributionCounts.get(k) || 0), 0)

    // Calculate unfilled slots (capacity-aware)
    let totalUnfilledShifts = 0
    for (const positionsGroup of positionsByLeadership.values()) {
      for (const position of positionsGroup) {
        const shifts = position.shifts?.filter(s => !s.isAllDay) || []
        for (const shift of shifts) {
          totalUnfilledShifts += getOpenShiftSlots(shift, position.assignments)
        }
      }
    }

    // Build final message
    let message = `🎯 Oversight-Aware Auto-Assign Complete!\n\n`
    message += `✅ Total Assignments: ${assignmentCount}\n`
    message += `   • ${hierarchyMatches} matched their overseer/keyman\n`
    if (fallbackAssignments > 0) {
      message += `   • ${fallbackAssignments} filled from other oversight groups (capacity fallback)\n`
    }
    message += `👥 Attendants Used: ${allAssignedAttendants.size}\n\n`
    message += `📊 Distribution:\n`
    message += `   • ${with1Shift} attendants with 1 shift\n`
    message += `   • ${with2Shifts} attendants with 2 shifts\n`

    if (with3PlusShifts > 0) {
      message += `   • ${with3PlusShifts} attendants with 3+ shifts\n`
    }

    message += `\n💡 Primary fill respects oversight; leftover slots use cross-oversight fallback.`

    if (totalUnfilledShifts > 0) {
      message += `\n\n⚠️ ${totalUnfilledShifts} slots remain unfilled - insufficient attendants!`
    }

    return {
      success: true,
      totalAssignments: assignmentCount,
      hierarchyMatches,
      fallbackAssignments,
      attendantsUsed: allAssignedAttendants.size,
      distribution: {
        with1Shift,
        with2Shifts,
        with3PlusShifts
      },
      unfilledShifts: totalUnfilledShifts,
      message
    }
  }

  /**
   * Logging helper
   */
  private log(message: string): void {
    this.logs.push(message)
    this.onLog(message)
  }

  /**
   * Clear logs
   */
  private clearLogs(): void {
    this.logs = []
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('autoAssignLogs', JSON.stringify([]))
    }
  }

  /**
   * Update progress callback
   */
  private updateProgress(progress: AssignmentProgress): void {
    if (this.onProgress) {
      this.onProgress(progress)
    }
  }

  /**
   * Get all logs
   */
  public getLogs(): string[] {
    return this.logs
  }
}
