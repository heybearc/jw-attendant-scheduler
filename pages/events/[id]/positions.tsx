import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'
import EventPageWrapper from '../../../components/EventPageWrapper'
import BulkPositionCreator from '../../../components/BulkPositionCreator'
import PositionTemplateModal from '../../../components/PositionTemplateModal'
import PositionGridView from '../../../components/PositionGridView'
import { AutoAssignmentEngine } from '../../../lib/autoAssignmentEngine'
import { createPositionService } from '../../../lib/positionService'
import { exportService } from '../../../lib/exportService'
import { usePositions } from '../../../hooks/usePositions'
import { useAssignments } from '../../../hooks/useAssignments'
import { useBulkOperations } from '../../../hooks/useBulkOperations'
import { useShifts } from '../../../hooks/useShifts'
import { useOversight } from '../../../hooks/useOversight'
import { useExport } from '../../../hooks/useExport'
import CreatePositionModal from '../../../components/CreatePositionModal'
import ShiftModal from '../../../components/ShiftModal'
import OverseerModal from '../../../components/OverseerModal'
import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../api/auth/[...nextauth]'
import crypto from 'crypto'

// Utility function to convert 24-hour time to 12-hour format
function formatTime12Hour(time24: string): string {
  if (!time24) return ''
  
  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  
  return `${hour12}:${minutes} ${ampm}`
}

// APEX GUARDIAN: Modern Event Positions Management Page
// Updated to use the new positions API with bulk creation capabilities

interface Position {
  id: string
  positionNumber: number
  name: string
  positionName: string
  description?: string
  area?: string
  sequence: number
  isActive: boolean
  overseerId?: string | null
  keymanId?: string | null
  shifts?: Array<{
    id: string
    name: string
    startTime?: string
    endTime?: string
    isAllDay: boolean
  }>
  assignments?: Array<{
    id: string
    role: string
    attendant: {
      id: string
      firstName: string
      lastName: string
    }
    overseer?: {
      id: string
      firstName: string
      lastName: string
    }
    keyman?: {
      id: string
      firstName: string
      lastName: string
    }
    shift?: {
      id: string
      name: string
      startTime?: string
      endTime?: string
      isAllDay: boolean
    }
  }>
  oversight?: Array<{
    id: string
    overseer?: {
      id: string
      firstName: string
      lastName: string
    }
    keyman?: {
      id: string
      firstName: string
      lastName: string
    }
  }>
}

interface Event {
  id: string
  name: string
  eventType: string
  startDate: string
  endDate: string
  status: string
  departmentTemplate?: {
    id: string
    name: string
    moduleConfig?: any
    terminology?: any
    positionTemplates?: Array<{
      id: string
      name: string
      description?: string
      capacity?: number
      sortOrder: number
    }>
  } | null
}

interface Stats {
  total: number
  active: number
  assigned: number
}

interface Volunteer {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  emergencyContact?: string
  medicalInfo?: string
  formsOfService: string[] | string
  congregation?: string
  isActive: boolean
  overseerId?: string | null
  keymanId?: string | null
  overseer?: {
    id: string
    firstName: string
    lastName: string
  } | null
  keyman?: {
    id: string
    firstName: string
    lastName: string
  } | null
  users?: {
    role: string
  } | null
}
// Type alias for Attendant
type Attendant = Volunteer

