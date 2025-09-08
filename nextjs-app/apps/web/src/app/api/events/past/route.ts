// Past Events API Route - Next.js API
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { EventService } from '../../../../../libs/event-management/src/eventservice';

const prisma = new PrismaClient();
const eventService = new EventService(prisma);

export async function GET() {
  try {
    const events = await eventService.getPastEvents(180); // Last 180 days
    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch past events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch past events' },
      { status: 500 }
    );
  }
}
