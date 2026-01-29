import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import Link from 'next/link'
import { useRouter } from 'next/router'

/**
 * Phase 4C: Assignment Notifications Help Documentation
 */

export default function AssignmentNotificationsHelp() {
  const router = useRouter()

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
                📧 Assignment Notifications
              </h1>
            </div>
            <Link
              href="/help"
              className="text-blue-600 hover:text-blue-800"
            >
              Help Center
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Overview */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-700 leading-relaxed">
              Assignment notifications automatically send email updates to volunteers when they are assigned to positions, 
              when their assignments change, or when assignments are cancelled. This keeps everyone informed and reduces 
              the need for manual communication.
            </p>
          </section>

          {/* Notification Types */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Types</h2>
            
            <div className="space-y-6">
              {/* Assignment Created */}
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">✅ Assignment Created</h3>
                <p className="text-gray-700 mb-2">
                  Sent when a volunteer is assigned to a position for the first time.
                </p>
                <div className="bg-gray-50 rounded p-3 text-sm">
                  <strong>Includes:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                    <li>Event name, date, and location</li>
                    <li>Position name and number</li>
                    <li>Shift start and end times</li>
                    <li>Overseer contact information</li>
                    <li>Special instructions or notes</li>
                    <li>Link to view full assignment details</li>
                  </ul>
                </div>
              </div>

              {/* Assignment Updated */}
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">🔄 Assignment Updated</h3>
                <p className="text-gray-700 mb-2">
                  Sent when an existing assignment is modified.
                </p>
                <div className="bg-gray-50 rounded p-3 text-sm">
                  <strong>Includes:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                    <li>Summary of what changed</li>
                    <li>Updated assignment details</li>
                    <li>New shift times (if changed)</li>
                    <li>Link to view updated assignment</li>
                  </ul>
                </div>
              </div>

              {/* Assignment Cancelled */}
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">❌ Assignment Cancelled</h3>
                <p className="text-gray-700 mb-2">
                  Sent when an assignment is removed or cancelled.
                </p>
                <div className="bg-gray-50 rounded p-3 text-sm">
                  <strong>Includes:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                    <li>Event and position details</li>
                    <li>Who cancelled the assignment</li>
                    <li>Reason for cancellation (if provided)</li>
                    <li>Confirmation that no action is required</li>
                  </ul>
                </div>
              </div>

              {/* Assignment Reminder */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">⏰ Assignment Reminder</h3>
                <p className="text-gray-700 mb-2">
                  Sent 24 hours before an event as a friendly reminder.
                </p>
                <div className="bg-gray-50 rounded p-3 text-sm">
                  <strong>Includes:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                    <li>Countdown to event start time</li>
                    <li>Complete assignment details</li>
                    <li>Pre-assignment checklist</li>
                    <li>Overseer contact information</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Automatic Sending</h4>
                  <p className="text-gray-600">
                    Notifications are sent automatically when you create, update, or delete assignments through the system.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Email Configuration Required</h4>
                  <p className="text-gray-600">
                    Your system administrator must configure SMTP email settings before notifications can be sent.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Graceful Fallback</h4>
                  <p className="text-gray-600">
                    If email is not configured, assignments still work normally - notifications just won't be sent.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Professional Branding</h4>
                  <p className="text-gray-600">
                    All emails use professional TheoShift branding and are mobile-responsive.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* For Administrators */}
          <section className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">👨‍💼 For Administrators</h2>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Email Configuration</h4>
                <p className="text-gray-700 mb-2">
                  To enable assignment notifications, configure SMTP settings in the admin panel:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-4">
                  <li>Go to Admin → Email Configuration</li>
                  <li>Enter your SMTP server details (Gmail, Outlook, etc.)</li>
                  <li>Test the configuration</li>
                  <li>Save settings</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Environment Variables</h4>
                <p className="text-gray-700 mb-2">
                  Required environment variables:
                </p>
                <div className="bg-white rounded p-3 font-mono text-sm text-gray-600">
                  SMTP_HOST=smtp.gmail.com<br/>
                  SMTP_PORT=587<br/>
                  SMTP_USER=your-email@gmail.com<br/>
                  SMTP_PASSWORD=your-app-password<br/>
                  EMAIL_FROM_NAME=Theocratic Shift Scheduler
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Testing Notifications</h4>
                <p className="text-gray-700">
                  Create a test assignment to yourself to verify notifications are working correctly.
                </p>
              </div>
            </div>
          </section>

          {/* For Overseers */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">👥 For Overseers</h2>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Creating Assignments</h4>
                <p className="text-gray-700">
                  When you assign a volunteer to a position, they will automatically receive an email notification 
                  with all the details they need.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Updating Assignments</h4>
                <p className="text-gray-700">
                  If you change shift times or other details, the volunteer will receive an update notification 
                  showing what changed.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Cancelling Assignments</h4>
                <p className="text-gray-700">
                  When you remove an assignment, the volunteer will be notified that they are no longer required 
                  for that position.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Your Contact Info</h4>
                <p className="text-gray-700">
                  Your name, email, and phone number (if provided) will be included in assignment notifications 
                  so volunteers can contact you with questions.
                </p>
              </div>
            </div>
          </section>

          {/* For Volunteers */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">🙋 For Volunteers</h2>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Receiving Notifications</h4>
                <p className="text-gray-700">
                  You'll receive email notifications at the email address associated with your account when:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4 mt-2">
                  <li>You're assigned to a new position</li>
                  <li>Your assignment details change</li>
                  <li>Your assignment is cancelled</li>
                  <li>24 hours before your assignment (reminder)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What to Do</h4>
                <p className="text-gray-700">
                  When you receive a notification:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-4 mt-2">
                  <li>Read the email carefully for all details</li>
                  <li>Note the date, time, and position</li>
                  <li>Contact your overseer if you have questions</li>
                  <li>Click the link to view full details in the system</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can't Fulfill Assignment?</h4>
                <p className="text-gray-700">
                  If you cannot fulfill an assignment, contact your overseer immediately using the contact 
                  information provided in the email.
                </p>
              </div>
            </div>
          </section>

          {/* Troubleshooting */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">🔧 Troubleshooting</h2>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Not Receiving Emails?</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                  <li>Check your spam/junk folder</li>
                  <li>Verify your email address is correct in your profile</li>
                  <li>Contact your administrator to verify email is configured</li>
                  <li>Add the sender email to your contacts</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Email Looks Wrong?</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                  <li>Try viewing the email in a different email client</li>
                  <li>Enable HTML email viewing in your email settings</li>
                  <li>Check if images are blocked by your email client</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Notifications Not Sending?</h4>
                <p className="text-gray-700">
                  Administrators should:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                  <li>Verify SMTP settings are correct</li>
                  <li>Check server logs for error messages</li>
                  <li>Test email configuration in admin panel</li>
                  <li>Ensure firewall allows SMTP connections</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section className="bg-green-50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">✨ Best Practices</h2>
            
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-gray-700">
                  <strong>Keep profiles updated:</strong> Ensure all volunteers have current email addresses
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-gray-700">
                  <strong>Include notes:</strong> Add special instructions to assignments for clarity
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-gray-700">
                  <strong>Provide reasons:</strong> When cancelling, include a brief reason for context
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-gray-700">
                  <strong>Test first:</strong> Create test assignments to verify notifications work
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-gray-700">
                  <strong>Monitor delivery:</strong> Check with volunteers that they're receiving emails
                </span>
              </li>
            </ul>
          </section>

          {/* Related Help Topics */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">📚 Related Help Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/help/managing-assignments"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <h4 className="font-semibold text-gray-900 mb-1">Managing Assignments</h4>
                <p className="text-sm text-gray-600">Learn how to create and manage position assignments</p>
              </Link>
              <Link
                href="/help/event-management"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <h4 className="font-semibold text-gray-900 mb-1">Event Management</h4>
                <p className="text-sm text-gray-600">Complete guide to managing events</p>
              </Link>
              <Link
                href="/help/volunteer-management"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <h4 className="font-semibold text-gray-900 mb-1">Volunteer Management</h4>
                <p className="text-sm text-gray-600">Managing volunteer profiles and information</p>
              </Link>
              <Link
                href="/help/troubleshooting"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <h4 className="font-semibold text-gray-900 mb-1">Troubleshooting</h4>
                <p className="text-sm text-gray-600">Common issues and solutions</p>
              </Link>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Need more help? Contact your system administrator or overseer.
            </p>
          </div>
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

  return {
    props: {}
  }
}
