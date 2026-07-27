import { prisma } from '@/lib/prisma'
import { volunteerRosterWhere } from '@/lib/volunteerRoster'
import { uniqueByEmail } from '@/lib/bulkEmailJob'

export type RosterEmailRecipient = {
  id: string
  firstName: string
  lastName: string
  email: string
}

/** Active Volunteers-roster members with email (excludes IVS-only). */
export async function getEventRosterEmailRecipients(
  eventId: string,
  options?: { volunteerIds?: string[] }
): Promise<RosterEmailRecipient[]> {
  const memberships = await prisma.event_volunteers.findMany({
    where: {
      eventId,
      isActive: true,
      volunteerId: options?.volunteerIds?.length
        ? { in: options.volunteerIds }
        : { not: null },
      ...volunteerRosterWhere,
      volunteer: { isActive: true },
    },
    select: {
      volunteer: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  })

  const rows = memberships
    .map((m) => m.volunteer)
    .filter(
      (v): v is RosterEmailRecipient =>
        !!v?.id && !!v.email?.trim() && !!v.firstName
    )

  return uniqueByEmail(rows)
}
