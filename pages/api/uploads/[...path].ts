import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { resolveSecurePathUnderUploads } from '@/lib/uploadsPaths'
import { tryPipeUploadFromPeers } from '@/lib/uploadPeerFallback'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { path: pathSegments } = req.query

    if (!pathSegments || !Array.isArray(pathSegments)) {
      return res.status(400).send('Invalid path')
    }

    const peerRelay = req.headers['x-theoshift-peer-relay']

    const fullPath = resolveSecurePathUnderUploads(pathSegments)
    if (!fullPath) {
      return res.status(403).send('Forbidden')
    }

    if (fs.existsSync(fullPath)) {
      return streamLocalFile(fullPath, res)
    }

    /** Prevent A→B→A infinite loops when both nodes lack the file. */
    if (peerRelay) {
      return res.status(404).send('File not found')
    }

    const ok = await tryPipeUploadFromPeers(pathSegments, res, {
      cacheControl: 'public, max-age=31536000'
    })
    if (ok) return

    return res.status(404).send('File not found')
  } catch {
    res.status(500).send('Internal server error')
  }
}

function streamLocalFile(fullPath: string, res: NextApiResponse) {
  const stat = fs.statSync(fullPath)

  const ext = path.extname(fullPath).toLowerCase()
  const contentTypes: { [key: string]: string } = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain'
  }

  const contentType = contentTypes[ext] || 'application/octet-stream'

  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Length', stat.size)
  res.setHeader('Cache-Control', 'public, max-age=31536000')

  const fileStream = fs.createReadStream(fullPath)
  fileStream.pipe(res)
}
