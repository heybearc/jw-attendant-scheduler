import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import Link from 'next/link'

export default function CreatingEventsHelp() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📅 Creating Your First Event
            </h1>
            <p className="text-gray-600">
              A step-by-step guide for event coordinators
            </p>
          </div>

          {/* Quick Start */}
          <section className="mb-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">🚀 Quick Start</h2>
            <p className="text-blue-800 mb-4">
              Creating an event in TheoShift takes just a few minutes. You'll provide basic information, 
              choose how your event is organized, and customize which features you need.
            </p>
            <div className="bg-white rounded p-4">
              <p className="font-medium text-gray-900 mb-2">Three main steps:</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Department Configuration</strong> - Choose how your event is organized</li>
                <li><strong>Basic Information</strong> - Event name, dates, and description</li>
                <li><strong>Location & Capacity</strong> - Where and how many people</li>
              </ol>
            </div>
          </section>

          {/* Step 1: Department Configuration */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              🎯 Step 1: Department Configuration
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Choose a Department Template</h3>
              <p className="text-gray-700 mb-4">
                Department templates control which features are available for your event. Each template 
                is pre-configured for different types of events.
              </p>
              
              <div className="bg-white rounded border border-gray-200 p-4 mb-4">
                <p className="font-medium text-gray-900 mb-2">Common Templates:</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">→</span>
                    <span><strong>Audio-Video:</strong> For media and sound departments</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">→</span>
                    <span><strong>Attendants:</strong> For volunteer coordination and assignments</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">→</span>
                    <span><strong>No template:</strong> All features enabled (most flexible)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <p className="text-yellow-800">
                  <strong>💡 Tip:</strong> If you're not sure which template to use, select "No template" 
                  to have all features available. You can always customize later.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Customize Available Modules</h3>
              <p className="text-gray-700 mb-4">
                After selecting a template, you can choose which modules to enable for this specific event:
              </p>
              
              <div className="space-y-3">
                <div className="bg-white rounded border border-gray-200 p-4">
                  <p className="font-medium text-gray-900 mb-1">⏱️ Count Times</p>
                  <p className="text-sm text-gray-600">
                    Track attendance at different times during your event. Useful for conventions and assemblies.
                  </p>
                </div>

                <div className="bg-white rounded border border-gray-200 p-4">
                  <p className="font-medium text-gray-900 mb-1">🎫 Lanyards</p>
                  <p className="text-sm text-gray-600">
                    Manage and print volunteer identification badges. Great for large events.
                  </p>
                </div>

                <div className="bg-white rounded border border-gray-200 p-4">
                  <p className="font-medium text-gray-900 mb-1">📋 IVS Approvals</p>
                  <p className="text-sm text-gray-600">
                    Manage International Volunteer Service volunteers coming from other locations.
                  </p>
                </div>
              </div>

              <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4">
                <p className="text-green-800">
                  <strong>✨ New Feature:</strong> You can now disable modules you don't need! Uncheck any 
                  module to hide it from your event navigation. This keeps your interface clean and focused.
                </p>
              </div>
            </div>
          </section>

          {/* Step 2: Basic Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              📝 Step 2: Basic Information
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Name *</h3>
                <p className="text-gray-700 mb-2">
                  Choose a clear, descriptive name for your event.
                </p>
                <div className="bg-white rounded border border-gray-200 p-3">
                  <p className="text-sm text-gray-600 mb-2"><strong>Good examples:</strong></p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Circuit Assembly 2026 - Spring</li>
                    <li>• Regional Convention - Audio-Video Department</li>
                    <li>• Special Assembly Day - October</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Type *</h3>
                <p className="text-gray-700 mb-2">
                  Select the type of event you're organizing:
                </p>
                <ul className="text-gray-700 space-y-2 ml-4">
                  <li>• <strong>Circuit Assembly</strong> - One or two-day circuit events</li>
                  <li>• <strong>Regional Convention</strong> - Multi-day regional events</li>
                  <li>• <strong>Special Event</strong> - Memorial, special talks, etc.</li>
                  <li>• <strong>Other</strong> - Any other type of event</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Dates and Times *</h3>
                <p className="text-gray-700 mb-4">
                  Provide the start and end dates for your event. The start time is required, 
                  but end time is optional.
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                  <p className="text-yellow-800">
                    <strong>⚠️ Note:</strong> Make sure the end date is on or after the start date.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description (Optional)</h3>
                <p className="text-gray-700">
                  Add any additional details about your event. This helps volunteers understand 
                  what to expect and can include special instructions or notes.
                </p>
              </div>
            </div>
          </section>

          {/* Step 3: Location & Capacity */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              📍 Step 3: Location & Capacity
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Location *</h3>
                <p className="text-gray-700 mb-4">
                  Search for an existing location or create a new one. The location selector 
                  will show you previously used venues.
                </p>
                
                <div className="bg-white rounded border border-gray-200 p-4 mb-4">
                  <p className="font-medium text-gray-900 mb-2">To use an existing location:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
                    <li>Start typing the location name</li>
                    <li>Select from the dropdown list</li>
                    <li>The address will be filled in automatically</li>
                  </ol>
                </div>

                <div className="bg-white rounded border border-gray-200 p-4">
                  <p className="font-medium text-gray-900 mb-2">To create a new location:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
                    <li>Click "Create New Location"</li>
                    <li>Enter the location name and address</li>
                    <li>Optionally add map coordinates</li>
                    <li>Save - it will be available for future events</li>
                  </ol>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Capacity (Optional)</h3>
                <p className="text-gray-700 mb-2">
                  The maximum number of attendees expected at your event.
                </p>
                <p className="text-sm text-gray-600">
                  Example: 250 for a circuit assembly, 5000 for a regional convention
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Volunteers Needed (Optional)</h3>
                <p className="text-gray-700 mb-2">
                  How many volunteers you need for this event.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-3">
                  <p className="text-blue-800">
                    <strong>💡 Tip:</strong> This number cannot exceed your event capacity.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* After Creating */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              ✅ After Creating Your Event
            </h2>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Once you create your event, you'll be able to:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-2">📋 Create Positions</p>
                  <p className="text-sm text-gray-600">
                    Set up volunteer positions and shifts for your event
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-2">👥 Manage Volunteers</p>
                  <p className="text-sm text-gray-600">
                    Add volunteers and track their availability
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-2">📊 Make Assignments</p>
                  <p className="text-sm text-gray-600">
                    Assign volunteers to positions and shifts
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-2">📤 Export Data</p>
                  <p className="text-sm text-gray-600">
                    Download schedules and reports for your team
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Common Questions */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">❓ Common Questions</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Can I change the department template after creating the event?
                </h3>
                <p className="text-gray-600">
                  No, the department template is set when you create the event. However, you can 
                  customize which modules are enabled in the event settings.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  What if I don't see the template I need?
                </h3>
                <p className="text-gray-600">
                  Contact your system administrator to create custom department templates. They can 
                  configure templates specific to your organization's needs.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Can I create child events?
                </h3>
                <p className="text-gray-600">
                  Yes! When creating an event, you can select a "Parent Event" to create a hierarchy. 
                  For example, you might have "Regional Convention" as the parent and "Audio Crew" as a child event.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  What happens if I make a mistake?
                </h3>
                <p className="text-gray-600">
                  You can edit most event details after creation by going to the event and clicking 
                  "⚙️ Settings". You can update dates, capacity, description, and module settings.
                </p>
              </div>
            </div>
          </section>

          {/* Need More Help */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">📞 Need More Help?</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">→</span>
                  <span>
                    Check the <Link href="/help" className="text-blue-600 hover:text-blue-800 underline">Help Center</Link> for more guides
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">→</span>
                  <span>Contact your system administrator for assistance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">→</span>
                  <span>Use the <strong>Send Feedback</strong> button to report issues or suggest improvements</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Back Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
            <Link
              href="/help"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Help Center
            </Link>
            <Link
              href="/events/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Event →
            </Link>
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
