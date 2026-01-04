import { useState } from 'react'
import { PositionTemplate } from '../types/departmentTemplate'

interface PositionTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  templates: PositionTemplate[]
  departmentName: string
  eventId: string
  onSuccess: () => void
}

export default function PositionTemplateModal({
  isOpen,
  onClose,
  templates,
  departmentName,
  eventId,
  onSuccess
}: PositionTemplateModalProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set())
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const toggleTemplate = (templateId: string) => {
    const newSelected = new Set(selectedTemplates)
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId)
    } else {
      newSelected.add(templateId)
    }
    setSelectedTemplates(newSelected)
  }

  const selectAll = () => {
    setSelectedTemplates(new Set(templates.map(t => t.id)))
  }

  const deselectAll = () => {
    setSelectedTemplates(new Set())
  }

  const handleCreate = async () => {
    if (selectedTemplates.size === 0) {
      setError('Please select at least one position template')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      // Get the next available position number
      const positionsResponse = await fetch(`/api/events/${eventId}/positions`)
      const positionsData = await positionsResponse.json()
      const existingPositions = positionsData.data || []
      const maxPositionNumber = existingPositions.length > 0
        ? Math.max(...existingPositions.map((p: any) => p.positionNumber))
        : 0

      // Create positions from selected templates
      const templatesToCreate = templates
        .filter(t => selectedTemplates.has(t.id))
        .sort((a, b) => a.sortOrder - b.sortOrder)

      const createdPositions = []
      for (let i = 0; i < templatesToCreate.length; i++) {
        const template = templatesToCreate[i]
        const positionNumber = maxPositionNumber + i + 1

        const response = await fetch(`/api/events/${eventId}/positions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            positionNumber,
            name: template.name,
            description: template.description || '',
            area: departmentName,
            capacity: template.capacity
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to create position: ${template.name}`)
        }

        const result = await response.json()
        createdPositions.push(result.data)
      }

      alert(`✅ Successfully created ${createdPositions.length} position(s) from template!`)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create positions from template')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">📋 Create Positions from Template</h2>
          <p className="text-blue-100 mt-1">
            {departmentName} Department • {templates.length} position template(s) available
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Select the positions you want to create for this event:
            </p>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={deselectAll}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Template List */}
          <div className="space-y-2 mb-6">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => toggleTemplate(template.id)}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTemplates.has(template.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={selectedTemplates.has(template.id)}
                    onChange={() => toggleTemplate(template.id)}
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      {template.capacity && (
                        <span className="text-sm text-gray-500">
                          Capacity: {template.capacity}
                        </span>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {selectedTemplates.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                <strong>{selectedTemplates.size}</strong> position(s) will be created
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || selectedTemplates.size === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Creating...
              </>
            ) : (
              `Create ${selectedTemplates.size} Position(s)`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
