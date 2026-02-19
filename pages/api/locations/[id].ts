import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'
import { handleApiError } from '@/lib/apiError'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid location ID' })
  }

  try {
    if (req.method === 'GET') {
      // Get single location with events
      const location = await prisma.locations.findUnique({
        where: { id },
        include: {
          events: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              status: true
            },
            orderBy: { startDate: 'desc' },
            take: 10
          },
          _count: {
            select: { events: true }
          }
        }
      })

      if (!location) {
        return res.status(404).json({ success: false, error: 'Location not found' })
      }

      return res.status(200).json({
        success: true,
        data: location
      })
    }

    if (req.method === 'PUT') {
      // Update location
      const { name, address, latitude, longitude, notes, isActive } = req.body

      const updateData: any = {}

      if (name !== undefined) updateData.name = name.trim()
      if (address !== undefined) updateData.address = address?.trim() || null
      if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null
      if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null
      if (notes !== undefined) updateData.notes = notes?.trim() || null
      if (isActive !== undefined) updateData.isActive = Boolean(isActive)
      
      updateData.updatedAt = new Date()

      const location = await prisma.locations.update({
        where: { id },
        data: updateData
      })

      return res.status(200).json({
        success: true,
        data: location
      })
    }

    if (req.method === 'DELETE') {
      // Soft delete - mark as inactive
      const location = await prisma.locations.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })

      return res.status(200).json({
        success: true,
        data: location
      })
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' })
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}
