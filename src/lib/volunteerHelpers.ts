/**
 * Volunteer Helper Functions
 * 
 * Implements D-TS-021: Global Volunteer Registry
 * 
 * These helpers ensure volunteers are treated as global records,
 * preventing duplicate creation and enforcing search-first logic.
 */

import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

interface FindOrCreateVolunteerParams {
  firstName: string
  lastName: string
  email: string
  congregation: string
  phone?: string
  formsOfService?: string[]
  userId?: string
}

/**
 * Find existing volunteer by email, or create new one if not found.
 * 
 * This implements the global volunteer registry pattern - one person = one record.
 * Email is the unique identifier.
 * 
 * @param params Volunteer data
 * @returns Existing or newly created volunteer record
 */
export async function findOrCreateVolunteer(params: FindOrCreateVolunteerParams) {
  const { firstName, lastName, email, congregation, phone, formsOfService, userId } = params

  // Normalize email for search
  const normalizedEmail = email.toLowerCase().trim()

  // Search for existing volunteer by email
  const existingVolunteer = await prisma.volunteers.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive'
      }
    }
  })

  if (existingVolunteer) {
    // Volunteer exists - return it
    console.log(`✓ Found existing volunteer: ${existingVolunteer.firstName} ${existingVolunteer.lastName} (${existingVolunteer.id})`)
    return existingVolunteer
  }

  // Volunteer doesn't exist - create new record
  const newVolunteer = await prisma.volunteers.create({
    data: {
      id: randomUUID(),
      firstName,
      lastName,
      email: normalizedEmail,
      congregation,
      phone: phone || null,
      formsOfService: formsOfService || [],
      userId: userId || null,
      updatedAt: new Date()
    }
  })

  console.log(`✓ Created new volunteer: ${newVolunteer.firstName} ${newVolunteer.lastName} (${newVolunteer.id})`)
  return newVolunteer
}

/**
 * Link volunteer to event via event_volunteers junction table.
 * 
 * Ensures volunteer is associated with the event. If already linked, returns existing record.
 * 
 * @param volunteerId Volunteer ID
 * @param eventId Event ID
 * @returns event_volunteers record
 */
export async function linkVolunteerToEvent(volunteerId: string, eventId: string) {
  // Check if already linked
  const existing = await prisma.event_volunteers.findFirst({
    where: {
      volunteerId,
      eventId
    }
  })

  if (existing) {
    console.log(`✓ Volunteer already linked to event`)
    return existing
  }

  // Create new link
  const link = await prisma.event_volunteers.create({
    data: {
      id: randomUUID(),
      volunteerId,
      eventId,
      updatedAt: new Date()
    }
  })

  console.log(`✓ Linked volunteer to event`)
  return link
}

/**
 * Get volunteers for a specific event (event-scoped query).
 * 
 * This ensures data isolation - only volunteers linked to this event are returned.
 * 
 * @param eventId Event ID
 * @returns Array of volunteers for this event
 */
export async function getVolunteersForEvent(eventId: string) {
  const volunteers = await prisma.volunteers.findMany({
    where: {
      event_volunteers_primary: {
        some: {
          eventId
        }
      }
    },
    orderBy: [
      { lastName: 'asc' },
      { firstName: 'asc' }
    ]
  })

  return volunteers
}
