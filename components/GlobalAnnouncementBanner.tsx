import { useState, useEffect } from 'react'

interface GlobalAnnouncement {
  id: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'URGENT'
  createdAt: string
}

const TYPE_STYLES = {
  URGENT: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-900',
    icon: '🚨',
    titleColor: 'text-red-800',
    dismissColor: 'text-red-400 hover:text-red-600'
  },
  WARNING: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-900',
    icon: '⚠️',
    titleColor: 'text-yellow-800',
    dismissColor: 'text-yellow-400 hover:text-yellow-600'
  },
  INFO: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-900',
    icon: 'ℹ️',
    titleColor: 'text-blue-800',
    dismissColor: 'text-blue-400 hover:text-blue-600'
  }
}

const DISMISSED_KEY = 'theoshift_dismissed_announcements'

function getDismissed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveDismissed(dismissed: Set<string>) {
  try {
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]))
  } catch {
    // ignore
  }
}

export default function GlobalAnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<GlobalAnnouncement[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    setDismissed(getDismissed())

    fetch('/api/global-announcements')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success) setAnnouncements(data.data)
      })
      .catch(() => {})
  }, [])

  const handleDismiss = (id: string) => {
    setDismissed(prev => {
      const next = new Set([...prev, id])
      saveDismissed(next)
      return next
    })
  }

  const visible = announcements.filter(a => !dismissed.has(a.id))

  if (visible.length === 0) return null

  return (
    <div className="space-y-0">
      {visible.map(a => {
        const styles = TYPE_STYLES[a.type] ?? TYPE_STYLES.INFO
        return (
          <div
            key={a.id}
            className={`${styles.bg} border-b ${styles.border} px-4 py-3 ${styles.text}`}
          >
            <div className="max-w-7xl mx-auto flex items-start gap-3">
              <span className="text-lg flex-shrink-0 mt-0.5">{styles.icon}</span>
              <div className="flex-1 min-w-0">
                <span className={`font-semibold ${styles.titleColor}`}>{a.title}</span>
                {a.message && (
                  <span className="ml-2 text-sm">{a.message}</span>
                )}
              </div>
              <button
                onClick={() => handleDismiss(a.id)}
                className={`flex-shrink-0 ${styles.dismissColor} transition-colors ml-2`}
                aria-label="Dismiss announcement"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
