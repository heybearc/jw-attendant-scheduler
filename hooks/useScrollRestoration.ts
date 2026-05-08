import { useEffect, useRef } from 'react'

const STORAGE_PREFIX = 'theoshift:scrollY:'

/**
 * Persists window scroll position across refresh for this browser tab (sessionStorage).
 * Call with a stable key per logical surface (e.g. router.asPath + tab id).
 * Use ready=false until async content has finished loading so restore runs after layout height is known.
 */
export function useScrollRestoration(storageKey: string, ready = true) {
  const key = `${STORAGE_PREFIX}${storageKey}`
  const restoredRef = useRef(false)

  useEffect(() => {
    restoredRef.current = false
  }, [key])

  useEffect(() => {
    if (!ready || restoredRef.current) return

    const raw = sessionStorage.getItem(key)
    if (raw == null) {
      restoredRef.current = true
      return
    }
    const y = Number(raw)
    if (!Number.isFinite(y) || y < 0) {
      restoredRef.current = true
      return
    }

    let cancelled = false
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) {
          window.scrollTo(0, y)
        }
        restoredRef.current = true
      })
    })

    return () => {
      cancelled = true
    }
  }, [key, ready])

  useEffect(() => {
    if (!ready) return

    let timeout: ReturnType<typeof setTimeout>
    const persist = () => {
      sessionStorage.setItem(key, String(window.scrollY))
    }
    const schedulePersist = () => {
      clearTimeout(timeout)
      timeout = setTimeout(persist, 120)
    }

    window.addEventListener('scroll', schedulePersist, { passive: true })
    window.addEventListener('beforeunload', persist)
    window.addEventListener('pagehide', persist)

    return () => {
      clearTimeout(timeout)
      persist()
      window.removeEventListener('scroll', schedulePersist)
      window.removeEventListener('beforeunload', persist)
      window.removeEventListener('pagehide', persist)
    }
  }, [key, ready])
}
