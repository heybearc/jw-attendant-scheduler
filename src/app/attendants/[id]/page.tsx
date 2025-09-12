'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
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
  servingAs: string[];
  totalAssignments: number;
  totalHours: number;
  createdAt: string;
  updatedAt: string;
  users?: User;
}

const SERVING_AS_OPTIONS = [
  'Elder',
  'Ministerial Servant',
  'Regular Pioneer',
  'Overseer',
  'Overseer Assistant',
  'Keyman',
  'Other Department'
];

const OVERSIGHT_ROLES = ['Overseer', 'Overseer Assistant', 'Keyman'];

export default function AttendantEditPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const attendantId = params.id as string;
  const eventId = searchParams.get('eventId'); // Get event context from URL params
  
  const [attendant, setAttendant] = useState<Attendant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    availabilityStatus: 'AVAILABLE',
    notes: '',
    servingAs: [] as string[]
  });

  useEffect(() => {
    if (attendantId) {
      fetchAttendant();
    }
  }, [attendantId]);

  const fetchAttendant = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendants/${attendantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendant');
      }
      const data = await response.json();
      setAttendant(data);
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        availabilityStatus: data.availabilityStatus,
        notes: data.notes || '',
        servingAs: data.servingAs || []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendant');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServingAsChange = (option: string, checked: boolean) => {
    setFormData(prev => {
      const newServingAs = checked 
        ? [...prev.servingAs, option]
        : prev.servingAs.filter(item => item !== option);
      
      // Auto-set availability to UNAVAILABLE if "Other Department" is selected
      const newAvailabilityStatus = newServingAs.includes('Other Department') 
        ? 'UNAVAILABLE' 
        : prev.availabilityStatus;

      return {
        ...prev,
        servingAs: newServingAs,
        availabilityStatus: newAvailabilityStatus
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/attendants/${attendantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update attendant');
      }

      // Navigate back to event-specific attendants page if eventId exists, otherwise to events
      if (eventId) {
        router.push(`/events/${eventId}/attendants`);
      } else {
        router.push('/events');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update attendant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this attendant? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/attendants/${attendantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete attendant');
      }

      // Navigate back to event-specific attendants page if eventId exists, otherwise to events
      if (eventId) {
        router.push(`/events/${eventId}/attendants`);
      } else {
        router.push('/events');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attendant');
    } finally {
      setSaving(false);
    }
  };

  const isOtherDepartmentSelected = formData.servingAs.includes('Other Department');
  const hasOversightRole = formData.servingAs.some(role => OVERSIGHT_ROLES.includes(role));

  // Determine back link based on context
  const getBackLink = () => {
    if (eventId) {
      return `/events/${eventId}/attendants`;
    }
    return '/events';
  };

  const getBackLinkText = () => {
    if (eventId) {
      return 'Back to Event Attendants';
    }
    return 'Back to Events';
  };

  const getServingAsBadgeColor = (role: string) => {
    if (role === 'Other Department') return 'bg-orange-100 text-orange-800';
    if (OVERSIGHT_ROLES.includes(role)) return 'bg-purple-100 text-purple-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendant...</p>
        </div>
      </div>
    );
  }

  if (error && !attendant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading attendant</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href={getBackLink()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {getBackLinkText()}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Navigation */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href={getBackLink()}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {getBackLinkText()}
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Attendant</h1>
            <p className="mt-2 text-gray-600">
              Update attendant information and availability
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Department Warning */}
        {isOtherDepartmentSelected && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">Automatic Availability Update</h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>This attendant is serving in "Other Department" and has been automatically set to "Unavailable" for event assignments.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Oversight Role Warning */}
        {hasOversightRole && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-purple-800">Oversight Role Assignment</h3>
                <div className="mt-2 text-sm text-purple-700">
                  <p>This attendant has an oversight role (Overseer, Overseer Assistant, or Keyman) and will not be available for regular position assignments. They will be responsible for overseeing other attendants.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Availability */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Availability</h3>
              <div>
                <label htmlFor="availabilityStatus" className="block text-sm font-medium text-gray-700">
                  Availability Status
                </label>
                <select
                  name="availabilityStatus"
                  id="availabilityStatus"
                  value={formData.availabilityStatus}
                  onChange={handleInputChange}
                  disabled={isOtherDepartmentSelected}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    isOtherDepartmentSelected ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                  <option value="LIMITED">Limited Availability</option>
                </select>
                {isOtherDepartmentSelected && (
                  <p className="mt-1 text-sm text-gray-500">
                    Availability is automatically set to "Unavailable" when serving in Other Department.
                  </p>
                )}
              </div>
            </div>

            {/* Serving As */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Serving As</h3>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Select all that apply:</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {SERVING_AS_OPTIONS.map((option) => (
                    <div key={option} className="flex items-center">
                      <input
                        id={`serving-${option}`}
                        type="checkbox"
                        checked={formData.servingAs.includes(option)}
                        onChange={(e) => handleServingAsChange(option, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`serving-${option}`} className="ml-2 block text-sm text-gray-900">
                        {option}
                        {option === 'Other Department' && (
                          <span className="text-orange-600 text-xs ml-1">(Sets to Unavailable)</span>
                        )}
                        {OVERSIGHT_ROLES.includes(option) && (
                          <span className="text-purple-600 text-xs ml-1">(Oversight Role)</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.servingAs.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-blue-800">Selected roles:</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {formData.servingAs.map((role) => (
                        <span key={role} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServingAsBadgeColor(role)}`}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes about this attendant..."
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Deleting...' : 'Delete Attendant'}
              </button>
              
              <div className="flex space-x-3">
                <Link
                  href={getBackLink()}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Attendant Stats */}
        {attendant && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Attendant Statistics</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{attendant.totalAssignments}</div>
                <div className="text-sm text-gray-500">Total Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{attendant.totalHours.toFixed(1)}</div>
                <div className="text-sm text-gray-500">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Date(attendant.createdAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500">Date Added</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
