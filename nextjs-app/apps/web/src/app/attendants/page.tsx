'use client';

import { useState, useEffect } from 'react';
import { AttendantService, Attendant } from '../../../libs/attendant-management/src/attendantservice';
import { PrismaClient } from '@prisma/client';

export default function AttendantsPage() {
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAttendant, setNewAttendant] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    loadAttendants();
  }, []);

  const loadAttendants = async () => {
    try {
      const response = await fetch('/api/attendants');
      const data = await response.json();
      setAttendants(data);
    } catch (error) {
      console.error('Failed to load attendants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadAttendants();
      return;
    }

    try {
      const response = await fetch(`/api/attendants/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setAttendants(data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleCreateAttendant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/attendants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAttendant),
      });

      if (response.ok) {
        setNewAttendant({ firstName: '', lastName: '', email: '', phone: '' });
        setShowCreateForm(false);
        loadAttendants();
      }
    } catch (error) {
      console.error('Failed to create attendant:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
        <p className="text-yellow-700">
          <strong>Next.js Staging Environment</strong> - Attendant management with SDD architecture
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Attendant Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Attendant
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search attendants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
        >
          Search
        </button>
        <button
          onClick={() => {
            setSearchQuery('');
            loadAttendants();
          }}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
        >
          Clear
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Add New Attendant</h2>
            <form onSubmit={handleCreateAttendant}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  required
                  value={newAttendant.firstName}
                  onChange={(e) => setNewAttendant({...newAttendant, firstName: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  required
                  value={newAttendant.lastName}
                  onChange={(e) => setNewAttendant({...newAttendant, lastName: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={newAttendant.email}
                  onChange={(e) => setNewAttendant({...newAttendant, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={newAttendant.phone}
                  onChange={(e) => setNewAttendant({...newAttendant, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Create Attendant
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendants List */}
      <div className="grid gap-4">
        {attendants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-xl mb-2">No attendants found</p>
            <p>Add your first attendant to get started</p>
          </div>
        ) : (
          attendants.map((attendant) => (
            <div key={attendant.id} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    {attendant.firstName} {attendant.lastName}
                  </h3>
                  {attendant.email && (
                    <p className="text-gray-600">{attendant.email}</p>
                  )}
                  {attendant.phone && (
                    <p className="text-gray-600">{attendant.phone}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Added: {new Date(attendant.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    attendant.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {attendant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 text-center text-gray-500">
        <p>Total Attendants: {attendants.length}</p>
        <p className="text-sm">Using SDD Attendant Management Library</p>
      </div>
    </div>
  );
}
