// Generate Count Session Name API Route - Next.js API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) }
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    const baseSessionName = `${event.name} Count - ${new Date().toLocaleDateString()}`;
    let sessionName = baseSessionName;
    let counter = 1;
    
    // Check for existing sessions and increment counter if needed
    while (await prisma.countSession.findFirst({ where: { sessionName } })) {
      sessionName = `${baseSessionName} (${counter})`;
      counter++;
    }
    return NextResponse.json({ sessionName });
  } catch (error) {
    console.error('Failed to generate session name:', error);
    return NextResponse.json(
      { error: 'Failed to generate session name' },
      { status: 500 }
    );
  }
}
