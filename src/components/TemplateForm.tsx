import { useState, useEffect } from 'react'
import { notifyAlert, toast } from '../../lib/ui/toast'

/**
 * Phase 4C: Assignment Template Form Component
 * Reusable form for creating and editing assignment templates
 */

interface TemplateAssignment {
  positionNumber: number
  positionName: string
  area?: string
  shiftStart: string
  shiftEnd: string
  requiredCount: number
  role?: string
  notes?: string
}

interface TemplateFormData {
  name: string
  description: string
  eventType: string
  isActive: boolean
  template_assignments: TemplateAssignment[]
}

interface TemplateFormProps {
  initialData?: TemplateFormData
  onSubmit: (data: TemplateFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export default function TemplateForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Template'
}: TemplateFormProps) {
  const [formData, setFormData] = useState<TemplateFormData>(
    initialData || {
      name: '',
      description: '',
      eventType: 'Convention',
      isActive: true,
      template_assignments: []
    }
  )
  const [submitting, setSubmitting] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<number | null>(null)
  const [newAssignment, setNewAssignment] = useState<TemplateAssignment>({
    positionNumber: 1,
    positionName: '',
    area: '',
    shiftStart: '08:00',
    shiftEnd: '12:00',
    requiredCount: 1,
    role: '',
    notes: ''
  })

  const eventTypes = [
    'Convention',
    'Circuit Assembly',
    'Memorial',
    'Regional Convention',
    'Special Event'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      notifyAlert('Template name is required')
      return
    }

    if (formData.template_assignments.length === 0) {
      notifyAlert('At least one position assignment is required')
      return
    }

    try {
      setSubmitting(true)
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
      notifyAlert('Failed to save template')
    } finally {
      setSubmitting(false)
    }
  }

  const addAssignment = () => {
    if (!newAssignment.positionName.trim()) {
      notifyAlert('Position name is required')
      return
    }

    setFormData({
      ...formData,
      template_assignments: [...formData.template_assignments, { ...newAssignment }]
    })

    setNewAssignment({
      positionNumber: formData.template_assignments.length + 2,
      positionName: '',
      area: '',
      shiftStart: '08:00',
      shiftEnd: '12:00',
      requiredCount: 1,
      role: '',
      notes: ''
    })
  }

  const updateAssignment = (index: number, field: keyof TemplateAssignment, value: any) => {
    const updated = [...formData.template_assignments]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, template_assignments: updated })
  }

  const removeAssignment = (index: number) => {
    setFormData({
      ...formData,
      template_assignments: formData.template_assignments.filter((_, i) => i !== index)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Details</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Standard Convention Setup"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe when to use this template..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type *
              </label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Position Assignments */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Position Assignments ({formData.template_assignments.length})
        </h3>

        {/* Existing Assignments */}
        {formData.template_assignments.length > 0 && (
          <div className="space-y-3 mb-6">
            {formData.template_assignments.map((assignment, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                {editingAssignment === index ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Position Number
                        </label>
                        <input
                          type="number"
                          value={assignment.positionNumber}
                          onChange={(e) => updateAssignment(index, 'positionNumber', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Position Name
                        </label>
                        <input
                          type="text"
                          value={assignment.positionName}
                          onChange={(e) => updateAssignment(index, 'positionName', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Shift Start
                        </label>
                        <input
                          type="time"
                          value={assignment.shiftStart}
                          onChange={(e) => updateAssignment(index, 'shiftStart', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Shift End
                        </label>
                        <input
                          type="time"
                          value={assignment.shiftEnd}
                          onChange={(e) => updateAssignment(index, 'shiftEnd', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Required Count
                        </label>
                        <input
                          type="number"
                          value={assignment.requiredCount}
                          onChange={(e) => updateAssignment(index, 'requiredCount', parseInt(e.target.value))}
                          min="1"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Area (Optional)
                      </label>
                      <input
                        type="text"
                        value={assignment.area || ''}
                        onChange={(e) => updateAssignment(index, 'area', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={assignment.notes || ''}
                        onChange={(e) => updateAssignment(index, 'notes', e.target.value)}
                        rows={2}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingAssignment(null)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        #{assignment.positionNumber} - {assignment.positionName}
                      </p>
                      {assignment.area && (
                        <p className="text-sm text-gray-600">Area: {assignment.area}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        🕐 {assignment.shiftStart} - {assignment.shiftEnd}
                      </p>
                      {assignment.notes && (
                        <p className="text-sm text-gray-500 mt-1 italic">
                          Note: {assignment.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {assignment.requiredCount} {assignment.requiredCount === 1 ? 'person' : 'people'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingAssignment(index)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAssignment(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add New Assignment */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Position</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Position Number
                </label>
                <input
                  type="number"
                  value={newAssignment.positionNumber}
                  onChange={(e) => setNewAssignment({ ...newAssignment, positionNumber: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Position Name *
                </label>
                <input
                  type="text"
                  value={newAssignment.positionName}
                  onChange={(e) => setNewAssignment({ ...newAssignment, positionName: e.target.value })}
                  placeholder="e.g., Attendant - Main Entrance"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Shift Start
                </label>
                <input
                  type="time"
                  value={newAssignment.shiftStart}
                  onChange={(e) => setNewAssignment({ ...newAssignment, shiftStart: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Shift End
                </label>
                <input
                  type="time"
                  value={newAssignment.shiftEnd}
                  onChange={(e) => setNewAssignment({ ...newAssignment, shiftEnd: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Required Count
                </label>
                <input
                  type="number"
                  value={newAssignment.requiredCount}
                  onChange={(e) => setNewAssignment({ ...newAssignment, requiredCount: parseInt(e.target.value) })}
                  min="1"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Area (Optional)
              </label>
              <input
                type="text"
                value={newAssignment.area || ''}
                onChange={(e) => setNewAssignment({ ...newAssignment, area: e.target.value })}
                placeholder="e.g., Lobby, Parking Lot"
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={addAssignment}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              + Add Position
            </button>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
