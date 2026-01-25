import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../api/auth/[...nextauth]'
import { useRouter } from 'next/router'
import TemplateForm from '../../../src/components/TemplateForm'

/**
 * Phase 4C: Assignment Template Create Page
 * Create new assignment templates
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

export default function CreateTemplatePage() {
  const router = useRouter()

  const handleSubmit = async (formData: TemplateFormData) => {
    try {
      const response = await fetch('/api/assignment-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Template created successfully!')
        router.push('/admin/assignment-templates')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create template')
      }
    } catch (error) {
      console.error('Create error:', error)
      throw error
    }
  }

  const handleCancel = () => {
    router.push('/admin/assignment-templates')
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
              ➕ Create New Template
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TemplateForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Create Template"
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
