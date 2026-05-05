import { prisma } from './prisma'
import { checkEventAccess } from './eventAccess'

type ChatActor =
  | { kind: 'user'; id: string; role: string }
  | { kind: 'volunteer'; id: string; role: string }

export async function resolveActorFromSessionEmail(
  email: string,
  opts?: { viewAsVolunteerId?: string | null }
): Promise<ChatActor | null> {
  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true, role: true }
  })

  const canSimulateVolunteer = user && ['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER'].includes(user.role)

  if (canSimulateVolunteer && opts?.viewAsVolunteerId) {
    const volunteer = await prisma.volunteers.findUnique({
      where: { id: opts.viewAsVolunteerId },
      select: { id: true }
    })
    if (volunteer) {
      return { kind: 'volunteer', id: volunteer.id, role: 'VOLUNTEER' }
    }
  }

  if (user) {
    return { kind: 'user', id: user.id, role: user.role }
  }

  const volunteer = await prisma.volunteers.findUnique({
    where: { email },
    select: { id: true }
  })

  if (volunteer) {
    return { kind: 'volunteer', id: volunteer.id, role: 'VOLUNTEER' }
  }

  return null
}

export async function canAccessEventChat(eventId: string, sessionEmail: string, opts?: { viewAsVolunteerId?: string | null }) {
  const actor = await resolveActorFromSessionEmail(sessionEmail, opts)
  if (!actor) return { allowed: false as const, actor: null }

  if (actor.kind === 'user') {
    const permission = await checkEventAccess(actor.id, eventId, 'VIEWER')
    return { allowed: !!permission, actor }
  }

  const membership = await prisma.event_volunteers.findUnique({
    where: {
      eventId_volunteerId: {
        eventId,
        volunteerId: actor.id
      }
    },
    select: { id: true, isActive: true }
  })

  return { allowed: !!membership?.isActive, actor }
}

export async function canAccessChatChannel(
  eventId: string,
  channelId: string,
  sessionEmail: string,
  opts?: { viewAsVolunteerId?: string | null }
){
  const eventAccess = await canAccessEventChat(eventId, sessionEmail, opts)
  if (!eventAccess.allowed || !eventAccess.actor) {
    return { allowed: false as const, actor: null, channel: null }
  }

  const channel = await prisma.event_chat_channels.findFirst({
    where: { id: channelId, eventId, isArchived: false },
    select: { id: true, eventId: true, type: true, positionId: true, name: true, pinnedMessageId: true }
  })

  if (!channel) {
    return { allowed: false as const, actor: eventAccess.actor, channel: null }
  }

  if (eventAccess.actor.kind === 'user') {
    return { allowed: true as const, actor: eventAccess.actor, channel }
  }

  if (channel.type === 'STAFF_INTERNAL') {
    return { allowed: false as const, actor: eventAccess.actor, channel }
  }

  if (channel.type === 'EVENT_ANNOUNCEMENTS' || channel.type === 'EVENT_GENERAL') {
    return { allowed: true as const, actor: eventAccess.actor, channel }
  }

  if (channel.type === 'POSITION' && channel.positionId) {
    const assignment = await prisma.position_assignments.findFirst({
      where: {
        volunteerId: eventAccess.actor.id,
        positionId: channel.positionId,
        positions: { eventId }
      },
      select: { id: true }
    })
    return { allowed: !!assignment, actor: eventAccess.actor, channel }
  }

  return { allowed: false as const, actor: eventAccess.actor, channel }
}
