/**
 * Position Service for Theoshift
 * Centralized API calls for position operations
 * 
 * Extracted from positions.tsx as part of gradual refactoring (Week 1, Step 3)
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Position {
  id: string
  positionNumber: number
  name: string
  area?: string
  isActive: boolean
}

export interface Shift {
  id: string
  name: string
  startTime?: string
  endTime?: string
  isAllDay: boolean
}

export interface Assignment {
  id: string
  role: string
  attendant?: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface UpdatePositionData {
  name?: string
  area?: string
  isActive?: boolean
}

export interface CreateShiftData {
  name: string
  startTime: string
  endTime: string
  isAllDay: boolean
}

export interface AssignOversightData {
  overseerId?: string
  keymanId?: string
}

export interface BulkOversightData {
  positionIds: string[]
  overseerId?: string
  keymanId?: string
}

export interface ApplyShiftTemplateData {
  positionIds: string[]
  shiftTemplateId: string
}

export interface CreateAssignmentData {
  positionId: string
  attendantId: string
  shiftId: string
  role: string
}

// ============================================================================
// POSITION SERVICE CLASS
// ============================================================================

export class PositionService {
  private eventId: string

  constructor(eventId: string) {
    this.eventId = eventId
  }

  /**
   * Delete a position
   */
  async deletePosition(positionId: string): Promise<boolean> {
    const response = await fetch(`/api/events/${this.eventId}/positions/${positionId}`, {
      method: 'DELETE'
    })
    return response.ok
  }

  /**
   * Hard delete a position (permanent)
   */
  async hardDeletePosition(positionId: string): Promise<{success: boolean, error?: string}> {
    const response = await fetch(`/api/events/${this.eventId}/positions/${positionId}?hardDelete=true`, {
      method: 'DELETE'
    })
    return await response.json()
  }

  /**
   * Update a position
   */
  async updatePosition(positionId: string, data: UpdatePositionData): Promise<boolean> {
    const response = await fetch(`/api/events/${this.eventId}/positions/${positionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.ok
  }

  /**
   * Create a shift for a position
   */
  async createShift(positionId: string, shiftData: CreateShiftData): Promise<boolean> {
    const response = await fetch(`/api/events/${this.eventId}/positions/${positionId}/shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shiftData)
    })
    return response.ok
  }

  /**
   * Delete a shift
   */
  async deleteShift(positionId: string, shiftId: string): Promise<boolean> {
    const response = await fetch(`/api/events/${this.eventId}/positions/${positionId}/shifts/${shiftId}`, {
      method: 'DELETE'
    })
    return response.ok
  }

  /**
   * Assign oversight (overseer/keyman) to a position
   */
  async assignOversight(positionId: string, data: AssignOversightData): Promise<boolean> {
    const response = await fetch(`/api/events/${this.eventId}/positions/${positionId}/position-oversight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.ok
  }

  /**
   * Bulk assign oversight to multiple positions
   */
  async bulkAssignOversight(data: BulkOversightData): Promise<boolean> {
    const response = await fetch(`/api/events/${this.eventId}/positions/bulk-oversight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.ok
  }

  /**
   * Apply shift template to multiple positions
   */
  async applyShiftTemplate(data: ApplyShiftTemplateData): Promise<boolean> {
    const response = await fetch(`/api/events/${this.eventId}/positions/apply-shift-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.ok
  }

  /**
   * Bulk update multiple positions
   */
  async bulkUpdatePositions(
    positionIds: string[],
    updateData: UpdatePositionData
  ): Promise<{successCount: number, errorCount: number}> {
    let successCount = 0
    let errorCount = 0

    for (const positionId of positionIds) {
      try {
        const success = await this.updatePosition(positionId, updateData)
        if (success) {
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        errorCount++
        console.error(`Error updating position ${positionId}:`, error)
      }
    }

    return { successCount, errorCount }
  }

  /**
   * Bulk create shifts for multiple positions
   */
  async bulkCreateShifts(
    positionIds: string[],
    shiftData: CreateShiftData
  ): Promise<{successCount: number, errorCount: number}> {
    let successCount = 0
    let errorCount = 0

    for (const positionId of positionIds) {
      try {
        const success = await this.createShift(positionId, shiftData)
        if (success) {
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        errorCount++
        console.error(`Error creating shift for position ${positionId}:`, error)
      }
    }

    return { successCount, errorCount }
  }

  /**
   * Bulk delete multiple positions
   */
  async bulkDeletePositions(positionIds: string[]): Promise<{successCount: number, errorCount: number}> {
    let successCount = 0
    let errorCount = 0

    for (const positionId of positionIds) {
      try {
        const success = await this.deletePosition(positionId)
        if (success) {
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        errorCount++
        console.error(`Error deleting position ${positionId}:`, error)
      }
    }

    return { successCount, errorCount }
  }

  /**
   * Clear all assignments for the event
   */
  async clearAllAssignments(): Promise<boolean> {
    const response = await fetch(`/api/events/${this.eventId}/positions/clear-assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    return response.ok
  }

  /**
   * Clear all shifts for the event
   */
  async clearAllShifts(): Promise<boolean> {
    const response = await fetch(`/api/events/${this.eventId}/positions/clear-shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    return response.ok
  }

  /**
   * Create an assignment (assign attendant to position/shift)
   */
  async createAssignment(data: CreateAssignmentData): Promise<boolean> {
    const response = await fetch(`/api/events/${this.eventId}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.ok
  }

  /**
   * Delete an assignment
   */
  async deleteAssignment(assignmentId: string): Promise<boolean> {
    const response = await fetch(`/api/events/${this.eventId}/assignments/${assignmentId}`, {
      method: 'DELETE'
    })
    return response.ok
  }

  /**
   * Activate a position
   */
  async activatePosition(positionId: string): Promise<boolean> {
    return this.updatePosition(positionId, { isActive: true })
  }

  /**
   * Deactivate a position
   */
  async deactivatePosition(positionId: string): Promise<boolean> {
    return this.updatePosition(positionId, { isActive: false })
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a PositionService instance for an event
 */
export function createPositionService(eventId: string): PositionService {
  return new PositionService(eventId)
}
