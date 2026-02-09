import { prisma } from './prisma'

export type EventPermissionRole = 'ADMIN' | 'COORDINATOR' | 'VIEWER'
export type EventScopeType = 'DEPARTMENT' | 'STATION_RANGE' | 'POSITION'

export interface EventPermission {
  role: EventPermissionRole
  scopeType?: EventScopeType | null
  scopeIds?: string[]
}

/**
 * Check if user has access to an event with at least the required role
 * Returns the permission object if access is granted, null otherwise
 * ADMIN users automatically have OWNER access to all events
 */
export async function checkEventAccess(
  userId: string,
  eventId: string,
  requiredRole: EventPermissionRole = 'VIEWER'
): Promise<EventPermission | null> {
  // Check if user is ADMIN - they have automatic OWNER access to all events
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  if (user?.role === 'ADMIN') {
    return {
      role: 'ADMIN',
      scopeType: null,
      scopeIds: undefined
    }
  }

  const permission = await prisma.event_permissions.findUnique({
    where: { userId_eventId: { userId, eventId } }
  })

  if (!permission) return null

  const roleHierarchy: Record<EventPermissionRole, number> = {
    ADMIN: 3,
    COORDINATOR: 2,
    VIEWER: 1
  }

  if (roleHierarchy[permission.role as EventPermissionRole] >= roleHierarchy[requiredRole]) {
    return {
      role: permission.role as EventPermissionRole,
      scopeType: permission.scopeType as EventScopeType | null,
      scopeIds: permission.scopeIds as string[] | undefined
    }
  }

  return null
}

/**
 * Check if user can manage volunteers (add/remove/edit)
 * Only ADMIN and COORDINATOR can manage volunteers
 */
export async function canManageAttendants(
  userId: string,
  eventId: string
): Promise<boolean> {
  const permission = await checkEventAccess(userId, eventId, 'COORDINATOR')
  if (!permission) return false

  // ADMIN and COORDINATOR can manage volunteers
  return ['ADMIN', 'COORDINATOR'].includes(permission.role)
}

/**
 * Check if user can manage a specific position
 * ADMIN and COORDINATOR can manage all positions
 */
export async function canManagePosition(
  userId: string,
  eventId: string,
  positionId: string
): Promise<boolean> {
  const permission = await checkEventAccess(userId, eventId, 'COORDINATOR')
  if (!permission) return false

  // ADMIN and COORDINATOR can manage all positions
  return ['ADMIN', 'COORDINATOR'].includes(permission.role)
}

/**
 * Check if user can edit a specific assignment
 * ADMIN and COORDINATOR can edit all assignments
 */
export async function canEditAssignment(
  userId: string,
  eventId: string,
  assignmentId: string
): Promise<boolean> {
  const permission = await checkEventAccess(userId, eventId, 'COORDINATOR')
  if (!permission) return false

  // ADMIN and COORDINATOR can edit all assignments
  return ['ADMIN', 'COORDINATOR'].includes(permission.role)
}

/**
 * Check if user can manage event settings (edit event details)
 * Only ADMIN can edit event settings
 */
export async function canManageEvent(
  userId: string,
  eventId: string
): Promise<boolean> {
  const permission = await checkEventAccess(userId, eventId, 'ADMIN')
  if (!permission) return false

  return permission.role === 'ADMIN'
}

/**
 * Check if user can delete an event
 * Only ADMIN can delete events
 */
export async function canDeleteEvent(
  userId: string,
  eventId: string
): Promise<boolean> {
  const permission = await checkEventAccess(userId, eventId, 'ADMIN')
  if (!permission) return false

  return permission.role === 'ADMIN'
}

/**
 * Check if user can manage event permissions (invite/remove users)
 * Only ADMIN can manage permissions
 * System ADMIN users automatically have permission
 */
export async function canManagePermissions(
  userId: string,
  eventId: string
): Promise<boolean> {
  const permission = await checkEventAccess(userId, eventId, 'ADMIN')
  if (!permission) {
    console.log('❌ canManagePermissions: No permission found for user', userId, 'event', eventId)
    return false
  }

  console.log('✅ canManagePermissions: User has role', permission.role)
  return permission.role === 'ADMIN'
}

/**
 * Check if user can upload/manage documents
 * ADMIN and COORDINATOR can manage documents
 */
export async function canManageDocuments(
  userId: string,
  eventId: string
): Promise<boolean> {
  const permission = await checkEventAccess(userId, eventId, 'COORDINATOR')
  if (!permission) return false

  // ADMIN and COORDINATOR can manage documents
  return ['ADMIN', 'COORDINATOR'].includes(permission.role)
}

/**
 * Get all events a user has access to
 * ADMIN users get access to all events automatically
 */
export async function getUserEvents(userId: string) {
  try {
    // Check if user is ADMIN - they get all events
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (user?.role === 'ADMIN') {
      const allEvents = await prisma.events.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          startDate: true,
          endDate: true,
          eventType: true,
          location: true,
          venue: true,
          parentEventId: true,
          childEvents: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          startDate: 'desc'
        }
      })

      return allEvents.map((event: any) => ({
        ...event,
        userRole: 'ADMIN',
        scopeType: null,
        scopeIds: null
      }))
    }

    const permissions = await (prisma as any).event_permissions.findMany({
      where: { userId },
      include: {
        events: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            startDate: true,
            endDate: true,
            eventType: true,
            location: true,
            venue: true,
            parentEventId: true,
            childEvents: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        events: {
          startDate: 'desc'
        }
      }
    })

    return permissions.map((p: any) => ({
      ...p.events,
      userRole: p.role,
      scopeType: p.scopeType,
      scopeIds: p.scopeIds
    }))
  } catch (error) {
    console.error('getUserEvents error:', error)
    // If event_permissions table doesn't exist yet, return empty array
    return []
  }
}

/**
 * Grant permission to a user for an event
 */
export async function grantEventPermission(
  eventId: string,
  userId: string,
  role: EventPermissionRole,
  scopeType?: EventScopeType,
  scopeIds?: string[]
) {
  return await prisma.event_permissions.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: {
      id: crypto.randomUUID(),
      userId,
      eventId,
      role,
      scopeType: scopeType || null,
      scopeIds: scopeIds || null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    update: {
      role,
      scopeType: scopeType || null,
      scopeIds: scopeIds || null,
      updatedAt: new Date()
    }
  })
}

/**
 * Revoke permission from a user for an event
 */
export async function revokeEventPermission(
  eventId: string,
  userId: string
) {
  return await prisma.event_permissions.delete({
    where: { userId_eventId: { userId, eventId } }
  })
}
