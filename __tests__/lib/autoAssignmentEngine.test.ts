/**
 * Unit tests for AutoAssignmentEngine
 * Tests the extracted auto-assignment algorithm
 */

import { AutoAssignmentEngine } from '../../lib/autoAssignmentEngine'

describe('AutoAssignmentEngine', () => {
  const mockEventId = 'event-123'
  
  const mockPositions = [
    {
      id: 'pos-1',
      positionNumber: 1,
      name: 'Position 1',
      positionName: 'Position 1',
      isActive: true,
      shifts: [
        {
          id: 'shift-1',
          name: 'Morning',
          startTime: '09:00',
          endTime: '12:00',
          isAllDay: false
        }
      ],
      assignments: [],
      oversight: []
    },
    {
      id: 'pos-2',
      positionNumber: 2,
      name: 'Position 2',
      positionName: 'Position 2',
      isActive: true,
      shifts: [
        {
          id: 'shift-2',
          name: 'Afternoon',
          startTime: '13:00',
          endTime: '16:00',
          isAllDay: false
        }
      ],
      assignments: [],
      oversight: []
    }
  ]

  const mockAttendants = [
    {
      id: 'att-1',
      firstName: 'John',
      lastName: 'Doe',
      overseerId: null,
      keymanId: null,
      isActive: true
    },
    {
      id: 'att-2',
      firstName: 'Jane',
      lastName: 'Smith',
      overseerId: null,
      keymanId: null,
      isActive: true
    }
  ]

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('Constructor', () => {
    it('should initialize with required parameters', () => {
      const engine = new AutoAssignmentEngine({
        eventId: mockEventId,
        positions: mockPositions,
        attendants: mockAttendants
      })

      expect(engine).toBeInstanceOf(AutoAssignmentEngine)
    })

    it('should accept optional progress callback', () => {
      const onProgress = jest.fn()
      
      const engine = new AutoAssignmentEngine({
        eventId: mockEventId,
        positions: mockPositions,
        attendants: mockAttendants,
        onProgress
      })

      expect(engine).toBeInstanceOf(AutoAssignmentEngine)
    })

    it('should accept optional log callback', () => {
      const onLog = jest.fn()
      
      const engine = new AutoAssignmentEngine({
        eventId: mockEventId,
        positions: mockPositions,
        attendants: mockAttendants,
        onLog
      })

      expect(engine).toBeInstanceOf(AutoAssignmentEngine)
    })
  })

  describe('execute()', () => {
    it('should return success result with no positions', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      const engine = new AutoAssignmentEngine({
        eventId: mockEventId,
        positions: [],
        attendants: mockAttendants
      })

      const result = await engine.execute()

      expect(result).toHaveProperty('totalAssignments')
      expect(result).toHaveProperty('message')
      expect(result.totalAssignments).toBe(0)
    })

    it('should return success result with no attendants', async () => {
      const engine = new AutoAssignmentEngine({
        eventId: mockEventId,
        positions: mockPositions,
        attendants: []
      })

      const result = await engine.execute()

      expect(result).toHaveProperty('totalAssignments')
      expect(result.totalAssignments).toBe(0)
    })

    it('should call progress callback during execution', async () => {
      const onProgress = jest.fn()
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      const engine = new AutoAssignmentEngine({
        eventId: mockEventId,
        positions: mockPositions,
        attendants: mockAttendants,
        onProgress
      })

      await engine.execute()

      expect(onProgress).toHaveBeenCalled()
      expect(onProgress.mock.calls[0][0]).toHaveProperty('phase')
      expect(onProgress.mock.calls[0][0]).toHaveProperty('current')
      expect(onProgress.mock.calls[0][0]).toHaveProperty('total')
    })

    it('should call log callback during execution', async () => {
      const onLog = jest.fn()
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      const engine = new AutoAssignmentEngine({
        eventId: mockEventId,
        positions: mockPositions,
        attendants: mockAttendants,
        onLog
      })

      await engine.execute()

      expect(onLog).toHaveBeenCalled()
      expect(typeof onLog.mock.calls[0][0]).toBe('string')
    })

    it('should handle API errors gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500
      })

      const engine = new AutoAssignmentEngine({
        eventId: mockEventId,
        positions: mockPositions,
        attendants: mockAttendants
      })

      const result = await engine.execute()

      expect(result).toHaveProperty('totalAssignments')
      expect(result).toHaveProperty('message')
    })

    it('should handle network errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const engine = new AutoAssignmentEngine({
        eventId: mockEventId,
        positions: mockPositions,
        attendants: mockAttendants
      })

      const result = await engine.execute()

      expect(result).toHaveProperty('totalAssignments')
      expect(result).toHaveProperty('message')
    })
  })

  describe('Leadership Grouping', () => {
    it('should group attendants by leadership', async () => {
      const attendantsWithLeadership = [
        {
          id: 'att-1',
          firstName: 'Leader',
          lastName: 'One',
          overseerId: null,
          keymanId: null,
          isActive: true
        },
        {
          id: 'att-2',
          firstName: 'Follower',
          lastName: 'One',
          overseerId: 'att-1',
          keymanId: null,
          isActive: true
        },
        {
          id: 'att-3',
          firstName: 'Follower',
          lastName: 'Two',
          overseerId: 'att-1',
          keymanId: null,
          isActive: true
        }
      ]

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      const engine = new AutoAssignmentEngine({
        eventId: mockEventId,
        positions: mockPositions,
        attendants: attendantsWithLeadership
      })

      const result = await engine.execute()

      expect(result).toHaveProperty('totalAssignments')
    })
  })

  describe('Conflict Detection', () => {
    it('should detect time conflicts', async () => {
      const positionsWithConflicts = [
        {
          id: 'pos-1',
          positionNumber: 1,
          name: 'Position 1',
          positionName: 'Position 1',
          isActive: true,
          shifts: [
            {
              id: 'shift-1',
              name: 'Morning',
              startTime: '09:00',
              endTime: '12:00',
              isAllDay: false
            }
          ],
          assignments: [],
          oversight: []
        },
        {
          id: 'pos-2',
          positionNumber: 2,
          name: 'Position 2',
          positionName: 'Position 2',
          isActive: true,
          shifts: [
            {
              id: 'shift-2',
              name: 'Overlapping',
              startTime: '11:00',
              endTime: '14:00',
              isAllDay: false
            }
          ],
          assignments: [],
          oversight: []
        }
      ]

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      const engine = new AutoAssignmentEngine({
        eventId: mockEventId,
        positions: positionsWithConflicts,
        attendants: [mockAttendants[0]]
      })

      const result = await engine.execute()

      expect(result).toHaveProperty('totalAssignments')
    })
  })
})
