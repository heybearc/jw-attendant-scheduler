import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../api/auth/[...nextauth]'
import { useRouter } from 'next/router'
import EventPageLayout from '../../../components/EventPageLayout'
import { TemplateProvider } from '../../../contexts/TemplateContext'
import { PrismaClient } from '@prisma/client'
import EditVolunteerModal from '../../../components/EditVolunteerModal'
import BulkActionModal from '../../../components/BulkActionModal'

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
        
        // Extract unique departments, rounds, and congregations
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

      const result = await response.json()
      
      if (result.success) {
        alert(`Import successful!\nImported: ${result.imported}\nSkipped: ${result.skipped}`)
        setShowImportModal(false)
        fetchVolunteers()
      } else {
        alert(`Import failed: ${result.message}`)
      }
    } catch (error) {
      console.error('[Frontend] Import error:', error)
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

  const handleEdit = (volunteer: IVSVolunteer) => {
    setEditingVolunteer(volunteer)
    setShowEditModal(true)
  }

  const handleQuickApprove = async (volunteerId: string, approve: boolean) => {
    const reason = !approve ? prompt('Reason for denial:') : null
    if (!approve && !reason) return

    try {
      const response = await fetch(`/api/events/${eventId}/ivs/volunteers/${volunteerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ivsApprovalStatus: approve ? 'Approved' : 'Not Approved',
          ...(reason && { ivsDeniedReason: reason })
        }),
      })

      if (response.ok) {
        alert(`Volunteer ${approve ? 'approved' : 'denied'} successfully!`)
        fetchVolunteers()
      } else {
        alert('Failed to update approval status')
      }
    } catch (error) {
      console.error('Error updating approval:', error)
      alert('Error updating approval status')
    }
  }

  const handleStatusChange = async (volunteerId: string, newStatus: string) => {
    if (newStatus === 'Not Approved') {
      const reason = prompt('Reason for denial:')
      if (!reason) return

      try {
        const response = await fetch(`/api/events/${eventId}/ivs/volunteers/${volunteerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ivsApprovalStatus: newStatus,
            ivsDeniedReason: reason
          }),
        })

        if (response.ok) {
          fetchVolunteers()
        } else {
          alert('Failed to update approval status')
        }
      } catch (error) {
        console.error('Error updating approval:', error)
        alert('Error updating approval status')
      }
    } else {
      try {
        const response = await fetch(`/api/events/${eventId}/ivs/volunteers/${volunteerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ivsApprovalStatus: newStatus
          }),
        })

        if (response.ok) {
          fetchVolunteers()
        } else {
          alert('Failed to update approval status')
        }
      } catch (error) {
        console.error('Error updating approval:', error)
        alert('Error updating approval status')
      }
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVolunteers(filteredVolunteers.map(v => v.id))
    } else {
      setSelectedVolunteers([])
    }
  }

  const handleSelectVolunteer = (volunteerId: string, checked: boolean) => {
    if (checked) {
      setSelectedVolunteers([...selectedVolunteers, volunteerId])
    } else {
      setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteerId))
    }
  }

  const handleBulkAction = (action: string) => {
    if (selectedVolunteers.length === 0) {
      alert('Please select volunteers first')
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

  const handleClearAll = async () => {
    if (!confirm(`Delete ALL ${volunteers.length} volunteers from IVS Approvals? This cannot be undone.`)) return
    if (!confirm('Are you ABSOLUTELY sure? This will permanently delete all IVS volunteer records.')) return

    try {
      const response = await fetch(`/api/events/${eventId}/ivs/volunteers/clear-all`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully deleted ${result.deleted} volunteer(s)`)
        fetchVolunteers()
      } else {
        alert('Failed to clear volunteers')
      }
    } catch (error) {
      console.error('Error clearing volunteers:', error)
      alert('Error clearing volunteers')
    }
  }

  const handleSort = (field: keyof IVSVolunteer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  const filteredVolunteers = volunteers.filter(v => {
    // Filter by department
    if (filterDepartment && v.submittedBy !== filterDepartment) return false
    // Filter by status
    if (filterStatus && v.approvalStatus !== filterStatus) return false
    // Filter by round
    if (filterRound && v.requestRound !== parseInt(filterRound)) return false
    // Filter by congregation
    if (filterCongregation && v.congregation !== filterCongregation) return false
    // Search by name or congregation
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const fullName = `${v.firstName} ${v.lastName}`.toLowerCase()
      const congregation = v.congregation.toLowerCase()
      if (!fullName.includes(search) && !congregation.includes(search)) return false
    }
    return true
  })

  // Sort volunteers
  const sortedVolunteers = [...filteredVolunteers].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]
    
    // Handle undefined/null values
    if (aVal === undefined || aVal === null) return 1
    if (bVal === undefined || bVal === null) return -1
    
    // Convert to strings for comparison
    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    
    if (sortDirection === 'asc') {
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
    } else {
      return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
    }
  })

  // Pagination
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
    <TemplateProvider
      moduleConfig={event.departmentTemplate?.moduleConfig || null}
      terminology={event.departmentTemplate?.terminology || null}
      positionTemplates={event.departmentTemplate?.positionTemplates || null}
      departmentTemplateName={event.departmentTemplate?.name}
    >
      <EventPageLayout
        event={event}
        currentPage="ivs-approvals"
        canEdit={canEdit}
      >
        <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">IVS Volunteer Approvals</h1>
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
            <button
              onClick={() => router.push(`/events/${eventId}/ivs-checkin`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              ⏰ Early Check-In
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
                  <th className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedVolunteers.length === paginatedVolunteers.length && paginatedVolunteers.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4"
                    />
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastName')}
                  >
                    Name {sortField === 'lastName' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('congregation')}
                  >
                    Congregation {sortField === 'congregation' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('submittedBy')}
                  >
                    Department {sortField === 'submittedBy' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('requestRound')}
                  >
                    Round {sortField === 'requestRound' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('approvalStatus')}
                  >
                    Status {sortField === 'approvalStatus' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Early Entry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedVolunteers.map(volunteer => (
                  <tr key={volunteer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedVolunteers.includes(volunteer.id)}
                        onChange={(e) => handleSelectVolunteer(volunteer.id, e.target.checked)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">{volunteer.firstName} {volunteer.lastName}</td>
                    <td className="px-4 py-3 text-sm">{volunteer.congregation}</td>
                    <td className="px-4 py-3 text-sm">{volunteer.submittedBy}</td>
                    <td className="px-4 py-3 text-sm">Request {volunteer.requestRound}</td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={volunteer.approvalStatus}
                        onChange={(e) => handleStatusChange(volunteer.id, e.target.value)}
                        className={`px-2 py-1 rounded-md text-xs font-medium border-0 cursor-pointer ${getStatusBadgeColor(volunteer.approvalStatus)}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Not Approved">Not Approved</option>
                      </select>
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
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleEdit(volunteer)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        {volunteer.approvalStatus === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleQuickApprove(volunteer.id, true)}
                              className="px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleQuickApprove(volunteer.id, false)}
                              className="px-3 py-1 bg-red-600 text-white rounded-md text-xs hover:bg-red-700"
                            >
                              Deny
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteVolunteer(volunteer.id, `${volunteer.firstName} ${volunteer.lastName}`)}
                          className="px-3 py-1 bg-gray-600 text-white rounded-md text-xs hover:bg-gray-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Items per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-2 py-1 border rounded-md text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
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
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 border rounded-md text-sm ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

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
