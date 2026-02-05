import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Position } from '../types'
import { createPositionService } from '../lib/positionService'

interface UsePositionsProps {
  eventId: string
  initialPositions: Position[]
}

interface UsePositionsReturn {
  positions: Position[]
  selectedPosition: Position | null
  editingPosition: Position | null
  showInactive: boolean
  selectedPositions: Set<string>
  isSubmitting: boolean
  
  setSelectedPosition: (position: Position | null) => void
  setEditingPosition: (position: Position | null) => void
  setShowInactive: (show: boolean) => void
  setSelectedPositions: (positions: Set<string>) => void
  setIsSubmitting: (submitting: boolean) => void
  
  handleDelete: (positionId: string) => Promise<void>
  handleActivate: (positionId: string) => Promise<void>
  handleDeactivate: (positionId: string) => Promise<void>
  handleHardDelete: (positionId: string, positionName: string) => Promise<void>
  handleBulkDelete: () => Promise<void>
  
  togglePositionSelection: (positionId: string) => void
  selectAllPositions: () => void
  clearSelection: () => void
  getFilteredPositions: () => Position[]
}

export function usePositions({ eventId, initialPositions }: UsePositionsProps): UsePositionsReturn {
  const router = useRouter()
  const [positions] = useState<Position[]>(initialPositions)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const positionService = createPositionService(eventId)

  // Initialize showInactive from URL or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const showInactiveParam = urlParams.get('showInactive')
    
    if (showInactiveParam === 'true') {
      setShowInactive(true)
    } else {
      const savedState = localStorage.getItem(`showInactive-event-${eventId}`)
      if (savedState === 'true') {
        setShowInactive(true)
      }
    }
  }, [eventId])

  // Save showInactive state to localStorage
  useEffect(() => {
    localStorage.setItem(`showInactive-event-${eventId}`, showInactive.toString())
  }, [showInactive, eventId])

  const handleDelete = async (positionId: string) => {
    if (!confirm('Are you sure you want to deactivate this position? It can be reactivated later.')) {
      return
    }

    try {
      setIsSubmitting(true)
      const success = await positionService.deletePosition(positionId)

      if (success) {
        router.reload()
      } else {
        alert('Failed to delete position')
      }
    } catch (error) {
      alert('Failed to deactivate position')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleActivate = async (positionId: string) => {
    try {
      const success = await positionService.activatePosition(positionId)
      if (success) {
        router.reload()
      } else {
        alert('Failed to activate position')
      }
    } catch (error) {
      alert('Failed to activate position')
    }
  }

  const handleDeactivate = async (positionId: string) => {
    try {
      const success = await positionService.deactivatePosition(positionId)
      if (success) {
        router.reload()
      } else {
        alert('Failed to deactivate position')
      }
    } catch (error) {
      alert('Failed to deactivate position')
    }
  }

  const handleHardDelete = async (positionId: string, positionName: string) => {
    const confirmed = confirm(
      `⚠️ PERMANENT DELETION ⚠️\n\n` +
      `This will permanently delete "${positionName}" from the database.\n` +
      `This action CANNOT be undone.\n\n` +
      `Are you absolutely sure?`
    )
    if (!confirmed) return

    try {
      const result = await positionService.hardDeletePosition(positionId)
      
      if (result.success) {
        alert(`Position "${positionName}" permanently deleted.`)
        router.reload()
      } else {
        if (result.error) {
          alert(`Cannot delete position:\n${result.error}`)
        } else {
          alert(`Failed: ${result.error}`)
        }
      }
    } catch (error) {
      alert('Failed to permanently delete position')
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedPositions.size} selected positions? This action cannot be undone.`)) {
      return
    }

    try {
      setIsSubmitting(true)
      let successCount = 0
      let errorCount = 0

      for (const positionId of selectedPositions) {
        try {
          const success = await positionService.deletePosition(positionId)

          if (success) {
            successCount++
          } else {
            errorCount++
            console.error(`Failed to delete position ${positionId}`)
          }
        } catch (error) {
          errorCount++
          console.error(`Error deleting position ${positionId}:`, error)
        }
      }

      if (successCount > 0) {
        alert(`✅ Successfully deleted ${successCount} positions${errorCount > 0 ? ` (${errorCount} failed)` : ''}`)
        router.reload()
      } else {
        alert('❌ Failed to delete any positions')
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      alert('Failed to delete positions')
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePositionSelection = (positionId: string) => {
    const newSelection = new Set(selectedPositions)
    if (newSelection.has(positionId)) {
      newSelection.delete(positionId)
    } else {
      newSelection.add(positionId)
    }
    setSelectedPositions(newSelection)
  }

  const selectAllPositions = () => {
    const allPositionIds = new Set(
      positions.filter(p => showInactive ? true : p.isActive).map(p => p.id)
    )
    setSelectedPositions(allPositionIds)
  }

  const clearSelection = () => {
    setSelectedPositions(new Set())
  }

  const getFilteredPositions = () => {
    return positions.filter(p => showInactive ? true : p.isActive)
  }

  return {
    positions,
    selectedPosition,
    editingPosition,
    showInactive,
    selectedPositions,
    isSubmitting,
    
    setSelectedPosition,
    setEditingPosition,
    setShowInactive,
    setSelectedPositions,
    setIsSubmitting,
    
    handleDelete,
    handleActivate,
    handleDeactivate,
    handleHardDelete,
    handleBulkDelete,
    
    togglePositionSelection,
    selectAllPositions,
    clearSelection,
    getFilteredPositions,
  }
}
