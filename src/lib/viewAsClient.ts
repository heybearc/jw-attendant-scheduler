const STORAGE_KEY = 'adminViewAsVolunteerId'

export function getViewAsVolunteerId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}

export function setViewAsVolunteerId(volunteerId: string | null) {
  if (typeof window === 'undefined') return
  if (!volunteerId) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, volunteerId)
}

export function getViewAsHeaders(): Record<string, string> {
  const volunteerId = getViewAsVolunteerId()
  if (!volunteerId) return {}
  return {
    'x-view-as-volunteer-id': volunteerId
  }
}
