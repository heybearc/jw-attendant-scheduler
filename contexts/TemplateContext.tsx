import { createContext, useContext, ReactNode } from 'react'

export interface ModuleConfig {
  countTimes: boolean
  lanyards: boolean
  ivsModule: boolean
  positions: boolean
  documents: boolean
  announcements: boolean
  customFields?: any[]
}

export interface Terminology {
  volunteer?: string
  position?: string
  shift?: string
  assignment?: string
}

interface TemplateContextValue {
  moduleConfig: ModuleConfig | null
  terminology: Terminology | null
}

const TemplateContext = createContext<TemplateContextValue | undefined>(undefined)

interface TemplateProviderProps {
  children: ReactNode
  moduleConfig?: ModuleConfig | null
  terminology?: Terminology | null
  eventModuleOverrides?: Record<string, boolean> | null
}

export function TemplateProvider({
  children,
  moduleConfig = null,
  terminology = null,
  eventModuleOverrides = null
}: TemplateProviderProps) {
  const mergedModuleConfig = moduleConfig ? {
    ...moduleConfig,
    ...(eventModuleOverrides || {})
  } : null

  return (
    <TemplateContext.Provider
      value={{
        moduleConfig: mergedModuleConfig,
        terminology
      }}
    >
      {children}
    </TemplateContext.Provider>
  )
}

export function useTemplateContext() {
  const context = useContext(TemplateContext)
  if (context === undefined) {
    throw new Error('useTemplateContext must be used within a TemplateProvider')
  }
  return context
}

export function useModuleConfig() {
  const { moduleConfig } = useTemplateContext()
  return moduleConfig
}

export function useTerminology() {
  const { terminology } = useTemplateContext()
  
  // Default terminology uses "Volunteer" (neutral/generic)
  // Only the Attendants template should override to "Attendant"
  const getLabel = (key: keyof Terminology, defaultLabel: string): string => {
    return terminology?.[key] || defaultLabel
  }
  
  return {
    volunteer: getLabel('volunteer', 'Volunteer'),
    position: getLabel('position', 'Position'),
    shift: getLabel('shift', 'Shift'),
    assignment: getLabel('assignment', 'Assignment'),
    getLabel
  }
}

export function useIsModuleEnabled(moduleName: keyof ModuleConfig): boolean {
  const moduleConfig = useModuleConfig()
  
  if (!moduleConfig) {
    return true
  }
  
  return moduleConfig[moduleName] === true
}
