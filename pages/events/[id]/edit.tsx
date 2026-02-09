import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../api/auth/[...nextauth]'
import EventLayout from '../../../components/EventLayout'
import LocationSelector from '../../../components/LocationSelector'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// Helper function to format date for input[type="date"] without timezone issues
const formatDateForInput = (dateString: string): string => {
  if (!dateString) return ''
  // Parse ISO date string directly to avoid timezone conversion
  // Input: "2025-10-20T00:00:00.000Z" -> Output: "2025-10-20"
  return dateString.split('T')[0]
}

interface EventFormData {
  name: string
  description: string
  eventType: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string
  locationId: string
  capacity: string
  volunteersNeeded: string
  status: string
  departmentTemplateId: string
  // APEX GUARDIAN: Oversight Management Fields
  circuitOverseerName: string
  circuitOverseerPhone: string
  circuitOverseerEmail: string
  assemblyOverseerName: string
  assemblyOverseerPhone: string
  assemblyOverseerEmail: string
  volunteerOverseerName: string
  volunteerOverseerPhone: string
  volunteerOverseerEmail: string
  volunteerOverseerAssistants: string // JSON string for form handling
}

interface Event {
  id: string
  name: string
  description?: string
  eventType: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  location?: string
  locationId?: string
  capacity?: number
  volunteersNeeded?: number
  status: string
  departmentTemplateId?: string
  createdAt: string
  updatedAt: string
  // APEX GUARDIAN: Oversight Management Fields
  circuitOverseerName?: string
  circuitOverseerPhone?: string
  circuitOverseerEmail?: string
  assemblyOverseerName?: string
  assemblyOverseerPhone?: string
  assemblyOverseerEmail?: string
  volunteerOverseerName?: string
  volunteerOverseerPhone?: string
  volunteerOverseerEmail?: string
  volunteerOverseerAssistants?: any[] // JSONB array
}

interface DepartmentTemplate {
  id: string
  name: string
  icon: string | null
}

interface EditEventPageProps {
  event: Event
  departmentTemplates: DepartmentTemplate[]
}

