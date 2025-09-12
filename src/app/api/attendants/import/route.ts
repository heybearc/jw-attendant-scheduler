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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvData } = body;

    if (!csvData || !Array.isArray(csvData)) {
      return NextResponse.json(
        { error: 'Invalid CSV data format' },
        { status: 400, headers: corsHeaders }
      );
    }

    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    for (const row of csvData) {
      try {
        const { firstName, lastName, email, phone, availabilityStatus, notes } = row;

        // Validate required fields
        if (!firstName || !lastName || !email) {
          results.failed.push({
            row,
            error: 'Missing required fields: firstName, lastName, email'
          });
          continue;
        }

        // Check if attendant already exists using findFirst instead of findUnique
        const existingAttendant = await prisma.attendants.findFirst({
          where: { email: email.trim().toLowerCase() }
        });

        if (existingAttendant) {
          results.skipped.push({
            row,
            reason: 'Attendant with this email already exists'
          });
          continue;
        }

        // Create new attendant
        const attendant = await prisma.attendants.create({
          data: {
            id: randomUUID(),
            userId: null, // CSV imports are manual entries
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || null,
            availabilityStatus: availabilityStatus?.trim() || 'AVAILABLE',
            notes: notes?.trim() || null,
            isAvailable: (availabilityStatus?.trim() || 'AVAILABLE') !== 'UNAVAILABLE',
            totalAssignments: 0,
            totalHours: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        results.successful.push({
          id: attendant.id,
          email: attendant.email,
          name: `${attendant.firstName} ${attendant.lastName}`
        });

      } catch (error) {
        results.failed.push({
          row,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: 'CSV import completed',
      summary: {
        total: csvData.length,
        successful: results.successful.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      },
      results
    }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error processing CSV import:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV import' },
      { status: 500, headers: corsHeaders }
    );
  }
}