interface EventPositionsProps {
  eventId: string
  event: Event
  positions: Position[]
  attendants: Attendant[]
  stats: Stats
  canManageContent: boolean
  canEdit: boolean
  canDelete: boolean
  canManagePermissions: boolean
  moduleConfig?: any
  terminology?: any
  positionTemplates?: any
  departmentTemplateName?: string
}
export default function EventPositionsPage({ eventId, event, positions: initialPositions, attendants, stats, canManageContent, canEdit, canDelete, canManagePermissions, moduleConfig, terminology, positionTemplates, departmentTemplateName }: EventPositionsProps) {
  const router = useRouter()
  
  // Initialize services
  const positionService = React.useMemo(() => createPositionService(eventId), [eventId])
  
  // Custom hooks for state management
  const positionsHook = usePositions({ eventId, initialPositions })
  const assignmentsHook = useAssignments({ eventId })
  const bulkOpsHook = useBulkOperations({ 
    eventId, 
    selectedPositions: positionsHook.selectedPositions,
    positions: positionsHook.positions 
  })
  const shiftsHook = useShifts({ eventId })
  const oversightHook = useOversight({ eventId })
  
  // Remaining local state (not yet extracted to hooks)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkCreator, setShowBulkCreator] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [assignmentProgress, setAssignmentProgress] = useState({
    phase: '',
    current: 0,
    total: 0,
    message: '',
    assignments: [] as Array<{attendant: string, position: string, shift: string}>
  })
  const [bulkCreateResults, setBulkCreateResults] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [showAvailableAttendants, setShowAvailableAttendants] = useState(false)
  const [selectedOverseer, setSelectedOverseer] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'overseers' | 'assistants' | 'keymen'>('all')
  // Initialize viewMode from localStorage if available
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('positions-view-mode')
      return (saved === 'list' || saved === 'grid') ? saved : 'list'
    }
    return 'list'
  })
  const [showFiltersMenu, setShowFiltersMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)

  // Persist viewMode to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('positions-view-mode', viewMode)
    }
  }, [viewMode])

  // Restore scroll position after content loads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedScrollPos = sessionStorage.getItem('positions-scroll-pos')
      if (savedScrollPos) {
        // Wait for content to render, then restore scroll position
        const restoreScroll = () => {
          const scrollPos = parseInt(savedScrollPos, 10)
          window.scrollTo(0, scrollPos)
          sessionStorage.removeItem('positions-scroll-pos')
        }
        
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          setTimeout(restoreScroll, 300)
        })
      }
    }
  }, [positionsHook.positions])

  // Save scroll position before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('positions-scroll-pos', window.scrollY.toString())
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
  
  // Define getFilteredPositionsWithOverseer before using it in exportHook
  const getFilteredPositionsWithOverseer = () => {
    let filtered = positionsHook.getFilteredPositions()
    
    // Apply overseer filter
    if (selectedOverseer !== 'all') {
      filtered = filtered.filter(position => 
        position.oversight?.some(o => o.overseer?.id === selectedOverseer)
      )
    }
    
    // Apply role filter (Phase 5B: Oversight Role Filtering)
    if (roleFilter !== 'all') {
      filtered = filtered.filter(position => {
        const assignments = position.assignments || []
        
        if (roleFilter === 'overseers') {
          return assignments.some(a => a.role === 'OVERSEER')
        } else if (roleFilter === 'assistants') {
          return assignments.some(a => a.role === 'ASSISTANT_OVERSEER')
        } else if (roleFilter === 'keymen') {
          return assignments.some(a => a.role === 'KEYMAN')
        }
        
        return true
      })
    }
    
    return filtered
  }
  
  const exportHook = useExport({
    eventId,
    eventName: event.name,
    positions: getFilteredPositionsWithOverseer(),
    overseerFilter: selectedOverseer
  })
  
  // Destructure hook values for easier access
  const { 
    positions,
    selectedPosition, 
    setSelectedPosition,
    editingPosition,
    setEditingPosition,
    showInactive, 
    setShowInactive,
    selectedPositions,
    setSelectedPositions,
    isSubmitting,
    setIsSubmitting,
    handleDelete,
    handleActivate,
    handleDeactivate,
    handleHardDelete,
    handleBulkDelete,
    togglePositionSelection,
    selectAllPositions,
    clearSelection,
    getFilteredPositions
  } = positionsHook
  
  const {
    showAssignAttendantModal,
    setShowAssignAttendantModal,
    selectedShift,
    setSelectedShift,
    handleCreateAssignment,
    handleRemoveAssignment,
    handleClearAllAssignments
  } = assignmentsHook
  
  const {
    showBulkEditModal,
    setShowBulkEditModal,
    showTemplateModal,
    setShowTemplateModal,
    handleBulkEdit,
    handleApplyTemplate,
    handleBulkShiftCreate,
    handleBulkOversight,
    handleClearAllShifts
  } = bulkOpsHook
  
  const {
    showShiftModal,
    setShowShiftModal,
    shiftFormData,
    setShiftFormData,
    handleShiftSubmit: handleShiftSubmitHook,
    handleDeleteShift
  } = shiftsHook
  
  const {
    showOverseerModal,
    setShowOverseerModal,
    overseerFormData,
    setOverseerFormData,
    handleOverseerSubmit: handleOverseerSubmitHook
  } = oversightHook
  
  const {
    isExporting,
    handleExportPDF,
    handleExportExcel
  } = exportHook

  // Utility function to format 24-hour time to 12-hour format
  const formatTime12Hour = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  // Initialize showInactive state from URL or localStorage on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const showInactiveParam = urlParams.get('showInactive')
    
    if (showInactiveParam === 'true') {
      setShowInactive(true)
    } else {
      // Check localStorage as fallback
      const savedState = localStorage.getItem(`showInactive-event-${eventId}`)
      if (savedState === 'true') {
        setShowInactive(true)
      }
    }
    
    // Restore scroll position if it was saved recently (within 5 seconds)
    const savedScrollY = sessionStorage.getItem('positions_scroll_y')
    const savedScrollX = sessionStorage.getItem('positions_scroll_x')
    const savedTimestamp = sessionStorage.getItem('positions_scroll_timestamp')
    
    if (savedScrollY && savedScrollX && savedTimestamp) {
      const timeSinceSave = Date.now() - parseInt(savedTimestamp)
      // Only restore if saved within last 5 seconds (prevents stale scroll positions)
      if (timeSinceSave < 5000) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
          window.scrollTo(parseInt(savedScrollX), parseInt(savedScrollY))
          // Don't clear immediately - allow multiple refreshes to use same position
        }, 100)
      } else {
        // Clear stale scroll position
        sessionStorage.removeItem('positions_scroll_y')
        sessionStorage.removeItem('positions_scroll_x')
        sessionStorage.removeItem('positions_scroll_timestamp')
      }
    }
  }, [eventId])
  const [formData, setFormData] = useState({
    positionNumber: 1,
    name: '',
    area: '',
    description: ''
  })

  // APEX GUARDIAN: Client-side fetching removed - data now provided via SSR

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Position name is required')
      return
    }

    try {
      const url = editingPosition 
        ? `/api/events/${eventId}/positions/${editingPosition.id}`
        : `/api/events/${eventId}/positions`
      
      const method = editingPosition ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert(editingPosition ? 'Position updated successfully' : 'Position created successfully')
        setShowCreateModal(false)
        setEditingPosition(null)
        setFormData({ positionNumber: 1, name: '', area: '', description: '' })
        router.reload() // Refresh data without page reload
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save position')
      }
    } catch (error) {
      console.error('Error saving position:', error)
      alert('Failed to save position')
    }
  }

  const handleEdit = (position: Position) => {
    setEditingPosition(position)
    setFormData({
      positionNumber: position.positionNumber,
      name: position.name,
      area: position.area || '',
      description: position.description || ''
    })
    setShowCreateModal(true)
  }

  // handleDelete is now provided by usePositions hook

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingPosition(null)
    setFormData({ positionNumber: 1, name: '', area: '', description: '' })
  }

  // handleShiftSubmit is now provided by useShifts hook
  const handleShiftSubmit = (e: React.FormEvent) => handleShiftSubmitHook(e, selectedPosition)

  // handleOverseerSubmit is now provided by useOversight hook
  const handleOverseerSubmit = (e: React.FormEvent) => handleOverseerSubmitHook(e, selectedPosition)

  const handleBulkCreateSuccess = async (result: any) => {
    alert(`Successfully created ${result.created} positions`)
    setShowBulkCreator(false)
    router.reload() // Refresh page to show updated data
  }

  // APEX GUARDIAN: New Separated Bulk Operation Handlers
  
  // Handle bulk position updates (area, status)
  const handleBulkPositionUpdate = async () => {
    try {
      const area = (document.getElementById('bulk-area') as HTMLInputElement)?.value
      const isActive = (document.getElementById('bulk-status') as HTMLSelectElement)?.value
      
      if (!area && isActive === '') {
        alert('Please specify at least one field to update')
        return
      }
      
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
      
      alert(`✅ Successfully updated ${successCount} of ${selectedPositions.size} positions`)
      router.reload()
    } catch (error) {
      console.error('Bulk position update error:', error)
      alert('Failed to update positions')
    }
  }

  // Handle bulk template application
  const handleBulkTemplateApplication = async () => {
    try {
      const templateType = (document.getElementById('bulk-template') as HTMLSelectElement)?.value
      
      if (!templateType) {
        alert('Please select a template')
        return
      }
      
      // APEX GUARDIAN: Bidirectional shift logic validation for All Day template
      if (templateType === 'allday') {
        const selectedPositionObjects = positions.filter(p => selectedPositions.has(p.id))
        const positionsWithPartialShifts = selectedPositionObjects.filter(position => 
          position.shifts && position.shifts.some(shift => !shift.isAllDay)
        )
        
        if (positionsWithPartialShifts.length > 0) {
          const positionNames = positionsWithPartialShifts.map(p => p.name).join(', ')
          alert(
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
        alert(`✅ Template Applied Successfully!`)
        router.reload()
      } else {
        alert('Failed to apply template')
      }
    } catch (error) {
      console.error('Template application error:', error)
      alert('Failed to apply template')
    }
  }

  // Handle bulk custom shift creation
  const handleBulkCustomShiftCreation = async () => {
    try {
      const shiftName = (document.getElementById('bulk-shift-name') as HTMLInputElement)?.value
      const shiftStart = (document.getElementById('bulk-shift-start') as HTMLInputElement)?.value
      const shiftEnd = (document.getElementById('bulk-shift-end') as HTMLInputElement)?.value
      const isAllDay = (document.getElementById('bulk-shift-allday') as HTMLInputElement)?.checked
      
      if (!isAllDay && (!shiftStart || !shiftEnd)) {
        alert('Please specify start and end times, or check "All Day"')
        return
      }
      
      if (!shiftName) {
        alert('Please specify a shift name')
        return
      }
      
      // APEX GUARDIAN: Bidirectional shift logic validation for bulk operations
      if (isAllDay) {
        const selectedPositionObjects = positions.filter(p => selectedPositions.has(p.id))
        const positionsWithPartialShifts = selectedPositionObjects.filter(position => 
          position.shifts && position.shifts.some(shift => !shift.isAllDay)
        )
        
        if (positionsWithPartialShifts.length > 0) {
          const positionNames = positionsWithPartialShifts.map(p => p.name).join(', ')
          alert(
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
          startTime: isAllDay ? null : (shiftStart || ''),
          endTime: isAllDay ? null : (shiftEnd || ''),
          isAllDay: isAllDay
        })
        
        if (success) {
          successCount++
        } else {
          console.error(`Failed to create shift for position ${positionId}`)
        }
      }
      
      alert(`✅ Successfully created "${shiftName}" shift for ${successCount} of ${selectedPositions.size} positions`)
      router.reload()
    } catch (error) {
      console.error('Custom shift creation error:', error)
      alert('Failed to create shifts')
    }
  }

  // Handle combined shift creation + oversight assignment (FB-012)
  const handleCombinedShiftAndOversight = async () => {
    try {
      const shiftName = (document.getElementById('combined-shift-name') as HTMLInputElement)?.value
      const shiftStart = (document.getElementById('combined-shift-start') as HTMLInputElement)?.value
      const shiftEnd = (document.getElementById('combined-shift-end') as HTMLInputElement)?.value
      const isAllDay = (document.getElementById('combined-shift-allday') as HTMLInputElement)?.checked
      const overseerId = (document.getElementById('combined-overseer') as HTMLSelectElement)?.value
      const keymanId = (document.getElementById('combined-keyman') as HTMLSelectElement)?.value
      
      if (!shiftName) {
        alert('Please specify a shift name')
        return
      }
      
      if (!isAllDay && (!shiftStart || !shiftEnd)) {
        alert('Please specify start and end times, or check "All Day"')
        return
      }
      
      setIsSubmitting(true)
      
      // Step 1: Create shifts for all selected positions
      let shiftSuccessCount = 0
      for (const positionId of selectedPositions) {
        const success = await positionService.createShift(positionId, {
          name: shiftName,
          startTime: isAllDay ? null : (shiftStart || ''),
          endTime: isAllDay ? null : (shiftEnd || ''),
          isAllDay: isAllDay
        })
        
        if (success) {
          shiftSuccessCount++
        }
      }
      
      // Step 2: Assign oversight if specified
      let oversightSuccessCount = 0
      if (overseerId || keymanId) {
        const response = await fetch(`/api/events/${eventId}/positions/bulk-oversight`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            positionIds: Array.from(selectedPositions),
            overseerId: overseerId || null,
            keymanId: keymanId || null
          })
        })
        
        if (response.ok) {
          oversightSuccessCount = selectedPositions.size
        }
      }
      
      // Report results
      const messages = []
      if (shiftSuccessCount > 0) {
        messages.push(`✅ Created "${shiftName}" shift for ${shiftSuccessCount} positions`)
      }
      if (oversightSuccessCount > 0) {
        messages.push(`✅ Assigned oversight to ${oversightSuccessCount} positions`)
      }
      
      if (messages.length > 0) {
        alert(messages.join('\n'))
        // Keep modal open and selection preserved (FB-012 requirement)
        router.reload()
      } else {
        alert('No changes were made')
      }
    } catch (error) {
      console.error('Combined operation error:', error)
      alert('Failed to complete combined operation')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle bulk oversight assignment using new API
  const handleBulkOversightAssignment = async () => {
    try {
      const overseerId = (document.getElementById('bulk-overseer') as HTMLSelectElement)?.value
      const keymanId = (document.getElementById('bulk-keyman') as HTMLSelectElement)?.value
      
      if (!overseerId && !keymanId) {
        alert('Please select at least one oversight role to assign')
        return
      }
      
      const success = await positionService.bulkAssignOversight({
        positionIds: Array.from(selectedPositions),
        overseerId: overseerId || undefined,
        keymanId: keymanId || undefined
      })
      
      if (success) {
        alert(`✅ Oversight Assigned Successfully!`)
        router.reload()
      } else {
        alert('Failed to assign oversight')
      }
    } catch (error) {
      console.error('Bulk oversight assignment error:', error)
      alert('Failed to assign oversight')
    }
  }

  // handleDeleteShift is now provided by useShifts hook

  // handleBulkDelete is now provided by usePositions hook

  // handleRemoveAssignment is now provided by useAssignments hook

  // Export handlers are now provided by useExport hook

  // Auto-assign algorithm - APEX GUARDIAN OVERSIGHT-AWARE VERSION v3.0
  // Refactored to use extracted AutoAssignmentEngine (Week 1, Step 2)
  const handleAutoAssignOversightAware = async () => {
    if (!confirm('Auto-assign available volunteers to unfilled positions?')) return
    
    try {
      setIsSubmitting(true)
      setShowProgressModal(true)

      // Initialize the AutoAssignmentEngine with current data
      const engine = new AutoAssignmentEngine({
        eventId,
        positions,
        attendants,
        onProgress: (progress) => {
          // Convert progress format to match component state
          setAssignmentProgress({
            phase: progress.phase,
            current: progress.current,
            total: progress.total,
            message: progress.message,
            assignments: [] // Component expects object array, engine provides string array
          })
        },
        onLog: (message) => {
          console.log(message)
          // Store logs in localStorage for debugging
          const logs = JSON.parse(localStorage.getItem('autoAssignLogs') || '[]')
          logs.push(message)
          localStorage.setItem('autoAssignLogs', JSON.stringify(logs))
        }
      })

      // Execute the auto-assignment algorithm
      const result = await engine.execute()

      // Show success message with results
      alert(result.message)

      // Show completion status
      setAssignmentProgress({
        phase: 'Assignment Complete!',
        current: result.totalAssignments,
        total: result.totalAssignments,
        message: `Successfully assigned ${result.totalAssignments} shifts!`,
        assignments: []
      })

      // Reload page after brief delay
      setTimeout(() => {
        setShowProgressModal(false)
        router.reload()
      }, 2000)
      
      return // Don't close modal immediately
    } catch (error) {
      console.error('Auto-assign error:', error)
      alert('Failed to auto-assign volunteers')
    } finally {
      setIsSubmitting(false)
      setShowProgressModal(false)
      setAssignmentProgress({
        phase: '',
        current: 0,
        total: 0,
        message: '',
        assignments: []
      })
    }
  }

  // getFilteredPositionsWithOverseer is now defined earlier in the component

  // Get unassigned attendants count (excluding leadership roles)
  const getUnassignedCount = () => {
    const assignedAttendantIds = new Set()
    const leadershipAttendantIds = new Set()
    
    positions.forEach(position => {
      // Track assigned attendants
      position.assignments?.forEach(assignment => {
        if (assignment.volunteer?.id) {
          assignedAttendantIds.add(assignment.volunteer.id)
        }
      })
      
      // Track overseers and keymen from oversight array
      position.oversight?.forEach(oversight => {
        if (oversight.overseer?.id) {
          leadershipAttendantIds.add(oversight.overseer.id)
        }
        if (oversight.keyman?.id) {
          leadershipAttendantIds.add(oversight.keyman.id)
        }
      })
    })
    
    // Also check attendants who have Overseer or Keyman in their forms of service
    attendants.forEach(att => {
      const formsOfService = Array.isArray(att.formsOfService) 
        ? att.formsOfService 
        : typeof att.formsOfService === 'string' 
          ? JSON.parse(att.formsOfService) 
          : []
      
      if (formsOfService.includes('Overseer') || formsOfService.includes('Keyman')) {
        leadershipAttendantIds.add(att.id)
      }
      
      // Also check if user has OVERSEER or KEYMAN role
      if (att.users?.role === 'OVERSEER' || att.users?.role === 'KEYMAN') {
        leadershipAttendantIds.add(att.id)
      }
    })
    
    return attendants.filter(att => 
      att.isActive && 
      !assignedAttendantIds.has(att.id) && 
      !leadershipAttendantIds.has(att.id)
    ).length
  }
  
  // Get list of unassigned attendants (excluding leadership roles)
  const getUnassignedAttendants = () => {
    const assignedAttendantIds = new Set()
    const leadershipAttendantIds = new Set()
    
    positions.forEach(position => {
      // Track assigned attendants
      position.assignments?.forEach(assignment => {
        if (assignment.volunteer?.id) {
          assignedAttendantIds.add(assignment.volunteer.id)
        }
      })
      
      // Track overseers and keymen from oversight array
      position.oversight?.forEach(oversight => {
        if (oversight.overseer?.id) {
          leadershipAttendantIds.add(oversight.overseer.id)
        }
        if (oversight.keyman?.id) {
          leadershipAttendantIds.add(oversight.keyman.id)
        }
      })
    })
    
    // Also check attendants who have Overseer or Keyman in their forms of service
    attendants.forEach(att => {
      const formsOfService = Array.isArray(att.formsOfService) 
        ? att.formsOfService 
        : typeof att.formsOfService === 'string' 
          ? JSON.parse(att.formsOfService) 
          : []
      
      if (formsOfService.includes('Overseer') || formsOfService.includes('Keyman')) {
        leadershipAttendantIds.add(att.id)
      }
      
      // Also check if user has OVERSEER or KEYMAN role
      if (att.users?.role === 'OVERSEER' || att.users?.role === 'KEYMAN') {
        leadershipAttendantIds.add(att.id)
      }
    })
    
    return attendants.filter(att => 
      att.isActive && 
      !assignedAttendantIds.has(att.id) && 
      !leadershipAttendantIds.has(att.id)
    )
  }

  // Get session data
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  // Helper function to reload page while preserving showInactive state
  const reloadWithState = () => {
    // Store scroll position BEFORE any navigation
    const scrollY = window.scrollY
    const scrollX = window.scrollX
    
    sessionStorage.setItem('positions_scroll_y', scrollY.toString())
    sessionStorage.setItem('positions_scroll_x', scrollX.toString())
    sessionStorage.setItem('positions_scroll_timestamp', Date.now().toString())
    
    // Use window.location.reload() to ensure sessionStorage persists
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading positions...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <EventPageWrapper
      event={event}
      currentPage="positions"
      canEdit={canEdit}
      canDelete={canDelete}
      canManagePermissions={canManagePermissions}
      moduleConfig={moduleConfig}
      terminology={terminology}
      positionTemplates={positionTemplates}
      departmentTemplateName={departmentTemplateName}
    >
      <Head>
        <title>{event?.name ? `${event.name} - Positions` : 'Event Positions'} | Theocratic Shift Scheduler</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            {/* Professional Action Toolbar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* Primary Actions */}
                {canManageContent && (
                  <>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create
                    </button>
                    <button
                      onClick={() => setShowBulkCreator(true)}
                      className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Bulk Create
                    </button>
                  </>
                )}
                
                {/* Auto-Assign - Only show when needed */}
                {canManageContent && getUnassignedCount() > 0 && (
                  <button
                    onClick={handleAutoAssignOversightAware}
                    disabled={isSubmitting}
                    className="inline-flex items-center px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                        <span>Assigning...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Auto-Assign ({getUnassignedCount()})
                      </>
                    )}
                  </button>
                )}
                
                {/* View Toggle */}
                <div className="flex border border-gray-300 rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="List View"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Grid View"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
                
                {/* Filters Dropdown */}
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowFiltersMenu(!showFiltersMenu)}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showFiltersMenu && (
                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <div className="p-3 space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Overseer</label>
                          <select
                            value={selectedOverseer}
                            onChange={(e) => setSelectedOverseer(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All Overseers</option>
                            {Array.from(new Set(
                              positions
                                .map(p => p.oversight?.[0]?.overseer)
                                .filter(Boolean)
                                .map(o => JSON.stringify({ id: o!.id, name: `${o!.firstName} ${o!.lastName}` }))
                            )).map(overseerStr => {
                              const overseer = JSON.parse(overseerStr)
                              return (
                                <option key={overseer.id} value={overseer.id}>
                                  {overseer.name}
                                </option>
                              )
                            })}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                          <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'overseers' | 'assistants' | 'keymen')}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All Roles</option>
                            <option value="overseers">Overseers</option>
                            <option value="assistants">Assistants</option>
                            <option value="keymen">Keymen</option>
                          </select>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <button
                            onClick={() => {
                              const newState = !showInactive
                              setShowInactive(newState)
                              localStorage.setItem(`showInactive-event-${eventId}`, newState.toString())
                              const url = new URL(window.location.href)
                              if (newState) {
                                url.searchParams.set('showInactive', 'true')
                              } else {
                                url.searchParams.delete('showInactive')
                              }
                              window.history.replaceState({}, '', url.toString())
                            }}
                            className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                          >
                            <input
                              type="checkbox"
                              checked={showInactive}
                              onChange={() => {}}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span>Show Inactive</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* More Menu */}
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                    More
                  </button>
                  {showActionsMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <button
                        onClick={() => { handleExportPDF(); setShowActionsMenu(false); }}
                        disabled={isExporting}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
                      </button>
                      <button
                        onClick={() => { handleExportExcel(); setShowActionsMenu(false); }}
                        disabled={isExporting}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{isExporting ? 'Exporting...' : 'Export Excel'}</span>
                      </button>
                      {canManageContent && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          {event.departmentTemplate?.positionTemplates && 
                           (event.departmentTemplate.positionTemplates as any[]).length > 0 && (
                            <button
                              onClick={() => { setShowTemplateModal(true); setShowActionsMenu(false); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Create from Template</span>
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              setShowActionsMenu(false)
                              if (!confirm('📧 Send assignment notifications to all volunteers?\n\nThis will send an email to each volunteer with their current assignments.\n\nContinue?')) return
                              try {
                                const response = await fetch(`/api/events/${eventId}/assignments/send-notifications`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' }
                                })
                                const data = await response.json()
                                if (response.ok && data.success) {
                                  alert(data.failed > 0 ? `⚠️ ${data.message}\n\nErrors:\n${data.errors?.join('\n') || 'Unknown errors'}` : `✅ ${data.message}`)
                                } else {
                                  alert(`❌ ${data.error || data.message || 'Failed to send notifications'}`)
                                }
                              } catch (error) {
                                alert(`❌ Failed to send notifications: ${error.message}`)
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>Send Notifications</span>
                          </button>
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={async () => {
                              setShowActionsMenu(false)
                              if (!confirm('⚠️ Clear ALL shifts from ALL positions?\n\nThis will remove all shifts AND their assignments.\n\nThis action cannot be undone.')) return
                              try {
                                const success = await positionService.clearAllShifts()
                                if (success) {
                                  alert('✅ Cleared all shifts and assignments')
                                  router.reload()
                                } else {
                                  alert('Failed to clear shifts')
                                }
                              } catch (error) {
                                console.error('Clear shifts error:', error)
                                alert('Failed to clear shifts')
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Clear All Shifts</span>
                          </button>
                          <button
                            onClick={async () => {
                              setShowActionsMenu(false)
                              if (!confirm('⚠️ Clear ALL assignments?\n\nThis cannot be undone.')) return
                              try {
                                const success = await positionService.clearAllAssignments()
                                if (success) {
                                  alert('✅ Cleared all assignments')
                                  router.reload()
                                } else {
                                  alert('Failed to clear assignments')
                                }
                              } catch (error) {
                                alert('Failed to clear assignments')
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Clear All Assignments</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bulk Operations Bar (contextual) */}
              {canManageContent && selectedPositions.size > 0 && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-blue-700 font-medium">
                    {selectedPositions.size} selected
                  </span>
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="text-xs bg-white hover:bg-gray-50 text-blue-700 px-2 py-1 rounded font-medium border border-blue-300"
                  >
                    Template
                  </button>
                  <button
                    onClick={() => setShowBulkEditModal(true)}
                    className="text-xs bg-white hover:bg-gray-50 text-blue-700 px-2 py-1 rounded font-medium border border-blue-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="text-xs bg-white hover:bg-gray-50 text-red-600 px-2 py-1 rounded font-medium border border-red-300"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedPositions(new Set())}
                    className="text-xs bg-white hover:bg-gray-50 text-gray-700 px-2 py-1 rounded font-medium border border-gray-300"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Positions</p>
                  <p className="text-3xl font-bold text-gray-900">{positions.filter(p => p.isActive).length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
            </div>
            {(() => {
              const totalShifts = positions.filter(p => p.isActive).reduce((sum, pos) => sum + (pos.shifts?.length || 0), 0)
              const assignedShifts = positions.filter(p => p.isActive).reduce((sum, pos) => {
                return sum + (pos.shifts?.filter(shift => {
                  const shiftAssignments = pos.assignments?.filter(a => a.shift?.id === shift.id && a.role === 'VOLUNTEER').length || 0
                  return shiftAssignments > 0
                }).length || 0)
              }, 0)
              const completionPercentage = totalShifts > 0 ? Math.round((assignedShifts / totalShifts) * 100) : 0
              
              return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Shift Coverage</p>
                      <p className="text-3xl font-bold text-gray-900">{assignedShifts}/{totalShifts}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        completionPercentage === 100 ? 'bg-green-500' : 
                        completionPercentage >= 80 ? 'bg-blue-500' : 
                        completionPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">{completionPercentage}% Complete</p>
                </div>
              )
            })()}
            
            <div
              onClick={() => setShowAvailableAttendants(true)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer hover:border-purple-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Available Volunteers</p>
                  <p className="text-3xl font-bold text-gray-900">{getUnassignedCount()}</p>
                  <p className="text-xs text-gray-400 mt-1">Click to view list</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Assignments</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {positions.filter(p => p.isActive).reduce((sum, p) => sum + (p.assignments?.filter(a => a.role === 'VOLUNTEER').length || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional View: Grid or List */}
          {viewMode === 'grid' ? (
            <PositionGridView
              positions={getFilteredPositions().filter(p => showInactive ? true : p.isActive)}
              attendants={attendants}
              eventId={eventId}
              onAssign={async (positionId, shiftId, attendantId) => {
                try {
                  const success = await positionService.createAssignment({
                    positionId,
                    attendantId,
                    shiftId
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
              }}
              onUnassign={async (assignmentId) => {
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
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredPositions().filter(p => p.isActive).length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
                <span className="text-6xl mb-4 block">📋</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No positions created</h3>
                <p className="text-gray-500 mb-4">{canManageContent ? 'Create your first position to get started' : 'No positions have been created for this event yet'}</p>
                {canManageContent && (
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setShowBulkCreator(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      🚀 Bulk Create
                    </button>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Create Position
                    </button>
                  </div>
                )}
              </div>
            ) : (
              getFilteredPositions().filter(p => showInactive ? true : p.isActive).map((position) => {
                // Calculate completion percentage for this position
                const totalShifts = position.shifts?.length || 0
                const assignedShifts = position.shifts?.filter(shift => {
                  const shiftAssignments = position.assignments?.filter(a => a.shift?.id === shift.id && a.role === 'VOLUNTEER').length || 0
                  return shiftAssignments > 0
                }).length || 0
                const completionPercentage = totalShifts > 0 ? Math.round((assignedShifts / totalShifts) * 100) : 0
                
                return (
                <div key={position.id} className={`group relative rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                  position.isActive 
                    ? 'bg-white border border-gray-200 hover:border-blue-300' 
                    : 'bg-gray-50 border-2 border-dashed border-gray-300'
                } ${completionPercentage === 100 ? 'ring-2 ring-green-200' : ''}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        {canManageContent && (
                          <input
                            type="checkbox"
                            checked={selectedPositions.has(position.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedPositions)
                              if (e.target.checked) {
                                newSelected.add(position.id)
                              } else {
                                newSelected.delete(position.id)
                              }
                              setSelectedPositions(newSelected)
                            }}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        )}
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`text-lg font-semibold mb-0 ${
                              position.isActive ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {position.name}
                            </h3>
                            {!position.isActive && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Inactive
                              </span>
                            )}
                          </div>
                          {position.area && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {position.area}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          position.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {position.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {/* Completion Badge */}
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                          completionPercentage === 100 
                            ? 'bg-green-100 text-green-800' 
                            : completionPercentage > 0 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span className="text-xs">
                            {completionPercentage === 100 ? '✅' : completionPercentage > 0 ? '⏳' : '⭕'}
                          </span>
                          <span>{completionPercentage}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Assignment Progress</span>
                        <span>{assignedShifts}/{totalShifts} shifts filled</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            completionPercentage === 100 
                              ? 'bg-gradient-to-r from-green-500 to-green-600' 
                              : completionPercentage > 0 
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                : 'bg-gray-300'
                          }`}
                          style={{ width: `${completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {position.description && (
                      <p className="text-sm text-gray-600 mb-3">{position.description}</p>
                    )}


                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>Position #{position.positionNumber}</span>
                      <span>{position.shifts?.length || 0} shifts • {position.assignments?.filter(a => a.role === 'VOLUNTEER').length || 0} attendants</span>
                    </div>


                    {/* SHIFT-SPECIFIC ASSIGNMENT DISPLAY */}
                    {position.shifts && position.shifts.length > 0 ? (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">🕐 Shift Assignments</p>
                        <div className="space-y-2">
                          {position.shifts.map(shift => {
                            // Find assignments for this specific shift
                            const shiftSpecificAssignments = position.assignments?.filter(assignment => 
                              assignment.shift?.id === shift.id
                            ) || []
                            
                            // Get ALL leadership assignments (both position-level and shift-specific)
                            const allLeadershipAssignments = position.assignments?.filter(assignment => 
                              assignment.role === 'OVERSEER' || assignment.role === 'KEYMAN'
                            ) || []
                            
                            // Separate regular attendants from leadership for this shift
                            const attendantAssignments = shiftSpecificAssignments.filter(assignment => 
                              assignment.role === 'VOLUNTEER'
                            )
                            const shiftLeadershipAssignments = shiftSpecificAssignments.filter(assignment => 
                              assignment.role === 'OVERSEER' || assignment.role === 'KEYMAN'
                            )
                            
                            return (
                              <div key={shift.id} className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all duration-200">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-medium text-gray-700">
                                      {shift.name}
                                    </span>
                                    {!shift.isAllDay && (
                                      <span className="text-xs text-gray-500">
                                        {formatTime12Hour(shift.startTime || '')} - {formatTime12Hour(shift.endTime || '')}
                                      </span>
                                    )}
                                    {shift.isAllDay && (
                                      <span className="text-xs text-blue-600 bg-blue-100 px-1 rounded">
                                        All Day
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-400">
                                      {attendantAssignments.length} attendant{attendantAssignments.length !== 1 ? 's' : ''}
                                    </span>
                                    <button
                                      onClick={() => handleDeleteShift(position.id, shift.id, shift.name)}
                                      className="text-xs text-red-600 hover:text-red-800 hover:bg-red-100 rounded px-1 py-0.5 transition-colors"
                                      title={`Delete ${shift.name} shift`}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Shift Leadership Assignments */}
                                {shiftLeadershipAssignments.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-xs font-medium text-gray-600 mb-1">Oversight:</p>
                                    <div className="space-y-1">
                                      {shiftLeadershipAssignments.map(assignment => {
                                        const roleColor = assignment.role === 'OVERSEER' ? 'text-blue-700' : 'text-purple-700'
                                        const bgColor = assignment.role === 'OVERSEER' ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100'
                                        
                                        return (
                                          <div key={assignment.id} className={`flex items-center justify-between ${bgColor} border rounded px-2 py-1`}>
                                            <div className="flex items-center">
                                              <span className={`text-xs font-medium ${roleColor}`}>
                                                {assignment.volunteer?.firstName} {assignment.volunteer?.lastName}
                                              </span>
                                            </div>
                                            <button
                                              onClick={() => handleRemoveAssignment(assignment.id)}
                                              className="text-xs text-red-600 hover:text-red-800 px-1"
                                              title="Remove assignment"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Attendant Assignments */}
                                {attendantAssignments.length > 0 ? (
                                  <div className="space-y-1">
                                    {attendantAssignments.map(assignment => {
                                      // Attendant assignments should be green
                                      const roleColor = 'text-green-700'
                                      const bgColor = 'bg-green-50 border-green-100'
                                      
                                      return (
                                        <div key={assignment.id} className={`flex items-center justify-between ${bgColor} border rounded px-2 py-1`}>
                                          <div className="flex items-center">
                                            <span className={`text-xs font-medium ${roleColor}`}>
                                              {assignment.volunteer?.firstName} {assignment.volunteer?.lastName}
                                            </span>
                                          </div>
                                          <button
                                            onClick={() => handleRemoveAssignment(assignment.id)}
                                            className="text-xs text-red-600 hover:text-red-800 px-1"
                                            title="Remove assignment"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedPosition(position)
                                      setSelectedShift(shift)
                                      setShowAssignAttendantModal(true)
                                    }}
                                    className="w-full text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-2 py-1 transition-colors"
                                  >
                                    + Assign Volunteer
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        
                        {/* Add Shift Button - Only show if no All Day shift exists */}
                        {!position.shifts?.some(s => s.isAllDay) ? (
                          <button
                            onClick={() => {
                              setSelectedPosition(position)
                              setShowShiftModal(true)
                            }}
                            className="w-full mt-2 text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 rounded px-2 py-1 transition-colors"
                          >
                            + Add Shift
                          </button>
                        ) : (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                            ℹ️ Cannot add more shifts - this position has an All Day shift that covers the entire 24-hour period
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">🕐 No Shifts Created</p>
                        {canManageContent && (
                          <button
                            onClick={() => {
                              setSelectedPosition(position)
                              setShowShiftModal(true)
                            }}
                            className="w-full text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-2 py-1 transition-colors"
                          >
                            + Create First Shift
                          </button>
                        )}
                      </div>
                    )}

                    {/* Legacy Assignment Display (for positions without shifts) */}
                    {(!position.shifts || position.shifts.length === 0) && position.assignments && position.assignments.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">👤 Legacy Assignments</p>
                        <div className="space-y-1">
                          {position.assignments
                            .filter(assignment => !assignment.shift)
                            .map(assignment => (
                            <div key={assignment.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                              <div className="flex items-center">
                                <span className="text-xs font-medium text-yellow-700">
                                  {assignment.attendant?.firstName} {assignment.attendant?.lastName}
                                </span>
                                <span className="ml-2 text-xs text-yellow-600">
                                  (Needs Shift Assignment)
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                className="text-xs text-red-600 hover:text-red-800 px-1"
                                title="Remove assignment"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              setSelectedPosition(position)
                              setShowAssignAttendantModal(true)
                            }}
                            className="w-full text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded px-2 py-1 transition-colors"
                          >
                            + Assign Volunteer
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Position Management Actions */}
                    {canManageContent && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          onClick={() => {
                            setSelectedPosition(position)
                            setShowOverseerModal(true)
                          }}
                          className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors"
                        >
                          👥 Assign Oversight
                        </button>
                        <button
                          onClick={() => handleEdit(position)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded transition-colors"
                        >
                          ✏️ Edit
                        </button>
                      {position.isActive ? (
                        <button
                          onClick={async () => {
                            if (!confirm(`Mark "${position.name}" as inactive? This will hide it from active view but preserve all data.`)) {
                              return
                            }
                            try {
                              const success = await positionService.deactivatePosition(position.id)
                              if (success) {
                                router.reload()
                              } else {
                                alert('Failed to deactivate position')
                              }
                            } catch (error) {
                              alert('Failed to deactivate position')
                            }
                          }}
                          className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded transition-colors"
                        >
                          ⏸️ Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              const success = await positionService.activatePosition(position.id)
                              if (success) {
                                router.reload()
                              } else {
                                alert('Failed to activate position')
                              }
                            } catch (error) {
                              alert('Failed to activate position')
                            }
                          }}
                          className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors"
                        >
                          ▶️ Activate
                        </button>
                      )}
                        <button
                          onClick={() => handleDelete(position.id)}
                          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}

                    {/* APEX GUARDIAN: Oversight Assignments Display */}
                    {position.oversight && position.oversight.length > 0 && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <h4 className="text-sm font-medium text-green-800 mb-2">👥 Position Oversight</h4>
                        {position.oversight.map((oversight) => (
                          <div key={oversight.id} className="space-y-1">
                            {oversight.overseer && (
                              <div className="text-xs text-green-700">
                                <span className="font-medium">Overseer:</span> {oversight.overseer.firstName} {oversight.overseer.lastName}
                              </div>
                            )}
                            {oversight.keyman && (
                              <div className="text-xs text-green-700">
                                <span className="font-medium">Keyman:</span> {oversight.keyman.firstName} {oversight.keyman.lastName}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Special handling for inactive positions */}
                    {!position.isActive && (
                      <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/events/${eventId}/positions/${position.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isActive: true }),
                              })
                              if (response.ok) {
                                router.reload()
                              } else {
                                alert('Failed to activate position')
                              }
                            } catch (error) {
                              alert('Failed to activate position')
                            }
                          }}
                          className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                        >
                          ✅ Activate
                        </button>
                        {isAdmin && (
                          <button
                            onClick={async () => {
                              const confirmed = confirm(
                                `⚠️ PERMANENT DELETION ⚠️\n\n` +
                                `This will permanently delete "${position.name}" from the database.\n` +
                                `This action CANNOT be undone.\n\n` +
                                `Are you absolutely sure?`
                              )
                              if (!confirmed) return

                              try {
                                const result = await positionService.hardDeletePosition(position.id)
                                
                                if (result.success) {
                                  alert(`Position "${position.name}" permanently deleted.`)
                                  router.reload()
                                } else {
                                  if (result.error) {
                                    alert(
                                      `Cannot delete position:\n${result.error}`
                                    )
                                  } else {
                                    alert(`Failed: ${result.error}`)
                                  }
                                }
                              } catch (error) {
                                alert('Failed to permanently delete position')
                              }
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                            title="Permanently delete position (Admin only)"
                          >
                            🗑️ Delete Forever
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                )
              })
            )}
            </div>
          )}
        </div>

        {/* Position Template Modal */}
        {showTemplateModal && event.departmentTemplate?.positionTemplates && (
          <PositionTemplateModal
            isOpen={showTemplateModal}
            onClose={() => setShowTemplateModal(false)}
            templates={event.departmentTemplate.positionTemplates as any[]}
            departmentName={event.departmentTemplate.name}
            eventId={eventId}
            onSuccess={() => router.reload()}
          />
        )}

        {/* Bulk Position Creator Modal */}
        {showBulkCreator && (
          <BulkPositionCreator
            eventId={eventId}
            onClose={() => setShowBulkCreator(false)}
            onSuccess={handleBulkCreateSuccess}
          />
        )}

        {/* Create/Edit Position Modal */}
        <CreatePositionModal
          isOpen={showCreateModal}
          editingPosition={editingPosition}
          formData={formData}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onFormDataChange={setFormData}
        />

        {/* Shift Creation Modal */}
        <ShiftModal
          isOpen={showShiftModal}
          position={selectedPosition}
          formData={shiftFormData}
          onClose={() => setShowShiftModal(false)}
          onSubmit={handleShiftSubmit}
          onFormDataChange={setShiftFormData}
        />

        {/* Overseer Assignment Modal */}
        <OverseerModal
          isOpen={showOverseerModal}
          position={selectedPosition}
          attendants={attendants}
          formData={overseerFormData}
          onClose={() => setShowOverseerModal(false)}
          onSubmit={handleOverseerSubmit}
          onFormDataChange={setOverseerFormData}
        />

        {/* Assign Volunteer Modal */}
        {showAssignAttendantModal && selectedPosition && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assign Volunteer to {selectedPosition.name}
                  {selectedShift && (
                    <div className="text-sm text-gray-600 mt-1">
                      Shift: {selectedShift.name} {!selectedShift.isAllDay && `(${formatTime12Hour(selectedShift.startTime || '')} - ${formatTime12Hour(selectedShift.endTime || '')})`}
                    </div>
                  )}
                </h3>
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const volunteerId = formData.get('volunteerId') as string
                  const shiftId = formData.get('shiftId') as string
                  
                  if (!volunteerId) {
                    alert('Please select a volunteer')
                    return
                  }
                  
                  if (!shiftId) {
                    alert('Please select a shift')
                    return
                  }

                  try {
                    const response = await fetch(`/api/events/${eventId}/assignments`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        positionId: selectedPosition.id,
                        volunteerId: volunteerId,
                        shiftId: shiftId,
                        role: 'VOLUNTEER'
                      })
                    })

                    if (response.ok) {
                      alert('Attendant assigned successfully')
                      setShowAssignAttendantModal(false)
                      setSelectedShift(null)
                      router.reload()
                    } else {
                      const errorData = await response.json()
                      
                      // Handle specific conflict types
                      if (response.status === 409) {
                        if (errorData.conflictType === 'DUPLICATE_SHIFT_ASSIGNMENT') {
                          alert('⚠️ Conflict: This attendant is already assigned to this shift.')
                        } else if (errorData.conflictType === 'TIME_OVERLAP') {
                          alert(`⚠️ Time Conflict: This attendant has conflicting assignments:\n\n${errorData.conflicts?.map(c => `• ${c.positionName} - ${c.shiftName}`).join('\n')}\n\nPlease choose a different attendant or shift.`)
                        } else if (errorData.conflictType === 'SHIFT_FULL') {
                          alert('⚠️ Shift Full: This shift already has the maximum number of attendants assigned (1).')
                        } else if (errorData.conflictType === 'ROLE_OCCUPIED') {
                          alert(`⚠️ Role Occupied: ${errorData.message}`)
                        } else {
                          alert(`⚠️ Assignment Conflict: ${errorData.message || 'Unable to assign volunteer to this shift.'}`)
                        }
                      } else {
                        alert(`Failed to assign volunteer: ${errorData.error || 'Unknown error'}`)
                      }
                    }
                  } catch (error) {
                    console.error('Error assigning volunteer:', error)
                    alert('Failed to assign volunteer')
                  }
                }}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Volunteer
                      {(() => {
                        const positionOverseer = selectedPosition.assignments?.find(a => a.role === 'OVERSEER')?.attendant
                        const positionKeyman = selectedPosition.assignments?.find(a => a.role === 'KEYMAN')?.attendant
                        
                        if (positionOverseer || positionKeyman) {
                          return (
                            <span className="text-xs text-orange-600 font-normal block mt-1">
                              Showing all attendants (hierarchy filtering temporarily disabled)
                            </span>
                          )
                        }
                        return null
                      })()}
                    </label>
                    <select 
                      name="volunteerId"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a volunteer...</option>
                      {(() => {
                        // APEX GUARDIAN: Get oversight from position.oversight array
                        const oversight = selectedPosition.oversight && selectedPosition.oversight.length > 0 ? selectedPosition.oversight[0] : null
                        const positionOverseer = oversight?.overseer
                        const positionKeyman = oversight?.keyman
                        
                        // Filter attendants based on position's oversight
                        let filteredAttendants = attendants?.filter(att => att.isActive) || []
                        
                        // APEX GUARDIAN: Debug attendant data first
                        
                        // APEX GUARDIAN: EXACT overseer matching filtering
                        if (positionOverseer || positionKeyman) {
                          // Show ONLY attendants assigned to the SAME overseer/keyman as this position
                          const beforeFilter = filteredAttendants.length
                          filteredAttendants = filteredAttendants.filter(attendant => {
                            // Must match the exact overseer or keyman of this position
                            const matchesOverseer = positionOverseer && attendant.overseerId === positionOverseer.id
                            const matchesKeyman = positionKeyman && attendant.keymanId === positionKeyman.id
                            return matchesOverseer || matchesKeyman
                          })
                          
                          
                        }
                        
                        return filteredAttendants.map(attendant => (
                          <option key={attendant.id} value={attendant.id}>
                            {attendant.firstName} {attendant.lastName}
                            {attendant.congregation && ` (${attendant.congregation})`}
                          </option>
                        ))
                      })()}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Shift
                    </label>
                    <select 
                      name="shiftId"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      defaultValue={selectedShift?.id || ''}
                    >
                      <option value="">Select a shift...</option>
                      {selectedPosition.shifts?.map(shift => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} {!shift.isAllDay && `(${formatTime12Hour(shift.startTime || '')} - ${formatTime12Hour(shift.endTime || '')})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAssignAttendantModal(false)
                        setSelectedShift(null)
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                      Assign Volunteer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Redesigned Bulk Operations Modal */}
        {showBulkEditModal && selectedPositions.size > 0 && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
              <div className="mt-3">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Bulk Operations - {selectedPositions.size} Positions Selected
                </h3>
                
                {/* Three Separated Operation Sections */}
                <div className="space-y-8">
                  
                  {/* 1. BULK POSITION UPDATES */}
                  <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                    <h4 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">1</span>
                      Bulk Position Updates
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Update Area
                        </label>
                        <input
                          id="bulk-area"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Leave blank to keep current"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Update Status
                        </label>
                        <select 
                          id="bulk-status"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Keep current status</option>
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleBulkPositionUpdate}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium"
                      >
                        {isSubmitting ? 'Updating...' : `Update ${selectedPositions.size} Positions`}
                      </button>
                    </div>
                  </div>

                  {/* 2. BULK SHIFT OPERATIONS */}
                  <div className="border border-orange-200 rounded-lg p-6 bg-orange-50">
                    <h4 className="text-lg font-medium text-orange-900 mb-4 flex items-center">
                      <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">2</span>
                      Bulk Shift Operations
                    </h4>
                    
                    {/* Apply Template Option */}
                    <div className="mb-6 p-4 border border-orange-300 rounded-md bg-white">
                      <h5 className="font-medium text-gray-900 mb-3">Apply Shift Template</h5>
                      <div className="flex items-center space-x-4">
                        <select 
                          id="bulk-template"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Choose a template...</option>
                          <option value="standard">Standard Day (7:50-10, 10-12, 12-2, 2-5)</option>
                          <option value="extended">Extended Day (6:30-8:30, 8:30-10:30, 10:30-12:45, 12:45-3, 3-Close)</option>
                          <option value="allday">All Day Shift</option>
                        </select>
                        <button
                          onClick={handleBulkTemplateApplication}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-md font-medium"
                        >
                          Apply Template
                        </button>
                      </div>
                    </div>
                    
                    {/* Create Custom Shift Option */}
                    <div className="p-4 border border-orange-300 rounded-md bg-white">
                      <h5 className="font-medium text-gray-900 mb-3">Create Custom Shift</h5>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Shift Name
                          </label>
                          <input
                            id="bulk-shift-name"
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., Morning"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Time
                          </label>
                          <input
                            id="bulk-shift-start"
                            type="time"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Time
                          </label>
                          <input
                            id="bulk-shift-end"
                            type="time"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <div className="flex items-center h-10">
                            <input
                              id="bulk-shift-allday"
                              type="checkbox"
                              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                            <label htmlFor="bulk-shift-allday" className="ml-2 text-sm text-gray-900">
                              All Day
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={handleBulkCustomShiftCreation}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-md font-medium"
                        >
                          {isSubmitting ? 'Creating...' : `Create Shift for ${selectedPositions.size} Positions`}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. COMBINED SHIFT + OVERSIGHT (FB-012) */}
                  <div className="border border-purple-200 rounded-lg p-6 bg-purple-50">
                    <h4 className="text-lg font-medium text-purple-900 mb-4 flex items-center">
                      <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">3</span>
                      Combined: Create Shift + Assign Oversight
                    </h4>
                    <p className="text-sm text-purple-700 mb-4">Create a shift AND assign oversight in one operation (FB-012)</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Shift Details */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900">Shift Details</h5>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name</label>
                          <input
                            id="combined-shift-name"
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., Morning"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                            <input
                              id="combined-shift-start"
                              type="time"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                            <input
                              id="combined-shift-end"
                              type="time"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="combined-shift-allday"
                            type="checkbox"
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="combined-shift-allday" className="ml-2 text-sm text-gray-900">All Day</label>
                        </div>
                      </div>
                      
                      {/* Oversight Assignment */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900">Oversight Assignment</h5>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Overseer</label>
                          <select
                            id="combined-overseer"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">No Overseer</option>
                            {attendants.filter(att => 
                              att.isActive && 
                              Array.isArray(att.formsOfService) && 
                              att.formsOfService.some(form => form.toLowerCase().includes('overseer'))
                            ).map(overseer => (
                              <option key={overseer.id} value={overseer.id}>
                                {overseer.firstName} {overseer.lastName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Keyman</label>
                          <select
                            id="combined-keyman"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">No Keyman</option>
                            {attendants.filter(att => 
                              att.isActive && 
                              Array.isArray(att.formsOfService) && 
                              att.formsOfService.some(form => form.toLowerCase().includes('keyman'))
                            ).map(keyman => (
                              <option key={keyman.id} value={keyman.id}>
                                {keyman.firstName} {keyman.lastName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleCombinedShiftAndOversight}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-md font-medium"
                      >
                        {isSubmitting ? 'Processing...' : `Apply to ${selectedPositions.size} Positions`}
                      </button>
                    </div>
                  </div>

                  {/* 4. BULK OVERSIGHT ASSIGNMENT */}
                  <div className="border border-green-200 rounded-lg p-6 bg-green-50">
                    <h4 className="text-lg font-medium text-green-900 mb-4 flex items-center">
                      <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">4</span>
                      Bulk Oversight Assignment (Separate)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign Overseer
                        </label>
                        <select 
                          id="bulk-overseer"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">No change</option>
                          {attendants?.filter(att => att.isActive && Array.isArray(att.formsOfService) && att.formsOfService.some(form => form.toLowerCase() === 'overseer')).map(attendant => (
                            <option key={attendant.id} value={attendant.id}>
                              {attendant.firstName} {attendant.lastName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign Keyman
                        </label>
                        <select 
                          id="bulk-keyman"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">No change</option>
                          {attendants?.filter(att => att.isActive && Array.isArray(att.formsOfService) && att.formsOfService.some(form => form.toLowerCase() === 'keyman')).map(attendant => (
                            <option key={attendant.id} value={attendant.id}>
                              {attendant.firstName} {attendant.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md">
                      <p className="text-sm text-green-800">
                        ✅ <strong>No shift dependency required</strong> - Oversight can be assigned independently of shifts
                      </p>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleBulkOversightAssignment}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md font-medium"
                      >
                        {isSubmitting ? 'Assigning...' : `Assign Oversight to ${selectedPositions.size} Positions`}
                      </button>
                    </div>
                  </div>
                  
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowBulkEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shift Template Application Modal */}
        {showTemplateModal && selectedPositions.size > 0 && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Apply Shift Template to {selectedPositions.size} Position(s)
                </h3>
                
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const templateType = formData.get('templateType') as string
                  
                  if (!templateType) {
                    alert('Please select a template')
                    return
                  }
                  
                  try {
                    setIsSubmitting(true)
                    
                    const success = await positionService.applyShiftTemplate({
                      positionIds: Array.from(selectedPositions),
                      shiftTemplateId: templateType
                    })
                    
                    if (success) {
                      setShowTemplateModal(false)
                      setSelectedPositions(new Set())
                      router.reload()
                    } else {
                      alert('Failed to apply template')
                    }
                  } catch (error) {
                    console.error('Error applying template:', error)
                    alert('Failed to apply template')
                  } finally {
                    setIsSubmitting(false)
                  }
                }}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Shift Template
                    </label>
                    <select 
                      name="templateType"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Choose a template...</option>
                      <option value="standard">
                        Standard Day (7:50-10, 10-12, 12-2, 2-5)
                      </option>
                      <option value="extended">
                        Extended Day (6:30-8:30, 8:30-10:30, 10:30-12:45, 12:45-3, 3-Close)
                      </option>
                    </select>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> This will create shifts for all selected positions. 
                      Existing shifts will not be affected.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTemplateModal(false)
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md"
                    >
                      {isSubmitting ? 'Applying...' : 'Apply Template'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Progress Modal */}
        {showProgressModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-8 border w-11/12 md:w-2/3 lg:w-1/2 shadow-2xl rounded-xl bg-white">
              <div className="text-center">
                <div className="mb-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">🚀 Smart Auto-Assignment in Progress</h3>
                  <p className="text-gray-600">Intelligently matching attendants to positions with oversight awareness</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{assignmentProgress.phase}</span>
                    <span className="text-sm text-gray-500">
                      {assignmentProgress.current} / {assignmentProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${assignmentProgress.total > 0 ? (assignmentProgress.current / assignmentProgress.total) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Assignment Feed */}
                {assignmentProgress.assignments.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Assignments</h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      {assignmentProgress.assignments.slice(-5).map((assignment, index) => (
                        <div key={index} className="text-sm text-gray-700 mb-1 flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          <span>{String(assignment)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Message */}
                {assignmentProgress.message && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">{assignmentProgress.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Available Volunteers Modal */}
        {showAvailableAttendants && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto border w-full max-w-2xl shadow-2xl rounded-xl bg-white">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">Available Volunteers</h3>
                  <button
                    onClick={() => setShowAvailableAttendants(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  These attendants are active and not currently assigned to any positions or serving in oversight roles (overseers/keymen).
                </p>

                {(() => {
                  const availableAttendants = getUnassignedAttendants()

                  if (availableAttendants.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl mb-2 block">🎉</span>
                        <p>All attendants are currently assigned!</p>
                      </div>
                    )
                  }

                  return (
                    <div className="max-h-96 overflow-y-auto">
                      <div className="space-y-2">
                        {availableAttendants.map((attendant, index) => (
                          <div
                            key={attendant.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {attendant.firstName} {attendant.lastName}
                                </p>
                                {attendant.congregation && (
                                  <p className="text-sm text-gray-500">{attendant.congregation}</p>
                                )}
                              </div>
                            </div>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Available
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowAvailableAttendants(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EventPageWrapper>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const timestamp = new Date().toISOString()
  
  try {
    const session = await getServerSession(context.req, context.res, authOptions)
  
    if (!session) {
      return {
        redirect: {
          destination: '/auth/signin',
        },
      }
    }

    // CRITICAL: Block attendants from accessing admin pages
    if (session.user?.role === 'VOLUNTEER') {
      return {
        redirect: {
          destination: '/volunteer/dashboard',
          permanent: false,
        },
      }
    }

    // Only ADMIN, OVERSEER, ASSISTANT_OVERSEER, KEYMAN can access
    if (!['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER', 'KEYMAN'].includes(session.user?.role || '')) {
      return {
        redirect: {
          destination: '/auth/signin',
          permanent: false,
        },
      }
    }

    const canManage = session.user?.role === 'ADMIN' || session.user?.role === 'OVERSEER'

    // Check event-specific permissions
    const { canManageEvent, canDeleteEvent, canManagePermissions } = await import('../../../src/lib/eventAccess')
    const sessionUserId = session.user?.id || ''
    const canEdit = await canManageEvent(sessionUserId, context.params!.id as string)
    const canDelete = await canDeleteEvent(sessionUserId, context.params!.id as string)
    const canManagePerms = await canManagePermissions(sessionUserId, context.params!.id as string)

    // APEX GUARDIAN: Full SSR data fetching for positions tab
    const { id } = context.params!
    
    const { prisma } = await import('../../../src/lib/prisma')
    
    // Fetch event with positions data
    const eventData = await prisma.events.findUnique({
      where: { id: id as string },
      include: {
        departmentTemplate: {
          select: {
            id: true,
            name: true,
            moduleConfig: true,
            terminology: true,
            positionTemplates: true
          }
        },
        positions: {
          include: {
            assignments: {
              include: {
                volunteer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                },
                overseer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                },
                keyman: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                },
                shift: {
                  select: {
                    id: true,
                    name: true,
                    startTime: true,
                    endTime: true,
                    isAllDay: true
                  }
                }
              }
            },
            shifts: true
          },
          orderBy: [
            { positionNumber: 'asc' }
          ]
        }
      }
    })

    // Fetch attendants for overseer assignment from attendants table
    // APEX GUARDIAN: Manually fetch oversight data since relation has TypeScript issues
    const oversightData = await (prisma as any).position_oversight_assignments.findMany({
      where: { eventId: id as string },
      include: {
        overseer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        keyman: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Attach oversight data to positions and rename position_assignments to assignments for client compatibility
    const positionsWithOversight = (eventData as any)!.positions.map((position: any) => {
      const positionOversight = oversightData
        .filter((oversight: any) => oversight.positionId === position.id)
        .map((oversight: any) => ({
          id: oversight.id,
          overseer: oversight.overseer,
          keyman: oversight.keyman
        }))
      
      // Assignments and shifts are already correctly named from the schema
      return {
        ...position,
        oversight: positionOversight
      }
    })

    
    // Get all active attendants with their user role
    const allAttendants = await prisma.volunteers.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        formsOfService: true,
        congregation: true,
        isActive: true,
        user: {
          select: {
            role: true
          }
        }
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })

    // Get event-attendant associations for oversight assignments (SOURCE OF TRUTH)
    const eventAssociations = await prisma.event_volunteers.findMany({
      where: {
        eventId: id as string
      },
      include: {
        overseer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        keyman: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Create oversight map for quick lookup
    const oversightMap = new Map();
    eventAssociations.forEach(assoc => {
      if (assoc.volunteerId) {
        oversightMap.set(assoc.volunteerId, assoc)
      }
    })

    // Merge attendants with their event-specific oversight assignments
    const attendantsData = allAttendants.map(attendant => {
      const association = oversightMap.get(attendant.id)
      return {
        ...attendant,
        overseerId: association?.overseerId || null,
        keymanId: association?.keymanId || null,
        overseer: association?.overseer || null,
        keyman: association?.keyman || null
      }
    })

    const attendantsWithOversight = attendantsData.filter(att => att.overseerId)
    
    if (!eventData) {
      return { notFound: true }
    }

    // Transform event data
    const event = {
      id: eventData.id,
      name: eventData.name,
      eventType: eventData.eventType,
      startDate: eventData.startDate?.toISOString() || null,
      endDate: eventData.endDate?.toISOString() || null,
      status: eventData.status,
      departmentTemplate: eventData.departmentTemplate ? {
        id: eventData.departmentTemplate.id,
        name: eventData.departmentTemplate.name,
        moduleConfig: eventData.departmentTemplate.moduleConfig,
        terminology: eventData.departmentTemplate.terminology,
        positionTemplates: eventData.departmentTemplate.positionTemplates
      } : null
    }

    // Transform positions data - REMOVED: Using positionsWithOversight directly instead
    // This code was causing crashes because eventData.positions typing issue

    // APEX GUARDIAN: Debug positions data loading
    const positionsWithOversightData = positionsWithOversight.filter((p: any) => p.oversight && p.oversight.length > 0)
    positionsWithOversightData.forEach((p: any) => {
    })

    // Check event-specific permissions
    const { canManageAttendants } = await import('../../../src/lib/eventAccess')
    const userId = session.user?.id || ''
    const canManageContent = await canManageAttendants(userId, id as string)

       return {
      props: {
        eventId: id as string,
        event,
        positions: positionsWithOversight,
        attendants: attendantsData,
        stats: {
          total: positionsWithOversight.length,
          active: positionsWithOversight.filter((p: any) => p.isActive).length,
          assigned: positionsWithOversight.filter((p: any) => p.assignments && p.assignments.length > 0).length
        },
        canManageContent,
        canEdit,
        canDelete,
        canManagePermissions: canManagePerms,
        moduleConfig: eventData.departmentTemplate?.moduleConfig || null,
        terminology: eventData.departmentTemplate?.terminology || null,
        positionTemplates: eventData.departmentTemplate?.positionTemplates || null,
        departmentTemplateName: eventData.departmentTemplate?.name || undefined
      }
    }

  } catch (error) {
    console.error('Error fetching event data:', error)
    return {
      notFound: true
    }
  }
}
