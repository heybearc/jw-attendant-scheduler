import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

interface VolunteerLoginForm {
  firstName: string
  lastName: string
  congregation: string
  pin: string
}

export default function VolunteerLogin() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<VolunteerLoginForm>({
    firstName: '',
    lastName: '',
    congregation: '',
    pin: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔵 Login form submitted', formData)
    
    if (!formData.firstName || !formData.lastName || !formData.congregation || !formData.pin) {
      console.log('❌ Validation failed - missing fields')
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🔵 Signing in with NextAuth...')
      
      // Use NextAuth's built-in redirect to event selection page
      const result = await signIn('volunteer-pin', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        congregation: formData.congregation,
        pin: formData.pin,
        callbackUrl: '/volunteer/select-event',
        redirect: true
      })

      // If we get here, there was an error (redirect: true navigates away on success)
      
      if (result?.error) {
        setError('Invalid credentials. Please check your information.')
        setLoading(false)
      }
    } catch (error) {
      console.error('❌ Exception during login:', error)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof VolunteerLoginForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <>
      <Head>
        <title>Volunteer Login | TheoShift</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-6 flex justify-center">
              <img
                src="/logo.svg"
                alt="TheoShift Logo"
                className="h-32 w-32 drop-shadow-lg"
              />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Volunteer Access
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your information to view your assignments and documents
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white shadow-xl rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="text-red-400 text-sm">⚠️</div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="off"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="off"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter your last name"
                  required
                />
              </div>

              <div>
                <label htmlFor="congregation" className="block text-sm font-medium text-gray-700 mb-2">
                  Congregation
                </label>
                <input
                  id="congregation"
                  name="congregation"
                  type="text"
                  autoComplete="off"
                  value={formData.congregation}
                  onChange={(e) => handleInputChange('congregation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter your congregation name"
                  required
                />
              </div>

              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                  PIN
                </label>
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={formData.pin}
                  onChange={(e) => handleInputChange('pin', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter your 4-digit PIN"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Your PIN is the last 4 digits of your phone number
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-3">
                  Having trouble signing in?
                </p>
                <Link
                  href="/auth/signin"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Admin/Overseer Login →
                </Link>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-blue-400 text-sm">ℹ️</div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Quick Access for Volunteers
                </h3>
                <p className="text-xs text-blue-700 mt-1">
                  Simply enter your name and congregation to view your assignments, 
                  documents, and oversight contact information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps() {
  return {
    props: {}
  }
}
