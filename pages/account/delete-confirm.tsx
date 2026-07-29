import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

type ConfirmationDetails = {
  name: string
  assignmentCount: number
}

export default function ConfirmAccountDeletionPage() {
  const router = useRouter()
  const token = typeof router.query.token === 'string' ? router.query.token : ''
  const [details, setDetails] = useState<ConfirmationDetails | null>(null)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  useEffect(() => {
    if (!router.isReady || !token) return
    ;(async () => {
      try {
        const response = await fetch(
          `/api/profile/delete-confirm?token=${encodeURIComponent(token)}`
        )
        const data = await response.json()
        if (!data.success) {
          setError(data.error || 'This confirmation link is invalid')
          return
        }
        setDetails(data.data)
      } catch {
        setError('Unable to verify this confirmation link')
      }
    })()
  }, [router.isReady, token])

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      const response = await fetch('/api/profile/delete-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, confirmation })
      })
      const data = await response.json()
      if (!data.success) {
        setError(data.error || 'Failed to delete account')
        return
      }
      setDeleted(true)
    } catch {
      setError('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Confirm Account Deletion | TheoShift</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <img src="/logo.svg" alt="TheoShift" className="h-14 w-14 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900 mt-3">
              Confirm account deletion
            </h1>
          </div>

          {deleted ? (
            <div className="text-center">
              <div className="rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
                Your account and personal information have been permanently deleted.
              </div>
              <Link
                href="/auth/signin"
                className="inline-block mt-5 text-blue-600 hover:text-blue-800"
              >
                Return to sign in
              </Link>
            </div>
          ) : error && !details ? (
            <div className="text-center">
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
              </div>
              <Link
                href="/auth/signin"
                className="inline-block mt-5 text-blue-600 hover:text-blue-800"
              >
                Return to sign in
              </Link>
            </div>
          ) : !details ? (
            <div className="text-center text-gray-600">Verifying link…</div>
          ) : (
            <div>
              <p className="text-gray-700">
                You are about to permanently delete the TheoShift account for{' '}
                <strong>{details.name}</strong>.
              </p>
              {details.assignmentCount > 0 && (
                <p className="mt-3 text-gray-700">
                  This will also remove{' '}
                  <strong>
                    {details.assignmentCount} position assignment
                    {details.assignmentCount === 1 ? '' : 's'}
                  </strong>{' '}
                  so active schedules remain accurate.
                </p>
              )}
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                This action cannot be undone.
              </div>

              <label className="block text-sm font-medium text-gray-700 mt-5 mb-1">
                Type <span className="font-mono font-semibold">DELETE</span> to confirm
              </label>
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                autoComplete="off"
                placeholder="DELETE"
              />

              {error && (
                <p className="mt-3 text-sm text-red-700">{error}</p>
              )}

              <div className="flex items-center justify-between gap-3 mt-5">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={
                    deleting || confirmation.trim().toUpperCase() !== 'DELETE'
                  }
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-md"
                >
                  {deleting ? 'Deleting…' : 'Permanently delete account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
