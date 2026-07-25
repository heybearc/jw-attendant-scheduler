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
            <p className="text-gray-700 mb-4">
              On a phone or tablet, <strong>Approvals</strong> uses a card layout (no sideways scrolling),
              and <strong>Early Check-In</strong> uses large buttons—handy at the registration table.
              On a wider screen, Approvals still shows the full table.
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
            
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Download the template</h3>
            <p className="text-gray-700 mb-4">
              On Approvals, click <strong>Import Volunteers</strong>, then <strong>Download template</strong>.
              The spreadsheet includes sample rows and an Instructions sheet.
            </p>

            <h3 className="text-xl font-semibold text-gray-700 mb-3">Required columns</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li><strong>NAME</strong> — Full name (first and last)</li>
              <li><strong>CONGREGATION</strong> — Home congregation</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-700 mb-3">Optional columns</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li>
                <strong>DEPARTMENT</strong> — Per-row department (overrides the default set in the import dialog)
              </li>
              <li>
                <strong>STATUS</strong> — Pending, Requested, Approved, or Not Approved. Leave blank to default
                (elders auto-approve; everyone else starts Pending)
              </li>
              <li>
                <strong>EARLY ENTRY</strong> — Examples: <code>Fri, Sat</code>, <code>All days</code>,{' '}
                <code>Yes</code>, <code>No</code>. Leave blank to skip
              </li>
              <li>
                Or use separate Yes/No columns: <strong>EARLY ENTRY FRIDAY</strong>,{' '}
                <strong>EARLY ENTRY SATURDAY</strong>, <strong>EARLY ENTRY SUNDAY</strong>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-700 mb-3">How to Import</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li>Click <strong>Import Volunteers</strong></li>
              <li>Optionally download the template and fill it from your spreadsheet</li>
              <li>Choose the <strong>Request Round</strong> (applies to the whole file)</li>
              <li>Optionally set a default <strong>Department Name</strong> for rows without DEPARTMENT</li>
              <li>Select your Excel/CSV file and click Import</li>
              <li>You&apos;ll see how many were imported and how many existing people were updated</li>
            </ol>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="text-yellow-800">
                <strong>⚠️ Note:</strong> Re-importing the same person updates department, status, and early
                entry when those columns are present. You can import a full working spreadsheet that already
                includes approval status and early-entry days.
              </p>
            </div>
          </section>

          {/* Department contacts */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">📞 Department Contacts</h2>
            <p className="text-gray-700 mb-4">
              Store each department&apos;s overseer and assistants so the early-entry desk can look them up
              quickly. Manage contacts on the Approvals tab; the Early Check-In tab shows a lookup panel.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
              <li>
                <strong>Add</strong> a department name if it is not already on the list, then save overseer
                / assistant details
              </li>
              <li>
                <strong>Clear contact info</strong> removes phone/email/names but keeps the department in
                the list
              </li>
              <li>
                <strong>Remove department</strong> deletes that spelling from contacts. If volunteers still
                use that department label, it will reappear until you rename those rows (bulk{' '}
                <strong>Change department name</strong>)
              </li>
              <li>
                Phone numbers format as <strong>(XXX) XXX-XXXX</strong> as you type or paste (including +1)
              </li>
            </ul>
          </section>

          {/* Managing Volunteers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">✏️ Managing Volunteers</h2>
            
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Individual Actions</h3>
            <p className="text-gray-700 mb-4">For each volunteer, you can:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li><strong>Edit</strong> - Update volunteer information (name, congregation, department, round, notes)</li>
              <li><strong>Status</strong> - Use the status menu to set Pending, Requested, Approved, or Not Approved (same choices everywhere on the page)</li>
              <li><strong>Delete</strong> - Permanently remove the volunteer from the list</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-700 mb-3">Bulk Actions</h3>
            <p className="text-gray-700 mb-4">
              To perform actions on multiple volunteers at once:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li>Check the boxes next to the volunteers you want to update</li>
              <li>Open the purple <strong>Bulk actions</strong> menu</li>
              <li>Choose an action:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>Set status</strong> - Pick any status (Pending, Requested, Approved, Not Approved); optional shared note for Not Approved</li>
                  <li><strong>Set early entry days</strong> - Choose Friday, Saturday, Sunday, or combinations for all selected</li>
                  <li><strong>Change round</strong> - Move everyone to the same request round number</li>
                  <li><strong>Change department name</strong> - Set the same department label for all selected</li>
                  <li><strong>Change congregation name</strong> - Set the same congregation for all selected (fixes names after import)</li>
                </ul>
              </li>
              <li>Confirm in the dialog</li>
            </ol>
          </section>

          {/* Early Check-In */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">⏰ Early Check-In</h2>
            
            <h3 className="text-xl font-semibold text-gray-700 mb-3">What is Early Check-In?</h3>
            <p className="text-gray-700 mb-4">
              Some IVS volunteers may check in early on convention days (Friday, Saturday, or Sunday).
              You choose which days each volunteer is eligible — any combination of Fri, Sat, and Sun.
            </p>

            <h3 className="text-xl font-semibold text-gray-700 mb-3">Setting early entry days</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li>On the Approvals list, use the <strong>Fri / Sat / Sun</strong> toggles on each row (or open <strong>Edit</strong>)</li>
              <li>Tap <strong>All</strong> or <strong>None</strong> for quick presets, or pick individual days</li>
              <li>Changes save when you toggle a day</li>
            </ol>

            <p className="text-gray-700 mb-4">
              Or use bulk actions → <strong>Set early entry days</strong> for multiple volunteers at once.
            </p>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
              <p className="text-amber-900">
                <strong>Note:</strong> If you remove eligibility for a day that already has a check-in,
                TheoShift asks for confirmation and clears that day&apos;s check-in record.
              </p>
            </div>
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
              <li><strong>Day tabs</strong> - Today, Friday, Saturday, Sunday</li>
              <li><strong>Large search bar</strong> - Search by name, congregation, or department</li>
              <li><strong>Department contacts</strong> - Look up overseer/assistants for a department</li>
              <li><strong>Real-time stats</strong> - Pending and checked-in counts for the selected day</li>
              <li><strong>Collapsible sections</strong> - PENDING CHECK-IN and CHECKED IN for that day</li>
              <li><strong>Big check-in buttons</strong> - Check in one day at a time</li>
              <li><strong>Live updates</strong> - Automatically refreshes every 5 seconds</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-700 mb-3">How to Use It</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
              <li>On the IVS Module page, click the <strong>⏰ Early Check-In</strong> tab</li>
              <li>Select <strong>Today</strong> or a specific day (Fri / Sat / Sun)</li>
              <li>Use the search bar to find a volunteer eligible for that day</li>
              <li>Tap the green <strong>Check In</strong> button in the PENDING section</li>
              <li>The volunteer appears under CHECKED IN for that day only</li>
              <li>Use <strong>Undo</strong> to reverse a check-in for the day you are viewing</li>
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
              <li><strong>Status</strong> - Filter by Pending, Requested, Approved, or Not Approved</li>
              <li><strong>Early Entry</strong> - All, Eligible, or None</li>
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
                  between Pending, Requested, Approved, and Not Approved at any time.
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
                  On the Early Check-In tab, find the volunteer under CHECKED IN for the day you are viewing
                  and tap <strong>Undo</strong>. You can also remove that day&apos;s eligibility on the Approvals tab
                  (you will be asked to confirm if a check-in exists).
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
