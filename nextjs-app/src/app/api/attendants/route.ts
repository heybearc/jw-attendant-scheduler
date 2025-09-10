import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const attendants = await prisma.attendants.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(attendants, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching attendants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendants' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      firstName, 
      lastName, 
      email, 
      phone, 
      availabilityStatus, 
      notes, 
      assignmentCount, 
      totalHours 
    } = body;

    // Handle two creation modes: user mapping vs manual entry
    if (userId) {
      // Mode 1: Creating attendant from existing user
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      const existingAttendant = await prisma.attendants.findUnique({
        where: { userId: userId }
      });

      if (existingAttendant) {
        return NextResponse.json(
          { error: 'Attendant profile already exists for this user' },
          { status: 400, headers: corsHeaders }
        );
      }

      const attendant = await prisma.attendants.create({
        data: {
          id: randomUUID(),
          userId: userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || null,
          availabilityStatus: availabilityStatus || 'AVAILABLE',
          notes: notes || null,
          isAvailable: availabilityStatus !== 'UNAVAILABLE',
          totalAssignments: assignmentCount || 0,
          totalHours: totalHours || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
              role: true
            }
          }
        }
      });

      return NextResponse.json(attendant, { status: 201, headers: corsHeaders });

    } else {
      // Mode 2: Manual attendant creation
      if (!firstName || !lastName || !email) {
        return NextResponse.json(
          { error: 'firstName, lastName, and email are required for manual entry' },
          { status: 400, headers: corsHeaders }
        );
      }

      const existingAttendant = await prisma.attendants.findUnique({
        where: { email: email }
      });

      if (existingAttendant) {
        return NextResponse.json(
          { error: 'Attendant with this email already exists' },
          { status: 400, headers: corsHeaders }
        );
      }

      const attendant = await prisma.attendants.create({
        data: {
          id: randomUUID(),
          userId: null, // No user mapping
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phone || null,
          availabilityStatus: availabilityStatus || 'AVAILABLE',
          notes: notes || null,
          isAvailable: availabilityStatus !== 'UNAVAILABLE',
          totalAssignments: assignmentCount || 0,
          totalHours: totalHours || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return NextResponse.json(attendant, { status: 201, headers: corsHeaders });
    }

  } catch (error) {
    console.error('Error creating attendant:', error);
    return NextResponse.json(
      { error: 'Failed to create attendant' },
      { status: 500, headers: corsHeaders }
    );
  }
}
