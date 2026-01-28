import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || session.user.role !== 'ATTENDANT') {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const { eventId } = req.query

  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ success: false, error: 'Event ID required' })
  }

  if (req.method === 'GET') {
    try {
      const availabilityRequests = await prisma.volunteer_availability.findMany({
        where: {
          attendantId: session.user.id,
          eventId: eventId,
          status: 'PENDING'
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              location: true
            }
          }
        },
        orderBy: {
          requestedAt: 'desc'
        }
      })

      const formattedRequests = availabilityRequests.map(req => ({
        id: req.id,
        eventId: req.eventId,
        status: req.status,
        requestedAt: req.requestedAt.toISOString(),
        respondedAt: req.respondedAt?.toISOString() || null,
        event: {
          id: req.event.id,
          name: req.event.name,
          startDate: req.event.startDate.toISOString(),
          endDate: req.event.endDate.toISOString(),
          location: req.event.location || 'Location TBD'
        }
      }))

      return res.status(200).json({
        success: true,
        requests: formattedRequests
      })
    } catch (error) {
      console.error('Error fetching availability requests:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch availability requests' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { requestId, status, notes } = req.body

      if (!requestId || !status) {
        return res.status(400).json({ success: false, error: 'Request ID and status required' })
      }

      if (!['AVAILABLE', 'PARTIAL', 'NOT_AVAILABLE'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' })
      }

      const availabilityRequest = await prisma.volunteer_availability.findUnique({
        where: { id: requestId }
      })

      if (!availabilityRequest) {
        return res.status(404).json({ success: false, error: 'Availability request not found' })
      }

      if (availabilityRequest.attendantId !== session.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to respond to this request' })
      }

      await prisma.volunteer_availability.update({
        where: { id: requestId },
        data: {
          status,
          notes: notes || null,
          respondedAt: new Date()
        }
      })

      return res.status(200).json({
        success: true,
        message: 'Availability response recorded'
      })
    } catch (error) {
      console.error('Error updating availability:', error)
      return res.status(500).json({ success: false, error: 'Failed to update availability' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
