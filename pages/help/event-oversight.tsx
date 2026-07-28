import HelpLayout from '../../components/HelpLayout'
import Link from 'next/link'

export default function EventOversightHelp() {
  return (
    <HelpLayout title="Event Oversight Dashboard">
      <div className="prose max-w-none">
        <h1>Event Oversight Dashboard</h1>
        
        <p className="lead">
          The Event Oversight Dashboard helps coordinators view and manage oversight coverage for events, 
          ensuring all positions have appropriate oversight assigned.
        </p>

        <h2>What is the Oversight Dashboard?</h2>
        <p>
          The Oversight Dashboard provides a centralized view of all oversight assignments for a specific event. 
          It shows which overseers, assistant overseers, and keymen are assigned to positions, helping with 
          event planning and coverage verification.
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
          <p className="font-semibold text-blue-900">Key Principle</p>
          <p className="text-blue-800 mt-2">
            The dashboard is <strong>event-focused</strong>, not organization-focused. It shows oversight 
            for ONE event at a time, making it simple to verify coverage for upcoming events.
          </p>
        </div>

        <h2>Accessing the Oversight Dashboard</h2>
        <ol>
          <li>Navigate to your event dashboard</li>
          <li>Click the <strong>"🔍 Oversight Dashboard"</strong> button in the Quick Actions section</li>
          <li>Or go directly to: <code>/events/[eventId]/oversight</code></li>
        </ol>

        <h2>Understanding Coverage Statistics</h2>
        
        <h3>Coverage Percentage</h3>
        <p>
          The coverage percentage shows what portion of your event positions have oversight assigned:
        </p>
        <ul>
          <li><strong className="text-green-600">90% or higher:</strong> Excellent coverage (green indicator)</li>
          <li><strong className="text-yellow-600">70-89%:</strong> Good coverage with some gaps (yellow indicator)</li>
          <li><strong className="text-red-600">Below 70%:</strong> Needs attention (red indicator)</li>
        </ul>

        <h3>Oversight Counts</h3>
        <p>The dashboard displays three key metrics:</p>
        <ul>
          <li><strong>Overseers:</strong> Number of overseer assignments</li>
          <li><strong>Assistant Overseers:</strong> Number of assistant overseer assignments</li>
          <li><strong>Keymen:</strong> Number of keyman assignments</li>
        </ul>

        <h2>Exporting Oversight Data</h2>
        <p>
          You can export oversight data in two formats for offline use, printing, or sharing with your team:
        </p>

        <h3>📄 PDF Export</h3>
        <p>
          Click the <strong>"📄 Export PDF"</strong> button to generate a professional PDF report containing:
        </p>
        <ul>
          <li>Coverage statistics summary</li>
          <li>Complete list of overseers with their assignments</li>
          <li>Complete list of assistant overseers with their assignments</li>
          <li>Complete list of keymen with their assignments</li>
          <li>Coverage gaps (positions without oversight)</li>
        </ul>
        <p>
          Perfect for printing and distributing at planning meetings or keeping as event records.
        </p>

        <h3>📊 Excel Export</h3>
        <p>
          Click the <strong>"📊 Export Excel"</strong> button to generate a spreadsheet with multiple sheets:
        </p>
        <ul>
          <li><strong>Statistics:</strong> Overview of coverage metrics</li>
          <li><strong>Overseers:</strong> Detailed list with contact information</li>
          <li><strong>Assistant Overseers:</strong> Detailed list with contact information</li>
          <li><strong>Keymen:</strong> Detailed list with contact information</li>
          <li><strong>Coverage Gaps:</strong> Positions needing oversight</li>
        </ul>
        <p>
          Ideal for further analysis, filtering, or importing into other systems.
        </p>

        <h3>Oversight Counts</h3>
        <p>The dashboard displays three key metrics:</p>
        <ul>
          <li><strong>🔵 Overseers:</strong> Number of overseer assignments</li>
          <li><strong>🟢 Assistant Overseers:</strong> Number of assistant overseer assignments</li>
          <li><strong>🟡 Keymen:</strong> Number of keyman assignments</li>
        </ul>

        <h2>Viewing Oversight Assignments</h2>
        
        <h3>Assignment Details</h3>
        <p>For each oversight assignment, you can see:</p>
        <ul>
          <li>Person's name and email</li>
          <li>Position name and number</li>
          <li>Department (if applicable)</li>
          <li>Shift times</li>
          <li>Assignment status (Assigned, Confirmed, etc.)</li>
          <li>Any notes attached to the assignment</li>
        </ul>

        <h3>Organized by Role</h3>
        <p>
          Assignments are grouped into three sections for easy viewing:
        </p>
        <ul>
          <li><strong>Overseers Section:</strong> All overseer assignments</li>
          <li><strong>Assistant Overseers Section:</strong> All assistant overseer assignments</li>
          <li><strong>Keymen Section:</strong> All keyman assignments</li>
        </ul>

        <h2>Coverage Gaps</h2>
        
        <h3>What are Coverage Gaps?</h3>
        <p>
          Coverage gaps are positions that don't have any oversight assigned. These are highlighted 
          with a warning banner at the top of the dashboard.
        </p>

        <h3>Addressing Coverage Gaps</h3>
        <ol>
          <li>Review the "Coverage Gaps" section at the bottom of the dashboard</li>
          <li>Click the <strong>"Assign →"</strong> link next to any position</li>
          <li>You'll be taken to the Positions page where you can make assignments</li>
          <li>Return to the Oversight Dashboard to verify the gap is resolved</li>
        </ol>

        <h2>Using the Oversight Coverage Card</h2>
        
        <p>
          On your event dashboard, you'll see a compact Oversight Coverage Card that provides:
        </p>
        <ul>
          <li>Quick coverage percentage at a glance</li>
          <li>Summary counts for each oversight role</li>
          <li>Warning if coverage gaps exist</li>
          <li>Direct link to the full Oversight Dashboard</li>
        </ul>

        <h2>Filtering Positions by Role</h2>
        
        <p>
          On the <strong>Positions page</strong>, you can filter positions to show only those with 
          specific oversight roles:
        </p>
        <ol>
          <li>Navigate to the Positions page for your event</li>
          <li>Look for the role filter dropdown in the header</li>
          <li>Select from:
            <ul>
              <li><strong>All Roles:</strong> Show all positions</li>
              <li><strong>🔵 Overseers Only:</strong> Show positions with overseer assignments</li>
              <li><strong>🟢 Assistants Only:</strong> Show positions with assistant overseer assignments</li>
              <li><strong>🟡 Keymen Only:</strong> Show positions with keyman assignments</li>
            </ul>
          </li>
        </ol>

        <h2>Best Practices</h2>
        
        <h3>Before the Event</h3>
        <ul>
          <li>Review the Oversight Dashboard at least 1 week before the event</li>
          <li>Aim for 90% or higher coverage</li>
          <li>Address all coverage gaps before the event starts</li>
          <li>Verify that key positions have appropriate oversight levels</li>
        </ul>

        <h3>During Event Planning</h3>
        <ul>
          <li>Use the role filter to quickly review specific oversight categories</li>
          <li>Export the oversight data for planning meetings</li>
          <li>Share the dashboard link with other coordinators</li>
          <li>Check the dashboard after making bulk assignments</li>
        </ul>

        <h3>Assignment Strategy</h3>
        <ul>
          <li>Assign overseers to areas or departments first</li>
          <li>Then assign assistant overseers to support them</li>
          <li>Finally assign keymen to specific positions</li>
          <li>Ensure experienced volunteers are in oversight roles</li>
        </ul>

        <h2>Frequently Asked Questions</h2>

        <h3>Why don't I see any oversight assignments?</h3>
        <p>
          If the dashboard is empty, it means no volunteers with oversight roles (Overseer, Assistant Overseer, 
          or Keyman) have been assigned to positions yet. Navigate to the Positions page to start making assignments.
        </p>

        <h3>How do I assign someone to an oversight role?</h3>
        <p>
          On the <strong>Positions</strong> page, open a shift and use <strong>+ Assign Overseer</strong>
          or <strong>+ Assign Keyman</strong> for that shift. You can also choose Overseer or Keyman
          from the role menu when assigning someone. Use <strong>Position Oversight</strong> for a
          default overseer for the whole position when you do not need a different person per shift.
          User roles in User Management still control who appears on the Oversight Dashboard.
        </p>

        <h3>Can I export the oversight data?</h3>
        <p>
          Yes! Export functionality for oversight reports (PDF and Excel) is available from the Positions page. 
          The exports will include oversight information when you use the role filters.
        </p>

        <h3>What's the difference between overseers, assistants, and keymen?</h3>
        <p>
          These are user roles that indicate different levels of responsibility:
        </p>
        <ul>
          <li><strong>Overseer:</strong> Primary oversight responsibility for an area or department</li>
          <li><strong>Assistant Overseer:</strong> Supports the overseer in their duties</li>
          <li><strong>Keyman:</strong> Responsible for specific positions or tasks</li>
        </ul>

        <h3>Does the dashboard update in real-time?</h3>
        <p>
          The dashboard loads current data when you visit the page. Refresh the page to see the latest 
          assignments after making changes on the Positions page.
        </p>

        <h2>Related Help Topics</h2>
        <ul>
          <li><Link href="/help/positions" className="text-blue-600 hover:text-blue-800">Managing Positions</Link></li>
          <li><Link href="/help/assignments" className="text-blue-600 hover:text-blue-800">Making Assignments</Link></li>
          <li><Link href="/help/user-roles" className="text-blue-600 hover:text-blue-800">Understanding User Roles</Link></li>
          <li><Link href="/help/event-planning" className="text-blue-600 hover:text-blue-800">Event Planning Guide</Link></li>
        </ul>

        <div className="bg-green-50 border-l-4 border-green-500 p-4 my-6">
          <p className="font-semibold text-green-900">Need More Help?</p>
          <p className="text-green-800 mt-2">
            If you have questions about the Oversight Dashboard or need assistance, please{' '}
            <Link href="/help/feedback" className="text-green-900 underline font-semibold">
              send us feedback
            </Link>{' '}
            and we'll be happy to help!
          </p>
        </div>
      </div>
    </HelpLayout>
  )
}
