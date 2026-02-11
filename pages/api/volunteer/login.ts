import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../src/lib/prisma'
import bcrypt from 'bcryptjs'

interface VolunteerLoginRequest {
  firstName: string
  lastName: string
  congregation: string
  pin: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🟢 Volunteer login API called')
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { firstName, lastName, congregation, pin }: VolunteerLoginRequest = req.body

    if (!firstName || !lastName || !congregation || !pin) {
      console.log('❌ Missing fields')
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      })
    }

    // Search for volunteer by name and congregation
    const volunteer = await prisma.volunteers.findFirst({
      where: {
        firstName: {
          equals: firstName.trim(),
          mode: 'insensitive'
        },
        lastName: {
          equals: lastName.trim(),
          mode: 'insensitive'
        },
        congregation: {
          equals: congregation.trim(),
          mode: 'insensitive'
        }
      },
      include: {
        event_volunteers_primary: {
          include: {
            events: {
              select: {
                id: true,
                name: true,
                eventType: true,
                startDate: true,
                endDate: true,
                status: true
              }
            }
          },
          where: {
            events: {
              status: {
                in: ['UPCOMING', 'CURRENT']
              }
            }
          }
        }
      }
    })

    if (!volunteer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid credentials. Please check your information.' 
      })
    }
    
    
    // Verify PIN using raw query (Prisma client doesn't include pinHash field due to server issue)
    const pinResult = await prisma.$queryRaw<Array<{ pinHash: string | null }>>`
      SELECT "pinHash" FROM attendants WHERE id = ${volunteer.id}
    `
    
    const pinHash = pinResult[0]?.pinHash
    
    if (!pinHash) {
      console.log('❌ No PIN set for volunteer')
      return res.status(403).json({ 
        success: false, 
        error: 'No PIN set. Please contact your overseer.' 
      })
    }
    
    const pinValid = await bcrypt.compare(pin, pinHash)
    if (!pinValid) {
      console.log('❌ Invalid PIN')
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid PIN. Please try again.' 
      })
    }
    

    // Get active events for this volunteer
    const events = volunteer.event_volunteers_primary.map(ev => ({
      id: ev.events.id,
      name: ev.events.name,
      eventType: ev.events.eventType,
      startDate: ev.events.startDate?.toISOString(),
      endDate: ev.events.endDate?.toISOString(),
      status: ev.events.status
    }))

    if (events.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No active events found for your profile. Please contact your overseer.' 
      })
    }

    // Determine if event selection is needed
    const needsEventSelection = events.length > 1

    // If only one event, set it as the default
    const defaultEvent = events.length === 1 ? events[0] : null

    return res.status(200).json({
      success: true,
      data: {
        volunteer: {
          id: volunteer.id,
          firstName: volunteer.firstName,
          lastName: volunteer.lastName,
          congregation: volunteer.congregation,
          email: volunteer.email,
          phone: volunteer.phone
        },
        events,
        needsEventSelection,
        defaultEvent,
        redirectTo: needsEventSelection ? '/volunteer/select-event' : '/volunteer/dashboard'
      },
      message: `Welcome, ${volunteer.firstName}!`
    })

  } catch (error) {
    console.error('❌ Volunteer login error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return res.status(500).json({ 
      success: false, 
      error: `An error occurred during login: ${error instanceof Error ? error.message : String(error)}` 
    })
  }
}
