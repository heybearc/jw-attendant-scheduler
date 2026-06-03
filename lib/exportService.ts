import { notifyAlert, toast } from '../lib/ui/toast'

/**
 * Export Service for Theoshift
 * Centralized export operations for PDF and Excel
 * 
 * Extracted from positions.tsx as part of gradual refactoring (Week 1, Step 4)
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Position {
  id: string
  positionNumber: number
  name: string
  area?: string
  isActive: boolean
  shifts?: any[]
  assignments?: any[]
  oversight?: any[]
}

export interface ExportOptions {
  eventId: string
  eventName: string
  positions: Position[]
  overseerFilter?: string | null
}

export interface ExportResult {
  success: boolean
  blob?: Blob
  error?: string
}

// ============================================================================
// EXPORT SERVICE CLASS
// ============================================================================

export class ExportService {
  /**
   * Export positions to PDF
   */
  async exportToPDF(options: ExportOptions): Promise<ExportResult> {
    try {
      const response = await fetch('/api/export/positions-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to export PDF'
        }
      }

      const blob = await response.blob()
      return {
        success: true,
        blob
      }
    } catch (error) {
      console.error('PDF export error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Export positions to Excel
   */
  async exportToExcel(options: ExportOptions): Promise<ExportResult> {
    try {
      const response = await fetch('/api/export/positions-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to export Excel'
        }
      }

      const blob = await response.blob()
      return {
        success: true,
        blob
      }
    } catch (error) {
      console.error('Excel export error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Download a blob as a file
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  /**
   * Generate filename for export
   */
  generateFilename(eventName: string, extension: 'pdf' | 'xlsx'): string {
    const sanitizedName = eventName.replace(/\s+/g, '-')
    const date = new Date().toISOString().split('T')[0]
    return `positions-${sanitizedName}-${date}.${extension}`
  }

  /**
   * Export positions to PDF and download
   */
  async exportAndDownloadPDF(options: ExportOptions): Promise<boolean> {
    const result = await this.exportToPDF(options)
    
    if (!result.success || !result.blob) {
      notifyAlert(result.error || 'Failed to export PDF')
      return false
    }

    const filename = this.generateFilename(options.eventName, 'pdf')
    this.downloadBlob(result.blob, filename)
    return true
  }

  /**
   * Export positions to Excel and download
   */
  async exportAndDownloadExcel(options: ExportOptions): Promise<boolean> {
    const result = await this.exportToExcel(options)
    
    if (!result.success || !result.blob) {
      notifyAlert(result.error || 'Failed to export Excel')
      return false
    }

    const filename = this.generateFilename(options.eventName, 'xlsx')
    this.downloadBlob(result.blob, filename)
    return true
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create an ExportService instance
 */
export function createExportService(): ExportService {
  return new ExportService()
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton export service instance
 */
export const exportService = new ExportService()
