import { prisma } from './prisma'
import {
  compareSuggestionRank,
  countSessionToTargetMinutes,
  suggestionRankForAssignment,
} from './countTimeSuggestions'

type ShiftLike = {
  startTime: string | null
  endTime: string | null
  isAllDay: boolean
} | null

type AssigneeRow = { volunteerId: string }

type CandidateAssignment = {
  volunteerId: string
  shift: ShiftLike
}

/**
 * Whether a volunteer may enter a single-station count for this session/position.
 * Matches admin "apply suggestions" ranking when no explicit assignees exist for the station.
 */
export async function volunteerCanEnterStationCount(params: {
  eventId: string
  countSessionId: string
  positionId: string
  volunteerId: string
}): Promise<boolean> {
  const { eventId, countSessionId, positionId, volunteerId } = params

  const explicitMine = await prisma.count_session_position_assignees.findFirst({
    where: { countSessionId, positionId, volunteerId },
    select: { id: true },
  })
  if (explicitMine) return true

  const hasAnyForStation = await prisma.count_session_position_assignees.findFirst({
    where: { countSessionId, positionId },
    select: { id: true },
  })
  if (hasAnyForStation) return false

  if (process.env.COUNT_ASSIGNMENTS_FALLBACK === 'true') {
    const legacy = await prisma.position_assignments.findFirst({
      where: { positionId, volunteerId },
      select: { id: true },
    })
    return !!legacy
  }

  const session = await prisma.count_sessions.findUnique({
    where: { id: countSessionId },
    select: { countTime: true, eventId: true },
  })
  if (!session || session.eventId !== eventId) return false

  const assignments = await prisma.position_assignments.findMany({
    where: {
      positionId,
      role: { in: ['VOLUNTEER', 'ATTENDANT'] },
    },
    include: {
      shift: { select: { startTime: true, endTime: true, isAllDay: true } },
    },
  })

  return volunteerIsRankedSuggestionWinner(session.countTime, volunteerId, assignments)
}

function volunteerIsRankedSuggestionWinner(
  countTime: Date | null,
  volunteerId: string,
  assignments: Array<{ volunteerId: string; shift: ShiftLike }>
): boolean {
  if (assignments.length === 0) return false

  const targetMinutes = countSessionToTargetMinutes(countTime)
  const ranked = assignments
    .map((a) => ({
      volunteerId: a.volunteerId,
      rank: suggestionRankForAssignment(targetMinutes, a.shift),
    }))
    .sort((a, b) => compareSuggestionRank(a.rank, b.rank))

  return ranked[0]?.volunteerId === volunteerId
}

/**
 * Batch variant for volunteer dashboard (same rules as volunteerCanEnterStationCount).
 */
export function volunteerMayCountStationFromPreloaded(params: {
  sessionCountTime: Date | null
  volunteerId: string
  assigneesAtStation: AssigneeRow[]
  suggestionCandidates: CandidateAssignment[]
  fallbackEnabled: boolean
  volunteerHasLegacyAssignment: boolean
}): boolean {
  const {
    sessionCountTime,
    volunteerId,
    assigneesAtStation,
    suggestionCandidates,
    fallbackEnabled,
    volunteerHasLegacyAssignment,
  } = params

  if (assigneesAtStation.some((a) => a.volunteerId === volunteerId)) return true
  if (assigneesAtStation.length > 0) return false
  if (fallbackEnabled && volunteerHasLegacyAssignment) return true

  return volunteerIsRankedSuggestionWinner(sessionCountTime, volunteerId, suggestionCandidates)
}
