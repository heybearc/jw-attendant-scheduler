import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../src/lib/prisma'
import { handleApiError } from '@/lib/apiError'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { volunteerId } = req.query

    if (!volunteerId || typeof volunteerId !== 'string') {
      return res.status(400).json({ success: false, error: 'Volunteer ID is required' })
    }

    // Fetch events for this volunteer using the mapped table name
    const eventVolunteers = await prisma.event_volunteers.findMany({
      where: {
        volunteerId,
        events: {
          status: {
            in: ['UPCOMING', 'CURRENT']
          }
        }
      },
      select: {
        id: true,
        eventId: true,
        volunteerId: true,
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
      }
    })

    const events = eventVolunteers.map(ev => ({
      id: ev.events.id,
      name: ev.events.name,
      eventType: ev.events.eventType,
      startDate: ev.events.startDate?.toISOString(),
      endDate: ev.events.endDate?.toISOString(),
      status: ev.events.status
    }))

    return res.status(200).json({
      success: true,
      data: { events }
    })

  } catch (error) {
    // Error logged by handleApiError
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch events',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
