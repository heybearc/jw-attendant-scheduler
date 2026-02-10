import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../api/auth/[...nextauth]'
import { useRouter } from 'next/router'
import EventPageLayout from '../../../components/EventPageLayout'
import { TemplateProvider } from '../../../contexts/TemplateContext'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface IVSVolunteer {
  id: string
  firstName: string
  lastName: string
  congregation: string
  approvalStatus: string
  submittedBy: string
  requestRound: number
  approvedAt?: string
  approvedBy?: string
  notes?: string
  earlyCheckinEligible?: boolean
  checkedInAt?: string
  checkedInBy?: string
  checkinNotes?: string
}

interface IVSApprovalsPageProps {
  event: any
  canEdit: boolean
}

export default function IVSApprovalsPage({ event, canEdit }: IVSApprovalsPageProps) {
  const router = useRouter()
  const eventId = event.id
  const [volunteers, setVolunteers] = useState<IVSVolunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRound, setFilterRound] = useState('')
  const [departments, setDepartments] = useState<string[]>([])
  const [rounds, setRounds] = useState<number[]>([])

  useEffect(() => {
    fetchVolunteers()
  }, [])

  const fetchVolunteers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}/ivs/volunteers`)
      if (response.ok) {
        const data = await response.json()
        setVolunteers(data.volunteers || [])
        
        // Extract unique departments and rounds
        const depts = [...new Set(data.volunteers.map((v: IVSVolunteer) => v.submittedBy).filter(Boolean))]
        const rnds = [...new Set(data.volunteers.map((v: IVSVolunteer) => v.requestRound).filter(Boolean))]
        setDepartments(depts as string[])
        setRounds(rnds.sort() as number[])
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (file: File, requestRound: number, departmentName?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('requestRound', requestRound.toString())
    if (departmentName) {
      formData.append('departmentName', departmentName)
    }

    try {
      const response = await fetch(`/api/events/${eventId}/ivs/import`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`Import successful!\nImported: ${result.imported}\nSkipped: ${result.skipped}`)
        setShowImportModal(false)
        fetchVolunteers()
      } else {
        alert(`Import failed: ${result.message}`)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Import failed. Please try again.')
    }
  }

  const handleExport = async (departmentName?: string, requestRound?: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}/ivs/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentName, requestRound }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'export.xlsx'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setShowExportModal(false)
      } else {
        const error = await response.json()
        alert(`Export failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    }
  }

  const handleToggleEarlyEntry = async (volunteerId: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/events/${eventId}/ivs/volunteers/${volunteerId}/early-entry`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ earlyCheckinEligible: !currentValue }),
      })

      if (response.ok) {
        fetchVolunteers()
      } else {
        alert('Failed to update early entry flag')
      }
    } catch (error) {
      console.error('Error updating early entry:', error)
      alert('Error updating early entry flag')
    }
  }

  const handleCheckIn = async (volunteerId: string) => {
    const notes = prompt('Check-in notes (optional):')
    
    try {
      const response = await fetch(`/api/events/${eventId}/ivs/volunteers/${volunteerId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || undefined }),
      })

      if (response.ok) {
        alert('Volunteer checked in successfully!')
        fetchVolunteers()
      } else {
        alert('Failed to check in volunteer')
      }
    } catch (error) {
      console.error('Error checking in:', error)
      alert('Error checking in volunteer')
    }
  }

  const filteredVolunteers = volunteers.filter(v => {
    if (filterDepartment && v.submittedBy !== filterDepartment) return false
    if (filterStatus && v.approvalStatus !== filterStatus) return false
    if (filterRound && v.requestRound !== parseInt(filterRound)) return false
    return true
  })

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800'
      case 'Not Approved': return 'bg-red-100 text-red-800'
      case 'Requested': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <TemplateProvider
      moduleConfig={event.departmentTemplate?.moduleConfig || null}
      terminology={event.departmentTemplate?.terminology || null}
      positionTemplates={event.departmentTemplate?.positionTemplates || null}
      departmentTemplateName={event.departmentTemplate?.name}
    >
      <EventPageLayout
        event={event}
        currentPage="overview"
        canEdit={canEdit}
      >
        <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">IVS Volunteer Approvals</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Import Volunteers
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export List
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex gap-4">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Requested">Requested</option>
            <option value="Approved">Approved</option>
            <option value="Not Approved">Not Approved</option>
          </select>

          <select
            value={filterRound}
            onChange={(e) => setFilterRound(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Rounds</option>
            {rounds.map(round => (
              <option key={round} value={round}>Request {round}</option>
            ))}
          </select>

          {(filterDepartment || filterStatus || filterRound) && (
            <button
              onClick={() => {
                setFilterDepartment('')
                setFilterStatus('')
                setFilterRound('')
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Volunteers Table */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No volunteers found. Click "Import Volunteers" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Congregation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Round</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Early Entry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-In</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVolunteers.map(volunteer => (
                  <tr key={volunteer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{volunteer.firstName} {volunteer.lastName}</td>
                    <td className="px-4 py-3 text-sm">{volunteer.congregation}</td>
                    <td className="px-4 py-3 text-sm">{volunteer.submittedBy}</td>
                    <td className="px-4 py-3 text-sm">Request {volunteer.requestRound}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(volunteer.approvalStatus)}`}>
                        {volunteer.approvalStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleToggleEarlyEntry(volunteer.id, volunteer.earlyCheckinEligible || false)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          volunteer.earlyCheckinEligible
                            ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {volunteer.earlyCheckinEligible ? '✓ Early Entry' : 'Set Early Entry'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {volunteer.checkedInAt ? (
                        <div className="text-xs">
                          <div className="text-green-600 font-medium">✓ Checked In</div>
                          <div className="text-gray-500">{volunteer.checkedInAt}</div>
                        </div>
                      ) : volunteer.earlyCheckinEligible ? (
                        <span className="text-gray-400">Not checked in</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {volunteer.earlyCheckinEligible && !volunteer.checkedInAt && (
                        <button
                          onClick={() => handleCheckIn(volunteer.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <ImportModal
            onClose={() => setShowImportModal(false)}
            onImport={handleImport}
          />
        )}

        {/* Export Modal */}
        {showExportModal && (
          <ExportModal
            departments={departments}
            rounds={rounds}
            onClose={() => setShowExportModal(false)}
            onExport={handleExport}
          />
        )}
        </div>
      </EventPageLayout>
    </TemplateProvider>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  
  if (!session?.user?.id) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  const { id } = context.params as { id: string }

  try {
    const event = await prisma.events.findUnique({
      where: { id },
      include: {
        departmentTemplate: true,
      },
    })

    if (!event) {
      return { notFound: true }
    }

    const permission = await prisma.event_permissions.findFirst({
      where: {
        eventId: id,
        userId: session.user.id,
      },
    })

    if (!permission) {
      return {
        redirect: {
          destination: '/events/select',
          permanent: false,
        },
      }
    }

    const canEdit = permission.role === 'ADMIN' as any

    return {
      props: {
        event: JSON.parse(JSON.stringify(event)),
        canEdit,
      },
    }
  } catch (error) {
    console.error('Error fetching event:', error)
    return { notFound: true }
  } finally {
    await prisma.$disconnect()
  }
}

function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (file: File, round: number, dept?: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [requestRound, setRequestRound] = useState(1)
  const [departmentName, setDepartmentName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      onImport(file, requestRound, departmentName || undefined)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Import Volunteers</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Excel/CSV File</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
            <p className="text-xs text-gray-500 mt-1">File should have NAME and CONGREGATION columns</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Request Round</label>
            <input
              type="number"
              min="1"
              value={requestRound}
              onChange={(e) => setRequestRound(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Department Name (Optional)</label>
            <input
              type="text"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., Parking, Security"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Import
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ExportModal({ departments, rounds, onClose, onExport }: {
  departments: string[]
  rounds: number[]
  onClose: () => void
  onExport: (dept?: string, round?: number) => void
}) {
  const [departmentName, setDepartmentName] = useState('')
  const [requestRound, setRequestRound] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onExport(
      departmentName || undefined,
      requestRound ? parseInt(requestRound) : undefined
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Export Volunteers</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Department (Optional)</label>
            <select
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Request Round (Optional)</label>
            <select
              value={requestRound}
              onChange={(e) => setRequestRound(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Rounds</option>
              {rounds.map(round => (
                <option key={round} value={round}>Request {round}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-800">
              Export will include: NAME, CONGREGATION, APPROVAL STATUS, APPROVAL DATE, DEPARTMENT, ROUND, NOTES
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
