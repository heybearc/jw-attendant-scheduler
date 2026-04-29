import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '../../../../../../src/lib/prisma'
import { blockSimulatedMutation, getSessionUser, isPrivilegedCounterRole } from '@/lib/countAssignments'

const putGroupsSchema = z.object({
  groups: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    primaryVolunteerId: z.string().uuid().nullable().optional(),
    secondaryVolunteerId: z.string().uuid().nullable().optional(),
    positionIds: z.array(z.string().uuid()).min(1)
  }))
})

function toMinutes(clock: string | null | undefined): number {
  if (!clock || !clock.includes(':')) return Number.POSITIVE_INFINITY
  const [h, m] = clock.split(':').map(Number)
  return (h * 60) + m
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id: eventId, sessionId } = req.query
    if (!eventId || typeof eventId !== 'string' || !sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Event ID and Session ID are required' })
    }

    const sessionUser = await getSessionUser(req, res)
    if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' })

    const countSession = await prisma.count_sessions.findUnique({
      where: { id: sessionId },
      select: { id: true, eventId: true, countTime: true }
    })
    if (!countSession || countSession.eventId !== eventId) {
      return res.status(404).json({ error: 'Count session not found' })
    }

    if (req.method === 'GET') {
    const [groups, positions, assignments] = await Promise.all([
      prisma.count_session_groups.findMany({
        where: { countSessionId: sessionId },
        include: {
          positions: { select: { positionId: true } },
          primaryVolunteer: { select: { id: true, firstName: true, lastName: true } },
          secondaryVolunteer: { select: { id: true, firstName: true, lastName: true } },
          entry: { select: { id: true, attendeeCount: true, notes: true, enteredBy: true, enteredAt: true } }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.positions.findMany({
        where: { eventId, isActive: true },
        select: { id: true, name: true, positionNumber: true, area: true },
        orderBy: { positionNumber: 'asc' }
      }),
      prisma.position_assignments.findMany({
        where: { positions: { eventId } },
        include: {
          volunteer: { select: { id: true, firstName: true, lastName: true } },
          shift: { select: { startTime: true, endTime: true, isAllDay: true } }
        }
      })
    ])

    const targetMinutes = countSession.countTime
      ? countSession.countTime.getHours() * 60 + countSession.countTime.getMinutes()
      : Number.POSITIVE_INFINITY

    const suggestionsByPosition = new Map<string, Array<{ id: string; name: string }>>()
    positions.forEach((position) => {
      const ranked = assignments
        .filter((a) => a.positionId === position.id)
        .map((a) => {
          const score = a.shift?.isAllDay
            ? 0
            : Math.abs(((toMinutes(a.shift?.startTime) + toMinutes(a.shift?.endTime)) / 2) - targetMinutes)
          return { a, score }
        })
        .sort((x, y) => x.score - y.score)
      suggestionsByPosition.set(position.id, ranked.map((item) => ({
        id: item.a.volunteer.id,
        name: `${item.a.volunteer.firstName} ${item.a.volunteer.lastName}`
      })))
    })

    return res.status(200).json({
      success: true,
      data: {
        positions,
        groups: groups.map((group) => ({
          id: group.id,
          name: group.name,
          primaryVolunteerId: group.primaryVolunteerId,
          secondaryVolunteerId: group.secondaryVolunteerId,
          positionIds: group.positions.map((p) => p.positionId),
          entry: group.entry
        })),
        suggestionsByPosition: Object.fromEntries(suggestionsByPosition)
      }
    })
  }

    if (req.method === 'PUT') {
      if (blockSimulatedMutation(req, res)) return
      if (!isPrivilegedCounterRole(sessionUser.role)) {
        return res.status(403).json({ error: 'Only ADMIN/OVERSEER/KEYMAN can manage groups' })
      }

      const parsed = putGroupsSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors })
      }

      const flatPositionIds = parsed.data.groups.flatMap((group) => group.positionIds)
      const duplicates = flatPositionIds.filter((positionId, index) => flatPositionIds.indexOf(positionId) !== index)
      if (duplicates.length > 0) {
        return res.status(400).json({ error: 'Stations cannot overlap between groups', duplicatePositionIds: [...new Set(duplicates)] })
      }

      await prisma.$transaction(async (tx) => {
        const existing = await tx.count_session_groups.findMany({
          where: { countSessionId: sessionId },
          select: { id: true }
        })
        const existingIds = new Set(existing.map((group) => group.id))

        const normalizedInputs: Array<{ id: string; name: string; primaryVolunteerId: string | null; secondaryVolunteerId: string | null; positionIds: string[] }> = []
        const keepIds = new Set<string>()

        for (const groupInput of parsed.data.groups) {
          if (groupInput.id && existingIds.has(groupInput.id)) {
            keepIds.add(groupInput.id)
            await tx.count_session_groups.update({
              where: { id: groupInput.id },
              data: {
                name: groupInput.name,
                primaryVolunteerId: groupInput.primaryVolunteerId || null,
                secondaryVolunteerId: groupInput.secondaryVolunteerId || null,
                updatedAt: new Date()
              }
            })
            normalizedInputs.push({
              id: groupInput.id,
              name: groupInput.name,
              primaryVolunteerId: groupInput.primaryVolunteerId || null,
              secondaryVolunteerId: groupInput.secondaryVolunteerId || null,
              positionIds: groupInput.positionIds
            })
          } else {
            const created = await tx.count_session_groups.create({
              data: {
                countSessionId: sessionId,
                name: groupInput.name,
                primaryVolunteerId: groupInput.primaryVolunteerId || null,
                secondaryVolunteerId: groupInput.secondaryVolunteerId || null,
                createdBy: sessionUser.id
              },
              select: { id: true }
            })
            keepIds.add(created.id)
            normalizedInputs.push({
              id: created.id,
              name: groupInput.name,
              primaryVolunteerId: groupInput.primaryVolunteerId || null,
              secondaryVolunteerId: groupInput.secondaryVolunteerId || null,
              positionIds: groupInput.positionIds
            })
          }
        }

        const deleteIds = [...existingIds].filter((id) => !keepIds.has(id))
        if (deleteIds.length > 0) {
          await tx.count_session_groups.deleteMany({ where: { id: { in: deleteIds } } })
        }

        // Two-phase remap avoids uniqueness collisions while moving stations across groups.
        await tx.count_session_group_positions.deleteMany({ where: { countSessionId: sessionId } })
        const allMappings = normalizedInputs.flatMap((group) =>
          group.positionIds.map((positionId) => ({
            countSessionId: sessionId,
            groupId: group.id,
            positionId
          }))
        )
        if (allMappings.length > 0) {
          await tx.count_session_group_positions.createMany({ data: allMappings })
        }
      })

      return res.status(200).json({ success: true, message: 'Count groups updated successfully' })
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Count groups API error:', error)
    if (error?.code === 'P2002') {
      return res.status(400).json({ error: 'Stations cannot overlap between groups' })
    }
    return res.status(500).json({ error: 'Internal server error' })
  }
}
