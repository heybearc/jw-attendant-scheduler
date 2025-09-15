import React from 'react'

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          JW Attendant Scheduler
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Manage attendants, events, and count tracking for Jehovah's Witness conventions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            Attendant Management
          </h2>
          <p className="text-gray-600 mb-4">
            Manage attendant profiles, availability, and assignments for convention events.
          </p>
          <a
            href="/attendants"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            View Attendants
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">
            Event Management
          </h2>
          <p className="text-gray-600 mb-4">
            Create and manage convention events, schedules, and position assignments.
          </p>
          <a
            href="/events"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            View Events
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-2xl font-semibold text-purple-600 mb-4">
            Count Tracking
          </h2>
          <p className="text-gray-600 mb-4">
            Track attendance counts and generate analytics for convention sessions.
          </p>
          <a
            href="/counts"
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
          >
            View Counts
          </a>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Application Features
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600">
          <li>✅ Attendant Profile Management</li>
          <li>✅ Event Scheduling System</li>
          <li>✅ Position Assignment Tracking</li>
          <li>✅ Count Session Analytics</li>
          <li>✅ Real-time Data Updates</li>
          <li>✅ Responsive Design</li>
          <li>✅ Database Integration</li>
          <li>✅ Production Ready</li>
        </ul>
      </div>
    </div>
  )
}
