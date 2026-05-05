import { prisma } from './prisma'

/**
 * Volunteer id for chat/DM when a platform user also serves as a volunteer on this event.
 *
 * 1) Prefer an explicit `event_volunteers.userId` row (legacy / explicit tie-in).
 * 2) Otherwise, if `volunteers.userId` points at this user (admin user edit link), use that
 *    volunteer when they have an active `event_volunteers` row for this event.
 */
export async function getActiveLinkedVolunteerId(userId: string, eventId: string): Promise<string | null> {
  const explicit = await prisma.event_volunteers.findFirst({
    where: {
      eventId,
      userId,
      isActive: true,
      volunteerId: { not: null }
    },
    select: { volunteerId: true }
  })
  if (explicit?.volunteerId) return explicit.volunteerId

  const volunteer = await prisma.volunteers.findFirst({
    where: { userId },
    select: { id: true }
  })
  if (!volunteer) return null

  const onEvent = await prisma.event_volunteers.findFirst({
    where: {
      eventId,
      volunteerId: volunteer.id,
      isActive: true
    },
    select: { volunteerId: true }
  })
  return onEvent?.volunteerId ?? null
}

/** Canonical ordering for DM pair uniqueness (lexicographic on id strings). */
export function orderedVolunteerPair(id1: string, id2: string): { dmVolunteerAId: string; dmVolunteerBId: string } {
  return id1 <= id2 ? { dmVolunteerAId: id1, dmVolunteerBId: id2 } : { dmVolunteerAId: id2, dmVolunteerBId: id1 }
}
