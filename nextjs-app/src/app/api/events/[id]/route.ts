import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventType, EventStatus } from '@prisma/client';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const event = await prisma.events.findUnique({
      where: { id: params.id }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json(event, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    
    // Map status string to EventStatus enum
    const statusMap: { [key: string]: EventStatus } = {
      'UPCOMING': EventStatus.UPCOMING,
      'CURRENT': EventStatus.CURRENT,
      'ACTIVE': EventStatus.CURRENT, // Map ACTIVE to CURRENT
      'COMPLETED': EventStatus.COMPLETED,
      'CANCELLED': EventStatus.CANCELLED,
      'ARCHIVED': EventStatus.ARCHIVED
    };

    const updateData = {
      name: body.name,
      description: body.description || '',
      eventType: body.eventType as EventType,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      location: body.location,
      venue: body.venue || '',
      status: statusMap[body.status] || EventStatus.UPCOMING,
      updatedAt: new Date()
    };

    const event = await prisma.events.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(event, { headers: corsHeaders });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    await prisma.events.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Event deleted successfully' }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500, headers: corsHeaders });
  }
}
