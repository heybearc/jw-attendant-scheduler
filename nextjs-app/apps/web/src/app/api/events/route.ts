// Events API Route - Next.js API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { EventService } from '../../../../libs/event-management/src/eventservice';

const prisma = new PrismaClient();
const eventService = new EventService(prisma);

export async function GET() {
  try {
    const events = await eventService.getAllEvents();
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
    const { name, date, location, description } = body;

    if (!name || !date) {
      return NextResponse.json(
        { error: 'Event name and date are required' },
        { status: 400 }
      );
    }

    const event = await eventService.createEvent({
      name,
      date: new Date(date),
      location: location || undefined,
      description: description || undefined
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
