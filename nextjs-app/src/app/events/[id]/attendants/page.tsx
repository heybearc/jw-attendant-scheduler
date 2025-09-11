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
  congregation?: string;
  experienceLevel?: string;
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

interface EventAssignment {
  id: string;
  eventId: string;
  attendantId: string;
  position: string;
  assignedAt: string;
  attendant: Attendant;
}

export default function EventAttendantsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [assignments, setAssignments] = useState<EventAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'attendants' | 'assignments'>('attendants');
  
  // Enhanced form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAttendant, setEditingAttendant] = useState<Attendant | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedAttendant, setSelectedAttendant] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState('');

  // Enhanced form data with production-level fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    availabilityStatus: 'AVAILABLE' as 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE',
    servingAs: [] as string[],
    notes: ''
  });

  const servingRoleOptions = [
    { id: 'elder', label: 'Elder', isOversight: true },
    { id: 'ministerial_servant', label: 'Ministerial Servant', isOversight: false },
    { id: 'regular_pioneer', label: 'Regular Pioneer', isOversight: false },
    { id: 'overseer', label: 'Overseer', isOversight: true },
    { id: 'overseer_assistant', label: 'Overseer Assistant', isOversight: true },
    { id: 'keyman', label: 'Keyman', isOversight: true },
    { id: 'other_department', label: 'Other Department', isOversight: false }
  ];

  const positionOptions = [
    'Sound',
    'Platform',
    'Microphones',
    'Literature',
    'Parking',
    'Security',
    'Attendant'
  ];

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      fetchAttendants();
      fetchAssignments();
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

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/assignments`);
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      const data = await response.json();
      setAssignments(data);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    }
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    const updatedRoles = checked 
      ? [...formData.servingAs, roleId]
      : formData.servingAs.filter(role => role !== roleId);
    
    // Auto-set availability status based on Other Department role
    const hasOtherDepartment = updatedRoles.includes('other_department');
    const newAvailabilityStatus = hasOtherDepartment ? 'UNAVAILABLE' : (updatedRoles.includes('other_department') ? 'UNAVAILABLE' : formData.availabilityStatus);
    
    setFormData({
      ...formData, 
      servingAs: updatedRoles,
      availabilityStatus: newAvailabilityStatus
    });
  };

  const handleCreateAttendant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare the data with proper field mapping
      const createData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        availabilityStatus: formData.availabilityStatus,
        servingAs: formData.servingAs, // Ensure servingAs array is included
        notes: formData.notes,
        // Set isAvailable based on availability status and other department
        isAvailable: formData.availabilityStatus === 'AVAILABLE' && !formData.servingAs.includes('other_department')
      };

      console.log('Creating attendant with data:', createData); // Debug log

      const response = await fetch('/api/attendants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Create failed:', errorData);
        throw new Error(`Failed to create attendant: ${response.status}`);
      }
      
      setShowCreateForm(false);
      resetForm();
      fetchAttendants();
    } catch (err) {
      console.error('Create attendant error:', err);
      alert('Failed to create attendant: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleEditAttendant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttendant) return;

    try {
      // Prepare the data with proper field mapping
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        availabilityStatus: formData.availabilityStatus,
        servingAs: formData.servingAs, // Ensure servingAs array is included
        notes: formData.notes,
        // Set isAvailable based on availability status and other department
        isAvailable: formData.availabilityStatus === 'AVAILABLE' && !formData.servingAs.includes('other_department')
      };

      console.log('Updating attendant with data:', updateData); // Debug log

      const response = await fetch(`/api/attendants/${editingAttendant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Update failed:', errorData);
        throw new Error(`Failed to update attendant: ${response.status}`);
      }
      
      setEditingAttendant(null);
      resetForm();
      fetchAttendants();
    } catch (err) {
      console.error('Edit attendant error:', err);
      alert('Failed to update attendant: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteAttendant = async (attendantId: string) => {
    if (!confirm('Are you sure you want to delete this attendant? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/attendants/${attendantId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete attendant');
      
      setEditingAttendant(null);
      resetForm();
      fetchAttendants();
    } catch (err) {
      alert('Failed to delete attendant: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleAssignAttendant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/events/${eventId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendantId: selectedAttendant,
          position: selectedPosition
        })
      });

      if (!response.ok) throw new Error('Failed to assign attendant');
      
      setShowAssignForm(false);
      setSelectedAttendant('');
      setSelectedPosition('');
      fetchAssignments();
    } catch (err) {
      alert('Failed to assign attendant: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/assignments/${assignmentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to remove assignment');
      
      fetchAssignments();
    } catch (err) {
      alert('Failed to remove assignment: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      availabilityStatus: 'AVAILABLE',
      servingAs: [],
      notes: ''
    });
  };

  const startEdit = (attendant: Attendant) => {
    setEditingAttendant(attendant);
    setFormData({
      firstName: attendant.firstName,
      lastName: attendant.lastName,
      email: attendant.email,
      phone: attendant.phone || '',
      availabilityStatus: attendant.availabilityStatus,
      servingAs: attendant.servingAs || [],
      notes: attendant.notes || ''
    });
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
    // Check if attendant has "Other Department" role
    const hasOtherDepartment = attendant.servingAs?.includes('other_department') || 
                               attendant.servingAs?.includes('Other Department');
    
    if (hasOtherDepartment) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Unavailable
        </span>
      );
    }
    
    // Default availability status badges
    const statusColors = {
      'AVAILABLE': 'bg-green-100 text-green-800',
      'LIMITED': 'bg-yellow-100 text-yellow-800', 
      'UNAVAILABLE': 'bg-red-100 text-red-800'
    };
    
    const colorClass = statusColors[attendant.availabilityStatus as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {attendant.availabilityStatus}
      </span>
    );
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const processCSVImport = async () => {
    if (!csvFile) return;

    setImportProgress('Reading CSV file...');
    const text = await csvFile.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      alert('CSV file must contain at least a header row and one data row');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredFields = ['firstname', 'lastname', 'email'];
    
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    if (missingFields.length > 0) {
      alert(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const attendantData: any = {};
      
      headers.forEach((header, index) => {
        if (values[index]) {
          switch (header) {
            case 'firstname':
              attendantData.firstName = values[index];
              break;
            case 'lastname':
              attendantData.lastName = values[index];
              break;
            case 'email':
              attendantData.email = values[index];
              break;
            case 'phone':
              attendantData.phone = values[index];
              break;
            case 'availabilitystatus':
              attendantData.availabilityStatus = values[index].toUpperCase();
              break;
            case 'notes':
              attendantData.notes = values[index];
              break;
          }
        }
      });

      // Set defaults
      attendantData.availabilityStatus = attendantData.availabilityStatus || 'AVAILABLE';
      attendantData.servingAs = [];
      attendantData.isAvailable = attendantData.availabilityStatus === 'AVAILABLE';

      setImportProgress(`Processing ${i}/${lines.length - 1}: ${attendantData.firstName} ${attendantData.lastName}`);

      try {
        const response = await fetch('/api/attendants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attendantData)
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Failed to import ${attendantData.firstName} ${attendantData.lastName}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error importing ${attendantData.firstName} ${attendantData.lastName}:`, error);
      }
    }

    setImportProgress('');
    setCsvFile(null);
    setShowImportModal(false);
    
    alert(`Import completed! Success: ${successCount}, Errors: ${errorCount}`);
    
    if (successCount > 0) {
      fetchAttendants();
    }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <span>/</span>
            <Link href="/events" className="hover:text-gray-700">Events</Link>
            <span>/</span>
            <Link href={`/events/${eventId}`} className="hover:text-gray-700">{event?.name || 'Event'}</Link>
            <span>/</span>
            <span className="text-gray-900">Attendant Management</span>
          </nav>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendant Management</h1>
              <p className="mt-2 text-gray-600">
                Manage attendants and assignments for <strong>{event?.name || 'Event'}</strong>
              </p>
              {event && (
                <p className="text-sm text-gray-500">
                  {new Date(event.startDate).toLocaleDateString()} • {event.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('attendants')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'attendants'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Attendant Profiles ({attendants.length})
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'assignments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Event Assignments ({assignments.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Enhanced Create/Edit Form Modal */}
        {(showCreateForm || editingAttendant) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingAttendant ? 'Edit Attendant' : 'Create New Attendant'}
              </h3>
              
              {/* Oversight Role Warning */}
              {formData.servingAs.some(role => servingRoleOptions.find(opt => opt.id === role)?.isOversight) && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
                    <h4 className="font-medium text-purple-800">Oversight Role Assignment</h4>
                  </div>
                  <p className="text-sm text-purple-700 mt-1">
                    This attendant has an oversight role and will be responsible for overseeing other attendants.
                  </p>
                </div>
              )}

              <form onSubmit={editingAttendant ? handleEditAttendant : handleCreateAttendant}>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Availability</h4>
                    <select
                      value={formData.availabilityStatus}
                      onChange={(e) => setFormData({...formData, availabilityStatus: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="LIMITED">Limited</option>
                      <option value="UNAVAILABLE">Unavailable</option>
                    </select>
                  </div>

                  {/* Serving Roles */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Serving As</h4>
                    <p className="text-sm text-gray-600 mb-3">Select all that apply:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {servingRoleOptions.map((role) => (
                        <label key={role.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.servingAs.includes(role.id)}
                            onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                            className="mr-2"
                          />
                          <span className={role.isOversight ? 'text-purple-700 font-medium' : role.id === 'other_department' ? 'text-orange-700 font-medium' : ''}>
                            {role.label}
                            {role.isOversight && <span className="text-purple-500 text-xs ml-1">(Oversight)</span>}
                            {role.id === 'other_department' && <span className="text-orange-500 text-xs ml-1">(Sets Unavailable)</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Other Department Warning */}
                    {formData.servingAs.includes('other_department') && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                          <h4 className="font-medium text-orange-800">Other Department Assignment</h4>
                        </div>
                        <p className="text-sm text-orange-700 mt-1">
                          This attendant is serving in another department and has been automatically set to unavailable for regular position assignments.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={3}
                      placeholder="Additional notes about this attendant..."
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <div>
                    {editingAttendant && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAttendant(editingAttendant.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      >
                        Delete Attendant
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingAttendant(null);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      {editingAttendant ? 'Save Changes' : 'Create Attendant'}
                    </button>
                  </div>
                </div>

                {/* Attendant Statistics (for edit mode) */}
                {editingAttendant && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Attendant Statistics</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{editingAttendant.totalAssignments || 0}</div>
                        <div className="text-sm text-gray-500">Total Assignments</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{editingAttendant.totalHours || 0}.0</div>
                        <div className="text-sm text-gray-500">Total Hours</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {new Date(editingAttendant.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">Date Added</div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Assignment Form Modal */}
        {showAssignForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Assign Attendant to Position</h3>
              
              <form onSubmit={handleAssignAttendant}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Attendant
                    </label>
                    <select
                      value={selectedAttendant}
                      onChange={(e) => setSelectedAttendant(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Choose an attendant...</option>
                      {attendants
                        .filter(a => a.availabilityStatus === 'AVAILABLE' && a.isAvailable)
                        .map((attendant) => (
                          <option key={attendant.id} value={attendant.id}>
                            {attendant.firstName} {attendant.lastName}
                          </option>
                        ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <select
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Choose a position...</option>
                      {positionOptions.map((position) => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignForm(false);
                      setSelectedAttendant('');
                      setSelectedPosition('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Assign
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CSV Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Import Attendants from CSV</h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                    setImportProgress('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {csvFile && (
                  <div className="text-sm text-gray-600">
                    Selected: {csvFile.name}
                  </div>
                )}

                {importProgress && (
                  <div className="text-sm text-blue-600">
                    {importProgress}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  <p className="font-medium mb-1">Required columns:</p>
                  <p>firstName, lastName, email</p>
                  <p className="font-medium mb-1 mt-2">Optional columns:</p>
                  <p>phone, availabilityStatus, notes</p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setCsvFile(null);
                      setImportProgress('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processCSVImport}
                    disabled={!csvFile || !!importProgress}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md"
                  >
                    {importProgress ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'attendants' ? (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Attendant Profiles ({attendants.length})
              </h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add New Attendant
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Import CSV
                </button>
                <button
                  onClick={downloadCSVTemplate}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Download CSV Template
                </button>
              </div>
            </div>

            {/* Attendants List */}
            {attendants.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No attendants found</h3>
                <p className="text-gray-600 mb-4">Get started by adding attendants for this event.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add First Attendant
                </button>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
                                {attendant.congregation && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <p>{attendant.congregation}</p>
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
                              <button
                                onClick={() => startEdit(attendant)}
                                className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 flex items-center"
                                title="Edit Attendant"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
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
          </div>
        ) : (
          <div className="space-y-6">
            {/* Assignment Action Buttons */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Event Assignments ({assignments.length})
              </h3>
              <button
                onClick={() => setShowAssignForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Assign Attendant
              </button>
            </div>

            {/* Event Assignments */}
            {assignments.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                <p className="text-gray-600 mb-4">Start assigning attendants to positions for this event.</p>
                <button
                  onClick={() => setShowAssignForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Make First Assignment
                </button>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <li key={assignment.id}>
                      <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {assignment.attendant.firstName.charAt(0)}{assignment.attendant.lastName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex items-center mb-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {assignment.attendant.firstName} {assignment.attendant.lastName}
                                </p>
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {assignment.position}
                                </span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <p>{assignment.attendant.email}</p>
                                <span className="mx-2">•</span>
                                <p>Assigned {new Date(assignment.assignedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRemoveAssignment(assignment.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
