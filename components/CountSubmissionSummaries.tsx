import type { GroupSubmissionSummary, UngroupedPositionSubmission } from '@/lib/countSessionSubmissionSummaries'

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const date = new Date(iso)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}/${day}/${year} ${hours}:${minutes}`
  } catch {
    return '—'
  }
}

type Props = {
  groups: GroupSubmissionSummary[]
  ungroupedPositions: UngroupedPositionSubmission[]
  /** tighter spacing / typography for enter-count page */
  compact?: boolean
}

export default function CountSubmissionSummaries({
  groups,
  ungroupedPositions,
  compact = false,
}: Props) {
  if (groups.length === 0 && ungroupedPositions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        No count submissions to display yet.
      </div>
    )
  }

  const titleCls = compact ? 'text-base font-semibold text-gray-900' : 'text-lg font-semibold text-gray-900'
  const tableWrap = compact ? 'text-sm' : 'text-sm'

  return (
    <div className="space-y-6">
      {groups.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className={`px-4 py-3 border-b border-gray-200 bg-emerald-50 ${compact ? 'py-2' : ''}`}>
            <h3 className={titleCls}>Station group submissions</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              One agreed count per group (or summed from stations if entered separately).
            </p>
          </div>
          <div className={`overflow-x-auto ${tableWrap}`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stations</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Submitted by</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Submitted at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {groups.map((g) => (
                  <tr key={g.groupId} className={g.source === 'none' ? 'bg-gray-50/80' : ''}>
                    <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{g.groupName}</td>
                    <td className="px-4 py-2 text-gray-700 max-w-xs">
                      <span className="break-words">{g.stationsLabel || '—'}</span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {g.attendeeCount != null ? (
                        <span className="text-lg font-bold text-emerald-700">{g.attendeeCount}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-700 max-w-[200px] break-words">{g.notes || '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{g.submittedBy || '—'}</td>
                    <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatWhen(g.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ungroupedPositions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className={`px-4 py-3 border-b border-gray-200 bg-blue-50 ${compact ? 'py-2' : ''}`}>
            <h3 className={titleCls}>Individual station submissions</h3>
            <p className="text-xs text-gray-600 mt-0.5">Counts entered per station (not part of a station group).</p>
          </div>
          <div className={`overflow-x-auto ${tableWrap}`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Station</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Submitted by</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Submitted at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {ungroupedPositions.map((p) => (
                  <tr key={p.positionId} className={p.attendeeCount == null ? 'bg-amber-50/50' : ''}>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      #{p.positionNumber} {p.positionName}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{p.area || '—'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {p.attendeeCount != null ? (
                        <span className="text-lg font-bold text-blue-700">{p.attendeeCount}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-700 max-w-[200px] break-words">{p.notes || '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{p.submittedBy || '—'}</td>
                    <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatWhen(p.countedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
