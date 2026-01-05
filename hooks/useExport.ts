import { useState } from 'react'
import { exportService } from '../lib/exportService'

interface Position {
  id: string
  positionNumber: number
  name: string
  area?: string
  description?: string
  isActive: boolean
  shifts?: any[]
  assignments?: any[]
  positionOversight?: any[]
}

interface UseExportProps {
  eventId: string
  eventName: string
  positions: Position[]
  overseerFilter?: string | null
}

interface UseExportReturn {
  isExporting: boolean
  handleExportPDF: () => Promise<void>
  handleExportExcel: () => Promise<void>
}

export function useExport({ 
  eventId, 
  eventName, 
  positions,
  overseerFilter 
}: UseExportProps): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      await exportService.exportAndDownloadPDF({
        eventId,
        eventName,
        positions,
        overseerFilter: overseerFilter !== 'all' ? overseerFilter : null
      })
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await exportService.exportAndDownloadExcel({
        eventId,
        eventName,
        positions,
        overseerFilter: overseerFilter !== 'all' ? overseerFilter : null
      })
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export Excel')
    } finally {
      setIsExporting(false)
    }
  }

  return {
    isExporting,
    handleExportPDF,
    handleExportExcel
  }
}
