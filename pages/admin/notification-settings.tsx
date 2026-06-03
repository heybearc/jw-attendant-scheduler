import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { notifyAlert, toast } from '../../lib/ui/toast'

/**
 * Phase 4C Feature #1: Assignment Notification Settings
 * Admin panel to configure notification preferences
 */

interface NotificationSettings {
  assignmentCreated: boolean
  assignmentUpdated: boolean
  assignmentCancelled: boolean
  reminderEnabled: boolean
  reminder24h: boolean
  reminder48h: boolean
  reminder1week: boolean
}

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    assignmentCreated: true,
    assignmentUpdated: true,
    assignmentCancelled: true,
    reminderEnabled: false,
    reminder24h: false,
    reminder48h: false,
    reminder1week: false
  })
  const [emailConfigured, setEmailConfigured] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      
      // Check if email is configured
      const emailCheckResponse = await fetch('/api/admin/email-config/test')
      const emailCheckData = await emailCheckResponse.json()
      setEmailConfigured(emailCheckData.configured || false)
      
      // Load notification settings
      const response = await fetch('/api/admin/notification-settings')
      const data = await response.json()
      
      if (data.success && data.settings) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/admin/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      const data = await response.json()
      
      if (data.success) {
        notifyAlert('✅ Notification settings saved successfully!')
      } else {
        notifyAlert('❌ Failed to save settings: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Save error:', error)
      notifyAlert('❌ Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                📧 Notification Settings
              </h1>
            </div>
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-800"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Email Configuration Warning */}
        {!emailConfigured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Email Not Configured</h3>
                <p className="mt-2 text-sm text-yellow-700">
                  Email notifications are currently disabled because SMTP settings are not configured.
                  Please configure email settings first.
                </p>
                <Link
                  href="/admin/email-config"
                  className="mt-3 inline-block text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                >
                  Configure Email Settings →
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Assignment Notifications */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Assignment Notifications</h2>
            <p className="text-sm text-gray-600 mb-4">
              Automatically send email notifications to volunteers when assignments are created, updated, or cancelled.
            </p>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                <div>
                  <div className="font-medium text-gray-900">Assignment Created</div>
                  <div className="text-sm text-gray-600">Send email when volunteer is assigned to a position</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.assignmentCreated}
                  onChange={() => handleToggle('assignmentCreated')}
                  disabled={!emailConfigured}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                <div>
                  <div className="font-medium text-gray-900">Assignment Updated</div>
                  <div className="text-sm text-gray-600">Send email when assignment details change</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.assignmentUpdated}
                  onChange={() => handleToggle('assignmentUpdated')}
                  disabled={!emailConfigured}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                <div>
                  <div className="font-medium text-gray-900">Assignment Cancelled</div>
                  <div className="text-sm text-gray-600">Send email when assignment is removed</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.assignmentCancelled}
                  onChange={() => handleToggle('assignmentCancelled')}
                  disabled={!emailConfigured}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                />
              </label>
            </div>
          </section>

          {/* Reminder Notifications */}
          <section className="border-t pt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Reminder Notifications</h2>
            <p className="text-sm text-gray-600 mb-4">
              Send automated reminders to volunteers before their assigned events.
            </p>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                <div>
                  <div className="font-medium text-gray-900">Enable Reminders</div>
                  <div className="text-sm text-gray-600">Master toggle for all reminder notifications</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reminderEnabled}
                  onChange={() => handleToggle('reminderEnabled')}
                  disabled={!emailConfigured}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                />
              </label>

              {settings.reminderEnabled && (
                <div className="ml-4 space-y-3 border-l-2 border-blue-200 pl-4">
                  <label className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900">24 Hours Before</div>
                      <div className="text-sm text-gray-600">Send reminder 1 day before event</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.reminder24h}
                      onChange={() => handleToggle('reminder24h')}
                      disabled={!emailConfigured}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900">48 Hours Before</div>
                      <div className="text-sm text-gray-600">Send reminder 2 days before event</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.reminder48h}
                      onChange={() => handleToggle('reminder48h')}
                      disabled={!emailConfigured}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900">1 Week Before</div>
                      <div className="text-sm text-gray-600">Send reminder 7 days before event</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.reminder1week}
                      onChange={() => handleToggle('reminder1week')}
                      disabled={!emailConfigured}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                  </label>
                </div>
              )}
            </div>
          </section>

          {/* Save Button */}
          <div className="border-t pt-6 flex justify-end space-x-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !emailConfigured}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">📚 How Notifications Work</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Notifications are sent automatically when enabled</li>
            <li>Volunteers receive professional HTML emails with event details</li>
            <li>Failed notifications are logged but don't prevent operations</li>
            <li>Reminder notifications require a scheduled job (cron/PM2)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false
      }
    }
  }

  if (session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/events',
        permanent: false
      }
    }
  }

  return {
    props: {}
  }
}
