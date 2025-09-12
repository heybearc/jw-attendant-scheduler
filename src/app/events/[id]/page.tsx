'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Event {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  status: string;
  startDate: string;
  endDate: string;
  location: string;
  venue?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchEvent(params.id as string);
    }
  }, [params.id]);

  const fetchEvent = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }
      const eventData = await response.json();
      setEvent(eventData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/events/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }

      router.push('/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error || 'Event not found'}
          </div>
          <Link
            href="/events"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/events"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Events
              </Link>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                event.status === 'UPCOMING' 
                  ? 'bg-blue-100 text-blue-800'
                  : event.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {event.status}
              </span>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/events/${event.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Event
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{event.name}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Event Type</span>
                      <p className="text-gray-900">{event.eventType.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Location</span>
                      <p className="text-gray-900">{event.location}</p>
                    </div>
                    {event.venue && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Venue</span>
                        <p className="text-gray-900">{event.venue}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status</span>
                      <p className="text-gray-900">{event.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{event.description}</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Schedule</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Start Date</span>
                      <p className="text-gray-900">
                        {new Date(event.startDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">End Date</span>
                      <p className="text-gray-900">
                        {new Date(event.endDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Duration</span>
                      <p className="text-gray-900">
                        {Math.ceil((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Metadata</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Event ID</span>
                      <p className="text-gray-900 font-mono text-sm">{event.id}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Created</span>
                      <p className="text-gray-900">
                        {new Date(event.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Last Updated</span>
                      <p className="text-gray-900">
                        {new Date(event.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href={`/events/${event.id}/attendants`}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Manage Attendants
          </Link>
          <Link
            href={`/events/${event.id}/positions`}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Manage Positions
          </Link>
          <Link
            href={`/events/${event.id}/assignments`}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            View Assignments
          </Link>
        </div>
      </div>
    </div>
  );
}
