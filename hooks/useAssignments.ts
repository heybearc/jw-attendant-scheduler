import { useState } from 'react'
import { useRouter } from 'next/router'
import { createPositionService } from '../lib/positionService'

interface UseAssignmentsProps {
  eventId: string
}

interface UseAssignmentsReturn {
  showAssignAttendantModal: boolean
  selectedShift: any | null
  
  setShowAssignAttendantModal: (show: boolean) => void
  setSelectedShift: (shift: any | null) => void
  
  handleCreateAssignment: (positionId: string, shiftId: string, attendantId: string) => Promise<void>
  handleRemoveAssignment: (assignmentId: string) => Promise<void>
  handleClearAllAssignments: () => Promise<void>
}

export function useAssignments({ eventId }: UseAssignmentsProps): UseAssignmentsReturn {
  const router = useRouter()
  const [showAssignAttendantModal, setShowAssignAttendantModal] = useState(false)
  const [selectedShift, setSelectedShift] = useState<any | null>(null)
  
  const positionService = createPositionService(eventId)

  const handleCreateAssignment = async (positionId: string, shiftId: string, attendantId: string) => {
    try {
      const success = await positionService.createAssignment({
        positionId,
        attendantId,
        shiftId,
        role: 'VOLUNTEER'
      })
      
      if (success) {
        router.reload()
      } else {
        alert('Failed to create assignment')
      }
    } catch (error) {
      console.error('Assignment error:', error)
      alert('Failed to create assignment')
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return
    
    try {
      const success = await positionService.deleteAssignment(assignmentId)
      
      if (success) {
        router.reload()
      } else {
        alert('Failed to remove assignment')
      }
    } catch (error) {
      console.error('Error removing assignment:', error)
      alert('Failed to remove assignment')
    }
  }

  const handleClearAllAssignments = async () => {
    if (!confirm('⚠️ Clear ALL assignments from ALL positions?\n\nThis will remove all attendant assignments but keep positions and shifts intact.\n\nThis action cannot be undone.')) {
      return
    }
    
    try {
      const success = await positionService.clearAllAssignments()
      
      if (success) {
        alert('✅ Cleared all assignments')
        router.reload()
      } else {
        alert('Failed to clear assignments')
      }
    } catch (error) {
      console.error('Clear assignments error:', error)
      alert('Failed to clear assignments')
    }
  }

  return {
    showAssignAttendantModal,
    selectedShift,
    
    setShowAssignAttendantModal,
    setSelectedShift,
    
    handleCreateAssignment,
    handleRemoveAssignment,
    handleClearAllAssignments,
  }
}
