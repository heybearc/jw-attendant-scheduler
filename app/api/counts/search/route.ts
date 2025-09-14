// Count Sessions Search API Route - Next.js API
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

    const countSessions = await prisma.countSession.findMany({
      where: {
        OR: [
          { sessionName: { contains: query } },
          { notes: { contains: query } }
        ],
        isActive: true
      },
      include: {
        event: true
      },
      orderBy: { countTime: 'desc' }
    });
    return NextResponse.json(countSessions);
  } catch (error) {
    console.error('Failed to search count sessions:', error);
    return NextResponse.json(
      { error: 'Failed to search count sessions' },
      { status: 500 }
    );
  }
}
