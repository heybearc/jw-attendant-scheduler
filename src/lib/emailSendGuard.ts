/**
 * Prevent concurrent bulk email jobs for the same key (e.g. eventId).
 * In-memory only — enough to stop double-clicks / gateway retries on one node.
 */

const activeJobs = new Map<string, number>()

/** Returns false if a job with this key is already running. */
export function tryAcquireEmailJob(key: string): boolean {
  if (activeJobs.has(key)) return false
  activeJobs.set(key, Date.now())
  return true
}

export function releaseEmailJob(key: string): void {
  activeJobs.delete(key)
}

export function isEmailJobActive(key: string): boolean {
  return activeJobs.has(key)
}
