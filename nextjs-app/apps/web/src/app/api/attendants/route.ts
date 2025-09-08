// Attendants API Route - Next.js API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AttendantService } from '../../../../libs/attendant-management/src/attendantservice';

const prisma = new PrismaClient();
const attendantService = new AttendantService(prisma);

export async function GET() {
  try {
    const attendants = await attendantService.getAllAttendants();
    return NextResponse.json(attendants);
  } catch (error) {
    console.error('Failed to fetch attendants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    const attendant = await attendantService.createAttendant({
      firstName,
      lastName,
      email: email || undefined,
      phone: phone || undefined
    });

    return NextResponse.json(attendant, { status: 201 });
  } catch (error) {
    console.error('Failed to create attendant:', error);
    return NextResponse.json(
      { error: 'Failed to create attendant' },
      { status: 500 }
    );
  }
}
