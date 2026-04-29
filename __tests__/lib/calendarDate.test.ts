import { formatCalendarDateLabel, toDateOnlyStringUTC } from '../../src/lib/calendarDate'

describe('toDateOnlyStringUTC', () => {
  it('keeps PostgreSQL calendar date as yyyy-MM-dd regardless of process TZ', () => {
    const pgDate = new Date('2026-05-09T00:00:00.000Z')
    expect(toDateOnlyStringUTC(pgDate)).toBe('2026-05-09')
  })
})

describe('formatCalendarDateLabel', () => {
  it('formats yyyy-MM-dd as calendar day', () => {
    expect(formatCalendarDateLabel('2026-05-09')).toMatch(/May 9, 2026/)
  })

  it('formats legacy UTC midnight ISO using calendar day', () => {
    expect(formatCalendarDateLabel('2026-05-09T00:00:00.000Z')).toMatch(/May 9, 2026/)
  })
})
