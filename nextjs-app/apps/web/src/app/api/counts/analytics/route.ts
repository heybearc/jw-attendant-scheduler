// Count Analytics API Route - Next.js API
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CountService } from '../../../../../libs/count-tracking/src/countservice';

const prisma = new PrismaClient();
const countService = new CountService(prisma);

export async function GET() {
  try {
    const analytics = await countService.getCountAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Failed to fetch count analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch count analytics' },
      { status: 500 }
    );
  }
}
