import { NextApiRequest } from 'next'
import { prisma } from '@/lib/prisma'
import {
  getViewAsVolunteerId,
  isPrivilegedCounterRole,
} from '@/lib/countAssignmentsShared'
import { resolveVolunteerIdForSessionUser } from '@/lib/countAssignments'
import { canViewIvsVolunteers } from '@/lib/eventAccess'

function canUseViewAs(role: string | undefined): boolean {
  if (!role) return false
  const normalized = role.trim().toUpperCase()
  return (
    isPrivilegedCounterRole(normalized) ||
    normalized === 'ASSISTANT_OVERSEER'
  )
}

export type EarlyCheckinAccessResult =
  | { ok: true; volunteerId: string }
  | { ok: false; status: number; message: string }

/**
 * Resolve the volunteers.id used for IVS early check-in access.
 * PIN sessions use volunteers.id as session.user.id; staff may simulate via x-view-as-volunteer-id.
 */
export async function resolveEarlyCheckinVolunteerId(
  req: NextApiRequest,
  sessionUserId: string,
  sessionRole: string | undefined,
): Promise<string | null> {
  const viewAs = getViewAsVolunteerId(req)
  if (viewAs && canUseViewAs(sessionRole)) {
    const exists = await prisma.volunteers.findUnique({
      where: { id: viewAs },
      select: { id: true },
    })
    return exists?.id ?? null
  }

  const bySession = await resolveVolunteerIdForSessionUser(sessionUserId, sessionRole || '')
  if (bySession) return bySession

  // Staff linked by users.id → volunteers.userId already covered above; also accept direct volunteers.id
  const byId = await prisma.volunteers.findUnique({
    where: { id: sessionUserId },
    select: { id: true },
  })
  return byId?.id ?? null
}

/**
 * IVS early check-in on the volunteer dashboard requires an IVS team position assignment
 * for the effective volunteer (including simulated). Staff with IVS view rights may also access.
 */
export async function verifyVolunteerIvsEarlyCheckinAccess(
  req: NextApiRequest,
  sessionUserId: string,
  sessionRole: string | undefined,
  eventId: string,
): Promise<EarlyCheckinAccessResult> {
  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: { eventType: true },
  })

  if (event?.eventType !== 'REGIONAL_CONVENTION') {
    return { ok: false, status: 403, message: 'This is not an IVS event' }
  }

  const volunteerId = await resolveEarlyCheckinVolunteerId(req, sessionUserId, sessionRole)

  if (volunteerId) {
    const ivsTeamMember = await prisma.position_assignments.findFirst({
      where: {
        volunteerId,
        positions: { eventId },
      },
      select: { id: true },
    })
    if (ivsTeamMember) {
      return { ok: true, volunteerId }
    }
  }

  // Staff with IVS visibility (e.g. admin not assigned as IVS team) can still open the list
  if (await canViewIvsVolunteers(sessionUserId, eventId)) {
    return { ok: true, volunteerId: volunteerId || sessionUserId }
  }

  return {
    ok: false,
    status: 403,
    message: 'Access denied - IVS team member access required',
  }
}
