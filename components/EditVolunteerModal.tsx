import { useState } from 'react'

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

interface EditVolunteerModalProps {
  volunteer: IVSVolunteer
  onClose: () => void
  onSave: (data: any) => void
}

export default function EditVolunteerModal({ volunteer, onClose, onSave }: EditVolunteerModalProps) {
  const [firstName, setFirstName] = useState(volunteer.firstName)
  const [lastName, setLastName] = useState(volunteer.lastName)
  const [congregation, setCongregation] = useState(volunteer.congregation)
  const [approvalStatus, setApprovalStatus] = useState(volunteer.approvalStatus)
  const [notes, setNotes] = useState(volunteer.notes || '')
  const [deniedReason, setDeniedReason] = useState('')
  const [earlyCheckin, setEarlyCheckin] = useState(volunteer.earlyCheckinEligible || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      firstName,
      lastName,
      congregation,
      ivsApprovalStatus: approvalStatus,
      ivsApprovalNotes: notes,
      ...(approvalStatus === 'Not Approved' && deniedReason && { ivsDeniedReason: deniedReason }),
      earlyCheckinEligible: earlyCheckin
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Volunteer</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Congregation</label>
            <input
              type="text"
              value={congregation}
              onChange={(e) => setCongregation(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Approval Status</label>
            <select
              value={approvalStatus}
              onChange={(e) => setApprovalStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="Pending">Pending</option>
              <option value="Requested">Requested</option>
              <option value="Approved">Approved</option>
              <option value="Not Approved">Not Approved</option>
            </select>
          </div>

          {approvalStatus === 'Not Approved' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Denial Reason</label>
              <textarea
                value={deniedReason}
                onChange={(e) => setDeniedReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
                placeholder="Reason for denial..."
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Approval Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={earlyCheckin}
                onChange={(e) => setEarlyCheckin(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Early Check-In Eligible</span>
            </label>
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
