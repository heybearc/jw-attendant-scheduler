import { ReactNode } from 'react'
import EventPageLayout from './EventPageLayout'
import { TemplateProvider } from '../contexts/TemplateContext'

interface EventPageWrapperProps {
  children: ReactNode
  event: {
    id: string
    name: string
    status: string
    eventType?: string
    startDate?: string
  }
  currentPage: 'overview' | 'positions' | 'volunteers' | 'count-times' | 'lanyards' | 'ivs' | 'documents' | 'announcements' | 'permissions' | 'edit'
  canEdit?: boolean
  canDelete?: boolean
  canManagePermissions?: boolean
  onStatusChange?: (status: string) => void
  onExport?: () => void
  moduleConfig?: any
  terminology?: any
}

/**
 * EventPageWrapper - Modular wrapper component for event pages
 * 
 * This component provides a consistent layout for all event-related pages
 * without requiring changes to the page implementation.
 * 
 * Usage:
 * ```tsx
 * <EventPageWrapper event={event} currentPage="volunteers" canEdit={canEdit}>
 *   {/* Your existing page content *\/}
 * </EventPageWrapper>
 * ```
 */
export default function EventPageWrapper({
  children,
  event,
  currentPage,
  canEdit = false,
  canDelete = false,
  canManagePermissions = false,
  onStatusChange,
  onExport,
  moduleConfig = null,
  terminology = null
}: EventPageWrapperProps) {
  return (
    <TemplateProvider
      moduleConfig={moduleConfig}
      terminology={terminology}
    >
      <EventPageLayout
        event={event}
        currentPage={currentPage}
        canEdit={canEdit}
        canDelete={canDelete}
        canManagePermissions={canManagePermissions}
        onStatusChange={onStatusChange}
        onExport={onExport}
      >
        {children}
      </EventPageLayout>
    </TemplateProvider>
  )
}
