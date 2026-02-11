import { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]"
import { prisma } from "../../../../src/lib/prisma"
import { v4 as uuidv4 } from 'uuid'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { id } = req.query
  let { name } = req.body

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Event ID is required" })
  }

  try {
    // Fetch the original event with all related data
    const originalEvent = await prisma.events.findUnique({
      where: { id },
      include: {
        event_volunteers: {
          include: {
            volunteer: true
          }
        },
        positions: {
          include: {
            shifts: true,
            assignments: true,
            oversight: true
          }
        },
        lanyard_settings: {
          include: {
            lanyards: true
          }
        },
        count_sessions: {
          include: {
            position_counts: true
          }
        }
      }
    })

    if (!originalEvent) {
      return res.status(404).json({ error: "Event not found" })
    }

    // Get current user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Auto-generate name if not provided
    if (!name || typeof name !== "string") {
      name = `${originalEvent.name} (Copy)`
    }

    // Create the cloned event
    const newEventId = uuidv4()
    const clonedEvent = await prisma.events.create({
      data: {
        id: newEventId,
        name: name,
        description: originalEvent.description,
        eventType: originalEvent.eventType,
        startDate: originalEvent.startDate,
        endDate: originalEvent.endDate,
        startTime: originalEvent.startTime,
        endTime: originalEvent.endTime,
        location: originalEvent.location,
        capacity: originalEvent.capacity,
        volunteersNeeded: originalEvent.volunteersNeeded,
        status: 'UPCOMING',
        createdBy: user.id,
        departmentTemplateId: originalEvent.departmentTemplateId,
        updatedAt: new Date(),
        // Clone oversight details
        circuitOverseerName: originalEvent.circuitOverseerName,
        circuitOverseerPhone: originalEvent.circuitOverseerPhone,
        circuitOverseerEmail: originalEvent.circuitOverseerEmail,
        assemblyOverseerName: originalEvent.assemblyOverseerName,
        assemblyOverseerPhone: originalEvent.assemblyOverseerPhone,
        assemblyOverseerEmail: originalEvent.assemblyOverseerEmail,
        volunteerOverseerName: originalEvent.volunteerOverseerName,
        volunteerOverseerPhone: originalEvent.volunteerOverseerPhone,
        volunteerOverseerEmail: originalEvent.volunteerOverseerEmail,
        volunteerOverseerAssistants: originalEvent.volunteerOverseerAssistants ?? undefined,
        settings: originalEvent.settings ?? undefined
      }
    })

    // Clone event_volunteers
    const volunteerMapping = new Map<string, string>()
    for (const eventVolunteer of originalEvent.event_volunteers) {
      const newVolunteerId = uuidv4()
      volunteerMapping.set(eventVolunteer.id, newVolunteerId)
      
      await prisma.event_volunteers.create({
        data: {
          id: newVolunteerId,
          eventId: newEventId,
          userId: eventVolunteer.userId,
          volunteerId: eventVolunteer.volunteerId,
          role: eventVolunteer.role,
          isActive: eventVolunteer.isActive,
          assignedDepartments: eventVolunteer.assignedDepartments ?? undefined,
          assignedStationRanges: eventVolunteer.assignedStationRanges ?? undefined,
          keymanId: eventVolunteer.keymanId,
          overseerId: eventVolunteer.overseerId,
          updatedAt: new Date()
        }
      })
    }

    // Clone positions
    const positionMapping = new Map<string, string>()
    if (originalEvent.positions.length > 0) {
      for (const position of originalEvent.positions) {
      const newPositionId = uuidv4()
      positionMapping.set(position.id, newPositionId)
      
      await prisma.positions.create({
        data: {
          id: newPositionId,
          eventId: newEventId,
          positionNumber: position.positionNumber,
          name: position.name,
          description: position.description,
          area: position.area,
          sequence: position.sequence,
          isActive: position.isActive,
          updatedAt: new Date()
        }
      })

      // Clone shifts for this position
      const shiftMapping = new Map<string, string>()
      for (const shift of position.shifts) {
        const newShiftId = uuidv4()
        shiftMapping.set(shift.id, newShiftId)
        
        await prisma.position_shifts.create({
          data: {
            id: newShiftId,
            positionId: newPositionId,
            name: shift.name,
            sequence: shift.sequence,
            isAllDay: shift.isAllDay,
            startTime: shift.startTime,
            endTime: shift.endTime
          }
        })
      }

      // Clone assignments for this position
      for (const assignment of position.assignments) {
        const newShiftId = assignment.shiftId ? shiftMapping.get(assignment.shiftId) : null
        
        // Only clone if there's a volunteerId
        if (assignment.volunteerId) {
          await prisma.position_assignments.create({
            data: {
              id: uuidv4(),
              positionId: newPositionId,
              volunteerId: assignment.volunteerId,
              shiftId: newShiftId || undefined,
              role: assignment.role || 'VOLUNTEER',
              assignedBy: user.id
            }
          })
        }
      }

      // Clone oversight assignments for this position
      for (const oversight of position.oversight) {
        await prisma.position_oversight_assignments.create({
          data: {
            id: uuidv4(),
            positionId: newPositionId,
            eventId: newEventId,
            overseerId: oversight.overseerId,
            keymanId: oversight.keymanId,
            assignedBy: user.id
          }
        })
      }
    }
    }

    // Clone lanyards (if lanyard settings exist)
    if (originalEvent.lanyard_settings) {
      // First create lanyard_settings for the new event
      const newLanyardSettingsId = uuidv4()
      await prisma.lanyard_settings.create({
        data: {
          id: newLanyardSettingsId,
          eventId: newEventId,
          totalLanyards: originalEvent.lanyard_settings.totalLanyards,
          availableLanyards: originalEvent.lanyard_settings.availableLanyards,
          isActive: originalEvent.lanyard_settings.isActive,
          updatedAt: new Date()
        }
      })

      // Then clone individual lanyards
      for (const lanyard of originalEvent.lanyard_settings.lanyards) {
        await prisma.lanyards.create({
          data: {
            id: uuidv4(),
            lanyardSettingId: newLanyardSettingsId,
            badgeNumber: lanyard.badgeNumber,
            status: lanyard.status,
            notes: lanyard.notes,
            updatedAt: new Date()
          }
        })
      }
    }

    // Note: We intentionally do NOT clone count_sessions as those are event-specific
    // and should start fresh for each event

    // Clone event permissions
    const originalPermissions = await prisma.event_permissions.findMany({
      where: { eventId: id }
    })

    for (const permission of originalPermissions) {
      console.log(`[CLONE] Cloning permission for user ${permission.userId} with role ${permission.role}`)
      await prisma.event_permissions.create({
        data: {
          id: uuidv4(),
          eventId: newEventId,
          userId: permission.userId,
          role: permission.role,
          scopeType: permission.scopeType,
          scopeIds: permission.scopeIds ?? undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    const positionCount = originalEvent.positions.length
    const lanyardCount = originalEvent.lanyard_settings?.lanyards.length || 0
    
    return res.status(200).json({ 
      success: true, 
      data: { 
        id: newEventId,
        name: clonedEvent.name,
        message: `Event cloned successfully with ${positionCount} positions, ${originalEvent.event_volunteers.length} volunteers, ${lanyardCount} lanyards, and ${originalPermissions.length} permissions`
      }
    })

  } catch (error) {
    console.error("Event clone error:", error)
    return res.status(500).json({ 
      error: "Failed to clone event",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}
