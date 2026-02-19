import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '../../../../../src/lib/prisma'
import { handleApiError } from '@/lib/apiError'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { id: eventId } = req.query

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ success: false, error: 'Event ID is required' })
    }

    // Verify event exists
    const event = await prisma.events.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    if (req.method === 'PATCH') {
      return await handleBulkUpdate(req, res, eventId)
    }

    if (req.method === 'DELETE') {
      return await handleBulkDelete(req, res, eventId)
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

async function handleBulkUpdate(req: NextApiRequest, res: NextApiResponse, eventId: string) {
  const { attendantIds, isActive } = req.body

  if (!Array.isArray(attendantIds) || attendantIds.length === 0) {
    return res.status(400).json({ success: false, error: 'attendantIds array is required' })
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ success: false, error: 'isActive boolean is required' })
  }

  try {
    // Update event_attendants associations using raw SQL
    const updateResult = await prisma.$executeRaw`
      UPDATE event_attendants
      SET "isActive" = ${isActive}, "updatedAt" = NOW()
      WHERE "eventId" = ${eventId}
      AND "attendantId" = ANY(${attendantIds}::text[])
    `

    return res.status(200).json({
      success: true,
      data: {
        updated: updateResult,
        isActive: isActive
      },
      message: `Successfully updated ${updateResult} volunteer(s)`
    })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update volunteers',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleBulkDelete(req: NextApiRequest, res: NextApiResponse, eventId: string) {
  const { attendantIds } = req.body

  if (!Array.isArray(attendantIds) || attendantIds.length === 0) {
    return res.status(400).json({ success: false, error: 'attendantIds array is required' })
  }

  try {
    // Check if any volunteers have position assignments
    const assignmentsCount = await prisma.position_assignments.count({
      where: {
        positions: {
          eventId: eventId
        },
        volunteer: {
          userId: { in: attendantIds }
        }
      }
    })

    if (assignmentsCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete volunteers with existing assignments. Found ${assignmentsCount} assignment(s). Please remove assignments first.`
      })
    }

    // Delete event_attendants associations using raw SQL
    const deleteResult = await prisma.$executeRaw`
      DELETE FROM event_attendants
      WHERE "eventId" = ${eventId}
      AND "attendantId" = ANY(${attendantIds}::text[])
    `

    return res.status(200).json({
      success: true,
      data: {
        deleted: deleteResult
      },
      message: `Successfully removed ${deleteResult} volunteer(s) from event`
    })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to delete volunteers',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
