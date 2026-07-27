import { compareShiftsByTime, sortShiftsByTime } from '../../lib/shiftSort'

describe('shiftSort', () => {
  it('orders timed shifts AM to PM', () => {
    const shifts = [
      { id: 'e', name: 'Evening', startTime: '14:00', endTime: '17:00', isAllDay: false, sequence: 1 },
      { id: 'm', name: 'Morning', startTime: '07:50', endTime: '10:00', isAllDay: false, sequence: 2 },
      { id: 'a', name: 'Afternoon', startTime: '12:00', endTime: '14:00', isAllDay: false, sequence: 3 }
    ]
    expect(sortShiftsByTime(shifts).map(s => s.name)).toEqual(['Morning', 'Afternoon', 'Evening'])
  })

  it('puts All Day after timed shifts', () => {
    const shifts = [
      { id: 'd', name: 'All Day', startTime: null, endTime: null, isAllDay: true, sequence: 1 },
      { id: 'm', name: 'Morning', startTime: '08:00', endTime: '12:00', isAllDay: false, sequence: 2 }
    ]
    expect(sortShiftsByTime(shifts).map(s => s.id)).toEqual(['m', 'd'])
  })

  it('compareShiftsByTime is stable for equal starts', () => {
    const a = { id: 'a', name: 'A', startTime: '09:00', isAllDay: false, sequence: 2 }
    const b = { id: 'b', name: 'B', startTime: '09:00', isAllDay: false, sequence: 1 }
    expect(compareShiftsByTime(a, b)).toBeGreaterThan(0)
  })
})
