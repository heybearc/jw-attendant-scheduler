// Generate Count Session Name API Route - Next.js API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CountService } from '../../../../../libs/count-tracking/src/countservice';

const prisma = new PrismaClient();
const countService = new CountService(prisma);

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

    const sessionName = await countService.generateSessionName(parseInt(eventId));
    return NextResponse.json({ sessionName });
  } catch (error) {
    console.error('Failed to generate session name:', error);
    return NextResponse.json(
      { error: 'Failed to generate session name' },
      { status: 500 }
    );
  }
}
