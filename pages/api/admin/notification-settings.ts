import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'

/**
 * Phase 4C Feature #1: Notification Settings API
 * Store and retrieve notification preferences
 */

interface NotificationSettings {
  assignmentCreated: boolean
  assignmentUpdated: boolean
  assignmentCancelled: boolean
  reminderEnabled: boolean
  reminder24h: boolean
  reminder48h: boolean
  reminder1week: boolean
}

const DEFAULT_SETTINGS: NotificationSettings = {
  assignmentCreated: true,
  assignmentUpdated: true,
  assignmentCancelled: true,
  reminderEnabled: false,
  reminder24h: false,
  reminder48h: false,
  reminder1week: false
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      // Get notification settings
      const settingsRecord = await prisma.system_settings.findFirst({
        where: { key: 'notification_settings' }
      })

      let settings = DEFAULT_SETTINGS
      if (settingsRecord?.value) {
        try {
          settings = JSON.parse(settingsRecord.value as string)
        } catch (e) {
          console.error('Failed to parse notification settings:', e)
        }
      }

      return res.status(200).json({
        success: true,
        settings
      })
    }

    if (req.method === 'POST') {
      // Save notification settings
      const settings: NotificationSettings = req.body

      // Validate settings
      if (typeof settings !== 'object') {
        return res.status(400).json({ error: 'Invalid settings format' })
      }

      // Upsert settings
      await prisma.system_settings.upsert({
        where: {
          key: 'notification_settings'
        },
        create: {
          id: require('crypto').randomUUID(),
          key: 'notification_settings',
          value: JSON.stringify(settings),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        update: {
          value: JSON.stringify(settings),
          updatedAt: new Date()
        }
      })

      return res.status(200).json({
        success: true,
        message: 'Notification settings saved successfully'
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Notification settings API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
