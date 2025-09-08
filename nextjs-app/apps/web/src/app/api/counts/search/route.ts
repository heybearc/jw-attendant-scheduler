// Count Sessions Search API Route - Next.js API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CountService } from '../../../../../libs/count-tracking/src/countservice';

const prisma = new PrismaClient();
const countService = new CountService(prisma);

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

    const countSessions = await countService.searchCountSessions(query);
    return NextResponse.json(countSessions);
  } catch (error) {
    console.error('Failed to search count sessions:', error);
    return NextResponse.json(
      { error: 'Failed to search count sessions' },
      { status: 500 }
    );
  }
}
