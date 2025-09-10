'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AttendantsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to events page after a short delay to show the message
    const timer = setTimeout(() => {
      router.push('/events');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-blue-600 text-6xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Attendant Management</h1>
          <p className="text-gray-600 mb-6">
            Attendants are now managed within specific events. You'll be redirected to the events page where you can select an event to manage its attendants.
          </p>
          <div className="space-y-3">
            <Link
              href="/events"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Events
            </Link>
            <p className="text-sm text-gray-500">
              Redirecting automatically in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
