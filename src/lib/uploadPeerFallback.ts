import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import type { NextApiResponse } from 'next'

function readHostEnv(name: string): string {
  if (typeof process === 'undefined') return ''
  const v = process.env[name]
  return typeof v === 'string' ? v.trim() : ''
}

function peerUrlsRaw(): string {
  return readHostEnv('THEOSHIFT_UPLOAD_PEER_URLS')
}

/**
 * Comma-separated base URLs of TheoShift nodes (scheme + host + port, no trailing slash).
 * Used when a file is missing locally after blue/green traffic switches (upload landed on the peer).
 *
 * Override if nodes or ports change.
 */
export function getPeerUploadBaseUrls(): string[] {
  const raw =
    peerUrlsRaw() ||
    'http://10.92.3.24:3001,http://10.92.3.22:3001'
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

export type PeerPipeHeaders = {
  contentTypeHint?: string
  contentDisposition?: string
  cacheControl?: string
}

/**
 * GET each peer's `/api/uploads/<segments>` and pipe the first successful response to `res`.
 */
export async function tryPipeUploadFromPeers(
  pathSegments: string[],
  res: NextApiResponse,
  headers: PeerPipeHeaders = {}
): Promise<boolean> {
  if (pathSegments.length === 0) return false

  const pathPart = pathSegments.map((s) => encodeURIComponent(s)).join('/')

  for (const base of getPeerUploadBaseUrls()) {
    const url = `${base}/api/uploads/${pathPart}`
    try {
      const peerRes = await fetch(url, {
        method: 'GET',
        headers: { 'X-TheoShift-Peer-Relay': '1' }
      })
      if (!peerRes.ok || !peerRes.body) continue

      const ct =
        peerRes.headers.get('content-type') ||
        headers.contentTypeHint ||
        'application/octet-stream'
      const len = peerRes.headers.get('content-length')
      res.setHeader('Content-Type', ct)
      if (len) res.setHeader('Content-Length', len)
      res.setHeader('Cache-Control', headers.cacheControl ?? 'public, max-age=3600')
      if (headers.contentDisposition) {
        res.setHeader('Content-Disposition', headers.contentDisposition)
      }

      const nodeStream = Readable.fromWeb(peerRes.body as any)
      await pipeline(nodeStream, res)
      return true
    } catch {
      continue
    }
  }
  return false
}
