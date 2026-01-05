import { useState } from 'react'
import { useRouter } from 'next/router'
import { createPositionService } from '../lib/positionService'

interface Position {
  id: string
  name: string
  shifts?: Array<{
    id: string
    name?: string
    startTime: string
    endTime: string
    isAllDay: boolean
  }>
}

interface ShiftFormData {
  name: string
  startTime: string
  endTime: string
  isAllDay: boolean
}

interface UseShiftsProps {
  eventId: string
}

interface UseShiftsReturn {
  showShiftModal: boolean
  setShowShiftModal: (show: boolean) => void
  shiftFormData: ShiftFormData
  setShiftFormData: (data: ShiftFormData) => void
  handleShiftSubmit: (e: React.FormEvent, position: Position | null) => Promise<void>
  handleDeleteShift: (positionId: string, shiftId: string, shiftName: string) => Promise<void>
}

export function useShifts({ eventId }: UseShiftsProps): UseShiftsReturn {
  const router = useRouter()
  const positionService = createPositionService(eventId)
  
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [shiftFormData, setShiftFormData] = useState<ShiftFormData>({
    name: '',
    startTime: '',
    endTime: '',
    isAllDay: false
  })

  const handleShiftSubmit = async (e: React.FormEvent, position: Position | null) => {
    e.preventDefault()
    
    if (!position) return
    
    // APEX GUARDIAN: Bidirectional shift logic validation
    if (shiftFormData.isAllDay && position.shifts && position.shifts.length > 0) {
      const hasPartialShifts = position.shifts.some(shift => !shift.isAllDay)
      if (hasPartialShifts) {
        alert(
          '❌ Cannot add All Day shift\n\n' +
          'This position already has partial shifts. An All Day shift covers the entire 24-hour period and conflicts with existing partial shifts.\n\n' +
          'Please delete existing partial shifts first, then add the All Day shift.'
        )
        return
      }
    }
    
    try {
      const success = await positionService.createShift(position.id, {
        name: shiftFormData.name || '',
        startTime: shiftFormData.startTime,
        endTime: shiftFormData.endTime,
        isAllDay: shiftFormData.isAllDay,
      })

      if (success) {
        alert('✅ Shift added successfully')
        setShowShiftModal(false)
        setShiftFormData({ name: '', startTime: '', endTime: '', isAllDay: false })
        router.reload()
      } else {
        alert('Failed to add shift')
      }
    } catch (error) {
      console.error('Error adding shift:', error)
      alert('Failed to add shift')
    }
  }

  const handleDeleteShift = async (positionId: string, shiftId: string, shiftName: string) => {
    if (!confirm(`Delete "${shiftName}" shift? This will also remove any attendant assignments to this shift.`)) {
      return
    }

    try {
      const success = await positionService.deleteShift(positionId, shiftId)
      
      if (success) {
        router.reload()
      } else {
        alert('Failed to delete shift')
      }
    } catch (error) {
      console.error('Delete shift error:', error)
      alert('Failed to delete shift')
    }
  }

  return {
    showShiftModal,
    setShowShiftModal,
    shiftFormData,
    setShiftFormData,
    handleShiftSubmit,
    handleDeleteShift
  }
}
