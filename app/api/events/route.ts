// Events API Route - Next.js API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const events = await prisma.events.findMany({
      orderBy: { startDate: 'desc' }
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
    const { name, description, startDate, location } = body;

    if (!name || !startDate) {
      return NextResponse.json(
        { error: 'Name and event date are required' },
        { status: 400 }
      );
    }

    const event = await prisma.events.create({
      data: {
        id: crypto.randomUUID(),
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(startDate), // Default to same as startDate
        location,
        isActive: true,
        updatedAt: new Date()
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
