import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../../../../src/lib/prisma'
import { blockSimulatedMutation, getSessionUser, isPrivilegedCounterRole } from '@/lib/countAssignments'
import {
  compareSuggestionRank,
  countSessionToTargetMinutes,
  suggestionRankForAssignment,
} from '@/lib/countTimeSuggestions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id: eventId, sessionId } = req.query
  if (!eventId || typeof eventId !== 'string' || !sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Event ID and Session ID are required' })
  }

  const sessionUser = await getSessionUser(req, res)
  if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' })
  if (blockSimulatedMutation(req, res)) return
  if (!isPrivilegedCounterRole(sessionUser.role)) {
    return res.status(403).json({ error: 'Only ADMIN/OVERSEER/KEYMAN can apply suggestions' })
  }

  const countSession = await prisma.count_sessions.findUnique({
    where: { id: sessionId },
    select: { eventId: true, countTime: true }
  })
  if (!countSession || countSession.eventId !== eventId) {
    return res.status(404).json({ error: 'Count session not found' })
  }

  const positions = await prisma.positions.findMany({
    where: { eventId, isActive: true },
    select: { id: true, positionNumber: true },
    orderBy: { positionNumber: 'asc' }
  })
  const positionIds = positions.map((p) => p.id)
  if (positionIds.length === 0) {
    return res.status(200).json({ success: true, message: 'No active positions found', data: [] })
  }

  const assignments = await prisma.position_assignments.findMany({
    where: {
      positionId: { in: positionIds },
      role: { in: ['VOLUNTEER', 'ATTENDANT'] },
    },
    include: {
      shift: { select: { startTime: true, endTime: true, isAllDay: true } }
    }
  })

  const targetMinutes = countSessionToTargetMinutes(countSession.countTime)

  const suggested: Array<{ positionId: string; volunteerId: string }> = []
  for (const position of positions) {
    const candidates = assignments.filter((a) => a.positionId === position.id)
    if (candidates.length === 0) continue

    const ranked = candidates
      .map((assignment) => ({
        assignment,
        rank: suggestionRankForAssignment(targetMinutes, assignment.shift),
      }))
      .sort((a, b) => compareSuggestionRank(a.rank, b.rank))

    if (ranked[0]) {
      suggested.push({ positionId: position.id, volunteerId: ranked[0].assignment.volunteerId })
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.count_session_position_assignees.deleteMany({ where: { countSessionId: sessionId } })
    if (suggested.length > 0) {
      await tx.count_session_position_assignees.createMany({
        data: suggested.map((entry) => ({
          countSessionId: sessionId,
          positionId: entry.positionId,
          volunteerId: entry.volunteerId,
          isSuggested: true,
          createdBy: sessionUser.id
        }))
      })
    }
  })

  return res.status(200).json({ success: true, data: suggested })
}
