import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../src/lib/prisma'
import { randomUUID } from 'crypto'

/**
 * Phase 4C Week 2: Assignment Template Operations
 * GET, PUT, DELETE operations for individual templates
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Template ID required' })
    }

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, id)
      case 'PUT':
        return await handlePut(req, res, id, session.user)
      case 'DELETE':
        return await handleDelete(req, res, id, session.user)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error: any) {
    console.error('Assignment template API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}

// GET: Fetch single template
async function handleGet(req: NextApiRequest, res: NextApiResponse, templateId: string) {
  const template = await (prisma as any).assignment_templates.findUnique({
    where: { id: templateId },
    include: {
      template_assignments: {
        orderBy: { sequence: 'asc' }
      },
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })

  if (!template) {
    return res.status(404).json({ error: 'Template not found' })
  }

  // Get usage statistics
  const usageLog = await (prisma as any).template_usage_log.findMany({
    where: { templateId },
    include: {
      events: {
        select: {
          id: true,
          name: true,
          startDate: true
        }
      },
      users: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: { appliedAt: 'desc' },
    take: 10
  })

  return res.status(200).json({
    success: true,
    template,
    usageLog,
    stats: {
      totalUsages: template.usageCount,
      recentUsages: usageLog.length
    }
  })
}

// PUT: Update template
async function handlePut(req: NextApiRequest, res: NextApiResponse, templateId: string, user: any) {
  const { name, description, eventType, departmentTemplateId, assignments, isActive } = req.body

  // Check if template exists
  const existing = await (prisma as any).assignment_templates.findUnique({
    where: { id: templateId }
  })

  if (!existing) {
    return res.status(404).json({ error: 'Template not found' })
  }

  // Check permissions (only creator or admin can edit)
  const userRole = (user as any).role
  if (existing.createdBy !== user.id && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Permission denied' })
  }

  // Update in transaction
  await (prisma as any).$transaction(async (tx: any) => {
    // Update template
    await tx.assignment_templates.update({
      where: { id: templateId },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        eventType: eventType || existing.eventType,
        departmentTemplateId: departmentTemplateId !== undefined ? departmentTemplateId : existing.departmentTemplateId,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        updatedAt: new Date()
      }
    })

    // If assignments provided, replace them
    if (assignments && Array.isArray(assignments)) {
      // Delete old assignments
      await tx.template_assignments.deleteMany({
        where: { templateId }
      })

      // Create new assignments
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
    }
  })

  // Fetch updated template
  const template = await (prisma as any).assignment_templates.findUnique({
    where: { id: templateId },
    include: {
      template_assignments: {
        orderBy: { sequence: 'asc' }
      }
    }
  })

  return res.status(200).json({
    success: true,
    message: 'Template updated successfully',
    template
  })
}

// DELETE: Delete template
async function handleDelete(req: NextApiRequest, res: NextApiResponse, templateId: string, user: any) {
  // Check if template exists
  const existing = await (prisma as any).assignment_templates.findUnique({
    where: { id: templateId }
  })

  if (!existing) {
    return res.status(404).json({ error: 'Template not found' })
  }

  // Check permissions
  const userRole = (user as any).role
  if (existing.createdBy !== user.id && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Permission denied' })
  }

  // Soft delete (set isActive = false) instead of hard delete
  await (prisma as any).assignment_templates.update({
    where: { id: templateId },
    data: {
      isActive: false,
      updatedAt: new Date()
    }
  })

  return res.status(200).json({
    success: true,
    message: 'Template deleted successfully'
  })
}
