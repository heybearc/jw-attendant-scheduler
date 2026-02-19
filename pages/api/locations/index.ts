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

  try {
    if (req.method === 'GET') {
      // Get all active locations with optional search
      const { search, includeInactive } = req.query

      const where: any = {}
      
      if (!includeInactive || includeInactive === 'false') {
        where.isActive = true
      }

      if (search && typeof search === 'string') {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } }
        ]
      }

      const locations = await prisma.locations.findMany({
        where,
        orderBy: [
          { usageCount: 'desc' },
          { name: 'asc' }
        ],
        include: {
          _count: {
            select: { events: true }
          }
        }
      })

      return res.status(200).json({
        success: true,
        data: locations
      })
    }

    if (req.method === 'POST') {
      // Create new location
      const { name, address, latitude, longitude, notes } = req.body

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Location name is required'
        })
      }

      const location = await prisma.locations.create({
        data: {
          id: `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: name.trim(),
          address: address?.trim() || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          notes: notes?.trim() || null,
          createdBy: session.user.id
        }
      })

      return res.status(201).json({
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
