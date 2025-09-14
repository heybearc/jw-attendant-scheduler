// Events Search API Route - Next.js API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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

    const events = await prisma.event.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { location: { contains: query } }
        ],
        isActive: true
      },
      orderBy: { eventDate: 'desc' }
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to search events:', error);
    return NextResponse.json(
      { error: 'Failed to search events' },
      { status: 500 }
    );
  }
}
