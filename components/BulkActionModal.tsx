import { useState } from 'react'

interface BulkActionModalProps {
  action: string
  selectedCount: number
  onClose: () => void
  onConfirm: (data: any) => void
}

export default function BulkActionModal({ action, selectedCount, onClose, onConfirm }: BulkActionModalProps) {
  const [denialReason, setDenialReason] = useState('')
  const [earlyEntry, setEarlyEntry] = useState(true)
  const [requestRound, setRequestRound] = useState(1)
  const [department, setDepartment] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const data: any = {}
    
    switch (action) {
      case 'approve':
        onConfirm({ action: 'approve' })
        break
      case 'deny':
        if (!denialReason) {
          alert('Please provide a reason for denial')
          return
        }
        onConfirm({ action: 'deny', ivsDeniedReason: denialReason })
        break
      case 'setEarlyEntry':
        onConfirm({ action: 'setEarlyEntry', earlyCheckinEligible: earlyEntry })
        break
      case 'changeRound':
        onConfirm({ action: 'changeRound', ivsRequestRound: requestRound })
        break
      case 'changeDepartment':
        if (!department) {
          alert('Please provide a department name')
          return
        }
        onConfirm({ action: 'changeDepartment', ivsSubmittedBy: department })
        break
    }
  }

  const getTitle = () => {
    switch (action) {
      case 'approve': return 'Bulk Approve Volunteers'
      case 'deny': return 'Bulk Deny Volunteers'
      case 'setEarlyEntry': return 'Set Early Entry'
      case 'changeRound': return 'Change Request Round'
      case 'changeDepartment': return 'Change Department'
      default: return 'Bulk Action'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{getTitle()}</h2>
        <p className="text-sm text-gray-600 mb-4">
          This will affect {selectedCount} selected volunteer{selectedCount !== 1 ? 's' : ''}.
        </p>
        
        <form onSubmit={handleSubmit}>
          {action === 'approve' && (
            <div className="mb-4 p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-800">
                All selected volunteers will be marked as "Approved" with the current timestamp and your user ID.
              </p>
            </div>
          )}

          {action === 'deny' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason for Denial *</label>
              <textarea
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Provide a reason for denial..."
                required
              />
            </div>
          )}

          {action === 'setEarlyEntry' && (
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={earlyEntry}
                  onChange={(e) => setEarlyEntry(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Enable Early Check-In</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {earlyEntry ? 'Volunteers will be eligible for early check-in' : 'Early check-in will be disabled'}
              </p>
            </div>
          )}

          {action === 'changeRound' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Request Round *</label>
              <input
                type="number"
                min="1"
                value={requestRound}
                onChange={(e) => setRequestRound(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          )}

          {action === 'changeDepartment' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Department Name *</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Parking, Security"
                required
              />
            </div>
          )}

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
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
