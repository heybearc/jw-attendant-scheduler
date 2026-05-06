import fs from 'fs'
import path from 'path'
import { getDocumentsUploadDir, getUploadsRootAbsolute } from './uploadsPaths'

/**
 * Resolve an uploaded event document to its absolute path under the uploads root.
 * `fileUrl` is stored as `/api/uploads/documents/<storedFileName>` (see documents POST handler).
 * Handles legacy `/uploads/documents/...` and bare filenames.
 *
 * Physical root: `THEOSHIFT_UPLOADS_ROOT` or `{cwd}/public/uploads` (see `uploadsPaths.ts`).
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

  const documentsDir = getDocumentsUploadDir()
  const full = path.join(documentsDir, basenameFile)
  const uploadsRoot = path.resolve(getUploadsRootAbsolute())
  if (!full.startsWith(uploadsRoot)) {
    return ''
  }

  return full
}

export function documentFileExists(fileUrl: string): boolean {
  const p = getDocumentAbsolutePath(fileUrl)
  return Boolean(p && fs.existsSync(p))
}
