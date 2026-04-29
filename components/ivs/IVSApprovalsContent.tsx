import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import EditVolunteerModal from '../EditVolunteerModal'
import BulkActionModal from '../BulkActionModal'
import ImportModal from '../ImportModal'
import ExportModal from '../ExportModal'

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

interface IVSApprovalsContentProps {
  event: any
  canEdit: boolean
}

export default function IVSApprovalsContent({ event, canEdit }: IVSApprovalsContentProps) {
  const router = useRouter()
  const eventId = event.id
  const [volunteers, setVolunteers] = useState<IVSVolunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRound, setFilterRound] = useState('')
  const [filterCongregation, setFilterCongregation] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [departments, setDepartments] = useState<string[]>([])
  const [rounds, setRounds] = useState<number[]>([])
  const [congregations, setCongregations] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [sortField, setSortField] = useState<keyof IVSVolunteer>('lastName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingVolunteer, setEditingVolunteer] = useState<IVSVolunteer | null>(null)
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState('')

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
        
        const depts = [...new Set(data.volunteers.map((v: IVSVolunteer) => v.submittedBy).filter(Boolean))]
        const rnds = [...new Set(data.volunteers.map((v: IVSVolunteer) => v.requestRound).filter(Boolean))]
        const congs = [...new Set(data.volunteers.map((v: IVSVolunteer) => v.congregation).filter(Boolean))]
        setDepartments(depts as string[])
        setRounds(rnds.sort() as number[])
        setCongregations(congs.sort() as string[])
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

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully imported ${result.imported} volunteer(s)`)
        setShowImportModal(false)
        fetchVolunteers()
      } else {
        const error = await response.json()
        alert(`Import failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Error importing:', error)
      alert('Error importing volunteers')
    }
  }

  const handleExport = async (departmentName?: string, requestRound?: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}/ivs/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentName: departmentName || undefined,
          requestRound: requestRound != null ? String(requestRound) : undefined,
          format: 'xlsx',
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ivs-volunteers-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setShowExportModal(false)
      } else {
        let msg = 'Export failed'
        try {
          const err = await response.json()
          if (err?.message) msg = err.message
        } catch {
          /* ignore */
        }
        alert(msg)
      }
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Error exporting volunteers')
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all IVS volunteers? This cannot be undone.')) return

    try {
      const response = await fetch(`/api/events/${eventId}/ivs/volunteers`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('All volunteers cleared successfully')
        fetchVolunteers()
      } else {
        alert('Failed to clear volunteers')
      }
    } catch (error) {
      console.error('Error clearing volunteers:', error)
      alert('Error clearing volunteers')
    }
  }

  const handleToggleEarlyEntry = async (volunteerId: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/events/${eventId}/ivs/volunteers/${volunteerId}/early-entry`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ earlyCheckinEligible: !currentValue }),
      })

      if (response.ok) {
        fetchVolunteers()
      } else {
        const data = await response.json()
        alert(data.message || 'Failed to update early entry status')
      }
    } catch (error) {
      console.error('Error toggling early entry:', error)
      alert('Error updating early entry status')
    }
  }

  const handleSelectVolunteer = (volunteerId: string) => {
    setSelectedVolunteers(prev => 
      prev.includes(volunteerId)
        ? prev.filter(id => id !== volunteerId)
        : [...prev, volunteerId]
    )
  }

  const handleSelectAll = () => {
    if (selectedVolunteers.length === filteredVolunteers.length) {
      setSelectedVolunteers([])
    } else {
      setSelectedVolunteers(filteredVolunteers.map(v => v.id))
    }
  }

  const handleBulkAction = (action: string) => {
    if (selectedVolunteers.length === 0) {
      alert('Please select at least one volunteer')
      return
    }
    setBulkAction(action)
    setShowBulkModal(true)
  }

  const handleBulkConfirm = async (data: any) => {
    try {
      const response = await fetch(`/api/events/${eventId}/ivs/volunteers/bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerIds: selectedVolunteers,
          ...data
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully updated ${result.updated} volunteer(s)`)
        setShowBulkModal(false)
        setBulkAction('')
        setSelectedVolunteers([])
        fetchVolunteers()
      } else {
        const error = await response.json()
        alert(`Failed to update volunteers: ${error.message}`)
      }
    } catch (error) {
      console.error('Error with bulk action:', error)
      alert('Error performing bulk action')
    }
  }

  const handleDeleteVolunteer = async (volunteerId: string, name: string) => {
    if (!confirm(`Delete ${name} from IVS Approvals? This cannot be undone.`)) return

    try {
      const response = await fetch(`/api/events/${eventId}/ivs/volunteers/${volunteerId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Volunteer deleted successfully')
        fetchVolunteers()
      } else {
        alert('Failed to delete volunteer')
      }
    } catch (error) {
      console.error('Error deleting volunteer:', error)
      alert('Error deleting volunteer')
    }
  }

  const handleSort = (field: keyof IVSVolunteer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredVolunteers = volunteers.filter(v => {
    if (filterDepartment && v.submittedBy !== filterDepartment) return false
    if (filterStatus && v.approvalStatus !== filterStatus) return false
    if (filterRound && v.requestRound !== parseInt(filterRound)) return false
    if (filterCongregation && v.congregation !== filterCongregation) return false
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const fullName = `${v.firstName} ${v.lastName}`.toLowerCase()
      const congregation = v.congregation.toLowerCase()
      if (!fullName.includes(search) && !congregation.includes(search)) return false
    }
    return true
  })

  const sortedVolunteers = [...filteredVolunteers].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]
    
    if (aVal === undefined || aVal === null) return 1
    if (bVal === undefined || bVal === null) return -1
    
    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    
    if (sortDirection === 'asc') {
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
    } else {
      return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
    }
  })

  const totalPages = Math.ceil(sortedVolunteers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedVolunteers = sortedVolunteers.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearFilters = () => {
    setFilterDepartment('')
    setFilterStatus('')
    setFilterRound('')
    setFilterCongregation('')
    setSearchTerm('')
    setCurrentPage(1)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800'
      case 'Not Approved': return 'bg-red-100 text-red-800'
      case 'Requested': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      {/* Action Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
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
        {volunteers.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Clear All
          </button>
        )}
        
        {selectedVolunteers.length > 0 && (
          <div className="ml-auto flex gap-2 items-center">
            <span className="text-sm text-gray-600">{selectedVolunteers.length} selected</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkAction(e.target.value)
                  e.target.value = ''
                }
              }}
              className="px-3 py-2 border rounded-md bg-purple-600 text-white hover:bg-purple-700"
            >
              <option value="">Bulk Actions</option>
              <option value="approve">Approve Selected</option>
              <option value="deny">Deny Selected</option>
              <option value="setEarlyEntry">Set Early Entry</option>
              <option value="changeRound">Change Round</option>
              <option value="changeDepartment">Change Department</option>
            </select>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder="Search by name or congregation..."
          className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <select
          value={filterDepartment}
          onChange={(e) => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
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
          onChange={(e) => { setFilterRound(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Rounds</option>
          {rounds.map(round => (
            <option key={round} value={round}>Request {round}</option>
          ))}
        </select>

        <select
          value={filterCongregation}
          onChange={(e) => { setFilterCongregation(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Congregations</option>
          {congregations.map(cong => (
            <option key={cong} value={cong}>{cong}</option>
          ))}
        </select>

        {(filterDepartment || filterStatus || filterRound || filterCongregation || searchTerm) && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded-md"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results Summary */}
      {!loading && sortedVolunteers.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(endIndex, sortedVolunteers.length)} of {sortedVolunteers.length} volunteer(s)
          {sortedVolunteers.length !== volunteers.length && ` (filtered from ${volunteers.length} total)`}
        </div>
      )}

      {/* Volunteers Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : sortedVolunteers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {volunteers.length === 0 
            ? 'No volunteers found. Click "Import Volunteers" to get started.'
            : 'No volunteers match your search or filters.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border">
                  <input
                    type="checkbox"
                    checked={selectedVolunteers.length === filteredVolunteers.length && filteredVolunteers.length > 0}
                    onChange={handleSelectAll}
                    className="cursor-pointer"
                  />
                </th>
                <th 
                  className="px-4 py-2 border text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastName')}
                >
                  Name {sortField === 'lastName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-2 border text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('congregation')}
                >
                  Congregation {sortField === 'congregation' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-2 border text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('submittedBy')}
                >
                  Department {sortField === 'submittedBy' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-2 border text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('requestRound')}
                >
                  Round {sortField === 'requestRound' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-2 border text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('approvalStatus')}
                >
                  Status {sortField === 'approvalStatus' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-2 border text-left">Early Entry</th>
                <th className="px-4 py-2 border text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVolunteers.map((volunteer) => (
                <tr key={volunteer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">
                    <input
                      type="checkbox"
                      checked={selectedVolunteers.includes(volunteer.id)}
                      onChange={() => handleSelectVolunteer(volunteer.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-2 border">
                    {volunteer.firstName} {volunteer.lastName}
                  </td>
                  <td className="px-4 py-2 border">{volunteer.congregation}</td>
                  <td className="px-4 py-2 border">{volunteer.submittedBy}</td>
                  <td className="px-4 py-2 border">Request {volunteer.requestRound}</td>
                  <td className="px-4 py-2 border">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(volunteer.approvalStatus)}`}>
                      {volunteer.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <button
                      onClick={() => handleToggleEarlyEntry(volunteer.id, volunteer.earlyCheckinEligible || false)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        volunteer.earlyCheckinEligible
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {volunteer.earlyCheckinEligible ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-4 py-2 border">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingVolunteer(volunteer)
                          setShowEditModal(true)
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVolunteer(volunteer.id, `${volunteer.firstName} ${volunteer.lastName}`)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Last
                </button>
              </div>

              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
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

      {/* Edit Modal */}
      {showEditModal && editingVolunteer && (
        <EditVolunteerModal
          volunteer={editingVolunteer}
          onClose={() => {
            setShowEditModal(false)
            setEditingVolunteer(null)
          }}
          onSave={async (data) => {
            try {
              const response = await fetch(`/api/events/${eventId}/ivs/volunteers/${editingVolunteer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              })

              if (response.ok) {
                alert('Volunteer updated successfully!')
                setShowEditModal(false)
                setEditingVolunteer(null)
                fetchVolunteers()
              } else {
                alert('Failed to update volunteer')
              }
            } catch (error) {
              console.error('Error updating volunteer:', error)
              alert('Error updating volunteer')
            }
          }}
        />
      )}

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <BulkActionModal
          action={bulkAction}
          selectedCount={selectedVolunteers.length}
          onClose={() => {
            setShowBulkModal(false)
            setBulkAction('')
          }}
          onConfirm={handleBulkConfirm}
        />
      )}
    </>
  )
}
