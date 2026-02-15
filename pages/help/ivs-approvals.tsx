import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'

export default function IVSApprovalsHelp() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📋 IVS Module
            </h1>
            <p className="text-gray-600">
              Manage International Volunteer Service (IVS) volunteers for your event with Approvals and Early Check-In
            </p>
          </div>

          {/* Overview */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">📖 Overview</h2>
            <p className="text-gray-700 mb-4">
              The IVS Approvals module helps you manage volunteers who are coming from other locations
              to serve at your event. You can import volunteer lists, review and approve requests,
              manage early check-in eligibility, and check volunteers in on the day of the event.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-800">
                <strong>💡 Tip:</strong> IVS volunteers are managed separately from your local volunteers
                and appear only on the IVS Approvals page, not on the main Volunteers page.
              </p>
            </div>
          </section>

          {/* Getting Started */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">🚀 Getting Started</h2>
            
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Step 1: Enable IVS Module</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li>Go to <strong>Admin → Department Templates</strong></li>
              <li>Edit your department template</li>
              <li>Go to the <strong>Modules</strong> tab</li>
              <li>Enable <strong>IVS Module</strong></li>
              <li>Save the template</li>
            </ol>

            <h3 className="text-xl font-semibold text-gray-700 mb-3">Step 2: Access IVS Module</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li>Navigate to your event</li>
              <li>Click the <strong>IVS Module</strong> tab</li>
              <li>You'll see two tabs: <strong>Approvals</strong> and <strong>⏰ Early Check-In</strong></li>
            </ol>
          </section>

          {/* Importing Volunteers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">📥 Importing IVS Volunteers</h2>
            
            <h3 className="text-xl font-semibold text-gray-700 mb-3">What You'll Need</h3>
            <p className="text-gray-700 mb-4">
              A spreadsheet (Excel or CSV) with the following columns:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li><strong>First Name</strong> - Volunteer's first name</li>
              <li><strong>Last Name</strong> - Volunteer's last name</li>
              <li><strong>Congregation</strong> - Their home congregation</li>
              <li><strong>Submitted By</strong> - Department requesting the volunteer</li>
              <li><strong>Request Round</strong> - Round number (1, 2, 3, etc.)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-700 mb-3">How to Import</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li>Click <strong>Import Volunteers</strong></li>
              <li>Select your spreadsheet file</li>
              <li>The system will validate and import the volunteers</li>
              <li>You'll see a success message with the number imported</li>
            </ol>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="text-yellow-800">
                <strong>⚠️ Note:</strong> All imported volunteers start with "Pending" status.
                You'll need to review and approve or deny each request.
              </p>
            </div>
          </section>

          {/* Managing Volunteers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">✏️ Managing Volunteers</h2>
            
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Individual Actions</h3>
            <p className="text-gray-700 mb-4">For each volunteer, you can:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li><strong>Edit</strong> - Update any volunteer information (name, congregation, department, round, notes)</li>
              <li><strong>Approve</strong> - Approve the volunteer request (changes status to "Approved")</li>
              <li><strong>Deny</strong> - Deny the request with a reason (changes status to "Denied")</li>
              <li><strong>Delete</strong> - Permanently remove the volunteer from the list</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-700 mb-3">Bulk Actions</h3>
            <p className="text-gray-700 mb-4">
              To perform actions on multiple volunteers at once:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li>Check the boxes next to the volunteers you want to update</li>
              <li>Click the <strong>Bulk Actions</strong> dropdown</li>
              <li>Choose an action:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>Bulk Approve</strong> - Approve all selected volunteers</li>
                  <li><strong>Bulk Deny</strong> - Deny all selected (you'll be asked for a reason)</li>
                  <li><strong>Set Early Entry</strong> - Enable or disable early check-in eligibility</li>
                  <li><strong>Change Round</strong> - Move volunteers to a different request round</li>
                  <li><strong>Change Department</strong> - Reassign to a different department</li>
                </ul>
              </li>
              <li>Confirm the action</li>
            </ol>
          </section>

          {/* Early Check-In */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">⏰ Early Check-In</h2>
            
            <h3 className="text-xl font-semibold text-gray-700 mb-3">What is Early Check-In?</h3>
            <p className="text-gray-700 mb-4">
              Some IVS volunteers may be eligible to check in early (before the event officially starts).
              You can mark volunteers as "Early Entry Eligible" to allow them to check in ahead of time.
            </p>

            <h3 className="text-xl font-semibold text-gray-700 mb-3">Enabling Early Check-In</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li>Click <strong>Edit</strong> on a volunteer</li>
              <li>Check the <strong>Early Entry Eligible</strong> box</li>
              <li>Save changes</li>
            </ol>

            <p className="text-gray-700 mb-4">
              Or use bulk actions to enable early entry for multiple volunteers at once.
            </p>
          </section>

          {/* Early Check-In Tab */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">⏰ Early Check-In Tab</h2>
            
            <h3 className="text-xl font-semibold text-gray-700 mb-3">What You'll See</h3>
            <p className="text-gray-700 mb-4">
              The Early Check-In tab is optimized for volunteers working check-in stations
              on tablets or phones. It provides:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li><strong>Large search bar</strong> - Search by name or congregation</li>
              <li><strong>Real-time stats</strong> - See pending, checked in, and total counts</li>
              <li><strong>Collapsible sections</strong> - PENDING CHECK-IN and CHECKED IN sections</li>
              <li><strong>Big check-in buttons</strong> - Easy to tap on mobile devices</li>
              <li><strong>Live updates</strong> - Automatically refreshes every 5 seconds</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-700 mb-3">How to Use It</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li>On the IVS Module page, click the <strong>⏰ Early Check-In</strong> tab</li>
              <li>Use the search bar to find a volunteer</li>
              <li>Tap the green <strong>Check In</strong> button in the PENDING section</li>
              <li>The volunteer moves to the CHECKED IN section automatically</li>
              <li>Use the <strong>Undo</strong> button if you need to reverse a check-in</li>
            </ol>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <p className="text-green-800">
                <strong>✅ Pro Tip:</strong> The page updates automatically every 5 seconds,
                so multiple people can use it at the same time without conflicts.
              </p>
            </div>
          </section>

          {/* Filtering */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">🔍 Filtering Volunteers</h2>
            <p className="text-gray-700 mb-4">
              Use the filter dropdowns at the top of the page to narrow down the list:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li><strong>Department</strong> - Show only volunteers from a specific department</li>
              <li><strong>Status</strong> - Filter by Pending, Approved, or Denied</li>
              <li><strong>Round</strong> - Show only volunteers from a specific request round</li>
            </ul>
          </section>

          {/* Exporting */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">📤 Exporting Data</h2>
            <p className="text-gray-700 mb-4">
              Click <strong>Export List</strong> to download a spreadsheet with all IVS volunteers
              and their current status. This is useful for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li>Creating reports</li>
              <li>Sharing with other coordinators</li>
              <li>Backing up your data</li>
              <li>Analyzing volunteer requests by department or round</li>
            </ul>
          </section>

          {/* Common Questions */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">❓ Common Questions</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Why don't I see IVS volunteers on the main Volunteers page?
                </h3>
                <p className="text-gray-600">
                  IVS volunteers are managed separately and only appear on the IVS Approvals page.
                  This keeps your local volunteers and IVS volunteers organized separately.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Can I undo an approval or denial?
                </h3>
                <p className="text-gray-600">
                  Yes! Click Edit on the volunteer and change their status. You can move volunteers
                  between Pending, Approved, and Denied at any time.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  What happens if I delete a volunteer?
                </h3>
                <p className="text-gray-600">
                  Deleting a volunteer permanently removes them from the system. This action cannot
                  be undone. If you're unsure, consider denying the request instead.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Can I clear all volunteers at once?
                </h3>
                <p className="text-gray-600">
                  Yes, use the <strong>Clear All</strong> button to delete all IVS volunteers.
                  You'll be asked to confirm twice to prevent accidental deletion.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  How do I clear a check-in if someone was checked in by mistake?
                </h3>
                <p className="text-gray-600">
                  Click Edit on the volunteer and use the <strong>Clear Check-In</strong> button.
                  This will remove their check-in time and allow them to be checked in again.
                </p>
              </div>
            </div>
          </section>

          {/* Need Help */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">📞 Need More Help?</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">→</span>
                  <span>Contact your system administrator for assistance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">→</span>
                  <span>Use the <strong>Send Feedback</strong> button to report issues</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">→</span>
                  <span>Check the main <strong>Help Center</strong> for other topics</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Back Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <a
              href="/help"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Help Center
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session?.user?.id) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
