import { useEffect, useMemo, useState } from 'react'
import {
  contactHasAnyInfo,
  IvsDepartmentAssistant,
  IvsDepartmentContact,
  IvsDepartmentContactsMap,
} from '@/lib/ivsDepartmentContacts'
import { notifyAlert, toast } from '../../lib/ui/toast'
import { appConfirmMessage } from '../../lib/ui/confirm'

type Mode = 'manage' | 'lookup'

type Props = {
  eventId: string
  canEdit?: boolean
  mode: Mode
  /** Prefill department lookup (e.g. current Approvals filter) */
  initialDepartment?: string
  className?: string
}

const emptyContact = (): IvsDepartmentContact => ({
  overseerName: '',
  overseerPhone: '',
  overseerEmail: '',
  assistants: [],
})

export default function IvsDepartmentContactsPanel({
  eventId,
  canEdit = false,
  mode,
  initialDepartment = '',
  className = '',
}: Props) {
  const [contacts, setContacts] = useState<IvsDepartmentContactsMap>({})
  const [departments, setDepartments] = useState<string[]>([])
  const [volunteerDepartments, setVolunteerDepartments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDept, setSelectedDept] = useState(initialDepartment)
  const [draft, setDraft] = useState<IvsDepartmentContact>(emptyContact())
  const [newDeptName, setNewDeptName] = useState('')
  const [collapsed, setCollapsed] = useState(mode === 'lookup')

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${eventId}/ivs/department-contacts`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        notifyAlert(data.message || 'Failed to load department contacts')
        return
      }
      const data = await res.json()
      setContacts(data.contacts || {})
      setDepartments(data.departments || [])
      setVolunteerDepartments(data.volunteerDepartments || [])
    } catch (e) {
      console.error(e)
      notifyAlert('Failed to load department contacts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [eventId])

  useEffect(() => {
    if (initialDepartment) setSelectedDept(initialDepartment)
  }, [initialDepartment])

  useEffect(() => {
    if (!selectedDept) {
      setDraft(emptyContact())
      return
    }
    setDraft(
      contacts[selectedDept]
        ? {
            ...emptyContact(),
            ...contacts[selectedDept],
            assistants: [...(contacts[selectedDept].assistants || [])],
          }
        : emptyContact(),
    )
  }, [selectedDept, contacts])

  const departmentOptions = useMemo(() => {
    return Array.from(new Set([...departments, ...Object.keys(contacts)])).sort((a, b) =>
      a.localeCompare(b),
    )
  }, [departments, contacts])

  const selectedContact = selectedDept ? contacts[selectedDept] : undefined
  const selectedIsOnVolunteers = selectedDept
    ? volunteerDepartments.some((d) => d.toLowerCase() === selectedDept.toLowerCase())
    : false

  const saveContact = async () => {
    if (!selectedDept) {
      notifyAlert('Select or add a department first')
      return
    }
    try {
      setSaving(true)
      const next = { ...contacts, [selectedDept]: draft }
      const res = await fetch(`/api/events/${eventId}/ivs/department-contacts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        notifyAlert(data.message || 'Failed to save contacts')
        return
      }
      setContacts(data.contacts || next)
      toast.success('Department contacts saved')
    } catch (e) {
      console.error(e)
      notifyAlert('Failed to save contacts')
    } finally {
      setSaving(false)
    }
  }

  const clearContactInfo = async () => {
    if (!selectedDept) return
    if (
      !(await appConfirmMessage(
        `Clear contact info for “${selectedDept}”? The department stays in the list.`,
      ))
    ) {
      return
    }
    try {
      setSaving(true)
      const next = { ...contacts }
      delete next[selectedDept]
      const res = await fetch(`/api/events/${eventId}/ivs/department-contacts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        notifyAlert(data.message || 'Failed to clear contacts')
        return
      }
      setContacts(data.contacts || next)
      setDraft(emptyContact())
      toast.success('Department contacts cleared')
    } catch (e) {
      console.error(e)
      notifyAlert('Failed to clear contacts')
    } finally {
      setSaving(false)
    }
  }

  const removeDepartment = async () => {
    if (!selectedDept) return

    const message = selectedIsOnVolunteers
      ? `Remove “${selectedDept}” from department contacts?\n\nThis name is still used on IVS volunteer rows, so it will show up again in the list until those volunteers’ department labels are corrected (bulk “Change department name” on Approvals). Contact info for this spelling will be deleted.`
      : `Remove “${selectedDept}” from department contacts? Contact info for this department will be deleted and it will leave the list.`

    if (!(await appConfirmMessage(message))) return

    try {
      setSaving(true)
      const next = { ...contacts }
      delete next[selectedDept]
      const res = await fetch(`/api/events/${eventId}/ivs/department-contacts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        notifyAlert(data.message || 'Failed to remove department')
        return
      }
      const saved = data.contacts || next
      setContacts(saved)
      setDepartments((prev) => prev.filter((d) => d !== selectedDept))
      setSelectedDept('')
      setDraft(emptyContact())
      toast.success(
        selectedIsOnVolunteers
          ? 'Contacts removed — department may reappear until volunteer rows are renamed'
          : 'Department removed',
      )
    } catch (e) {
      console.error(e)
      notifyAlert('Failed to remove department')
    } finally {
      setSaving(false)
    }
  }

  const addAssistant = () => {
    setDraft((prev) => ({
      ...prev,
      assistants: [...(prev.assistants || []), { name: '', phone: '', email: '' }],
    }))
  }

  const updateAssistant = (index: number, patch: Partial<IvsDepartmentAssistant>) => {
    setDraft((prev) => {
      const assistants = [...(prev.assistants || [])]
      assistants[index] = { ...assistants[index], ...patch }
      return { ...prev, assistants }
    })
  }

  const removeAssistant = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      assistants: (prev.assistants || []).filter((_, i) => i !== index),
    }))
  }

  const addDepartment = () => {
    const name = newDeptName.trim()
    if (!name) return
    if (!departmentOptions.includes(name)) {
      setDepartments((prev) => [...prev, name].sort((a, b) => a.localeCompare(b)))
    }
    setSelectedDept(name)
    setNewDeptName('')
  }

  return (
    <div className={`rounded-lg border border-gray-200 bg-white ${className}`}>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full min-h-[44px] px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div>
          <div className="font-semibold text-gray-900">Department contacts</div>
          <div className="text-xs text-gray-500">
            {mode === 'lookup'
              ? 'Look up overseer / assistants when someone is not on the early-entry list'
              : 'Overseer and assistants by IVS department'}
          </div>
        </div>
        <span className="text-gray-500 shrink-0">{collapsed ? '▶' : '▼'}</span>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {loading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 border rounded-md text-base"
                  aria-label="Select department"
                >
                  <option value="">Select department…</option>
                  {departmentOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                      {contactHasAnyInfo(contacts[d]) ? ' •' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {mode === 'manage' && canEdit && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="Add department name…"
                    className="w-full min-h-[44px] px-3 py-2 border rounded-md text-base"
                  />
                  <button
                    type="button"
                    onClick={addDepartment}
                    className="min-h-[44px] px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 shrink-0"
                  >
                    Add
                  </button>
                </div>
              )}

              {!selectedDept ? (
                <p className="text-sm text-gray-500">Choose a department to view contacts.</p>
              ) : mode === 'lookup' ? (
                <ContactReadOnly department={selectedDept} contact={selectedContact} />
              ) : canEdit ? (
                <div className="space-y-3">
                  {selectedIsOnVolunteers ? (
                    <p className="text-xs text-gray-500">
                      This name is used on IVS volunteer rows. To drop a misspelling from the list
                      entirely, rename those volunteers (bulk Change department name), then remove
                      the old spelling here.
                    </p>
                  ) : (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                      Contact-only department (not on any volunteer row). You can remove it from the
                      list if it was added by mistake.
                    </p>
                  )}

                  <Field
                    label="Overseer name"
                    value={draft.overseerName || ''}
                    onChange={(v) => setDraft((p) => ({ ...p, overseerName: v }))}
                  />
                  <Field
                    label="Overseer phone"
                    value={draft.overseerPhone || ''}
                    onChange={(v) => setDraft((p) => ({ ...p, overseerPhone: v }))}
                  />
                  <Field
                    label="Overseer email"
                    value={draft.overseerEmail || ''}
                    onChange={(v) => setDraft((p) => ({ ...p, overseerEmail: v }))}
                  />

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Assistants</h4>
                      <button
                        type="button"
                        onClick={addAssistant}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add assistant
                      </button>
                    </div>
                    {(draft.assistants || []).length === 0 ? (
                      <p className="text-xs text-gray-500">No assistants listed.</p>
                    ) : (
                      <div className="space-y-3">
                        {(draft.assistants || []).map((a, i) => (
                          <div key={i} className="rounded border border-gray-200 p-3 space-y-2">
                            <Field
                              label="Name"
                              value={a.name}
                              onChange={(v) => updateAssistant(i, { name: v })}
                            />
                            <Field
                              label="Phone"
                              value={a.phone || ''}
                              onChange={(v) => updateAssistant(i, { phone: v })}
                            />
                            <Field
                              label="Email"
                              value={a.email || ''}
                              onChange={(v) => updateAssistant(i, { email: v })}
                            />
                            <button
                              type="button"
                              onClick={() => removeAssistant(i)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Remove assistant
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={saveContact}
                      disabled={saving}
                      className="min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save contacts'}
                    </button>
                    {contactHasAnyInfo(contacts[selectedDept]) && (
                      <button
                        type="button"
                        onClick={clearContactInfo}
                        disabled={saving}
                        className="min-h-[44px] px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 disabled:opacity-50"
                      >
                        Clear contact info
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={removeDepartment}
                      disabled={saving}
                      className="min-h-[44px] px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 disabled:opacity-50"
                    >
                      Remove department
                    </button>
                  </div>
                </div>
              ) : (
                <ContactReadOnly department={selectedDept} contact={selectedContact} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[44px] px-3 py-2 border rounded-md text-base"
      />
    </label>
  )
}

function ContactReadOnly({
  department,
  contact,
}: {
  department: string
  contact: IvsDepartmentContact | undefined
}) {
  if (!contactHasAnyInfo(contact)) {
    return (
      <p className="text-sm text-gray-500">
        No contacts saved for <strong>{department}</strong> yet. Add them on the Approvals tab
        (Department contacts).
      </p>
    )
  }

  return (
    <div className="space-y-3 text-sm">
      <div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overseer</div>
        <div className="font-medium text-gray-900">{contact!.overseerName || '—'}</div>
        <ContactLinks phone={contact!.overseerPhone} email={contact!.overseerEmail} />
      </div>
      {(contact!.assistants || []).length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Assistants
          </div>
          <ul className="space-y-2">
            {(contact!.assistants || []).map((a, i) => (
              <li key={i}>
                <div className="font-medium text-gray-900">{a.name || '—'}</div>
                <ContactLinks phone={a.phone} email={a.email} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ContactLinks({ phone, email }: { phone?: string; email?: string }) {
  return (
    <div className="flex flex-wrap gap-3 mt-0.5 text-blue-600">
      {phone ? (
        <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="hover:underline">
          {phone}
        </a>
      ) : null}
      {email ? (
        <a href={`mailto:${email}`} className="hover:underline">
          {email}
        </a>
      ) : null}
    </div>
  )
}
