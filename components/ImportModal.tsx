import { useState } from 'react'

interface ImportModalProps {
  onClose: () => void
  onImport: (file: File, round: number, dept?: string) => void
}

export default function ImportModal({ onClose, onImport }: ImportModalProps) {
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
