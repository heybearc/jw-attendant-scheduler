/**
 * Auto-Assignment Engine for Theoshift
 * APEX GUARDIAN OVERSIGHT-AWARE VERSION v3.0
 * 
 * This module handles the complex logic for automatically assigning attendants
 * to position shifts while respecting oversight boundaries and preventing conflicts.
 * 
 * Extracted from positions.tsx as part of gradual refactoring (Week 1, Step 1)
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Shift {
  id: string
  name: string
  startTime?: string
  endTime?: string
  isAllDay: boolean
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
  attendant: {
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

      // Round-robin assignment for each oversight group
      for (const [leadershipKey, unfilledShifts] of unfilledShiftsByOversight.entries()) {
        const availableAttendantsInGroup = allAttendantsByOversight.get(leadershipKey) || []

        if (availableAttendantsInGroup.length === 0) {
          this.log(`⚠️ No attendants available for oversight group: ${leadershipKey}`)
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
        progressCount = result.progressCount
      }

      // Calculate final statistics
      return this.calculateFinalStatistics(assignmentCount, hierarchyMatches, positionsByLeadership)
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

      const overseerId = attendant.overseer?.id || 'none'
      const keymanId = attendant.keyman?.id || 'none'
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
   * Collect all unfilled shifts grouped by oversight
   */
  private collectUnfilledShifts(): Map<string, Array<{position: Position, shift: Shift, positionName: string, shiftName: string}>> {
    const unfilledShifts = new Map<string, Array<{position: Position, shift: Shift, positionName: string, shiftName: string}>>()

    this.positions.forEach(position => {
      if (!position.shifts || position.shifts.length === 0) return

      const positionOversight = position.oversight?.[0]
      const hasOversight = positionOversight?.overseer || positionOversight?.keyman

      // Include All Day shifts ONLY if position has oversight
      const shiftsToFill = hasOversight
        ? position.shifts
        : position.shifts?.filter(shift => !shift.isAllDay) || []

      const positionOverseerId = positionOversight?.overseer?.id || 'none'
      const positionKeymanId = positionOversight?.keyman?.id || 'none'
      const positionLeadershipKey = `${positionOverseerId}-${positionKeymanId}`

      shiftsToFill.forEach(shift => {
        const currentAssignments = position.assignments?.filter(a => a.shift?.id === shift.id).length || 0
        if (currentAssignments === 0) {
          if (!unfilledShifts.has(positionLeadershipKey)) {
            unfilledShifts.set(positionLeadershipKey, [])
          }
          unfilledShifts.get(positionLeadershipKey)!.push({
            position,
            shift,
            positionName: position.name,
            shiftName: shift.name
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
    unfilledShifts: Array<{position: Position, shift: Shift, positionName: string, shiftName: string}>,
    availableAttendants: Attendant[],
    initialProgressCount: number
  ): Promise<{assignmentCount: number, progressCount: number}> {
    let progressCount = initialProgressCount

    // Track assignments per attendant
    const attendantAssignments = new Map<string, Shift[]>()
    availableAttendants.forEach(att => {
      const existingShifts = this.positions
        .flatMap(pos => pos.assignments || [])
        .filter(a => a.attendant?.id === att.id)
        .map(a => a.shift)
        .filter((s): s is Shift => s !== undefined)

      attendantAssignments.set(att.id, existingShifts)
    })

    // Calculate optimal distribution
    const totalShiftsToFill = unfilledShifts.length
    const totalAttendants = availableAttendants.length
    const avgShiftsPerAttendant = totalShiftsToFill / totalAttendants
    const attendantsWithTwoShifts = Math.ceil((avgShiftsPerAttendant - 1) * totalAttendants)
    const maxShiftsPerAttendant = Math.ceil(avgShiftsPerAttendant)

    this.log(`📊 Smart Distribution for ${leadershipKey}:`)
    this.log(`   Total shifts to fill: ${totalShiftsToFill}`)
    this.log(`   Total attendants: ${totalAttendants}`)
    this.log(`   Average: ${avgShiftsPerAttendant.toFixed(2)} shifts per attendant`)
    this.log(`   Max shifts per attendant: ${maxShiftsPerAttendant}`)

    // Sort shifts by position number, then by time
    const sortedShifts = [...unfilledShifts].sort((a, b) => {
      const posNumDiff = (a.position.positionNumber || 0) - (b.position.positionNumber || 0)
      if (posNumDiff !== 0) return posNumDiff

      const aTime = a.shift.startTime || '00:00'
      const bTime = b.shift.startTime || '00:00'
      return aTime.localeCompare(bTime)
    })

    // PASS 1: Give everyone 1 shift first
    this.log(`📍 PASS 1: Assigning first shift to each attendant...`)
    let attendantIndex = 0
    let pass1Assignments = 0

    for (const shiftInfo of sortedShifts) {
      if (pass1Assignments >= totalAttendants) break

      let assigned = false
      let attempts = 0

      while (!assigned && attempts < availableAttendants.length) {
        const attendant = availableAttendants[attendantIndex % availableAttendants.length]
        const attendantCurrentAssignments = attendantAssignments.get(attendant.id) || []

        if (attendantCurrentAssignments.length > 0) {
          attendantIndex++
          attempts++
          continue
        }

        const hasConflict = this.checkTimeConflict(attendantCurrentAssignments, shiftInfo.shift)

        if (!hasConflict) {
          const success = await this.assignAttendantToShift(
            shiftInfo.position.id,
            attendant.id,
            shiftInfo.shift.id
          )

          if (success) {
            pass1Assignments++
            progressCount++
            attendantCurrentAssignments.push(shiftInfo.shift)
            attendantAssignments.set(attendant.id, attendantCurrentAssignments)
            assigned = true

            this.updateProgress({
              phase: 'Phase 2: Pass 1 - First Shift',
              current: progressCount,
              total: 0,
              message: `Assigning first shift to each attendant (${pass1Assignments}/${totalAttendants})...`,
              assignments: [`${attendant.firstName} ${attendant.lastName} → ${shiftInfo.positionName} (${shiftInfo.shiftName})`]
            })
          }
        }

        attendantIndex++
        attempts++
      }
    }

    this.log(`✅ Pass 1 complete: ${pass1Assignments} attendants have 1 shift each`)

    // PASS 2: Assign second shifts
    this.log(`📍 PASS 2: Assigning second shifts to ${attendantsWithTwoShifts} attendants...`)

    const assignedShiftIds = new Set<string>()
    attendantAssignments.forEach(shifts => {
      shifts.forEach(shift => assignedShiftIds.add(shift.id))
    })

    const remainingShifts = sortedShifts.filter(shiftInfo => !assignedShiftIds.has(shiftInfo.shift.id))

    attendantIndex = 0
    let pass2Assignments = 0
    let attendantsWithSecondShift = 0

    for (const shiftInfo of remainingShifts) {
      if (attendantsWithSecondShift >= attendantsWithTwoShifts) {
        this.log(`⏹️  Pass 2 target reached: ${attendantsWithSecondShift} attendants have 2 shifts`)
        break
      }

      let assigned = false
      let attempts = 0

      while (!assigned && attempts < availableAttendants.length * 2) {
        const attendant = availableAttendants[attendantIndex % availableAttendants.length]
        const attendantCurrentAssignments = attendantAssignments.get(attendant.id) || []

        // Skip if attendant already has 2 or more shifts
        if (attendantCurrentAssignments.length >= 2) {
          attendantIndex++
          attempts++
          continue
        }

        // Only assign to attendants with exactly 1 shift (for their 2nd shift)
        if (attendantCurrentAssignments.length !== 1) {
          attendantIndex++
          attempts++
          continue
        }

        // Check if attendant already has a shift at this position
        const existingAssignmentsAtThisPosition = this.positions
          .filter(p => p.id === shiftInfo.position.id)
          .flatMap(p => p.assignments || [])
          .filter(a => a.attendant?.id === attendant.id)

        if (existingAssignmentsAtThisPosition.length > 0) {
          attendantIndex++
          attempts++
          continue
        }

        const hasConflict = this.checkTimeConflict(attendantCurrentAssignments, shiftInfo.shift)

        if (!hasConflict) {
          const success = await this.assignAttendantToShift(
            shiftInfo.position.id,
            attendant.id,
            shiftInfo.shift.id
          )

          if (success) {
            pass2Assignments++
            progressCount++
            attendantCurrentAssignments.push(shiftInfo.shift)
            attendantAssignments.set(attendant.id, attendantCurrentAssignments)

            if (attendantCurrentAssignments.length === 2) {
              attendantsWithSecondShift++
            }

            assigned = true

            this.updateProgress({
              phase: 'Phase 2: Pass 2 - Second Shift',
              current: progressCount,
              total: 0,
              message: `Assigning second shifts (${attendantsWithSecondShift}/${attendantsWithTwoShifts} attendants with 2 shifts)...`,
              assignments: [`${attendant.firstName} ${attendant.lastName} → ${shiftInfo.positionName} (${shiftInfo.shiftName})`]
            })
          }
        }

        attendantIndex++
        attempts++
      }
    }

    this.log(`✅ Pass 2 complete: ${pass2Assignments} second shifts assigned`)

    return {
      assignmentCount: pass1Assignments + pass2Assignments,
      progressCount
    }
  }

  /**
   * Check if a shift conflicts with existing assignments
   */
  private checkTimeConflict(existingShifts: Shift[], newShift: Shift): boolean {
    return existingShifts.some(existingShift => {
      // If attendant has an all-day shift, they can't take any other shift
      if (existingShift.isAllDay) return true

      // If new shift is all-day, attendant can't have any existing shifts
      if (newShift.isAllDay && existingShifts.length > 0) return true

      const existingEnd = existingShift.endTime || '23:59'
      const newStart = newShift.startTime || '00:00'
      const existingStart = existingShift.startTime || '00:00'
      const newEnd = newShift.endTime || '23:59'

      // Check for direct time overlap
      return existingEnd > newStart && existingStart < newEnd
    })
  }

  /**
   * Assign an attendant to a shift via API
   */
  private async assignAttendantToShift(
    positionId: string,
    attendantId: string,
    shiftId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`/api/events/${this.eventId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId,
          attendantId,
          shiftId,
          role: 'ATTENDANT'
        })
      })

      return response.ok
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
    positionsByLeadership: Map<string, Position[]>
  ): AutoAssignmentResult {
    // Calculate distribution statistics
    const allAssignedAttendants = new Map<string, number>()
    this.positions.forEach(pos => {
      pos.assignments?.forEach(a => {
        if (a.attendant) {
          const name = `${a.attendant.firstName} ${a.attendant.lastName}`
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

    // Calculate unfilled shifts
    let totalUnfilledShifts = 0
    for (const positionsGroup of positionsByLeadership.values()) {
      for (const position of positionsGroup) {
        const shifts = position.shifts?.filter(s => !s.isAllDay) || []
        for (const shift of shifts) {
          const assignments = position.assignments?.filter(a => a.shift?.id === shift.id).length || 0
          if (assignments === 0) {
            totalUnfilledShifts++
          }
        }
      }
    }

    // Build final message
    let message = `🎯 Oversight-Aware Auto-Assign Complete!\n\n`
    message += `✅ Total Assignments: ${assignmentCount}\n`
    message += `👥 Attendants Used: ${allAssignedAttendants.size}\n\n`
    message += `📊 Distribution:\n`
    message += `   • ${with1Shift} attendants with 1 shift\n`
    message += `   • ${with2Shifts} attendants with 2 shifts\n`

    if (with3PlusShifts > 0) {
      message += `   ⚠️ ${with3PlusShifts} attendants with 3+ shifts\n`
    }

    message += `\n💡 All assignments respect oversight boundaries - no cross-contamination!`

    if (totalUnfilledShifts > 0) {
      message += `\n\n⚠️ ${totalUnfilledShifts} shifts remain unfilled - insufficient attendants!`
    }

    return {
      success: true,
      totalAssignments: assignmentCount,
      hierarchyMatches,
      fallbackAssignments: 0,
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
