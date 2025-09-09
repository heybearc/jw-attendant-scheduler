// Count Sessions API Route - Next.js API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  try {
    const countSessions = await prisma.countSession.findMany({
      include: {
        event: true
      },
      orderBy: { countTime: 'desc' }
    });
    return NextResponse.json(countSessions);
  } catch (error) {
    console.error('Failed to fetch count sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch count sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, sessionName, countTime, notes } = body;

    if (!eventId || !sessionName || !countTime) {
      return NextResponse.json(
        { error: 'Event ID, session name, and count time are required' },
        { status: 400 }
      );
    }

    const countSession = await prisma.countSession.create({
      data: {
        sessionName,
        eventId: parseInt(eventId),
        countTime: new Date(countTime),
        notes,
        isActive: true
      },
      include: {
        event: true
      }
    });

    return NextResponse.json(countSession, { status: 201 });
  } catch (error) {
    console.error('Failed to create count session:', error);
    
    // Handle unique constraint error
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create count session' },
      { status: 500 }
    );
  }
}
