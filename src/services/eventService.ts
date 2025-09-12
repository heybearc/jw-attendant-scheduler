// Event API service for CRUD operations
import { Event, CreateEventRequest, UpdateEventRequest } from '@/types/event';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class EventService {
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response;
  }

  async getAllEvents(): Promise<Event[]> {
    try {
      const response = await this.fetchWithAuth('/api/events');
      return await response.json();
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async getEvent(id: string): Promise<Event> {
    try {
      const response = await this.fetchWithAuth(`/api/events/${id}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching event ${id}:`, error);
      throw error;
    }
  }

  async createEvent(eventData: CreateEventRequest): Promise<Event> {
    try {
      const response = await this.fetchWithAuth('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(id: string, eventData: UpdateEventRequest): Promise<Event> {
    try {
      const response = await this.fetchWithAuth(`/api/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
      });
      return await response.json();
    } catch (error) {
      console.error(`Error updating event ${id}:`, error);
      throw error;
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      await this.fetchWithAuth(`/api/events/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`Error deleting event ${id}:`, error);
      throw error;
    }
  }

  async setCurrentEvent(id: string): Promise<Event> {
    try {
      const response = await this.fetchWithAuth(`/api/events/${id}/set-current`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      console.error(`Error setting current event ${id}:`, error);
      throw error;
    }
  }

  async archiveEvent(id: string): Promise<Event> {
    try {
      const response = await this.fetchWithAuth(`/api/events/${id}/archive`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      console.error(`Error archiving event ${id}:`, error);
      throw error;
    }
  }

  async getCurrentEvent(): Promise<Event | null> {
    try {
      const response = await this.fetchWithAuth('/api/events/current');
      return await response.json();
    } catch (error) {
      console.error('Error fetching current event:', error);
      return null;
    }
  }
}

export const eventService = new EventService();
