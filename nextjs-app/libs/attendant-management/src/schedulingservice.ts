// Scheduling Service - SDD Library
import { PrismaClient } from '@prisma/client';

export interface Assignment {
  id: number;
  eventId: number;
  attendantId: number;
  role?: string;
  notes?: string;
  createdAt: Date;
  event?: {
    id: number;
    name: string;
    date: Date;
    location?: string;
  };
  attendant?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface CreateAssignmentRequest {
  eventId: number;
  attendantId: number;
  role?: string;
  notes?: string;
}

export interface ScheduleConflict {
  attendantId: number;
  attendantName: string;
  conflictingEventId: number;
  conflictingEventName: string;
  conflictDate: Date;
}

export class SchedulingService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createAssignment(data: CreateAssignmentRequest): Promise<Assignment> {
    // Check for conflicts before creating
    const conflicts = await this.checkScheduleConflicts(data.attendantId, data.eventId);
    if (conflicts.length > 0) {
      throw new Error(`Schedule conflict detected: ${conflicts[0].conflictingEventName}`);
    }

    return await this.prisma.assignment.create({
      data,
      include: {
        event: true,
        attendant: true
      }
    });
  }

  async getAssignmentsByEvent(eventId: number): Promise<Assignment[]> {
    return await this.prisma.assignment.findMany({
      where: { eventId },
      include: {
        attendant: true,
        event: true
      },
      orderBy: { attendant: { lastName: 'asc' } }
    });
  }

  async getAssignmentsByAttendant(attendantId: number): Promise<Assignment[]> {
    return await this.prisma.assignment.findMany({
      where: { attendantId },
      include: {
        event: true,
        attendant: true
      },
      orderBy: { event: { date: 'asc' } }
    });
  }

  async checkScheduleConflicts(attendantId: number, eventId: number): Promise<ScheduleConflict[]> {
    const targetEvent = await this.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!targetEvent) {
      throw new Error('Event not found');
    }

    // Find overlapping assignments for the same attendant
    const conflictingAssignments = await this.prisma.assignment.findMany({
      where: {
        attendantId,
        event: {
          date: targetEvent.date,
          id: { not: eventId }
        }
      },
      include: {
        event: true,
        attendant: true
      }
    });

    return conflictingAssignments.map(assignment => ({
      attendantId: assignment.attendantId,
      attendantName: `${assignment.attendant?.firstName} ${assignment.attendant?.lastName}`,
      conflictingEventId: assignment.eventId,
      conflictingEventName: assignment.event?.name || 'Unknown Event',
      conflictDate: assignment.event?.date || new Date()
    }));
  }

  async removeAssignment(assignmentId: number): Promise<void> {
    await this.prisma.assignment.delete({
      where: { id: assignmentId }
    });
  }

  async updateAssignment(assignmentId: number, data: Partial<CreateAssignmentRequest>): Promise<Assignment> {
    return await this.prisma.assignment.update({
      where: { id: assignmentId },
      data,
      include: {
        event: true,
        attendant: true
      }
    });
  }

  async getAvailableAttendants(eventId: number): Promise<any[]> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Get attendants who are not already assigned to events on the same date
    const assignedAttendantIds = await this.prisma.assignment.findMany({
      where: {
        event: {
          date: event.date
        }
      },
      select: { attendantId: true }
    });

    const assignedIds = assignedAttendantIds.map(a => a.attendantId);

    return await this.prisma.attendant.findMany({
      where: {
        isActive: true,
        id: { notIn: assignedIds }
      },
      orderBy: { lastName: 'asc' }
    });
  }
}
