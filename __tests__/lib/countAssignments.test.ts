import { isPrivilegedCounterRole, getViewAsVolunteerId, isSimulatedMode } from '../../src/lib/countAssignmentsShared'

describe('countAssignments helpers', () => {
  it('recognizes privileged counter roles', () => {
    expect(isPrivilegedCounterRole('ADMIN')).toBe(true)
    expect(isPrivilegedCounterRole('OVERSEER')).toBe(true)
    expect(isPrivilegedCounterRole('KEYMAN')).toBe(true)
    expect(isPrivilegedCounterRole('VOLUNTEER')).toBe(false)
  })

  it('detects view-as volunteer header', () => {
    const req = {
      headers: {
        'x-view-as-volunteer-id': 'vol-123'
      }
    } as any
    expect(getViewAsVolunteerId(req)).toBe('vol-123')
    expect(isSimulatedMode(req)).toBe(true)
  })

  it('handles missing view-as header', () => {
    const req = { headers: {} } as any
    expect(getViewAsVolunteerId(req)).toBeNull()
    expect(isSimulatedMode(req)).toBe(false)
  })
})
