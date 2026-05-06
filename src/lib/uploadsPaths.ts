import fs from 'fs'
import path from 'path'

/** Dynamic lookup so Next/webpack does not inline `process.env.THEOSHIFT_UPLOADS_ROOT` from the build CI env (undefined). */
function readHostEnv(name: string): string {
  if (typeof process === 'undefined') return ''
  const v = process.env[name]
  return typeof v === 'string' ? v.trim() : ''
}

/**
 * Absolute directory that contains `documents/`, `feedback/`, etc.
 * Default: `{cwd}/public/uploads` (backward compatible).
 *
 * For blue/green: mount shared storage (e.g. NFS) at the same path on both nodes and set:
 *   THEOSHIFT_UPLOADS_ROOT=/mnt/theoshift-shared/uploads
 *
 * Uses bracket/dynamic env reads so production `next start` sees the host `.env`, not build-time inlining.
 */
export function getUploadsRootAbsolute(): string {
  const env = readHostEnv('THEOSHIFT_UPLOADS_ROOT')
  if (env) return path.resolve(env)
  return path.join(process.cwd(), 'public', 'uploads')
}

export function getDocumentsUploadDir(): string {
  return path.join(getUploadsRootAbsolute(), 'documents')
}

/** Ensure documents dir exists (upload handlers). */
export function ensureDocumentsUploadDir(): void {
  const dir = getDocumentsUploadDir()
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/** Reject path traversal or odd segments in `/api/uploads/[...path]`. */
export function sanitizeUploadPathSegments(segments: string[]): string[] | null {
  const out: string[] = []
  for (const s of segments) {
    if (!s || s === '.' || s === '..') return null
    if (s.includes('/') || s.includes('\\')) return null
    out.push(s)
  }
  return out
}

/** Legacy single-node path (same layout as `THEOSHIFT_UPLOADS_ROOT`). */
export function getLegacyPublicUploadsRootAbsolute(): string {
  return path.resolve(path.join(process.cwd(), 'public', 'uploads'))
}

/**
 * Join path segments under uploads root; return null if the result escapes allowed roots.
 * Checks configured root first, then `public/uploads` (split-brain during NFS migration).
 */
export function resolveSecurePathUnderUploads(segments: string[]): string | null {
  const safe = sanitizeUploadPathSegments(segments)
  if (!safe) return null
  const primaryRoot = path.resolve(getUploadsRootAbsolute())
  const legacyRoot = path.resolve(getLegacyPublicUploadsRootAbsolute())
  const primaryResolved = path.resolve(path.join(primaryRoot, ...safe))
  const legacyResolved = path.resolve(path.join(legacyRoot, ...safe))

  if (primaryResolved.startsWith(primaryRoot) && fs.existsSync(primaryResolved)) {
    return primaryResolved
  }
  if (legacyResolved.startsWith(legacyRoot) && fs.existsSync(legacyResolved)) {
    return legacyResolved
  }
  if (primaryResolved.startsWith(primaryRoot)) return primaryResolved
  if (legacyResolved.startsWith(legacyRoot)) return legacyResolved
  return null
}
