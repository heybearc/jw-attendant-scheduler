// Attendants Search API Route - Next.js API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AttendantService } from '../../../../../libs/attendant-management/src/attendantservice';

const prisma = new PrismaClient();
const attendantService = new AttendantService(prisma);

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

    const attendants = await attendantService.searchAttendants(query);
    return NextResponse.json(attendants);
  } catch (error) {
    console.error('Failed to search attendants:', error);
    return NextResponse.json(
      { error: 'Failed to search attendants' },
      { status: 500 }
    );
  }
}
