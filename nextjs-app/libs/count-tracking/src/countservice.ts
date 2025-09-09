// Count Tracking Service - SDD Library
import { PrismaClient } from '@prisma/client';

export interface CountSession {
  id: number;
  eventId: number;
  sessionName: string;
  countTime: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateCountSessionRequest {
  eventId: number;
  sessionName: string;
  countTime: Date;
  notes?: string;
}

export interface CountSessionWithEvent {
  id: number;
  eventId: number;
  sessionName: string;
  countTime: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  event: {
    id: number;
    name: string;
    date: Date;
    location?: string;
  };
}

export interface CountAnalytics {
  totalSessions: number;
  activeSessions: number;
  averageSessionsPerEvent: number;
  mostActiveEvent: {
    eventId: number;
    eventName: string;
    sessionCount: number;
  } | null;
  recentSessions: CountSessionWithEvent[];
}

export class CountService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getAllCountSessions(): Promise<CountSessionWithEvent[]> {
    return await this.prisma.countSession.findMany({
      include: {
        event: true
      },
      orderBy: { countTime: 'desc' }
    });
  }

  async getCountSessionById(id: number): Promise<CountSessionWithEvent | null> {
    return await this.prisma.countSession.findUnique({
      where: { id },
      include: {
        event: true
      }
    });
  }

  async createCountSession(data: CreateCountSessionRequest): Promise<CountSession> {
    // Check for duplicate session names for the same event
    const existingSession = await this.prisma.countSession.findFirst({
      where: {
        eventId: data.eventId,
        sessionName: data.sessionName
      }
    });

    if (existingSession) {
      throw new Error(`Count session "${data.sessionName}" already exists for this event`);
    }

    return await this.prisma.countSession.create({
      data: {
        eventId: data.eventId,
        sessionName: data.sessionName,
        countTime: data.countTime,
        notes: data.notes,
        isActive: true
      }
    });
  }

  async updateCountSession(id: number, data: Partial<CreateCountSessionRequest>): Promise<CountSession> {
    return await this.prisma.countSession.update({
      where: { id },
      data
    });
  }

  async deleteCountSession(id: number): Promise<void> {
    await this.prisma.countSession.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async getCountSessionsByEvent(eventId: number): Promise<CountSession[]> {
    return await this.prisma.countSession.findMany({
      where: { 
        eventId,
        isActive: true 
      },
      orderBy: { countTime: 'asc' }
    });
  }

  async getActiveCountSessions(): Promise<CountSessionWithEvent[]> {
    return await this.prisma.countSession.findMany({
      where: { isActive: true },
      include: {
        event: true
      },
      orderBy: { countTime: 'desc' }
    });
  }

  async getCountSessionsByDateRange(startDate: Date, endDate: Date): Promise<CountSessionWithEvent[]> {
    return await this.prisma.countSession.findMany({
      where: {
        countTime: {
          gte: startDate,
          lte: endDate
        },
        isActive: true
      },
      include: {
        event: true
      },
      orderBy: { countTime: 'asc' }
    });
  }

  async searchCountSessions(query: string): Promise<CountSessionWithEvent[]> {
    return await this.prisma.countSession.findMany({
      where: {
        OR: [
          { sessionName: { contains: query } },
          { notes: { contains: query } },
          { event: { name: { contains: query, mode: 'insensitive' } } }
        ],
        isActive: true
      },
      include: {
        event: true
      },
      orderBy: { countTime: 'desc' }
    });
  }

  async getCountAnalytics(): Promise<CountAnalytics> {
    const totalSessions = await this.prisma.countSession.count();
    const activeSessions = await this.prisma.countSession.count({
      where: { isActive: true }
    });

    const totalEvents = await this.prisma.event.count();
    const averageSessionsPerEvent = totalEvents > 0 
      ? Math.round((totalSessions / totalEvents) * 100) / 100 
      : 0;

    // Find most active event
    const eventSessionCounts = await this.prisma.countSession.groupBy({
      by: ['eventId'],
      _count: {
        id: true
      },
      where: { isActive: true },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 1
    });

    let mostActiveEvent = null;
    if (eventSessionCounts.length > 0) {
      const eventId = eventSessionCounts[0].eventId;
      const event = await this.prisma.event.findUnique({
        where: { id: eventId }
      });
      
      if (event) {
        mostActiveEvent = {
          eventId: event.id,
          eventName: event.name,
          sessionCount: eventSessionCounts[0]._count.id
        };
      }
    }

    // Get recent sessions
    const recentSessions = await this.prisma.countSession.findMany({
      where: { isActive: true },
      include: {
        event: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return {
      totalSessions,
      activeSessions,
      averageSessionsPerEvent,
      mostActiveEvent,
      recentSessions
    };
  }

  async generateSessionName(eventId: number): Promise<string> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const sessionCount = await this.prisma.countSession.count({
      where: { eventId }
    });

    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    return `${event.name} - Session ${sessionCount + 1} (${timestamp})`;
  }

  async bulkCreateCountSessions(sessions: CreateCountSessionRequest[]): Promise<CountSession[]> {
    const results: CountSession[] = [];

    for (const sessionData of sessions) {
      try {
        const session = await this.createCountSession(sessionData);
        results.push(session);
      } catch (error) {
        console.error(`Failed to create session ${sessionData.sessionName}:`, error);
        // Continue with other sessions
      }
    }

    return results;
  }

  async getCountSessionReport(eventId: number): Promise<{
    eventName: string;
    eventDate: Date;
    totalSessions: number;
    activeSessions: number;
    sessions: CountSession[];
    timeRange: {
      earliest: Date | null;
      latest: Date | null;
    };
  }> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const sessions = await this.getCountSessionsByEvent(eventId);
    const allSessions = await this.prisma.countSession.findMany({
      where: { eventId }
    });

    const countTimes = sessions.map(s => s.countTime).sort();
    const timeRange = {
      earliest: countTimes.length > 0 ? countTimes[0] : null,
      latest: countTimes.length > 0 ? countTimes[countTimes.length - 1] : null
    };

    return {
      eventName: event.name,
      eventDate: event.date,
      totalSessions: allSessions.length,
      activeSessions: sessions.length,
      sessions,
      timeRange
    };
  }
}
