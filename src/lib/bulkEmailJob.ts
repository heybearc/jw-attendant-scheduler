/**
 * In-process bulk email jobs with throttle + abort.
 * Gmail-safe default: ~1 message / 1.2s (~50/min), well under typical SMTP burst limits.
 */

export type BulkEmailRecipient = {
  email: string
  firstName?: string
  lastName?: string
  id?: string
}

export type BulkEmailJobSnapshot = {
  key: string
  eventId: string
  kind: string
  total: number
  sent: number
  failed: number
  aborted: boolean
  done: boolean
  startedAt: number
  finishedAt: number | null
  estimatedSecondsRemaining: number | null
}

type InternalJob = BulkEmailJobSnapshot & {
  abortRequested: boolean
}

const jobs = new Map<string, InternalJob>()
const activeKeys = new Set<string>()

const DEFAULT_DELAY_MS = 1200

function delayMs(): number {
  const raw = Number(process.env.BULK_EMAIL_DELAY_MS)
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_DELAY_MS
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function bulkEmailJobKey(eventId: string, kind: string): string {
  return `${kind}:${eventId}`
}

export function tryAcquireEmailJob(key: string): boolean {
  if (activeKeys.has(key)) return false
  activeKeys.add(key)
  return true
}

export function releaseEmailJob(key: string): void {
  activeKeys.delete(key)
}

export function isEmailJobActive(key: string): boolean {
  return activeKeys.has(key)
}

export function getBulkEmailJob(key: string): BulkEmailJobSnapshot | null {
  const job = jobs.get(key)
  if (!job) return null
  const d = delayMs()
  const remaining = Math.max(0, job.total - job.sent - job.failed)
  return {
    key: job.key,
    eventId: job.eventId,
    kind: job.kind,
    total: job.total,
    sent: job.sent,
    failed: job.failed,
    aborted: job.aborted,
    done: job.done,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    estimatedSecondsRemaining:
      job.done || d <= 0 ? 0 : Math.ceil((remaining * d) / 1000),
  }
}

/** Request abort; in-flight send finishes, then the loop stops. */
export function abortBulkEmailJob(key: string): boolean {
  const job = jobs.get(key)
  if (!job || job.done) return false
  job.abortRequested = true
  return true
}

export function estimateBulkEmailDurationSeconds(recipientCount: number): number {
  const d = delayMs()
  if (recipientCount <= 0) return 0
  return Math.ceil((recipientCount * Math.max(d, 0)) / 1000)
}

/**
 * Run sends sequentially with delay. Caller must have acquired the job key.
 * Releases the key in `finally`.
 */
export async function runThrottledBulkEmail(params: {
  eventId: string
  kind: string
  recipients: BulkEmailRecipient[]
  sendOne: (recipient: BulkEmailRecipient) => Promise<void>
  onProgress?: (snap: BulkEmailJobSnapshot) => void
}): Promise<BulkEmailJobSnapshot> {
  const key = bulkEmailJobKey(params.eventId, params.kind)
  const job: InternalJob = {
    key,
    eventId: params.eventId,
    kind: params.kind,
    total: params.recipients.length,
    sent: 0,
    failed: 0,
    aborted: false,
    done: false,
    startedAt: Date.now(),
    finishedAt: null,
    estimatedSecondsRemaining: estimateBulkEmailDurationSeconds(params.recipients.length),
    abortRequested: false,
  }
  jobs.set(key, job)

  const d = delayMs()
  try {
    for (let i = 0; i < params.recipients.length; i++) {
      if (job.abortRequested) {
        job.aborted = true
        break
      }
      const recipient = params.recipients[i]
      try {
        await params.sendOne(recipient)
        job.sent++
      } catch (err) {
        job.failed++
        console.error(
          `[bulk-email] ${key} failed ${recipient.email}:`,
          err instanceof Error ? err.message : err
        )
      }
      params.onProgress?.(getBulkEmailJob(key)!)
      // Delay between messages (skip after last if done/abort)
      if (i < params.recipients.length - 1 && !job.abortRequested && d > 0) {
        await sleep(d)
      }
    }
  } finally {
    job.done = true
    job.finishedAt = Date.now()
    releaseEmailJob(key)
    params.onProgress?.(getBulkEmailJob(key)!)
  }

  return getBulkEmailJob(key)!
}

/** Deduplicate by lowercased email. */
export function uniqueByEmail<T extends { email: string }>(rows: T[]): T[] {
  const seen = new Set<string>()
  return rows.filter((r) => {
    const key = r.email.trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}
