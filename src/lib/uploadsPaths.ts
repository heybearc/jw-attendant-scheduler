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

/**
 * Join path segments under uploads root; return null if the result escapes the root.
 */
export function resolveSecurePathUnderUploads(segments: string[]): string | null {
  const safe = sanitizeUploadPathSegments(segments)
  if (!safe) return null
  const root = path.resolve(getUploadsRootAbsolute())
  const resolved = path.resolve(path.join(root, ...safe))
  if (!resolved.startsWith(root)) return null
  return resolved
}
