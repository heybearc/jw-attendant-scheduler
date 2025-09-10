import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventType } from '@prisma/client';
import { randomUUID } from 'crypto';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    const events = await prisma.events.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(events, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      eventType,
      startDate,
      endDate,
      location,
      description,
      venue
    } = body;

    // Validation
    if (!name || !eventType || !startDate || !endDate || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: name, eventType, startDate, endDate, location' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate eventType is a valid enum value
    if (!Object.values(EventType).includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${Object.values(EventType).join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }

    const event = await prisma.events.create({
      data: {
        id: randomUUID(),
        name,
        description: description || '',
        eventType: eventType as EventType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        venue: venue || '',
        status: 'UPCOMING',
        isActive: true,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(event, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500, headers: corsHeaders });
  }
}
