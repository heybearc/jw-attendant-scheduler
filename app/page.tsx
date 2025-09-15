'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleManageEvents = () => {
    router.push('/events');
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-2">JW Attendant Scheduler</h1>
          <p className="text-gray-600 mb-8">Manage events and attendant assignments</p>

          <div className="grid grid-cols-1 gap-6">
            {/* Events Management - Primary Focus */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-blue-900 mb-4">Event Management</h2>
              <p className="text-blue-700 mb-6">Create and manage events, positions, and attendant assignments. All attendant management is done within specific events.</p>
              <button
                onClick={handleManageEvents}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                Manage Events & Attendants
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-700">Total Events</h3>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-700">Active Attendants</h3>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-700">Total Assignments</h3>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
