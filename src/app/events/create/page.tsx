'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import EventForm from '@/components/events/EventForm';
import { CreateEventRequest } from '@/types/event';
import { eventService } from '@/services/eventService';

export default function CreateEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (eventData: CreateEventRequest) => {
    setIsLoading(true);
    try {
      const newEvent = await eventService.createEvent(eventData);
      console.log('Event created successfully:', newEvent);
      
      // Redirect to events list or event detail page
      router.push('/events');
    } catch (error) {
      console.error('Failed to create event:', error);
      // TODO: Show error toast/notification
      alert('Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/events');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <div className="flex items-center">
                  <button
                    onClick={() => router.push('/')}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    Home
                  </button>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="flex-shrink-0 h-5 w-5 text-gray-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <button
                    onClick={() => router.push('/events')}
                    className="ml-4 text-gray-400 hover:text-gray-500"
                  >
                    Events
                  </button>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="flex-shrink-0 h-5 w-5 text-gray-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">
                    Create Event
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Event Form */}
        <EventForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
