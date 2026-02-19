import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import HelpLayout from '../../components/HelpLayout'

export default function GlobalAnnouncementsHelp() {
  return (
    <HelpLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">📢 Global Announcements</h1>

        <div className="prose max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            Global Announcements let administrators post system-wide messages that appear across the application — useful for maintenance notices, important updates, or urgent alerts.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Announcements</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-3">
              Go to <strong>Admin → Global Announcements</strong> to manage all system-wide messages.
            </p>
            <p className="text-gray-700 mb-3">From this page you can:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>View all current and past announcements</li>
              <li>Create new announcements</li>
              <li>Edit existing announcements</li>
              <li>Activate or deactivate announcements</li>
              <li>Delete announcements that are no longer needed</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Creating an Announcement</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <ol className="list-decimal list-inside text-gray-700 space-y-3">
              <li>Click <strong>New Announcement</strong></li>
              <li>Enter a short <strong>Title</strong> (shown as the headline)</li>
              <li>Enter the <strong>Message</strong> (the full announcement text)</li>
              <li>Choose a <strong>Type</strong>:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>Info</strong> — General information (blue)</li>
                  <li><strong>Warning</strong> — Something users should be aware of (yellow)</li>
                  <li><strong>Urgent</strong> — Requires immediate attention (red)</li>
                </ul>
              </li>
              <li>Optionally set a <strong>Start Date</strong> and <strong>End Date</strong> to control when it appears</li>
              <li>Click <strong>Save</strong></li>
            </ol>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
              <p className="font-semibold text-blue-800">💡 Tip</p>
              <p className="text-blue-700 mb-0">
                New announcements are inactive by default. Toggle them active when you're ready for users to see them.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Announcement Types</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">ℹ️ Info</span>
                <p className="text-gray-700 mt-1">Use for general notices — scheduled maintenance, new features, or reminders.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded">⚠️ Warning</span>
                <p className="text-gray-700 mt-1">Use when users should take caution — known issues, temporary limitations, or upcoming changes.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded">🚨 Urgent</span>
                <p className="text-gray-700 mt-1">Use for critical situations requiring immediate action — outages, data issues, or emergency notices.</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Activating and Deactivating</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-3">
              Each announcement has an <strong>Active</strong> toggle. Only active announcements are shown to users.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Toggle <strong>Active</strong> on to make an announcement visible</li>
              <li>Toggle <strong>Active</strong> off to hide it without deleting it</li>
              <li>Use <strong>Start/End dates</strong> to automatically control visibility by date</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Questions</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Who can see announcements?</h3>
              <p className="text-gray-700">All logged-in users will see active announcements.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Who can create announcements?</h3>
              <p className="text-gray-700">Only Administrators can create and manage global announcements.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Can I schedule an announcement in advance?</h3>
              <p className="text-gray-700">Yes — set a Start Date and the announcement will only appear from that date onward. Set an End Date to automatically stop showing it.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">How many announcements can I have active at once?</h3>
              <p className="text-gray-700">There is no hard limit, but we recommend keeping active announcements to a minimum so users don't experience alert fatigue.</p>
            </div>
          </div>

        </div>
      </div>
    </HelpLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  if (session.user?.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/help',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
