"""
Event Management Library

Standalone library for managing JW events with CLI interface.
Implements SDD Article I: Library-First architecture.
"""

from .models import EventModel
from .services import EventService
from .cli import EventCLI

class EventManagementLib:
    """Main interface for Event Management Library."""
    
    def __init__(self):
        self.service = EventService()
    
    def create_event(self, name: str, start_date: str, end_date: str, **kwargs) -> dict:
        """Create a new event."""
        return self.service.create_event(name, start_date, end_date, **kwargs)
    
    def get_event(self, event_id: int) -> dict:
        """Get event by ID."""
        return self.service.get_event(event_id)
    
    def list_events(self, **filters) -> list:
        """List events with optional filters."""
        return self.service.list_events(**filters)
    
    def update_event(self, event_id: int, **updates) -> dict:
        """Update event."""
        return self.service.update_event(event_id, **updates)
    
    def delete_event(self, event_id: int) -> bool:
        """Delete event."""
        return self.service.delete_event(event_id)
    
    def copy_event(self, event_id: int, new_name: str) -> dict:
        """Copy event with all configurations."""
        return self.service.copy_event(event_id, new_name)

__all__ = ["EventManagementLib", "EventModel", "EventService", "EventCLI"]
