/** Client helpers for bulk email confirm + abort. */

export type BulkEmailPreview = {
  recipientCount: number
  estimatedSeconds?: number
  scopeNote?: string
}

export function formatBulkEmailConfirmMessage(preview: BulkEmailPreview): string {
  const n = preview.recipientCount
  const mins = Math.max(1, Math.ceil((preview.estimatedSeconds ?? n * 1.2) / 60))
  const scope = preview.scopeNote ? `\n\n${preview.scopeNote}` : ''
  return (
    `This will email ${n} recipient${n === 1 ? '' : 's'}.\n` +
    `Estimated time: ~${mins} minute${mins === 1 ? '' : 's'} (Gmail-safe pacing).` +
    scope +
    `\n\nIVS-only people are not included.\n\nContinue?`
  )
}

export async function abortEventBulkEmail(
  eventId: string,
  job: string
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`/api/events/${eventId}/bulk-email`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job, action: 'abort' }),
  })
  const data = await res.json().catch(() => ({}))
  return {
    ok: res.ok && data.success !== false,
    message: data.message || data.error || (res.ok ? 'Abort requested' : 'Failed to abort'),
  }
}

export async function fetchBulkEmailJobStatus(eventId: string, job: string) {
  const res = await fetch(
    `/api/events/${eventId}/bulk-email?job=${encodeURIComponent(job)}`,
    { credentials: 'include' }
  )
  return res.json().catch(() => ({ success: false }))
}
