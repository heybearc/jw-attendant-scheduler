import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../src/lib/prisma'

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
        event: {
          status: {
            in: ['UPCOMING', 'CURRENT']
          }
        }
      },
      include: {
        event: true
      }
    })

    const events = eventVolunteers.map(ev => ({
      id: ev.event.id,
      name: ev.event.name,
      eventType: ev.event.eventType,
      startDate: ev.event.startDate?.toISOString(),
      endDate: ev.event.endDate?.toISOString(),
      status: ev.event.status
    }))

    return res.status(200).json({
      success: true,
      data: { events }
    })

  } catch (error) {
    console.error('Volunteer events error:', error)
    console.error('Error details:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch events' 
    })
  }
}
