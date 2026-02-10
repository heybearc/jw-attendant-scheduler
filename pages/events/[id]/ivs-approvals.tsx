import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import EventPageLayout from '../../../components/EventPageLayout'

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
}

export default function IVSApprovalsPage() {
  const router = useRouter()
  const { id: eventId } = router.query
  const { data: session } = useSession()
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
    if (eventId) {
      fetchVolunteers()
    }
  }, [eventId])

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
    <EventPageLayout>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
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
                    <td className="px-4 py-3 text-sm">{volunteer.approvedAt || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{volunteer.notes || '-'}</td>
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
  )
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
