const STORAGE_KEY = 'adminViewAsVolunteerId'

/** Roles allowed to use volunteer view-as simulation (aligned with dashboard / APIs). */
export const VIEW_AS_SIMULATION_ROLES = [
  'ADMIN',
  'OVERSEER',
  'ASSISTANT_OVERSEER',
  'KEYMAN',
] as const

/** Session roles may not match enum casing; simulation must still apply. */
export function canSimulateVolunteerRole(role: string | undefined): boolean {
  if (!role) return false
  const normalized = role.trim().toUpperCase()
  return (VIEW_AS_SIMULATION_ROLES as readonly string[]).includes(normalized)
}

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
