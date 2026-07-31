import { useCallback, useEffect, useState } from 'react'
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/formatPhone'
import { getViewAsHeaders } from '@/lib/viewAsClient'
import { notifyAlert, toast } from '../lib/ui/toast'

type Submission = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  congregation: string
  department: string
  approvalStatus: string
  submittedAt: string
}

interface IvsVolunteerRequestPanelProps {
  eventId: string
}

export default function IvsVolunteerRequestPanel({ eventId }: IvsVolunteerRequestPanelProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [congregation, setCongregation] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState('')
  const [notes, setNotes] = useState('')
  const [earlyFri, setEarlyFri] = useState(false)
  const [earlySat, setEarlySat] = useState(false)
  const [earlySun, setEarlySun] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingList, setLoadingList] = useState(true)

  const loadSubmissions = useCallback(async () => {
    try {
      setLoadingList(true)
      const res = await fetch(`/api/volunteer/ivs/request?eventId=${encodeURIComponent(eventId)}`, {
        headers: { ...getViewAsHeaders() },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setSubmissions(data.submissions || [])
      }
    } catch (err) {
      console.error('Failed to load IVS submissions', err)
    } finally {
      setLoadingList(false)
    }
  }, [eventId])

  useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setCongregation('')
    setEmail('')
    setPhone('')
    setDepartment('')
    setNotes('')
    setEarlyFri(false)
    setEarlySat(false)
    setEarlySun(false)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fn = firstName.trim()
    const ln = lastName.trim()
    const cong = congregation.trim()
    const em = email.trim().toLowerCase()
    const ph = phone.trim()

    if (!fn || !ln || !cong || !em || !ph) {
      setError('First name, last name, congregation, email, and phone are required')
      return
    }
    if (!em.includes('@')) {
      setError('Enter a valid email address')
      return
    }
    if (!isValidPhoneNumber(ph)) {
      setError('Enter a valid 10-digit phone number')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/volunteer/ivs/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getViewAsHeaders(),
        },
        body: JSON.stringify({
          eventId,
          firstName: fn,
          lastName: ln,
          congregation: cong,
          email: em,
          phone: ph,
          department: department.trim() || undefined,
          notes: notes.trim() || undefined,
          earlyEntry: {
            friday: earlyFri,
            saturday: earlySat,
            sunday: earlySun,
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || 'Failed to submit request')
        notifyAlert(data.message || 'Failed to submit request')
        return
      }
      toast.success(data.message || 'Request submitted')
      resetForm()
      loadSubmissions()
    } catch (err) {
      console.error(err)
      setError('Failed to submit request')
      notifyAlert('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Request IVS Volunteer</h2>
        <p className="text-sm text-gray-600 mb-4">
          Submit someone for IVS approval. They start as <strong>Pending</strong> until staff approve them.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md text-base"
                required
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md text-base"
                required
                autoComplete="family-name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Congregation *</label>
            <input
              type="text"
              value={congregation}
              onChange={(e) => setCongregation(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md text-base"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md text-base"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md text-base"
                required
                placeholder="(555) 123-4567"
                autoComplete="tel"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department (optional)</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md text-base"
              placeholder="e.g., Parking, Security"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Early entry days (optional)</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2 min-h-[44px]">
                <input type="checkbox" checked={earlyFri} onChange={(e) => setEarlyFri(e.target.checked)} />
                Friday
              </label>
              <label className="inline-flex items-center gap-2 min-h-[44px]">
                <input type="checkbox" checked={earlySat} onChange={(e) => setEarlySat(e.target.checked)} />
                Saturday
              </label>
              <label className="inline-flex items-center gap-2 min-h-[44px]">
                <input type="checkbox" checked={earlySun} onChange={(e) => setEarlySun(e.target.checked)} />
                Sunday
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit for approval'}
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">My submissions</h3>
        {loadingList ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="text-sm text-gray-500">You have not submitted any requests yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {submissions.map((s) => (
              <li key={s.id} className="py-3">
                <div className="font-medium text-gray-900">
                  {s.firstName} {s.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {s.congregation}
                  {s.department ? ` · ${s.department}` : ''}
                </div>
                <div className="text-sm text-gray-600 break-all">
                  {s.email} · {s.phone}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded font-semibold ${
                      s.approvalStatus === 'Approved'
                        ? 'bg-green-100 text-green-800'
                        : s.approvalStatus === 'Not Approved'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {s.approvalStatus}
                  </span>
                  <span className="text-gray-500">
                    {new Date(s.submittedAt).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
