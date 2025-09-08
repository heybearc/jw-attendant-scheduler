// Assignment Service - SDD Library
import { PrismaClient } from '@prisma/client';

export interface AssignmentWithDetails {
  id: number;
  eventId: number;
  attendantId: number;
  role?: string;
  notes?: string;
  createdAt: Date;
  event: {
    id: number;
    name: string;
    date: Date;
    location?: string;
    description?: string;
  };
  attendant: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
}

export interface AssignmentSummary {
  eventId: number;
  eventName: string;
  eventDate: Date;
  totalAssignments: number;
  assignedAttendants: string[];
  availableRoles: string[];
}

export class AssignmentService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getAssignmentById(id: number): Promise<AssignmentWithDetails | null> {
    return await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        event: true,
        attendant: true
      }
    });
  }

  async getAllAssignments(): Promise<AssignmentWithDetails[]> {
    return await this.prisma.assignment.findMany({
      include: {
        event: true,
        attendant: true
      },
      orderBy: [
        { event: { date: 'asc' } },
        { attendant: { lastName: 'asc' } }
      ]
    });
  }

  async getUpcomingAssignments(days: number = 30): Promise<AssignmentWithDetails[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.prisma.assignment.findMany({
      where: {
        event: {
          date: {
            gte: new Date(),
            lte: futureDate
          }
        }
      },
      include: {
        event: true,
        attendant: true
      },
      orderBy: [
        { event: { date: 'asc' } },
        { attendant: { lastName: 'asc' } }
      ]
    });
  }

  async getAssignmentSummaryByEvent(eventId: number): Promise<AssignmentSummary | null> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        assignments: {
          include: {
            attendant: true
          }
        }
      }
    });

    if (!event) return null;

    const assignedAttendants = event.assignments.map(
      a => `${a.attendant.firstName} ${a.attendant.lastName}`
    );

    const availableRoles = [...new Set(
      event.assignments
        .map(a => a.role)
        .filter(role => role !== null && role !== undefined)
    )] as string[];

    return {
      eventId: event.id,
      eventName: event.name,
      eventDate: event.date,
      totalAssignments: event.assignments.length,
      assignedAttendants,
      availableRoles
    };
  }

  async getAssignmentsByDateRange(startDate: Date, endDate: Date): Promise<AssignmentWithDetails[]> {
    return await this.prisma.assignment.findMany({
      where: {
        event: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        event: true,
        attendant: true
      },
      orderBy: [
        { event: { date: 'asc' } },
        { attendant: { lastName: 'asc' } }
      ]
    });
  }

  async getAttendantWorkload(attendantId: number, months: number = 3): Promise<{
    attendantId: number;
    attendantName: string;
    totalAssignments: number;
    upcomingAssignments: number;
    assignments: AssignmentWithDetails[];
  }> {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + months);

    const assignments = await this.prisma.assignment.findMany({
      where: {
        attendantId,
        event: {
          date: {
            gte: new Date(),
            lte: futureDate
          }
        }
      },
      include: {
        event: true,
        attendant: true
      },
      orderBy: { event: { date: 'asc' } }
    });

    const attendant = assignments[0]?.attendant;
    const attendantName = attendant ? `${attendant.firstName} ${attendant.lastName}` : 'Unknown';

    return {
      attendantId,
      attendantName,
      totalAssignments: assignments.length,
      upcomingAssignments: assignments.filter(a => a.event.date >= new Date()).length,
      assignments
    };
  }

  async bulkCreateAssignments(assignments: Array<{
    eventId: number;
    attendantId: number;
    role?: string;
    notes?: string;
  }>): Promise<AssignmentWithDetails[]> {
    const created = await this.prisma.assignment.createMany({
      data: assignments
    });

    // Return the created assignments with details
    return await this.prisma.assignment.findMany({
      where: {
        id: {
          in: assignments.map((_, index) => created.count - assignments.length + index + 1)
        }
      },
      include: {
        event: true,
        attendant: true
      }
    });
  }

  async getAssignmentStatistics(): Promise<{
    totalAssignments: number;
    upcomingAssignments: number;
    activeAttendants: number;
    averageAssignmentsPerAttendant: number;
  }> {
    const totalAssignments = await this.prisma.assignment.count();
    
    const upcomingAssignments = await this.prisma.assignment.count({
      where: {
        event: {
          date: { gte: new Date() }
        }
      }
    });

    const activeAttendants = await this.prisma.attendant.count({
      where: { isActive: true }
    });

    const averageAssignmentsPerAttendant = activeAttendants > 0 
      ? Math.round((totalAssignments / activeAttendants) * 100) / 100 
      : 0;

    return {
      totalAssignments,
      upcomingAssignments,
      activeAttendants,
      averageAssignmentsPerAttendant
    };
  }
}