export default function EditEventPage({ event, departmentTemplates }: EditEventPageProps) {
  const router = useRouter()
  const eventId = event.id
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCloneConfirm, setShowCloneConfirm] = useState(false)

  const [formData, setFormData] = useState<EventFormData>({
    name: event.name || '',
    description: event.description || '',
    eventType: event.eventType || 'CIRCUIT_ASSEMBLY',
    startDate: formatDateForInput(event.startDate),
    endDate: formatDateForInput(event.endDate),
    startTime: event.startTime || '09:30',
    endTime: event.endTime || '16:00',
    location: event.location || '',
    locationId: event.locationId || '',
    capacity: event.capacity ? event.capacity.toString() : '',
    volunteersNeeded: event.volunteersNeeded ? event.volunteersNeeded.toString() : '',
    status: event.status || 'UPCOMING',
    departmentTemplateId: event.departmentTemplateId || '',
    // APEX GUARDIAN: Oversight Management Fields
    circuitOverseerName: event.circuitOverseerName || '',
    circuitOverseerPhone: event.circuitOverseerPhone || '',
    circuitOverseerEmail: event.circuitOverseerEmail || '',
    assemblyOverseerName: event.assemblyOverseerName || '',
    assemblyOverseerPhone: event.assemblyOverseerPhone || '',
    assemblyOverseerEmail: event.assemblyOverseerEmail || '',
    volunteerOverseerName: event.volunteerOverseerName || '',
    volunteerOverseerPhone: event.volunteerOverseerPhone || '',
    volunteerOverseerEmail: event.volunteerOverseerEmail || '',
    volunteerOverseerAssistants: JSON.stringify(event.volunteerOverseerAssistants || [])
  })

  const [errors, setErrors] = useState<Partial<EventFormData>>({})
  
  // Parse assistants from JSON string for UI management
  const [assistants, setAssistants] = useState<Array<{name: string, phone: string, email: string}>>(() => {
    try {
      return JSON.parse(formData.volunteerOverseerAssistants)
    } catch {
      return []
    }
  })

  // Sync assistants array back to formData when it changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      volunteerOverseerAssistants: JSON.stringify(assistants)
    }))
  }, [assistants])

  const addAssistant = () => {
    setAssistants([...assistants, { name: '', phone: '', email: '' }])
  }

  const removeAssistant = (index: number) => {
    setAssistants(assistants.filter((_, i) => i !== index))
  }

  const updateAssistant = (index: number, field: 'name' | 'phone' | 'email', value: string) => {
    setAssistants(assistants.map((assistant, i) => 
      i === index ? { ...assistant, [field]: value } : assistant
    ))
  }

  const handleLocationChange = (locationId: string | null, locationName: string) => {
    setFormData(prev => ({
      ...prev,
      locationId: locationId || '',
      location: locationName
    }))
    
    if (errors.location) {
      setErrors(prev => ({
        ...prev,
        location: ''
      }))
    }
  }

  const handleLocationCreate = async (newLocation: any) => {
    setFormData(prev => ({
      ...prev,
      locationId: newLocation.id,
      location: newLocation.name
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }

    // Clear error for this field
    if (errors[name as keyof EventFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<EventFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required'
    }

    if (!formData.eventType) {
      newErrors.eventType = 'Event type is required'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    }

    if (!formData.location?.trim()) {
      newErrors.location = 'Location is required'
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      
      if (endDate < startDate) {
        newErrors.endDate = 'End date must be on or after start date'
      }
    }

    if (formData.capacity && parseInt(formData.capacity) <= 0) {
      newErrors.capacity = 'Capacity must be a positive number'
    }

    if (formData.volunteersNeeded && parseInt(formData.volunteersNeeded) < 0) {
      newErrors.volunteersNeeded = 'Volunteers needed cannot be negative'
    }

    if (formData.capacity && formData.volunteersNeeded) {
      const capacity = parseInt(formData.capacity)
      const volunteersNeeded = parseInt(formData.volunteersNeeded)
      
      if (volunteersNeeded > capacity) {
        newErrors.volunteersNeeded = 'Volunteers needed cannot exceed capacity'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const submitData: any = {
        name: formData.name,
        description: formData.description || undefined,
        eventType: formData.eventType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime || undefined,
        location: formData.location,
        locationId: formData.locationId || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        volunteersNeeded: formData.volunteersNeeded ? parseInt(formData.volunteersNeeded) : undefined,
        status: formData.status,
        // Note: departmentTemplateId removed - causes Prisma errors as it's a relation field
        // APEX GUARDIAN: Oversight Management Fields
        circuitOverseerName: formData.circuitOverseerName || undefined,
        circuitOverseerPhone: formData.circuitOverseerPhone || undefined,
        circuitOverseerEmail: formData.circuitOverseerEmail || undefined,
        assemblyOverseerName: formData.assemblyOverseerName || undefined,
        assemblyOverseerPhone: formData.assemblyOverseerPhone || undefined,
        assemblyOverseerEmail: formData.assemblyOverseerEmail || undefined,
        volunteerOverseerName: formData.volunteerOverseerName || undefined,
        volunteerOverseerPhone: formData.volunteerOverseerPhone || undefined,
        volunteerOverseerEmail: formData.volunteerOverseerEmail || undefined,
        volunteerOverseerAssistants: (() => {
          try {
            return formData.volunteerOverseerAssistants ? JSON.parse(formData.volunteerOverseerAssistants) : []
          } catch (e) {
            console.error('Invalid JSON in volunteerOverseerAssistants:', formData.volunteerOverseerAssistants)
            return []
          }
        })()
      }

      // Only add departmentTemplateId if it has a valid non-empty value
      const deptId = formData.departmentTemplateId?.trim()
      if (deptId && deptId !== '') {
        submitData.departmentTemplateId = deptId
      } else {
        // Explicitly set to null to clear the template
        submitData.departmentTemplateId = null
      }

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        setError(`HTTP ${response.status}: ${errorText}`)
        return
      }

      const data = await response.json()

      if (data.success) {
        setSuccess('Event updated successfully!')
        setTimeout(() => {
          router.push(`/events/${eventId}`)
        }, 1500)
      } else {
        setError(data.error || 'Failed to update event')
        if (data.details) {
          console.error('Validation errors:', data.details)
        }
      }
    } catch (error) {
      setError('Error updating event')
      console.error('Error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloneEvent = async () => {
    if (!showCloneConfirm) {
      setShowCloneConfirm(true)
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}/clone`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        router.push(`/events/${data.data.id}`)
      } else {
        setError(data.error || 'Failed to clone event')
        setShowCloneConfirm(false)
      }
    } catch (err) {
      setError('An error occurred while cloning the event')
      setShowCloneConfirm(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        router.push('/events')
      } else {
        setError(data.error || 'Failed to delete event')
        setShowDeleteConfirm(false)
      }
    } catch (err) {
      setError('An error occurred while deleting the event')
      setShowDeleteConfirm(false)
    }
  }

  const eventTypes = [
    { value: 'CIRCUIT_ASSEMBLY', label: 'Circuit Assembly' },
    { value: 'REGIONAL_CONVENTION', label: 'Regional Convention' },
    { value: 'SPECIAL_EVENT', label: 'Special Event' },
    { value: 'OTHER', label: 'Other' }
  ]

  const statusOptions = [
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'CURRENT', label: 'Current' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'ARCHIVED', label: 'Archived' }
  ]

  if (loading) {
    return (
      <EventLayout 
        title="Edit Event"
        breadcrumbs={[
          { label: 'Events', href: '/events' },
          { label: 'Loading...', href: `/events/${eventId}` },
          { label: 'Edit' }
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Loading event...</p>
        </div>
      </EventLayout>
    )
  }

  if (error && !event) {
    return (
      <EventLayout 
        title="Edit Event"
        breadcrumbs={[
          { label: 'Events', href: '/events' },
          { label: 'Error' }
        ]}
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <p className="text-red-700">{error}</p>
          <Link
            href="/events/select"
            className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            ← Back to Event Selection
          </Link>
        </div>
      </EventLayout>
    )
  }

  return (
    <EventLayout 
      title="Edit Event"
      breadcrumbs={[
        { label: 'Events', href: '/events' },
        { label: event?.name || '', href: `/events/${eventId}` },
        { label: 'Edit' }
      ]}
      selectedEvent={{
        id: event?.id || '',
        name: event?.name || ''
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
              <p className="mt-2 text-sm text-gray-600">
                Update event information and settings
              </p>
            </div>
            <Link
              href={`/events/${eventId}`}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              ← Back to Event
            </Link>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter event name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type *
                </label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.eventType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.eventType && <p className="mt-1 text-sm text-red-600">{errors.eventType}</p>}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="departmentTemplateId" className="block text-sm font-medium text-gray-700 mb-1">
                  Department Template
                </label>
                <select
                  id="departmentTemplateId"
                  name="departmentTemplateId"
                  value={formData.departmentTemplateId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">No template (all features enabled)</option>
                  {departmentTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.icon} {template.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Templates control which features are available for this event
                </p>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description of the event..."
                />
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Date and Time</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
              </div>

              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Location and Capacity */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Location and Capacity</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <LocationSelector
                  value={formData.locationId || null}
                  locationName={formData.location}
                  onChange={handleLocationChange}
                  onCreateNew={handleLocationCreate}
                  error={errors.location}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Search saved locations or create a new one
                </p>
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  min="1"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.capacity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Maximum attendees"
                />
                {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
              </div>

              <div>
                <label htmlFor="volunteersNeeded" className="block text-sm font-medium text-gray-700 mb-1">
                  Volunteers Needed
                </label>
                <input
                  type="number"
                  id="volunteersNeeded"
                  name="volunteersNeeded"
                  min="0"
                  value={formData.volunteersNeeded}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.volunteersNeeded ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Number of volunteers needed"
                />
                {errors.volunteersNeeded && <p className="mt-1 text-sm text-red-600">{errors.volunteersNeeded}</p>}
              </div>
            </div>
          </div>

          {/* APEX GUARDIAN: Oversight Management Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Oversight Management</h3>
            
            {/* Circuit Overseer */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🏛️</span>
                </span>
                Circuit Overseer
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="circuitOverseerName" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="circuitOverseerName"
                    name="circuitOverseerName"
                    value={formData.circuitOverseerName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Circuit Overseer Name"
                  />
                </div>
                <div>
                  <label htmlFor="circuitOverseerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="circuitOverseerPhone"
                    name="circuitOverseerPhone"
                    value={formData.circuitOverseerPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone Number"
                  />
                </div>
                <div>
                  <label htmlFor="circuitOverseerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="circuitOverseerEmail"
                    name="circuitOverseerEmail"
                    value={formData.circuitOverseerEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email Address"
                  />
                </div>
              </div>
            </div>

            {/* Assembly Overseer */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                <span className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🏢</span>
                </span>
                Assembly Overseer
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="assemblyOverseerName" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="assemblyOverseerName"
                    name="assemblyOverseerName"
                    value={formData.assemblyOverseerName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Assembly Overseer Name"
                  />
                </div>
                <div>
                  <label htmlFor="assemblyOverseerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="assemblyOverseerPhone"
                    name="assemblyOverseerPhone"
                    value={formData.assemblyOverseerPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone Number"
                  />
                </div>
                <div>
                  <label htmlFor="assemblyOverseerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="assemblyOverseerEmail"
                    name="assemblyOverseerEmail"
                    value={formData.assemblyOverseerEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email Address"
                  />
                </div>
              </div>
            </div>

            {/* Volunteer Overseer */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">👥</span>
                </span>
                Volunteer Overseer
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="volunteerOverseerName" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="volunteerOverseerName"
                    name="volunteerOverseerName"
                    value={formData.volunteerOverseerName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Volunteer Overseer Name"
                  />
                </div>
                <div>
                  <label htmlFor="volunteerOverseerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="volunteerOverseerPhone"
                    name="volunteerOverseerPhone"
                    value={formData.volunteerOverseerPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone Number"
                  />
                </div>
                <div>
                  <label htmlFor="volunteerOverseerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="volunteerOverseerEmail"
                    name="volunteerOverseerEmail"
                    value={formData.volunteerOverseerEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email Address"
                  />
                </div>
              </div>
            </div>

            {/* Volunteer Overseer Assistants */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                <span className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🤝</span>
                </span>
                Volunteer Overseer Assistants
              </h4>
              
              <div className="space-y-4">
                {assistants.map((assistant, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">Assistant {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeAssistant(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                        <input
                          type="text"
                          value={assistant.name}
                          onChange={(e) => updateAssistant(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Full Name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={assistant.phone}
                          onChange={(e) => updateAssistant(index, 'phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="555-0123"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                        <input
                          type="email"
                          value={assistant.email}
                          onChange={(e) => updateAssistant(index, 'email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addAssistant}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Assistant
                </button>
                
                {assistants.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No assistants added yet. Click "Add Assistant" to add one.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <Link
              href={`/events/${eventId}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></span>
                  Updating...
                </>
              ) : (
                'Update Event'
              )}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="bg-white shadow rounded-lg p-6 border-2 border-red-200 mt-8">
          <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
          <div className="space-y-4">
            {/* Clone Event */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Clone This Event</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Create a duplicate of this event with all settings and positions
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCloneEvent}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    showCloneConfirm
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {showCloneConfirm ? 'Confirm Clone' : '📋 Clone Event'}
                </button>
                {showCloneConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowCloneConfirm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Delete Event */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-red-900">Delete This Event</h4>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete this event and all associated data. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteEvent}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    showDeleteConfirm
                      ? 'bg-red-700 text-white hover:bg-red-800'
                      : 'bg-white border border-red-300 text-red-700 hover:bg-red-50'
                  }`}
                >
                  {showDeleteConfirm ? 'Confirm Delete' : '🗑️ Delete Event'}
                </button>
                {showDeleteConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </EventLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  // Only ADMIN, OVERSEER, ASSISTANT_OVERSEER, and KEYMAN can edit events
  if (!['ADMIN', 'OVERSEER', 'ASSISTANT_OVERSEER', 'KEYMAN'].includes(session.user?.role || '')) {
    return {
      redirect: {
        destination: '/events',
        permanent: false,
      },
    }
  }

  // APEX GUARDIAN: Check event-specific permissions for editing
  const { id } = context.params!
  
  // Import event access utilities
  const { canManageEvent } = await import('../../../src/lib/eventAccess')
  
  // Check if user can manage (edit) this event - requires MANAGER or OWNER role
  const canEdit = await canManageEvent(session.user?.id || '', id as string)
  
  if (!canEdit) {
    // User doesn't have permission to edit this event
    return {
      redirect: {
        destination: `/events/${id}`,
        permanent: false,
      },
    }
  }

  // APEX GUARDIAN: Fetch event data server-side to eliminate client-side API issues
  
  try {
    const { prisma } = await import('../../../src/lib/prisma')
    
    const event = await prisma.events.findUnique({
      where: { id: id as string }
    })

    if (!event) {
      return { notFound: true }
    }

    // Fetch department templates for the dropdown
    const departmentTemplates = await prisma.department_templates.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        icon: true
      },
      orderBy: { sortOrder: 'asc' }
    })

    // Transform event data for frontend compatibility
    const eventWithOversight = event as any // Type assertion for new oversight fields
    const transformedEvent = {
      id: event.id,
      name: event.name,
      description: event.description || '',
      eventType: event.eventType,
      startDate: event.startDate ? event.startDate.toISOString().split('T')[0] : null,
      endDate: event.endDate ? event.endDate.toISOString().split('T')[0] : null,
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      location: event.location || '',
      capacity: event.capacity,
      volunteersNeeded: event.volunteersNeeded,
      status: event.status,
      // APEX GUARDIAN: Oversight Management Fields (using database field names)
      departmentTemplateId: event.departmentTemplateId || '',
      circuitOverseerName: eventWithOversight.circuitoverseername,
      circuitOverseerPhone: eventWithOversight.circuitoverseerphone,
      circuitOverseerEmail: eventWithOversight.circuitoverseeremail,
      assemblyOverseerName: eventWithOversight.assemblyoverseername,
      assemblyOverseerPhone: eventWithOversight.assemblyoverseerphone,
      assemblyOverseerEmail: eventWithOversight.assemblyoverseeremail,
      volunteerOverseerName: eventWithOversight.volunteerOverseerName,
      volunteerOverseerPhone: eventWithOversight.volunteerOverseerPhone,
      volunteerOverseerEmail: eventWithOversight.volunteerOverseerEmail,
      volunteerOverseerAssistants: eventWithOversight.volunteerOverseerAssistants,
      createdAt: event.createdAt?.toISOString() || null,
      updatedAt: event.updatedAt?.toISOString() || null
    }

    return {
      props: {
        event: transformedEvent,
        departmentTemplates: departmentTemplates.map(t => ({
          id: t.id,
          name: t.name,
          icon: t.icon
        }))
      },
    }
  } catch (error) {
    console.error('Error fetching event for edit:', error)
    return { notFound: true }
  }
}
