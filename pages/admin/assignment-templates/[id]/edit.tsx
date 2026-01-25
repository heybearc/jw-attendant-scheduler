import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../api/auth/[...nextauth]'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import TemplateForm from '../../../../src/components/TemplateForm'

/**
 * Phase 4C: Assignment Template Edit Page
 * Edit existing assignment templates
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

export default function EditTemplatePage() {
  const router = useRouter()
  const { id } = router.query
  const [template, setTemplate] = useState<TemplateFormData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchTemplate()
    }
  }, [id])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/assignment-templates/${id}`)
      const data = await response.json()
      
      if (data.success) {
        setTemplate({
          name: data.template.name,
          description: data.template.description || '',
          eventType: data.template.eventType,
          isActive: data.template.isActive,
          template_assignments: data.template.template_assignments
        })
      } else {
        alert('Failed to load template')
        router.push('/admin/assignment-templates')
      }
    } catch (error) {
      console.error('Failed to fetch template:', error)
      alert('Failed to load template')
      router.push('/admin/assignment-templates')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: TemplateFormData) => {
    try {
      const response = await fetch(`/api/assignment-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Template updated successfully!')
        router.push('/admin/assignment-templates')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update template')
      }
    } catch (error) {
      console.error('Update error:', error)
      throw error
    }
  }

  const handleCancel = () => {
    router.push('/admin/assignment-templates')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading template...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Template not found</p>
          <button
            onClick={() => router.push('/admin/assignment-templates')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Return to Templates
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/assignment-templates')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Templates
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              ✏️ Edit Template
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TemplateForm
          initialData={template}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Update Template"
        />
      </div>
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
