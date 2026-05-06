import fs from 'fs'
import path from 'path'
import {
  getDocumentsUploadDir,
  getLegacyPublicUploadsRootAbsolute,
  getUploadsRootAbsolute,
} from './uploadsPaths'

/**
 * Resolve an uploaded event document to its absolute path under the uploads root.
 * `fileUrl` is stored as `/api/uploads/documents/<storedFileName>` (see documents POST handler).
 * Handles legacy `/uploads/documents/...` and bare filenames.
 *
 * Physical root: `THEOSHIFT_UPLOADS_ROOT` or `{cwd}/public/uploads` (see `uploadsPaths.ts`).
 * When both exist (NFS + legacy), prefers the path where the file actually exists.
 */
export function getDocumentAbsolutePath(fileUrl: string): string {
  const u = fileUrl.trim().split('?')[0] || ''

  let basenameFile = ''

  const apiMatch = u.match(/\/api\/uploads\/documents\/(.+)$/)
  const staticMatch = u.match(/\/uploads\/documents\/(.+)$/)
  if (apiMatch?.[1]) {
    basenameFile = path.basename(apiMatch[1])
  } else if (staticMatch?.[1]) {
    basenameFile = path.basename(staticMatch[1])
  } else {
    const base = path.basename(u)
    if (base && base !== '/' && base !== '.') {
      basenameFile = base
    }
  }

  if (!basenameFile) {
    return ''
  }

  const primaryDir = getDocumentsUploadDir()
  const legacyDocumentsDir = path.join(getLegacyPublicUploadsRootAbsolute(), 'documents')

  const primaryFull = path.resolve(path.join(primaryDir, basenameFile))
  const primaryRoot = path.resolve(getUploadsRootAbsolute())

  const legacyFull = path.resolve(path.join(legacyDocumentsDir, basenameFile))
  const legacyUploadsRoot = path.resolve(getLegacyPublicUploadsRootAbsolute())

  if (primaryFull.startsWith(primaryRoot) && fs.existsSync(primaryFull)) {
    return primaryFull
  }
  if (legacyFull.startsWith(legacyUploadsRoot) && fs.existsSync(legacyFull)) {
    return legacyFull
  }

  if (primaryFull.startsWith(primaryRoot)) {
    return primaryFull
  }
  if (legacyFull.startsWith(legacyUploadsRoot)) {
    return legacyFull
  }

  return ''
}

export function documentFileExists(fileUrl: string): boolean {
  const p = getDocumentAbsolutePath(fileUrl)
  return Boolean(p && fs.existsSync(p))
}
