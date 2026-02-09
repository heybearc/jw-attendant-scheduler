import { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]"
import { prisma } from "../../../src/lib/prisma"
import { canDeleteEvent } from "../../../src/lib/eventAccess"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { id } = req.query

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Event ID is required" })
  }

  try {
    if (req.method === "GET") {
      const event = await prisma.events.findUnique({
        where: { id },
        include: {
          event_volunteers: true,
          assignments: true,
          event_positions: true,
          // Phase 3B: Include department template configuration
          departmentTemplate: {
            select: {
              id: true,
              name: true,
              description: true,
              moduleConfig: true,
              terminology: true,
              positionTemplates: true
            }
          }
        }
      })

      if (!event) {
        return res.status(404).json({ error: "Event not found" })
      }

      // Transform event data for frontend compatibility
      const transformedEvent = {
        ...event,
        _count: {
          event_volunteers: event.event_volunteers.length,
          assignments: event.assignments.length,
          event_positions: event.event_positions.length
        }
      }

      return res.status(200).json({ success: true, data: transformedEvent })
    }

    if (req.method === "PUT") {
      try {
        const { 
          name, description, eventType, startDate, endDate, startTime, endTime, location, locationId, status, capacity, attendantsNeeded, volunteersNeeded,
          departmentTemplateId,
          // APEX GUARDIAN: Oversight Management Fields
          circuitOverseerName, circuitOverseerPhone, circuitOverseerEmail,
          assemblyOverseerName, assemblyOverseerPhone, assemblyOverseerEmail,
          volunteerOverseerName, volunteerOverseerPhone, volunteerOverseerEmail,
          volunteerOverseerAssistants
        } = req.body

        // APEX GUARDIAN: Build update data dynamically to avoid Prisma type issues
        const updateData: any = {
          name,
          description,
          eventType,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          startTime,
          endTime,
          location,
          locationId: locationId || null,
          status,
          capacity: capacity ? parseInt(capacity) : null,
          volunteersNeeded: (volunteersNeeded || attendantsNeeded) ? parseInt(volunteersNeeded || attendantsNeeded) : null,
          updatedAt: new Date()
        }

        // Add department template if provided (can be null to clear)
        // Note: departmentTemplateId is mapped in schema, so we can use it directly
        if (departmentTemplateId !== undefined) {
          updateData.departmentTemplateId = departmentTemplateId || null
        }

        // Add oversight fields if provided (note: circuit/assembly use lowercase in schema)
        if (circuitOverseerName !== undefined) updateData.circuitoverseername = circuitOverseerName || null
        if (circuitOverseerPhone !== undefined) updateData.circuitoverseerphone = circuitOverseerPhone || null
        if (circuitOverseerEmail !== undefined) updateData.circuitoverseeremail = circuitOverseerEmail || null
        if (assemblyOverseerName !== undefined) updateData.assemblyoverseername = assemblyOverseerName || null
        if (assemblyOverseerPhone !== undefined) updateData.assemblyoverseerphone = assemblyOverseerPhone || null
        if (assemblyOverseerEmail !== undefined) updateData.assemblyoverseeremail = assemblyOverseerEmail || null
        if (volunteerOverseerName !== undefined) updateData.volunteerOverseerName = volunteerOverseerName || null
        if (volunteerOverseerPhone !== undefined) updateData.volunteerOverseerPhone = volunteerOverseerPhone || null
        if (volunteerOverseerEmail !== undefined) updateData.volunteerOverseerEmail = volunteerOverseerEmail || null
        if (volunteerOverseerAssistants !== undefined) updateData.volunteerOverseerAssistants = volunteerOverseerAssistants || []

        const event = await prisma.events.update({
          where: { id },
          data: updateData
        })

        return res.status(200).json({ success: true, data: event })

      } catch (error) {
        console.error('Error updating event:', error)
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to update event', 
          details: error.message 
        })
      }
    }

    if (req.method === "DELETE") {
      // Get current user
      const user = await prisma.users.findUnique({
        where: { email: session.user.email }
      })

      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" })
      }

      // Check if user has permission to delete this event
      const canDelete = await canDeleteEvent(user.id, id)
      
      if (!canDelete) {
        return res.status(403).json({ 
          success: false,
          error: "Only event owners can delete events" 
        })
      }

      // Check if event has positions or other dependencies
      const positionsCount = await prisma.positions.count({
        where: { eventId: id }
      })

      if (positionsCount > 0) {
        return res.status(400).json({ 
          success: false,
          error: `Cannot delete event with ${positionsCount} position(s). Remove positions first.` 
        })
      }

      // Delete related records first (cascade delete will handle most)
      // Note: Database has ON DELETE CASCADE for most relations
      
      // Delete event_volunteers associations
      await prisma.event_volunteers.deleteMany({ where: { eventId: id } })
      
      // Delete count sessions (with their position_counts via cascade)
      await prisma.count_sessions.deleteMany({ where: { eventId: id } })
      
      // Delete event permissions
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM event_permissions WHERE "eventId" = $1`, id)
      } catch (e) {
        console.log('Note: event_permissions table may not exist:', e.message)
      }
      
      // Delete the event (cascade will handle remaining relations)
      await prisma.events.delete({
        where: { id }
      })

      return res.status(200).json({ 
        success: true, 
        message: "Event deleted successfully" 
      })
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (error) {
    console.error("Event API error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
