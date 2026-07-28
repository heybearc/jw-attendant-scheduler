import { useState } from 'react'
import { useRouter } from 'next/router'
import { createPositionService } from '../lib/positionService'
import { notifyAlert, toast } from '../lib/ui/toast'
import { appConfirm, appConfirmMessage } from '../lib/ui/confirm'
import { sameShiftDay } from '../lib/shiftConflict'

interface Position {
  id: string
  name: string
  shifts?: Array<{
    id: string
    name?: string
    startTime: string
    endTime: string
    isAllDay: boolean
    shiftDate?: string | Date | null
  }>
}

interface ShiftFormData {
  name: string
  startTime: string
  endTime: string
  isAllDay: boolean
  volunteersNeeded: number
  shiftDate: string | null
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
    isAllDay: false,
    volunteersNeeded: 1,
    shiftDate: null
  })

  const handleShiftSubmit = async (e: React.FormEvent, position: Position | null) => {
    e.preventDefault()
    
    if (!position) return

    const nextDay = {
      isAllDay: shiftFormData.isAllDay,
      shiftDate: shiftFormData.shiftDate
    }
    
    // Day-scoped All Day validation
    if (shiftFormData.isAllDay && position.shifts && position.shifts.length > 0) {
      const sameDayPartial = position.shifts.some(
        shift => !shift.isAllDay && sameShiftDay(shift, nextDay)
      )
      if (sameDayPartial) {
        notifyAlert(
          '❌ Cannot add All Day shift\n\n' +
          'This position already has partial shifts on that day.\n\n' +
          'Delete those shifts first, or pick a different day.'
        )
        return
      }
    }

    if (!shiftFormData.isAllDay && position.shifts?.some(s => s.isAllDay && sameShiftDay(s, nextDay))) {
      notifyAlert(
        '❌ Cannot add shift\n\n' +
        'An All Day shift already covers that day for this position.'
      )
      return
    }
    
    try {
      const success = await positionService.createShift(position.id, {
        name: shiftFormData.name || '',
        startTime: shiftFormData.startTime,
        endTime: shiftFormData.endTime,
        isAllDay: shiftFormData.isAllDay,
        volunteersNeeded: Math.max(1, Math.min(50, Number(shiftFormData.volunteersNeeded) || 1)),
        shiftDate: shiftFormData.shiftDate
      })

      if (success) {
        notifyAlert('✅ Shift added successfully')
        setShowShiftModal(false)
        setShiftFormData({
          name: '',
          startTime: '',
          endTime: '',
          isAllDay: false,
          volunteersNeeded: 1,
          shiftDate: null
        })
        router.reload()
      } else {
        notifyAlert('Failed to add shift')
      }
    } catch (error) {
      console.error('Error adding shift:', error)
      notifyAlert('Failed to add shift')
    }
  }

  const handleDeleteShift = async (positionId: string, shiftId: string, shiftName: string) => {
    if (!(await appConfirmMessage(`Delete "${shiftName}" shift? This will also remove any attendant assignments to this shift.`))) {
      return
    }

    try {
      const success = await positionService.deleteShift(positionId, shiftId)
      
      if (success) {
        router.reload()
      } else {
        notifyAlert('Failed to delete shift')
      }
    } catch (error) {
      console.error('Delete shift error:', error)
      notifyAlert('Failed to delete shift')
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
