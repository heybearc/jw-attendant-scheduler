import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../src/lib/prisma'
import { handleApiError } from '../../../src/lib/apiError'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user?.email) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true }
  })

  if (!user) {
    return res.status(403).json({ success: false, error: 'User not found' })
  }

  // GET: Allow ADMIN, OVERSEER, ASSISTANT_OVERSEER to read templates
  // POST: Only ADMIN can create templates
  const canRead = ['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER'].includes(user.role)
  const canWrite = user.role === 'ADMIN'

  try {
    switch (req.method) {
      case 'GET':
        if (!canRead) {
          return res.status(403).json({ success: false, error: 'Insufficient permissions' })
        }
        return await handleGet(req, res)
      case 'POST':
        if (!canWrite) {
          return res.status(403).json({ success: false, error: 'Admin access required' })
        }
        return await handlePost(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ success: false, error: 'Method not allowed' })
    }
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { includeInactive } = req.query

  const templates = await prisma.department_templates.findMany({
    where: includeInactive === 'true' ? {} : { isActive: true },
    include: {
      parent: {
        select: {
          id: true,
          name: true
        }
      },
      children: {
        where: includeInactive === 'true' ? {} : { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          sortOrder: true,
          isActive: true
        },
        orderBy: { sortOrder: 'asc' }
      },
      _count: {
        select: {
          event_departments: true,
          events: true
        }
      }
    },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' }
    ]
  })

  return res.status(200).json({
    success: true,
    data: templates
  })
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { 
    name, 
    description, 
    parentId, 
    icon, 
    sortOrder, 
    isActive,
    moduleConfig,
    terminology,
    positionTemplates
  } = req.body

  if (!name) {
    return res.status(400).json({ success: false, error: 'Department name is required' })
  }

  const existing = await prisma.department_templates.findUnique({
    where: { name }
  })

  if (existing) {
    return res.status(400).json({ success: false, error: 'Department name already exists' })
  }

  const template = await prisma.department_templates.create({
    data: {
      name,
      description: description || null,
      parentId: parentId || null,
      icon: icon || null,
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
      // Phase 3: Configuration fields
      moduleConfig: moduleConfig || null,
      terminology: terminology || null,
      positionTemplates: positionTemplates || null
    },
    include: {
      parent: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  return res.status(201).json({
    success: true,
    data: template
  })
}
