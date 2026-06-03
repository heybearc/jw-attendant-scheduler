import { useState } from 'react'
import { useRouter } from 'next/router'
import { createPositionService } from '../lib/positionService'
import { notifyAlert, toast } from '../lib/ui/toast'

interface Position {
  id: string
  name: string
}

interface OverseerFormData {
  overseerId: string
  keymanId: string
  responsibilities: string
}

interface UseOversightProps {
  eventId: string
}

interface UseOversightReturn {
  showOverseerModal: boolean
  setShowOverseerModal: (show: boolean) => void
  overseerFormData: OverseerFormData
  setOverseerFormData: (data: OverseerFormData) => void
  handleOverseerSubmit: (e: React.FormEvent, position: Position | null) => Promise<void>
}

export function useOversight({ eventId }: UseOversightProps): UseOversightReturn {
  const router = useRouter()
  const positionService = createPositionService(eventId)
  
  const [showOverseerModal, setShowOverseerModal] = useState(false)
  const [overseerFormData, setOverseerFormData] = useState<OverseerFormData>({
    overseerId: '',
    keymanId: '',
    responsibilities: ''
  })

  const handleOverseerSubmit = async (e: React.FormEvent, position: Position | null) => {
    e.preventDefault()
    
    if (!position) return
    
    try {
      const success = await positionService.assignOversight(position.id, {
        overseerId: overseerFormData.overseerId,
        keymanId: overseerFormData.keymanId || undefined,
        responsibilities: overseerFormData.responsibilities || undefined
      })

      if (success) {
        notifyAlert('✅ Overseer assigned successfully')
        setShowOverseerModal(false)
        setOverseerFormData({ overseerId: '', keymanId: '', responsibilities: '' })
        router.reload()
      } else {
        notifyAlert('Failed to assign overseer')
      }
    } catch (error) {
      console.error('Error assigning overseer:', error)
      notifyAlert('Failed to assign overseer')
    }
  }

  return {
    showOverseerModal,
    setShowOverseerModal,
    overseerFormData,
    setOverseerFormData,
    handleOverseerSubmit
  }
}
