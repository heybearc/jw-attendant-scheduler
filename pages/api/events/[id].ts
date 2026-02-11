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
          positions: true,
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
          positions: event.positions.length
        }
      }

      return res.status(200).json({ success: true, data: transformedEvent })
    }

    if (req.method === "PUT") {
      try {
        // Extract locationId separately to handle as a relation
        const { locationId, ...bodyData } = req.body
        
        const { 
          name, description, eventType, startDate, endDate, startTime, endTime, location, status, capacity, attendantsNeeded, volunteersNeeded,
          departmentTemplateId,
          // APEX GUARDIAN: Oversight Management Fields
          circuitOverseerName, circuitOverseerPhone, circuitOverseerEmail,
          assemblyOverseerName, assemblyOverseerPhone, assemblyOverseerEmail,
          volunteerOverseerName, volunteerOverseerPhone, volunteerOverseerEmail,
          volunteerOverseerAssistants
        } = bodyData

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
          status,
          capacity: capacity ? parseInt(capacity) : null,
          volunteersNeeded: (volunteersNeeded || attendantsNeeded) ? parseInt(volunteersNeeded || attendantsNeeded) : null,
          updatedAt: new Date()
        }

        // Handle location relation properly using Prisma's connect/disconnect pattern
        if (locationId !== undefined) {
          if (locationId) {
            // Connect to the location
            updateData.locationRef = {
              connect: { id: locationId }
            }
          } else {
            // Disconnect from location (set to null)
            updateData.locationRef = {
              disconnect: true
            }
          }
        }

        // Add oversight fields if provided (note: all oversight fields use lowercase in schema)
        if (circuitOverseerName !== undefined) updateData.circuitoverseername = circuitOverseerName || null
        if (circuitOverseerPhone !== undefined) updateData.circuitoverseerphone = circuitOverseerPhone || null
        if (circuitOverseerEmail !== undefined) updateData.circuitoverseeremail = circuitOverseerEmail || null
        if (assemblyOverseerName !== undefined) updateData.assemblyoverseername = assemblyOverseerName || null
        if (assemblyOverseerPhone !== undefined) updateData.assemblyoverseerphone = assemblyOverseerPhone || null
        if (assemblyOverseerEmail !== undefined) updateData.assemblyoverseeremail = assemblyOverseerEmail || null
        if (volunteerOverseerName !== undefined) updateData.volunteeroverseername = volunteerOverseerName || null
        if (volunteerOverseerPhone !== undefined) updateData.volunteeroverseerphone = volunteerOverseerPhone || null
        if (volunteerOverseerEmail !== undefined) updateData.volunteeroverseeremail = volunteerOverseerEmail || null
        if (volunteerOverseerAssistants !== undefined) updateData.volunteeroverseerassistants = volunteerOverseerAssistants || []

        // Update the event using Prisma relations
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

      // Delete the event
      // Database has ON DELETE CASCADE configured for:
      // - positions (and their position_assignments, position_counts, position_oversight_assignments)
      // - event_volunteers
      // - count_sessions (and their position_counts)
      // - event_permissions
      // - announcements
      // - and other related records
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
