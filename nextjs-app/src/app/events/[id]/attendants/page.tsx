'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  role: string;
}

interface Attendant {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
  availabilityStatus: string;
  isAvailable: boolean;
  servingAs?: string[];
  totalAssignments: number;
  totalHours: number;
  createdAt: string;
  updatedAt: string;
  users?: User;
}

interface Event {
  id: string;
  name: string;
  eventType: string;
  status: string;
  startDate: string;
  endDate: string;
  location: string;
}

export default function EventAttendantsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      fetchAttendants();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }
      const data = await response.json();
      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event');
    }
  };

  const fetchAttendants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendants');
      if (!response.ok) {
        throw new Error('Failed to fetch attendants');
      }
      const data = await response.json();
      setAttendants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendants');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSVTemplate = () => {
    const templateData = `firstName,lastName,email,phone,availabilityStatus,notes
John,Doe,john.doe@example.com,555-0101,AVAILABLE,Sample attendant with phone
Jane,Smith,jane.smith@example.com,,AVAILABLE,Sample attendant without phone
Bob,Johnson,bob.johnson@example.com,555-0103,UNAVAILABLE,Currently unavailable
Alice,Wilson,alice.wilson@example.com,555-0104,AVAILABLE,Expert level attendant`;

    const blob = new Blob([templateData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendants_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getAvailabilityBadge = (attendant: Attendant) => {
    // Check if "Other Department" is in servingAs array - this should make them unavailable
    const hasOtherDepartment = attendant.servingAs?.includes('Other Department');
    
    if (hasOtherDepartment || !attendant.isAvailable || attendant.availabilityStatus === 'UNAVAILABLE') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Unavailable
        </span>
      );
    } else if (attendant.availabilityStatus === 'LIMITED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Limited
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Available
        </span>
      );
    }
  };

  const getServingAsBadge = (role: string) => {
    const isOtherDepartment = role === 'Other Department';
    return (
      <span 
        key={role} 
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          isOtherDepartment 
            ? 'bg-orange-100 text-orange-800' 
            : 'bg-purple-100 text-purple-800'
        }`}
      >
        {role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading data</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href={`/events/${eventId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Navigation */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href={`/events/${eventId}`}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Event
            </Link>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Attendants for {event?.name || 'Event'}
              </h1>
              <p className="mt-2 text-gray-600">
                Manage attendant assignments for this event
              </p>
              {event && (
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>{event.eventType}</span>
                  <span>•</span>
                  <span>{event.location}</span>
                  <span>•</span>
                  <span>{new Date(event.startDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <Link
                href="/attendants/create"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add New Attendant
              </Link>
              <button
                onClick={downloadCSVTemplate}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Download CSV Template
              </button>
              <Link
                href="/attendants/import"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Import CSV
              </Link>
            </div>
          </div>
        </div>

        {/* CSV Import Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                CSV Import Instructions
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>1. Download the CSV template above to get the correct format</p>
                <p>2. Fill in your attendant data (firstName, lastName, email are required)</p>
                <p>3. Click "Import CSV" to upload your completed file</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attendants List */}
        {attendants.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No attendants found</h3>
            <p className="text-gray-600 mb-4">Get started by adding attendants for this event.</p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/attendants/create"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add First Attendant
              </Link>
              <button
                onClick={downloadCSVTemplate}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Download Template
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Available Attendants ({attendants.length})
                </h3>
                <div className="text-sm text-gray-500">
                  Click Edit to modify attendant details or Assign to add them to this event
                </div>
              </div>
            </div>
            <ul className="divide-y divide-gray-200">
              {attendants.map((attendant) => (
                <li key={attendant.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {attendant.firstName.charAt(0)}{attendant.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              {attendant.firstName} {attendant.lastName}
                            </p>
                            <div className="ml-2">
                              {getAvailabilityBadge(attendant)}
                            </div>
                            {attendant.userId && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                User Mapped
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <p>{attendant.email}</p>
                            {attendant.phone && (
                              <>
                                <span className="mx-2">•</span>
                                <p>{attendant.phone}</p>
                              </>
                            )}
                          </div>
                          {/* Serving As Tags */}
                          {attendant.servingAs && attendant.servingAs.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {attendant.servingAs.map((role) => getServingAsBadge(role))}
                            </div>
                          )}
                          {attendant.notes && (
                            <div className="text-sm text-gray-600">
                              <p className="line-clamp-1">{attendant.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="text-center">
                          <p className="font-medium text-gray-900">{attendant.totalAssignments}</p>
                          <p>Assignments</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-900">{attendant.totalHours.toFixed(1)}</p>
                          <p>Hours</p>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/attendants/${attendant.id}?eventId=${eventId}`}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 flex items-center"
                            title="Edit Attendant"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Link>
                          <button
                            onClick={() => {/* TODO: Implement assignment */}}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Event-specific attendant assignments would go here */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Event Assignments</h3>
          <div className="text-center py-8 text-gray-500">
            <p>Attendant assignment functionality will be implemented here.</p>
            <p className="text-sm mt-2">This will show attendants specifically assigned to this event with their positions and schedules.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
