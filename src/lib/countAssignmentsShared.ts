import { NextApiRequest } from 'next'

const PRIVILEGED_COUNTER_ROLES = ['ADMIN', 'OVERSEER', 'KEYMAN'] as const

export function isPrivilegedCounterRole(role: string | undefined): boolean {
  return !!role && PRIVILEGED_COUNTER_ROLES.includes(role as (typeof PRIVILEGED_COUNTER_ROLES)[number])
}

export function getViewAsVolunteerId(req: NextApiRequest): string | null {
  const value = req.headers['x-view-as-volunteer-id']
  if (!value) return null
  return Array.isArray(value) ? value[0] : value
}

export function isSimulatedMode(req: NextApiRequest): boolean {
  return !!getViewAsVolunteerId(req)
}
