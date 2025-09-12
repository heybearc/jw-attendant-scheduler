import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  { params }: { params: { id: string } }
) {
  try {
    const attendant = await prisma.attendants.findUnique({
      where: { id: params.id },
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

    if (!attendant) {
      return NextResponse.json(
        { error: 'Attendant not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(attendant, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching attendant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendant' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, availabilityStatus, notes, servingAs } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'firstName, lastName, and email are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if attendant exists
    const existingAttendant = await prisma.attendants.findUnique({
      where: { id: params.id }
    });

    if (!existingAttendant) {
      return NextResponse.json(
        { error: 'Attendant not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check for email conflicts (excluding current attendant)
    if (email !== existingAttendant.email) {
      const emailConflict = await prisma.attendants.findFirst({
        where: { 
          email: email.trim().toLowerCase(),
          id: { not: params.id }
        }
      });

      if (emailConflict) {
        return NextResponse.json(
          { error: 'An attendant with this email already exists' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Update attendant
    const updatedAttendant = await prisma.attendants.update({
      where: { id: params.id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        availabilityStatus: availabilityStatus?.trim() || 'AVAILABLE',
        notes: notes?.trim() || null,
        servingAs: servingAs || [],
        isAvailable: (availabilityStatus?.trim() || 'AVAILABLE') !== 'UNAVAILABLE',
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

    return NextResponse.json(updatedAttendant, { headers: corsHeaders });
  } catch (error) {
    console.error('Error updating attendant:', error);
    return NextResponse.json(
      { error: 'Failed to update attendant' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if attendant exists
    const existingAttendant = await prisma.attendants.findUnique({
      where: { id: params.id }
    });

    if (!existingAttendant) {
      return NextResponse.json(
        { error: 'Attendant not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Delete attendant
    await prisma.attendants.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Attendant deleted successfully' },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error deleting attendant:', error);
    return NextResponse.json(
      { error: 'Failed to delete attendant' },
      { status: 500, headers: corsHeaders }
    );
  }
}
