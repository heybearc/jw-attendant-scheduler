"""
Event Management Models

Data models for event management library.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, date
from django.db import models
from ..shared.observability import log_event, EventLogger

class EventModel:
    """Event model interface for the library."""
    
    def __init__(self, django_event=None):
        """Initialize with optional Django model instance."""
        self._django_event = django_event
    
    @classmethod
    def from_django(cls, django_event):
        """Create EventModel from Django Event instance."""
        return cls(django_event)
    
    @classmethod
    def create(cls, name: str, start_date: date, end_date: date, **kwargs) -> 'EventModel':
        """Create new event."""
        from scheduler.models import Event
        
        django_event = Event.objects.create(
            name=name,
            start_date=start_date,
            end_date=end_date,
            **kwargs
        )
        
        # Log event creation
        EventLogger.event_created(
            event_id=django_event.id,
            event_name=name,
            created_by=kwargs.get('created_by', 0)
        )
        
        return cls(django_event)
    
    @classmethod
    def get_by_id(cls, event_id: int) -> Optional['EventModel']:
        """Get event by ID."""
        from scheduler.models import Event
        
        try:
            django_event = Event.objects.get(id=event_id)
            return cls(django_event)
        except Event.DoesNotExist:
            return None
    
    @classmethod
    def list_all(cls, **filters) -> List['EventModel']:
        """List all events with optional filters."""
        from scheduler.models import Event
        
        queryset = Event.objects.all()
        
        # Apply filters
        if 'status' in filters:
            queryset = queryset.filter(status=filters['status'])
        if 'start_date_after' in filters:
            queryset = queryset.filter(start_date__gte=filters['start_date_after'])
        if 'start_date_before' in filters:
            queryset = queryset.filter(start_date__lte=filters['start_date_before'])
        
        return [cls(event) for event in queryset.order_by('-start_date')]
    
    @property
    def id(self) -> int:
        """Event ID."""
        return self._django_event.id if self._django_event else None
    
    @property
    def name(self) -> str:
        """Event name."""
        return self._django_event.name if self._django_event else ""
    
    @property
    def start_date(self) -> date:
        """Event start date."""
        return self._django_event.start_date if self._django_event else None
    
    @property
    def end_date(self) -> date:
        """Event end date."""
        return self._django_event.end_date if self._django_event else None
    
    @property
    def location(self) -> str:
        """Event location."""
        return self._django_event.location if self._django_event else ""
    
    @property
    def status(self) -> str:
        """Event status."""
        return self._django_event.status if self._django_event else "draft"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        if not self._django_event:
            return {}
        
        return {
            'id': self.id,
            'name': self.name,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'location': self.location,
            'status': self.status,
            'created_at': self._django_event.created_at.isoformat() if hasattr(self._django_event, 'created_at') else None
        }
    
    def update(self, **kwargs) -> bool:
        """Update event fields."""
        if not self._django_event:
            return False
        
        updated_fields = []
        for field, value in kwargs.items():
            if hasattr(self._django_event, field):
                setattr(self._django_event, field, value)
                updated_fields.append(field)
        
        if updated_fields:
            self._django_event.save(update_fields=updated_fields)
            
            # Log update
            log_event("event.updated", {
                "event_id": self.id,
                "updated_fields": updated_fields
            })
            
            return True
        
        return False
    
    def delete(self) -> bool:
        """Delete event."""
        if not self._django_event:
            return False
        
        event_id = self.id
        event_name = self.name
        
        self._django_event.delete()
        
        # Log deletion
        log_event("event.deleted", {
            "event_id": event_id,
            "event_name": event_name
        })
        
        return True
    
    def copy(self, new_name: str) -> 'EventModel':
        """Copy event with all configurations."""
        if not self._django_event:
            raise ValueError("Cannot copy event without Django model")
        
        # Create new event with same properties
        new_event_data = {
            'name': new_name,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'location': self.location,
            'status': 'draft'  # New events start as draft
        }
        
        new_event = EventModel.create(**new_event_data)
        
        # Copy positions if they exist
        if hasattr(self._django_event, 'positions'):
            for position in self._django_event.positions.all():
                position.pk = None  # Create new instance
                position.event = new_event._django_event
                position.save()
        
        # Log copy operation
        log_event("event.copied", {
            "original_event_id": self.id,
            "new_event_id": new_event.id,
            "new_event_name": new_name
        })
        
        return new_event
    
    def get_positions_count(self) -> int:
        """Get number of positions for this event."""
        if not self._django_event or not hasattr(self._django_event, 'positions'):
            return 0
        return self._django_event.positions.count()
    
    def get_attendants_count(self) -> int:
        """Get number of assigned attendants for this event."""
        if not self._django_event:
            return 0
        
        # Count unique attendants assigned to this event
        try:
            from scheduler.models import Assignment
            return Assignment.objects.filter(
                position__event=self._django_event
            ).values('attendant').distinct().count()
        except:
            return 0
    
    def __str__(self) -> str:
        """String representation."""
        return f"Event({self.name}, {self.start_date})"
    
    def __repr__(self) -> str:
        """Detailed representation."""
        return f"EventModel(id={self.id}, name='{self.name}', start_date='{self.start_date}')"
