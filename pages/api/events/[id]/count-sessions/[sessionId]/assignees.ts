import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '../../../../../../src/lib/prisma'
import { blockSimulatedMutation, getSessionUser, getViewAsVolunteerId, isPrivilegedCounterRole, resolveVolunteerIdForSessionUser } from '@/lib/countAssignments'
import {
  compareSuggestionRank,
  countSessionToTargetMinutes,
  suggestionRankForAssignment,
} from '@/lib/countTimeSuggestions'

const putAssigneesSchema = z.object({
  assignees: z.array(z.object({
    positionId: z.string().uuid(),
    volunteerIds: z.array(z.string().uuid())
  }))
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id: eventId, sessionId } = req.query
    if (!eventId || typeof eventId !== 'string' || !sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Event ID and Session ID are required' })
    }

    const sessionUser = await getSessionUser(req, res)
    if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' })

    if (req.method === 'GET') {
      const simulatedVolunteerId = getViewAsVolunteerId(req)
      const privileged = isPrivilegedCounterRole(sessionUser.role) && !simulatedVolunteerId
      const [countSession, positions, assignees] = await Promise.all([
        prisma.count_sessions.findUnique({ where: { id: sessionId }, select: { id: true, eventId: true, countTime: true } }),
        prisma.positions.findMany({
          where: { eventId, isActive: true },
          select: { id: true, name: true, positionNumber: true, area: true },
          orderBy: { positionNumber: 'asc' }
        }),
        prisma.count_session_position_assignees.findMany({
          where: { countSessionId: sessionId },
          include: {
            volunteer: { select: { id: true, firstName: true, lastName: true, congregation: true } }
          }
        })
      ])

      if (!countSession || countSession.eventId !== eventId) {
        return res.status(404).json({ error: 'Count session not found' })
      }

      const targetMinutes = countSessionToTargetMinutes(countSession.countTime)

      const positionAssignments = await prisma.position_assignments.findMany({
        where: {
          positionId: { in: positions.map((p) => p.id) },
          role: { in: ['VOLUNTEER', 'ATTENDANT'] },
        },
        include: {
          volunteer: { select: { id: true, firstName: true, lastName: true, congregation: true } },
          shift: { select: { startTime: true, endTime: true, isAllDay: true } }
        }
      })

      const byPosition = new Map<string, any[]>()
      assignees.forEach((entry) => {
        const list = byPosition.get(entry.positionId) || []
        list.push({
          id: entry.id,
          volunteerId: entry.volunteerId,
          isSuggested: entry.isSuggested,
          volunteer: entry.volunteer
        })
        byPosition.set(entry.positionId, list)
      })

      const ownVolunteerId = simulatedVolunteerId || (privileged ? null : await resolveVolunteerIdForSessionUser(sessionUser.id, sessionUser.role))
      return res.status(200).json({
        success: true,
        data: {
          sessionId,
          positions: positions.map((position) => {
            const candidates = positionAssignments.filter((a) => a.positionId === position.id)
            const ranked = candidates
              .map((candidate) => ({
                candidate,
                rank: suggestionRankForAssignment(targetMinutes, candidate.shift),
              }))
              .sort((a, b) => compareSuggestionRank(a.rank, b.rank))

            return {
              ...position,
              suggestedVolunteerId: ranked[0]?.candidate.volunteerId || null,
              candidateVolunteers: ranked.map((item) => ({
                id: item.candidate.volunteer.id,
                name: `${item.candidate.volunteer.firstName} ${item.candidate.volunteer.lastName}`,
                congregation: item.candidate.volunteer.congregation
              })),
              assignees: (byPosition.get(position.id) || []).filter((entry) => (
                privileged
                  ? true
                  : entry.volunteerId === ownVolunteerId && !entry.isSuggested
              ))
            }
          }).filter((position) => privileged || position.assignees.length > 0)
        }
      })
    }

    if (req.method === 'PUT') {
      if (blockSimulatedMutation(req, res)) return
      if (!isPrivilegedCounterRole(sessionUser.role)) {
        return res.status(403).json({ error: 'Only ADMIN/OVERSEER/KEYMAN can manage assignees' })
      }
      const parsed = putAssigneesSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors })
      }

      const countSession = await prisma.count_sessions.findUnique({
        where: { id: sessionId },
        select: { eventId: true }
      })
      if (!countSession || countSession.eventId !== eventId) {
        return res.status(404).json({ error: 'Count session not found' })
      }

      const validPositions = await prisma.positions.findMany({
        where: { eventId, id: { in: parsed.data.assignees.map((a) => a.positionId) } },
        select: { id: true }
      })
      const validPositionIds = new Set(validPositions.map((p) => p.id))
      if (validPositionIds.size !== parsed.data.assignees.length) {
        return res.status(400).json({ error: 'One or more position IDs are invalid for this event' })
      }

      const allVolunteerIds = [...new Set(parsed.data.assignees.flatMap((a) => a.volunteerIds))]
      if (allVolunteerIds.length > 0) {
        const validVolunteers = await prisma.event_volunteers.findMany({
          where: {
            eventId,
            volunteerId: { in: allVolunteerIds }
          },
          select: { volunteerId: true }
        })
        const validVolunteerIds = new Set(validVolunteers.map((v) => v.volunteerId).filter(Boolean))
        const invalid = allVolunteerIds.filter((id) => !validVolunteerIds.has(id))
        if (invalid.length > 0) {
          return res.status(400).json({ error: 'One or more volunteers are not registered for this event', invalidVolunteerIds: invalid })
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.count_session_position_assignees.deleteMany({ where: { countSessionId: sessionId } })
        const records = parsed.data.assignees.flatMap((entry) => (
          entry.volunteerIds.map((volunteerId) => ({
            countSessionId: sessionId,
            positionId: entry.positionId,
            volunteerId,
            isSuggested: false,
            createdBy: sessionUser.id
          }))
        ))

        if (records.length > 0) {
          await tx.count_session_position_assignees.createMany({ data: records })
        }
      })

      return res.status(200).json({ success: true, message: 'Assignees updated successfully' })
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Count assignees API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
