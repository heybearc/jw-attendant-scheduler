import fs from 'fs'
import path from 'path'

/**
 * Resolve an uploaded event document to its absolute path under `public/uploads`.
 * `fileUrl` is stored as `/api/uploads/documents/<storedFileName>` (see documents POST handler).
 * Handles legacy `/uploads/documents/...` and bare filenames.
 */
export function getDocumentAbsolutePath(fileUrl: string): string {
  const u = fileUrl.trim().split('?')[0] || ''

  let relativeUnderPublic = ''

  const apiMatch = u.match(/\/api\/uploads\/documents\/(.+)$/)
  const staticMatch = u.match(/\/uploads\/documents\/(.+)$/)
  if (apiMatch?.[1]) {
    relativeUnderPublic = path.join('uploads', 'documents', path.basename(apiMatch[1]))
  } else if (staticMatch?.[1]) {
    relativeUnderPublic = path.join('uploads', 'documents', path.basename(staticMatch[1]))
  } else {
    const base = path.basename(u)
    if (base && base !== '/' && base !== '.') {
      relativeUnderPublic = path.join('uploads', 'documents', base)
    }
  }

  if (!relativeUnderPublic) {
    return ''
  }

  const full = path.join(process.cwd(), 'public', relativeUnderPublic)
  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads')
  if (!full.startsWith(uploadsRoot)) {
    return ''
  }

  return full
}

export function documentFileExists(fileUrl: string): boolean {
  const p = getDocumentAbsolutePath(fileUrl)
  return Boolean(p && fs.existsSync(p))
}
