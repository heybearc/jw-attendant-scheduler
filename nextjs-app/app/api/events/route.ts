// Events API Route - Next.js API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { eventDate: 'desc' }
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, eventDate, location } = body;

    if (!name || !eventDate) {
      return NextResponse.json(
        { error: 'Name and event date are required' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        eventDate: new Date(eventDate),
        location,
        isActive: true
      }
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Failed to create event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
