/**
 * @deprecated Prefer `@/lib/bulkEmailJob` — kept as a thin re-export for existing imports.
 */
export {
  tryAcquireEmailJob,
  releaseEmailJob,
  isEmailJobActive,
  abortBulkEmailJob,
  getBulkEmailJob,
  bulkEmailJobKey,
  runThrottledBulkEmail,
  estimateBulkEmailDurationSeconds,
  uniqueByEmail,
} from './bulkEmailJob'
