import { prisma } from '../src/lib/prisma'
import { sortShiftsByTime } from './shiftSort'

type PrismaLike = {
  position_shifts: {
    findMany: (args: any) => Promise<Array<{
      id: string
      name: string
      startTime: string | null
      endTime: string | null
      isAllDay: boolean
      sequence: number
    }>>
    update: (args: any) => Promise<unknown>
  }
}

/**
 * Reorder a position's shifts AM→PM and persist sequence (1-based).
 * Call after create/update so list order stays chronological.
 */
export async function resequencePositionShifts(
  positionId: string,
  client: PrismaLike = prisma as PrismaLike
): Promise<void> {
  const shifts = await client.position_shifts.findMany({
    where: { positionId }
  })
  const ordered = sortShiftsByTime(shifts)
  for (let i = 0; i < ordered.length; i++) {
    const nextSequence = i + 1
    if (ordered[i].sequence !== nextSequence) {
      await client.position_shifts.update({
        where: { id: ordered[i].id },
        data: { sequence: nextSequence }
      })
    }
  }
}
