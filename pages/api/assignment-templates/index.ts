import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'
import { randomUUID } from 'crypto'

/**
 * Phase 4C Week 2: Assignment Templates API
 * CRUD operations for assignment templates
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userRole = (session.user as any).role

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, userRole)
      case 'POST':
        return await handlePost(req, res, session.user)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error: any) {
    console.error('Assignment templates API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}

// GET: List all templates
async function handleGet(req: NextApiRequest, res: NextApiResponse, userRole: string) {
  const { eventType, isActive, search } = req.query

  // Build where clause
  const where: any = {}
  
  if (eventType) {
    where.eventType = eventType
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive === 'true'
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } }
    ]
  }

  // Fetch templates with assignments
  const templates = await (prisma as any).assignment_templates.findMany({
    where,
    include: {
      template_assignments: {
        orderBy: { sequence: 'asc' }
      },
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: [
      { usageCount: 'desc' },
      { name: 'asc' }
    ]
  })

  return res.status(200).json({
    success: true,
    templates,
    count: templates.length
  })
}

// POST: Create new template
async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { name, description, eventType, departmentTemplateId, assignments } = req.body

  // Validation
  if (!name || !eventType || !assignments || !Array.isArray(assignments)) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['name', 'eventType', 'assignments']
    })
  }

  if (assignments.length === 0) {
    return res.status(400).json({
      error: 'Template must have at least one assignment'
    })
  }

  // Validate assignments
  for (const assignment of assignments) {
    if (!assignment.positionNumber || !assignment.positionName || !assignment.shiftStart || !assignment.shiftEnd) {
      return res.status(400).json({
        error: 'Each assignment must have positionNumber, positionName, shiftStart, and shiftEnd'
      })
    }
  }

  const templateId = randomUUID()

  // Create template with assignments in transaction
  await (prisma as any).$transaction(async (tx: any) => {
    // Create template
    await tx.assignment_templates.create({
      data: {
        id: templateId,
        name,
        description,
        eventType,
        departmentTemplateId,
        createdBy: user.id,
        usageCount: 0,
        isActive: true
      }
    })

    // Create template assignments
    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i]
      await tx.template_assignments.create({
        data: {
          id: randomUUID(),
          templateId,
          positionNumber: assignment.positionNumber,
          positionName: assignment.positionName,
          area: assignment.area,
          shiftStart: assignment.shiftStart,
          shiftEnd: assignment.shiftEnd,
          requiredCount: assignment.requiredCount || 1,
          role: assignment.role,
          notes: assignment.notes,
          sequence: i
        }
      })
    }
  })

  // Fetch created template
  const template = await (prisma as any).assignment_templates.findUnique({
    where: { id: templateId },
    include: {
      template_assignments: {
        orderBy: { sequence: 'asc' }
      }
    }
  })

  return res.status(201).json({
    success: true,
    message: 'Template created successfully',
    template
  })
}
