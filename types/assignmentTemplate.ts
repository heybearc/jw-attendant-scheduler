/**
 * Phase 4C: Assignment Template Types
 * Types for saving and reusing assignment patterns
 */

export interface AssignmentTemplate {
  id: string
  name: string
  description: string
  eventType: string
  departmentTemplateId?: string
  assignments: TemplateAssignment[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
  usageCount: number
  isActive: boolean
}

export interface TemplateAssignment {
  positionNumber: number
  positionName: string
  area?: string
  shiftStart: string  // Time in HH:MM format
  shiftEnd: string    // Time in HH:MM format
  requiredCount: number
  role?: string
  notes?: string
}

export interface CreateTemplateData {
  name: string
  description: string
  eventType: string
  departmentTemplateId?: string
  assignments: TemplateAssignment[]
}

export interface ApplyTemplateOptions {
  eventId: string
  templateId: string
  startDate: Date
  sendNotifications?: boolean
  overwriteExisting?: boolean
}

export interface TemplateUsageStats {
  templateId: string
  totalUsages: number
  lastUsedAt: Date
  eventsUsed: string[]
  averagePositionsCreated: number
}
