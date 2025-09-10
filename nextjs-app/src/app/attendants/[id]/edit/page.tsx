'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  userId: string;
  notes?: string;
  isAvailable: boolean;
  totalAssignments: number;
  totalHours: number;
  createdAt: string;
  updatedAt: string;
  users: User;
}

export default function EditAttendantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [attendant, setAttendant] = useState<Attendant | null>(null);
  const [formData, setFormData] = useState({
    notes: '',
    isAvailable: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (resolvedParams?.id) {
      fetchAttendant(resolvedParams.id);
    }
  }, [resolvedParams]);

  const fetchAttendant = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendants/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Attendant not found');
        }
        throw new Error('Failed to fetch attendant');
      }
      const data = await response.json();
      setAttendant(data);
      setFormData({
        notes: data.notes || '',
        isAvailable: data.isAvailable
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resolvedParams?.id) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/attendants/${resolvedParams.id}`, {
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

      router.push(`/attendants/${resolvedParams.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (resolvedParams?.id) {
      router.push(`/attendants/${resolvedParams.id}`);
    } else {
      router.push('/attendants');
    }
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

  if (error || !attendant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">
            {error || 'Attendant not found'}
          </div>
          <button
            onClick={() => router.push('/attendants')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Attendants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Attendant: {attendant.users.firstName} {attendant.users.lastName}
          </h1>
          <p className="mt-2 text-gray-600">Update attendant profile information</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800">{error}</div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">User Information (Read-only)</h3>
              <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                <div><strong>Name:</strong> {attendant.users.firstName} {attendant.users.lastName}</div>
                <div><strong>Email:</strong> {attendant.users.email}</div>
                {attendant.users.phone && <div><strong>Phone:</strong> {attendant.users.phone}</div>}
                <div><strong>Role:</strong> {attendant.users.role}</div>
              </div>
            </div>

            <div>
              <label htmlFor="isAvailable" className="flex items-center">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Available for assignments
                </span>
              </label>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional notes about this attendant..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
