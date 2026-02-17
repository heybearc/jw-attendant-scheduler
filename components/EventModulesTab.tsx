import { useState } from 'react'

interface ModuleConfig {
  countTimes: boolean
  lanyards: boolean
  ivsModule: boolean
  positions: boolean
  documents: boolean
  announcements: boolean
}

interface TerminologyConfig {
  volunteer: string
  position: string
  shift: string
  assignment: string
}

interface EventModulesTabProps {
  modules: ModuleConfig
  terminology: TerminologyConfig
  onChange: (modules: ModuleConfig, terminology: TerminologyConfig) => void
}

const DEFAULT_MODULES: ModuleConfig = {
  countTimes: true,
  lanyards: true,
  ivsModule: false,
  positions: true,
  documents: true,
  announcements: true
}

const DEFAULT_TERMINOLOGY: TerminologyConfig = {
  volunteer: 'Volunteer',
  position: 'Position',
  shift: 'Shift',
  assignment: 'Assignment'
}

export default function EventModulesTab({ modules, terminology, onChange }: EventModulesTabProps) {
  const [localModules, setLocalModules] = useState<ModuleConfig>(modules || DEFAULT_MODULES)
  const [localTerminology, setLocalTerminology] = useState<TerminologyConfig>(terminology || DEFAULT_TERMINOLOGY)

  const handleModuleToggle = (moduleName: keyof ModuleConfig) => {
    const updated = { ...localModules, [moduleName]: !localModules[moduleName] }
    setLocalModules(updated)
    onChange(updated, localTerminology)
  }

  const handleTerminologyChange = (field: keyof TerminologyConfig, value: string) => {
    const updated = { ...localTerminology, [field]: value }
    setLocalTerminology(updated)
    onChange(localModules, updated)
  }

  const resetToDefaults = () => {
    setLocalModules(DEFAULT_MODULES)
    setLocalTerminology(DEFAULT_TERMINOLOGY)
    onChange(DEFAULT_MODULES, DEFAULT_TERMINOLOGY)
  }

  return (
    <div className="space-y-8">
      {/* Module Toggles Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Module Toggles</h3>
            <p className="text-sm text-gray-600 mt-1">
              Enable or disable features for this event
            </p>
          </div>
          <button
            type="button"
            onClick={resetToDefaults}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Reset to Defaults
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          {/* Count Times */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localModules.countTimes}
                  onChange={() => handleModuleToggle('countTimes')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Count Times</span>
                  <span className="block text-sm text-gray-500">
                    Track attendance counts per session
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Lanyards */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localModules.lanyards}
                  onChange={() => handleModuleToggle('lanyards')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Lanyards</span>
                  <span className="block text-sm text-gray-500">
                    Generate and manage volunteer lanyards
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* IVS Module */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localModules.ivsModule}
                  onChange={() => handleModuleToggle('ivsModule')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-900">IVS Module</span>
                  <span className="block text-sm text-gray-500">
                    International Volunteer Services management
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Positions */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localModules.positions}
                  onChange={() => handleModuleToggle('positions')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Positions</span>
                  <span className="block text-sm text-gray-500">
                    Manage positions and assignments
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Documents */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localModules.documents}
                  onChange={() => handleModuleToggle('documents')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Documents</span>
                  <span className="block text-sm text-gray-500">
                    Share documents with volunteers
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Announcements */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localModules.announcements}
                  onChange={() => handleModuleToggle('announcements')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Announcements</span>
                  <span className="block text-sm text-gray-500">
                    Post announcements for volunteers
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Terminology Overrides Section */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Terminology Overrides</h3>
          <p className="text-sm text-gray-600 mt-1">
            Customize terminology used throughout this event
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Volunteer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volunteer
              </label>
              <input
                type="text"
                value={localTerminology.volunteer}
                onChange={(e) => handleTerminologyChange('volunteer', e.target.value)}
                placeholder="Volunteer"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: "Volunteer" (e.g., "Attendant", "Worker")
              </p>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <input
                type="text"
                value={localTerminology.position}
                onChange={(e) => handleTerminologyChange('position', e.target.value)}
                placeholder="Position"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: "Position" (e.g., "Role", "Post")
              </p>
            </div>

            {/* Shift */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift
              </label>
              <input
                type="text"
                value={localTerminology.shift}
                onChange={(e) => handleTerminologyChange('shift', e.target.value)}
                placeholder="Shift"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: "Shift" (e.g., "Time Slot", "Period")
              </p>
            </div>

            {/* Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignment
              </label>
              <input
                type="text"
                value={localTerminology.assignment}
                onChange={(e) => handleTerminologyChange('assignment', e.target.value)}
                placeholder="Assignment"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: "Assignment" (e.g., "Duty", "Task")
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Terminology changes will be reflected throughout the event interface,
              including pages, emails, and volunteer dashboards.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
