import { prisma } from './prisma'

/** Active event_volunteers row linked to a platform user account (staff also serving as volunteer). */
export async function getActiveLinkedVolunteerId(userId: string, eventId: string): Promise<string | null> {
  const row = await prisma.event_volunteers.findFirst({
    where: {
      eventId,
      userId,
      isActive: true,
      volunteerId: { not: null }
    },
    select: { volunteerId: true }
  })
  return row?.volunteerId ?? null
}

/** Canonical ordering for DM pair uniqueness (lexicographic on id strings). */
export function orderedVolunteerPair(id1: string, id2: string): { dmVolunteerAId: string; dmVolunteerBId: string } {
  return id1 <= id2 ? { dmVolunteerAId: id1, dmVolunteerBId: id2 } : { dmVolunteerAId: id2, dmVolunteerBId: id1 }
}
