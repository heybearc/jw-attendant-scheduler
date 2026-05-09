import { useEffect, useState } from 'react'

type Props = {
  /** Same-origin path, e.g. `/api/events/…/documents/…/file` */
  apiPath: string
  title: string
}

/**
 * iOS Safari / Chrome often render a black iframe when pointed at a streaming
 * authenticated PDF URL. Fetch with credentials and display a blob URL instead.
 */
export default function VolunteerPdfViewer({ apiPath, title }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    const revokeRef = { current: null as string | null }

    setPhase('loading')
    setMessage(null)
    setBlobUrl(null)

    ;(async () => {
      try {
        const res = await fetch(apiPath, { credentials: 'include', signal: ac.signal })
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Session expired. Go back and sign in again.')
          }
          if (res.status === 403) {
            throw new Error('You do not have access to this document.')
          }
          throw new Error(`Could not load document (${res.status}).`)
        }
        const blob = await res.blob()
        if (ac.signal.aborted) return
        const url = URL.createObjectURL(blob)
        if (ac.signal.aborted) {
          URL.revokeObjectURL(url)
          return
        }
        revokeRef.current = url
        setBlobUrl(url)
        setPhase('ready')
      } catch (e: unknown) {
        if (ac.signal.aborted) return
        if (e instanceof DOMException && e.name === 'AbortError') return
        setPhase('error')
        setMessage(e instanceof Error ? e.message : 'Failed to load PDF.')
      }
    })()

    return () => {
      ac.abort()
      if (revokeRef.current) {
        URL.revokeObjectURL(revokeRef.current)
        revokeRef.current = null
      }
    }
  }, [apiPath])

  return (
    <div className="relative flex-1 min-h-0 w-full bg-black">
      {phase === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 z-10">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent" />
          <p className="text-sm text-gray-300">Loading document…</p>
        </div>
      )}
      {phase === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center gap-4">
          <p className="text-sm text-gray-300">{message}</p>
          <a
            href={apiPath}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium touch-manipulation"
          >
            Open PDF in browser
          </a>
        </div>
      )}
      {phase === 'ready' && blobUrl && (
        <>
          <iframe src={blobUrl} className="absolute inset-0 w-full h-full border-0" title={title} />
          <a
            href={apiPath}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 z-20 rounded-md bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm touch-manipulation"
          >
            Open in browser
          </a>
        </>
      )}
    </div>
  )
}
