import { NextApiRequest, NextApiResponse } from 'next'
import { ConventionDay } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import {
  conventionDayLabel,
  getCurrentConventionDay,
  isEligibleForDay,
  scheduleFromRecord,
  upsertDayCheckIn,
} from '@/lib/ivsEarlyCheckin'

function parseDay(body: Record<string, unknown>): ConventionDay | null {
  const raw = body.conventionDay
  if (typeof raw === 'string') {
    const upper = raw.toUpperCase()
    if (Object.values(ConventionDay).includes(upper as ConventionDay)) {
      return upper as ConventionDay
    }
  }
  return getCurrentConventionDay()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const body =
      req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? (req.body as Record<string, unknown>)
        : {}
    const { eventId, volunteerId } = body

    if (!eventId || !volunteerId || typeof eventId !== 'string' || typeof volunteerId !== 'string') {
      return res.status(400).json({ success: false, message: 'Event ID and Volunteer ID required' })
    }

    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: { eventType: true },
    })

    if (event?.eventType !== 'REGIONAL_CONVENTION') {
      return res.status(403).json({ success: false, message: 'This is not an IVS event' })
    }

    const ivsTeamMember = await prisma.position_assignments.findFirst({
      where: {
        volunteerId: session.user.id,
        positions: { eventId },
      },
    })

    if (!ivsTeamMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - IVS team member access required',
      })
    }

    const day = parseDay(body)
    if (!day) {
      return res.status(400).json({
        success: false,
        message: 'Early check-in is only available on Friday, Saturday, or Sunday (event local time).',
      })
    }

    const volunteer = await prisma.event_volunteers.findUnique({
      where: { id: volunteerId },
      include: { earlyCheckins: true },
    })

    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer not found' })
    }

    const schedule = scheduleFromRecord(volunteer)
    if (!isEligibleForDay(schedule, day)) {
      return res.status(400).json({
        success: false,
        message: `Volunteer is not marked for early entry on ${conventionDayLabel(day)}`,
      })
    }

    const existing = volunteer.earlyCheckins.find((c) => c.conventionDay === day)
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Already checked in for ${conventionDayLabel(day)}`,
      })
    }

    const checkedInBy = `${session.user.name || session.user.email || session.user.id}`

    await prisma.$transaction(async (tx) => {
      await upsertDayCheckIn(tx, volunteer.id, day, checkedInBy)
    })

    return res.status(200).json({ success: true, conventionDay: day })
  } catch (error) {
    console.error('Error checking in volunteer:', error)
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
