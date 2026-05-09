import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../src/lib/prisma'
import { toDateOnlyStringUTC } from '../../../src/lib/calendarDate'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { volunteerId, eventId } = req.query

  if (!volunteerId || !eventId) {
    return res.status(400).json({ success: false, error: 'Missing volunteerId or eventId' })
  }

  try {
    // Get volunteer information using proper Prisma
    const volunteer = await prisma.volunteers.findUnique({
      where: { id: volunteerId as string }
    })

    if (!volunteer) {
      return res.status(404).json({ success: false, error: 'Volunteer not found' })
    }

    // Get published documents for THIS EVENT ONLY
    const publishedDocs = await prisma.document_publications.findMany({
      where: {
        volunteerId: volunteerId as string,
        event_documents: {
          eventId: eventId as string
        }
      },
      include: {
        event_documents: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    })

    // Format documents for frontend
    const documents = publishedDocs.map(pub => ({
      id: pub.event_documents.id,
      title: pub.event_documents.title,
      description: pub.event_documents.description,
      fileName: pub.event_documents.fileName,
      fileSize: pub.event_documents.fileSize,
      fileType: pub.event_documents.fileType,
      fileUrl: pub.event_documents.fileUrl,
      publishedAt: pub.publishedAt.toISOString()
    }))

    // Get event details
    const event = await prisma.events.findUnique({
      where: { id: eventId as string },
      select: {
        id: true,
        name: true,
        eventType: true,
        startDate: true,
        endDate: true,
        status: true,
        settings: true
      }
    })

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    // Get position assignments for this volunteer
    const positionAssignments = await prisma.position_assignments.findMany({
      where: {
        volunteerId: volunteerId as string,
        positions: {
          eventId: eventId as string
        }
      },
      include: {
        positions: {
          select: {
            id: true,
            name: true,
            area: true,
            positionNumber: true
          }
        },
        shift: {
          select: {
            name: true,
            startTime: true,
            endTime: true,
            isAllDay: true
          }
        },
        overseer: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        keyman: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        shift: {
          startTime: 'asc'
        }
      }
    })

    // Get complete schedule for each position (FB-003: Complete schedule visibility)
    const positionIds = positionAssignments.map(a => a.positions.id)
    const allPositionAssignments = await prisma.position_assignments.findMany({
      where: {
        positionId: {
          in: positionIds
        }
      },
      include: {
        volunteer: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        shift: {
          select: {
            name: true,
            startTime: true,
            endTime: true,
            isAllDay: true
          }
        }
      },
      orderBy: {
        shift: {
          startTime: 'asc'
        }
      }
    })

    // Format assignments for frontend with complete schedule
    const assignments = positionAssignments.map(assignment => {
      // Handle all-day shifts
      const isAllDay = assignment.shift?.isAllDay || false
      const shiftName = assignment.shift?.name || ''
      
      // Get complete schedule for this position
      const positionSchedule = allPositionAssignments
        .filter(a => a.positionId === assignment.positions.id)
        .map(a => ({
          volunteerName: `${a.volunteer.firstName} ${a.volunteer.lastName}`,
          isCurrentUser: a.volunteerId === volunteerId,
          shiftName: a.shift?.name || '',
          startTime: a.shift?.isAllDay ? 'All Day' : (a.shift?.startTime || ''),
          endTime: a.shift?.isAllDay ? '' : (a.shift?.endTime || ''),
          isAllDay: a.shift?.isAllDay || false
        }))
      
      return {
        id: assignment.id,
        positionId: assignment.positions.id,
        positionName: assignment.positions.name,
        location: assignment.positions.area || undefined,
        startTime: isAllDay ? 'All Day' : (assignment.shift?.startTime || shiftName || ''),
        endTime: isAllDay ? '' : (assignment.shift?.endTime || ''),
        instructions: undefined,
        overseer: assignment.overseer ? `${assignment.overseer.firstName} ${assignment.overseer.lastName}` : undefined,
        keyman: assignment.keyman ? `${assignment.keyman.firstName} ${assignment.keyman.lastName}` : undefined,
        completeSchedule: positionSchedule
      }
    })
    
    // Get oversight contacts from event_volunteers table (source of truth)
    const eventVolunteer = await prisma.event_volunteers.findFirst({
      where: {
        volunteerId: volunteerId as string,
        eventId: eventId as string
      },
      select: {
        id: true,
        eventId: true,
        volunteerId: true,
        keyman: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        overseer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        }
      }
    })
    
    // Build oversight contacts array
    const oversightContacts: any[] = []
    if (eventVolunteer?.overseer) {
      oversightContacts.push({
        name: `${eventVolunteer.overseer.firstName} ${eventVolunteer.overseer.lastName}`,
        role: 'Position Overseer',
        phone: eventVolunteer.overseer.phone,
        email: eventVolunteer.overseer.email
      })
    }
    if (eventVolunteer?.keyman) {
      oversightContacts.push({
        name: `${eventVolunteer.keyman.firstName} ${eventVolunteer.keyman.lastName}`,
        role: 'Position Keyman',
        phone: eventVolunteer.keyman.phone,
        email: eventVolunteer.keyman.email
      })
    }

    // Check if Early Check-In tab should be shown
    // Show if IVS module is enabled for the event (volunteer is already confirmed to be registered for this event)
    const ivsModuleEnabled = (event.settings as any)?.modules?.ivsModule ?? false
    
    // If IVS module is enabled, the volunteer has access to Early Check-In
    // (they're already registered for the event via event_volunteers)
    const ivsTeamMember = ivsModuleEnabled ? eventVolunteer : null

    // Count groups where this volunteer is primary or secondary counter (one combined entry per group).
    const volunteerGroups = await prisma.count_session_groups.findMany({
      where: {
        countSession: {
          eventId: eventId as string,
          status: 'ACTIVE',
          isActive: true
        },
        OR: [
          { primaryVolunteerId: volunteerId as string },
          { secondaryVolunteerId: volunteerId as string }
        ]
      },
      include: {
        primaryVolunteer: { select: { firstName: true, lastName: true } },
        secondaryVolunteer: { select: { firstName: true, lastName: true } },
        entry: true,
        positions: {
          include: {
            position: {
              select: { id: true, name: true, positionNumber: true }
            }
          }
        },
        countSession: {
          select: { id: true, sessionName: true, countTime: true, status: true }
        }
      },
      orderBy: { countSession: { countTime: 'asc' } }
    })

    const groupPositionKeys = new Set<string>()
    for (const g of volunteerGroups) {
      for (const row of g.positions) {
        groupPositionKeys.add(`${g.countSessionId}:${row.positionId}`)
      }
    }

    // Station-level counts on the volunteer dashboard: only volunteers explicitly listed in
    // count_session_position_assignees for that session/station. (Suggestion winners and legacy
    // assignment fallback stay available on the dedicated enter-count page / POST handler.)
    const activeSessions = await prisma.count_sessions.findMany({
      where: {
        eventId: eventId as string,
        status: 'ACTIVE',
        isActive: true
      },
      select: {
        id: true,
        sessionName: true,
        countTime: true,
        status: true
      },
      orderBy: {
        countTime: 'asc'
      }
    })

    const sessionIds = activeSessions.map((s) => s.id)

    const assigneesForSessions =
      sessionIds.length === 0
        ? []
        : await prisma.count_session_position_assignees.findMany({
            // Suggested rows (from "Apply suggestions") are draft until overseer confirms.
            where: { countSessionId: { in: sessionIds }, isSuggested: false },
            select: { countSessionId: true, positionId: true, volunteerId: true }
          })

    const assigneesBySession = new Map<string, typeof assigneesForSessions>()
    for (const row of assigneesForSessions) {
      const list = assigneesBySession.get(row.countSessionId) || []
      list.push(row)
      assigneesBySession.set(row.countSessionId, list)
    }

    const vid = volunteerId as string

    // Stations that belong to another volunteer's count group should not offer station-level submit
    // on the dashboard (counts go through the group's primary/secondary only). Explicit assignee
    // rows can remain from earlier setup; they must not surface duplicate submit UI here.
    const allGroupsForSessions =
      sessionIds.length === 0
        ? []
        : await prisma.count_session_groups.findMany({
            where: { countSessionId: { in: sessionIds } },
            select: {
              countSessionId: true,
              primaryVolunteerId: true,
              secondaryVolunteerId: true,
              positions: { select: { positionId: true } }
            }
          })

    const stationPositionsInOthersGroups = new Set<string>()
    for (const g of allGroupsForSessions) {
      const isThisVolunteer =
        g.primaryVolunteerId === vid || g.secondaryVolunteerId === vid
      if (isThisVolunteer) continue
      for (const row of g.positions) {
        stationPositionsInOthersGroups.add(`${g.countSessionId}:${row.positionId}`)
      }
    }

    const activeCountSessions = activeSessions
      .map((session) => {
        const rows = assigneesBySession.get(session.id) || []
        const positionIds = [
          ...new Set(
            rows
              .filter((r) => r.volunteerId === vid)
              .map((r) => r.positionId)
              .filter((pid) => !groupPositionKeys.has(`${session.id}:${pid}`))
              .filter((pid) => !stationPositionsInOthersGroups.has(`${session.id}:${pid}`))
          )
        ]
        return {
          id: session.id,
          sessionName: session.sessionName,
          countTime: session.countTime,
          status: session.status,
          positionIds
        }
      })
      .filter((session) => session.positionIds.length > 0)

    // Get active announcements for this event
    const now = new Date()
    const announcements = await prisma.announcements.findMany({
      where: {
        eventId: eventId as string,
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        createdAt: true
      },
      orderBy: [
        { type: 'desc' }, // URGENT first
        { createdAt: 'desc' }
      ]
    })

    return res.status(200).json({
      success: true,
      data: {
        volunteer: {
          id: volunteer.id,
          firstName: volunteer.firstName,
          lastName: volunteer.lastName,
          congregation: volunteer.congregation,
          email: volunteer.email,
          phone: volunteer.phone,
          profileVerificationRequired: volunteer.profileVerificationRequired || false,
          profileVerifiedAt: volunteer.profileVerifiedAt?.toISOString()
        },
        event: {
          id: event.id,
          name: event.name,
          eventType: event.eventType,
          startDate: event.startDate ? toDateOnlyStringUTC(event.startDate) : null,
          endDate: event.endDate ? toDateOnlyStringUTC(event.endDate) : null,
          status: event.status
        },
        isIVSTeamMember: !!ivsTeamMember,
        assignments,
        activeCountGroups: volunteerGroups.map((g) => ({
          sessionId: g.countSessionId,
          sessionName: g.countSession.sessionName,
          countTime: g.countSession.countTime ? g.countSession.countTime.toISOString() : null,
          groupId: g.id,
          groupName: g.name,
          primaryVolunteerId: g.primaryVolunteerId,
          secondaryVolunteerId: g.secondaryVolunteerId,
          primaryName: g.primaryVolunteer
            ? `${g.primaryVolunteer.firstName} ${g.primaryVolunteer.lastName}`.trim()
            : null,
          secondaryName: g.secondaryVolunteer
            ? `${g.secondaryVolunteer.firstName} ${g.secondaryVolunteer.lastName}`.trim()
            : null,
          stations: g.positions.map((row) => ({
            id: row.position.id,
            name: row.position.name,
            positionNumber: row.position.positionNumber
          })),
          existingCount: g.entry?.attendeeCount ?? null,
          existingNotes: g.entry?.notes ?? null
        })),
        activeCountSessions: activeCountSessions.map(session => ({
          id: session.id,
          sessionName: session.sessionName,
          countTime: session.countTime ? session.countTime.toISOString() : null,
          status: session.status,
          positionIds: session.positionIds
        })),
        announcements: announcements.map(ann => ({
          id: ann.id,
          title: ann.title,
          message: ann.message,
          type: ann.type,
          createdAt: ann.createdAt ? ann.createdAt.toISOString() : null
        })),
        documents: documents,
        oversightContacts
      }
    })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
