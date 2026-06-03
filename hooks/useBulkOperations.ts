import { useState } from 'react'
import { useRouter } from 'next/router'
import { Position } from '../types'
import { createPositionService } from '../lib/positionService'
import { notifyAlert, toast } from '../lib/ui/toast'
import { appConfirm, appConfirmMessage } from '../lib/ui/confirm'

interface UseBulkOperationsProps {
  eventId: string
  selectedPositions: Set<string>
  positions: Position[]
}

interface UseBulkOperationsReturn {
  isSubmitting: boolean
  showBulkEditModal: boolean
  showTemplateModal: boolean
  
  setShowBulkEditModal: (show: boolean) => void
  setShowTemplateModal: (show: boolean) => void
  
  handleBulkEdit: (area: string, isActive: string) => Promise<void>
  handleApplyTemplate: (templateType: string) => Promise<void>
  handleBulkShiftCreate: (shiftName: string, shiftStart: string, shiftEnd: string, isAllDay: boolean) => Promise<void>
  handleBulkOversight: (overseerId: string, keymanId: string) => Promise<void>
  handleClearAllShifts: () => Promise<void>
}

export function useBulkOperations({ eventId, selectedPositions, positions }: UseBulkOperationsProps): UseBulkOperationsReturn {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  
  const positionService = createPositionService(eventId)

  const handleBulkEdit = async (area: string, isActive: string) => {
    if (!area && isActive === '') {
      notifyAlert('Please specify at least one field to update')
      return
    }
    
    try {
      setIsSubmitting(true)
      let successCount = 0
      
      for (const positionId of selectedPositions) {
        const updateData: any = {}
        if (area) updateData.area = area
        if (isActive !== '') updateData.isActive = isActive === 'true'
        
        const success = await positionService.updatePosition(positionId, updateData)
        
        if (success) {
          successCount++
        } else {
          console.error(`Failed to update position ${positionId}`)
        }
      }
      
      notifyAlert(`✅ Successfully updated ${successCount} of ${selectedPositions.size} positions`)
      router.reload()
    } catch (error) {
      console.error('Bulk position update error:', error)
      notifyAlert('Failed to update positions')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApplyTemplate = async (templateType: string) => {
    if (!templateType) {
      notifyAlert('Please select a template')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Check for All Day template conflicts
      if (templateType === 'all-day') {
        const positionsWithPartialShifts = positions.filter(p => 
          selectedPositions.has(p.id) && 
          p.shifts && 
          p.shifts.some((s: any) => !s.isAllDay)
        )
        
        if (positionsWithPartialShifts.length > 0) {
          const positionNames = positionsWithPartialShifts.map(p => p.name).join(', ')
          notifyAlert(
            '❌ Cannot apply All Day template to some positions\n\n' +
            `The following positions have partial shifts that conflict with All Day shifts:\n${positionNames}\n\n` +
            'Please delete existing partial shifts from these positions first, then apply the All Day template.'
          )
          return
        }
      }
      
      const success = await positionService.applyShiftTemplate({
        positionIds: Array.from(selectedPositions),
        shiftTemplateId: templateType
      })
      
      if (success) {
        notifyAlert('✅ Template Applied Successfully!')
        router.reload()
      } else {
        notifyAlert('Failed to apply template')
      }
    } catch (error) {
      console.error('Template application error:', error)
      notifyAlert('Failed to apply template')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkShiftCreate = async (shiftName: string, shiftStart: string, shiftEnd: string, isAllDay: boolean) => {
    if (!shiftName) {
      notifyAlert('Please enter a shift name')
      return
    }
    
    if (!isAllDay && (!shiftStart || !shiftEnd)) {
      notifyAlert('Please enter start and end times for partial shifts')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Check for All Day shift conflicts
      if (isAllDay) {
        const positionsWithPartialShifts = positions.filter(p => 
          selectedPositions.has(p.id) && 
          p.shifts && 
          p.shifts.some((s: any) => !s.isAllDay)
        )
        
        if (positionsWithPartialShifts.length > 0) {
          const positionNames = positionsWithPartialShifts.map(p => p.name).join(', ')
          notifyAlert(
            '❌ Cannot add All Day shift to some positions\n\n' +
            `The following positions have partial shifts that conflict with All Day shifts:\n${positionNames}\n\n` +
            'Please delete existing partial shifts from these positions first, then add the All Day shift.'
          )
          return
        }
      }
      
      let successCount = 0
      for (const positionId of selectedPositions) {
        const success = await positionService.createShift(positionId, {
          name: shiftName,
          startTime: isAllDay ? null : shiftStart,
          endTime: isAllDay ? null : shiftEnd,
          isAllDay: isAllDay
        })
        
        if (success) {
          successCount++
        } else {
          console.error(`Failed to create shift for position ${positionId}`)
        }
      }
      
      notifyAlert(`✅ Successfully created "${shiftName}" shift for ${successCount} of ${selectedPositions.size} positions`)
      router.reload()
    } catch (error) {
      console.error('Custom shift creation error:', error)
      notifyAlert('Failed to create shifts')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkOversight = async (overseerId: string, keymanId: string) => {
    if (!overseerId && !keymanId) {
      notifyAlert('Please select at least one oversight role to assign')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      const success = await positionService.bulkAssignOversight({
        positionIds: Array.from(selectedPositions),
        overseerId: overseerId || undefined,
        keymanId: keymanId || undefined
      })
      
      if (success) {
        notifyAlert('✅ Oversight Assigned Successfully!')
        router.reload()
      } else {
        notifyAlert('Failed to assign oversight')
      }
    } catch (error) {
      console.error('Bulk oversight assignment error:', error)
      notifyAlert('Failed to assign oversight')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearAllShifts = async () => {
    if (!(await appConfirmMessage('⚠️ Clear ALL shifts from ALL positions?\n\nThis will remove all shifts AND their assignments.\n\nThis action cannot be undone.'))) {
      return
    }
    
    try {
      const success = await positionService.clearAllShifts()
      
      if (success) {
        notifyAlert('✅ Cleared all shifts and assignments')
        router.reload()
      } else {
        notifyAlert('Failed to clear shifts')
      }
    } catch (error) {
      console.error('Clear shifts error:', error)
      notifyAlert('Failed to clear shifts')
    }
  }

  return {
    isSubmitting,
    showBulkEditModal,
    showTemplateModal,
    
    setShowBulkEditModal,
    setShowTemplateModal,
    
    handleBulkEdit,
    handleApplyTemplate,
    handleBulkShiftCreate,
    handleBulkOversight,
    handleClearAllShifts,
  }
}
