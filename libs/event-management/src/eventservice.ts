// Event Management Service - SDD Library
import { PrismaClient } from '@prisma/client';

export interface Event {
  id: number;
  name: string;
  date: Date;
  location?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventRequest {
  name: string;
  date: Date;
  location?: string;
  description?: string;
}

export interface UpdateEventRequest {
  name?: string;
  date?: Date;
  location?: string;
  description?: string;
}

export interface EventWithAssignments {
  id: number;
  name: string;
  date: Date;
  location?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  assignments: Array<{
    id: number;
    role?: string;
    attendant: {
      id: number;
      firstName: string;
      lastName: string;
    };
  }>;
  countSessions: Array<{
    id: number;
    sessionName: string;
    countTime: Date;
  }>;
}

export class EventService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getAllEvents(): Promise<Event[]> {
    return await this.prisma.event.findMany({
      orderBy: { date: 'desc' }
    });
  }

  async getEventById(id: number): Promise<EventWithAssignments | null> {
    return await this.prisma.event.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            attendant: true
          }
        },
        countSessions: true
      }
    });
  }

  async createEvent(data: CreateEventRequest): Promise<Event> {
    return await this.prisma.event.create({
      data: {
        name: data.name,
        date: data.date,
        location: data.location,
        description: data.description
      }
    });
  }

  async updateEvent(id: number, data: UpdateEventRequest): Promise<Event> {
    return await this.prisma.event.update({
      where: { id },
      data
    });
  }

  async deleteEvent(id: number): Promise<void> {
    // Delete related assignments and count sessions first
    await this.prisma.assignment.deleteMany({
      where: { eventId: id }
    });
    
    await this.prisma.countSession.deleteMany({
      where: { eventId: id }
    });

    await this.prisma.event.delete({
      where: { id }
    });
  }

  async getUpcomingEvents(days: number = 30): Promise<Event[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.prisma.event.findMany({
      where: {
        date: {
          gte: new Date(),
          lte: futureDate
        }
      },
      orderBy: { date: 'asc' }
    });
  }

  async getPastEvents(days: number = 90): Promise<Event[]> {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);

    return await this.prisma.event.findMany({
      where: {
        date: {
          gte: pastDate,
          lt: new Date()
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    return await this.prisma.event.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });
  }

  async searchEvents(query: string): Promise<Event[]> {
    return await this.prisma.event.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { location: { contains: query } }
        ],
      },
      orderBy: { date: 'desc' }
    });
  }

  async getEventStatistics(): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    pastEvents: number;
    eventsThisMonth: number;
    averageAssignmentsPerEvent: number;
  }> {
    const totalEvents = await this.prisma.event.count();
    
    const upcomingEvents = await this.prisma.event.count({
      where: {
        date: { gte: new Date() }
      }
    });

    const pastEvents = await this.prisma.event.count({
      where: {
        date: { lt: new Date() }
      }
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const eventsThisMonth = await this.prisma.event.count({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const totalAssignments = await this.prisma.assignment.count();
    const averageAssignmentsPerEvent = totalEvents > 0 
      ? Math.round((totalAssignments / totalEvents) * 100) / 100 
      : 0;

    return {
      totalEvents,
      upcomingEvents,
      pastEvents,
      eventsThisMonth,
      averageAssignmentsPerEvent
    };
  }

  async duplicateEvent(eventId: number, newDate: Date, newName?: string): Promise<Event> {
    const originalEvent = await this.getEventById(eventId);
    if (!originalEvent) {
      throw new Error('Event not found');
    }

    const newEvent = await this.createEvent({
      name: newName || `${originalEvent.name} (Copy)`,
      date: newDate,
      location: originalEvent.location,
      description: originalEvent.description
    });

    // Copy assignments
    const assignmentData = originalEvent.assignments.map(assignment => ({
      eventId: newEvent.id,
      attendantId: assignment.attendant.id,
      role: assignment.role
    }));

    if (assignmentData.length > 0) {
      await this.prisma.assignment.createMany({
        data: assignmentData
      });
    }

    return newEvent;
  }
}
