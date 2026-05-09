const STORAGE_KEY = 'adminViewAsVolunteerId'

/** Roles allowed to use volunteer view-as simulation (aligned with dashboard / APIs). */
export const VIEW_AS_SIMULATION_ROLES = [
  'ADMIN',
  'OVERSEER',
  'ASSISTANT_OVERSEER',
  'KEYMAN',
] as const

export function getViewAsVolunteerId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}

export function setViewAsVolunteerId(volunteerId: string | null) {
  if (typeof window === 'undefined') return
  if (!volunteerId) {
    window.localStorage.removeItem(STORAGE_KEY)
  } else {
    window.localStorage.setItem(STORAGE_KEY, volunteerId)
  }
  window.dispatchEvent(new Event('theoshift-view-as-volunteer-changed'))
}

export function getViewAsHeaders(): Record<string, string> {
  const volunteerId = getViewAsVolunteerId()
  if (!volunteerId) return {}
  return {
    'x-view-as-volunteer-id': volunteerId
  }
}
