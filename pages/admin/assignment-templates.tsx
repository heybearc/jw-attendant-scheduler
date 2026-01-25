import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

/**
 * Phase 4C Week 2: Assignment Templates Management
 * Admin interface for creating and managing assignment templates
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

interface Template {
  id: string
  name: string
  description: string
  eventType: string
  usageCount: number
  isActive: boolean
  createdAt: string
  template_assignments: TemplateAssignment[]
  users: {
    firstName: string
    lastName: string
  }
}

export default function AssignmentTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    eventType: '',
    search: '',
    isActive: 'true'
  })
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [filter])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter.eventType) params.append('eventType', filter.eventType)
      if (filter.search) params.append('search', filter.search)
      if (filter.isActive) params.append('isActive', filter.isActive)

      const response = await fetch(`/api/assignment-templates?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/assignment-templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTemplates()
      } else {
        alert('Failed to delete template')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete template')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                📋 Assignment Templates
              </h1>
            </div>
            <button
              onClick={() => router.push('/admin/assignment-templates/create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Create Template
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                value={filter.eventType}
                onChange={(e) => setFilter({ ...filter, eventType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Types</option>
                <option value="Convention">Convention</option>
                <option value="Circuit Assembly">Circuit Assembly</option>
                <option value="Memorial">Memorial</option>
                <option value="Regional Convention">Regional Convention</option>
                <option value="Special Event">Special Event</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                placeholder="Search templates..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filter.isActive}
                onChange={(e) => setFilter({ ...filter, isActive: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Templates List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">No templates found</p>
            <button
              onClick={() => router.push('/admin/assignment-templates/create')}
              className="text-blue-600 hover:text-blue-800"
            >
              Create your first template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {template.name}
                      </h3>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {template.eventType}
                      </span>
                    </div>
                    {!template.isActive && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {template.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 py-3 border-t border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Positions</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {template.template_assignments.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Times Used</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {template.usageCount}
                      </p>
                    </div>
                  </div>

                  {/* Creator */}
                  <p className="text-xs text-gray-500 mb-4">
                    Created by {template.users.firstName} {template.users.lastName}
                  </p>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => router.push(`/admin/assignment-templates/${template.id}/edit`)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Details Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedTemplate.name}
                  </h2>
                  <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
                    {selectedTemplate.eventType}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {selectedTemplate.description && (
                <p className="text-gray-700 mb-6">{selectedTemplate.description}</p>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Template Assignments ({selectedTemplate.template_assignments.length})
                </h3>
                <div className="space-y-3">
                  {selectedTemplate.template_assignments.map((assignment, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
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
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {assignment.requiredCount} {assignment.requiredCount === 1 ? 'person' : 'people'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    router.push(`/admin/assignment-templates/${selectedTemplate.id}/edit`)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false
      }
    }
  }

  const userRole = (session.user as any).role
  if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'OVERSEER') {
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    }
  }

  return {
    props: {}
  }
}
