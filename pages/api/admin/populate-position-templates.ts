import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const { departmentTemplateId, positions } = req.body

    if (!departmentTemplateId || !positions) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Update the department template with position templates
    const updated = await prisma.department_templates.update({
      where: { id: departmentTemplateId },
      data: {
        positionTemplates: positions
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Position templates populated successfully',
      template: {
        id: updated.id,
        name: updated.name,
        positionCount: Object.values(positions).flat().length
      }
    })
  } catch (error) {
    console.error('Error populating position templates:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
