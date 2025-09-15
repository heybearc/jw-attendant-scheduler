import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalEvents, upcomingEvents, totalAttendants, myAssignments] = await Promise.all([
      prisma.events.count({
        where: { isActive: true }
      }),
      prisma.events.count({
        where: {
          isActive: true,
          status: 'UPCOMING',
          startDate: {
            gte: new Date()
          }
        }
      }),
      prisma.attendants.count({
        where: { isAvailable: true }
      }),
      prisma.assignments.count({
        where: {
          userId: session.user.id,
          status: {
            in: ['ASSIGNED', 'CONFIRMED']
          }
        }
      })
    ])

    return NextResponse.json({
      totalEvents,
      upcomingEvents,
      totalAttendants,
      myAssignments
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
