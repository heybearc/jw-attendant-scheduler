// Event types for TypeScript validation
export interface Event {
  id: string;
  name: string;
  eventType: EventType;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  status: EventStatus;
  venue?: string;
  isActive: boolean;
  settings?: unknown;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateEventRequest {
  name: string;
  eventType: EventType;
  startDate: string;
  endDate: string;
  location: string;
  description?: string;
  venue?: string;
}

export interface UpdateEventRequest {
  name?: string;
  eventType?: EventType;
  startDate?: string;
  endDate?: string;
  location?: string;
  description?: string;
  venue?: string;
  status?: EventStatus;
}

export enum EventType {
  ASSEMBLY = 'ASSEMBLY',
  CONVENTION = 'CONVENTION'
}

export enum EventStatus {
  UPCOMING = 'UPCOMING',
  CURRENT = 'CURRENT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED'
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EventType.ASSEMBLY]: 'Circuit Assembly',
  [EventType.CONVENTION]: 'Regional Convention'
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  [EventStatus.UPCOMING]: 'Upcoming',
  [EventStatus.CURRENT]: 'Current',
  [EventStatus.COMPLETED]: 'Completed',
  [EventStatus.CANCELLED]: 'Cancelled',
  [EventStatus.ARCHIVED]: 'Archived'
};
