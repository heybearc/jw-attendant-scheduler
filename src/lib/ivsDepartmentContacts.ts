/**
 * IVS department contacts stored on events.settings.ivsDepartmentContacts
 * Keyed by department name (matches event_volunteers.ivsSubmittedBy).
 */

export type IvsDepartmentAssistant = {
  name: string
  phone?: string
  email?: string
}

export type IvsDepartmentContact = {
  overseerName?: string
  overseerPhone?: string
  overseerEmail?: string
  assistants?: IvsDepartmentAssistant[]
}

export type IvsDepartmentContactsMap = Record<string, IvsDepartmentContact>

export function readIvsDepartmentContacts(settings: unknown): IvsDepartmentContactsMap {
  if (!settings || typeof settings !== 'object') return {}
  const raw = (settings as Record<string, unknown>).ivsDepartmentContacts
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}

  const out: IvsDepartmentContactsMap = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const dept = key.trim()
    if (!dept || !value || typeof value !== 'object' || Array.isArray(value)) continue
    const v = value as Record<string, unknown>
    const assistantsRaw = Array.isArray(v.assistants) ? v.assistants : []
    out[dept] = {
      overseerName: typeof v.overseerName === 'string' ? v.overseerName.trim() : '',
      overseerPhone: typeof v.overseerPhone === 'string' ? v.overseerPhone.trim() : '',
      overseerEmail: typeof v.overseerEmail === 'string' ? v.overseerEmail.trim() : '',
      assistants: assistantsRaw
        .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object' && !Array.isArray(a))
        .map((a) => ({
          name: typeof a.name === 'string' ? a.name.trim() : '',
          phone: typeof a.phone === 'string' ? a.phone.trim() : '',
          email: typeof a.email === 'string' ? a.email.trim() : '',
        }))
        .filter((a) => a.name || a.phone || a.email),
    }
  }
  return out
}

export function mergeIvsDepartmentContactsIntoSettings(
  settings: unknown,
  contacts: IvsDepartmentContactsMap,
): Record<string, unknown> {
  const base =
    settings && typeof settings === 'object' && !Array.isArray(settings)
      ? { ...(settings as Record<string, unknown>) }
      : {}
  const cleaned: IvsDepartmentContactsMap = {}
  for (const [key, value] of Object.entries(contacts)) {
    const dept = key.trim()
    if (!dept) continue
    const assistants = (value.assistants || []).filter((a) => a.name || a.phone || a.email)
    const entry: IvsDepartmentContact = {
      overseerName: (value.overseerName || '').trim(),
      overseerPhone: (value.overseerPhone || '').trim(),
      overseerEmail: (value.overseerEmail || '').trim(),
      assistants,
    }
    const hasContent =
      entry.overseerName ||
      entry.overseerPhone ||
      entry.overseerEmail ||
      (entry.assistants && entry.assistants.length > 0)
    if (hasContent) cleaned[dept] = entry
  }
  base.ivsDepartmentContacts = cleaned
  return base
}

export function contactHasAnyInfo(contact: IvsDepartmentContact | undefined): boolean {
  if (!contact) return false
  return Boolean(
    contact.overseerName ||
      contact.overseerPhone ||
      contact.overseerEmail ||
      (contact.assistants && contact.assistants.length > 0),
  )
}
