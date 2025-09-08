// Events Search API Route - Next.js API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { EventService } from '../../../../../libs/event-management/src/eventservice';

const prisma = new PrismaClient();
const eventService = new EventService(prisma);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const events = await eventService.searchEvents(query);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to search events:', error);
    return NextResponse.json(
      { error: 'Failed to search events' },
      { status: 500 }
    );
  }
}
