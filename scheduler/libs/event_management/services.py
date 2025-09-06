"""
Event Management Services

Business logic and service layer for event management.
"""

from typing import Dict, Any, List, Optional
from datetime import date, datetime
from ..shared.observability import log_event, monitor_performance
from ..shared.contracts import validate_contract
from .models import EventModel

class EventService:
    """Service layer for event management operations."""
    
    @monitor_performance("event_create")
    @validate_contract("event_create")
    def create_event(self, name: str, start_date: str, end_date: str, **kwargs) -> Dict[str, Any]:
        """Create a new event."""
        # Parse dates
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        # Validate date range
        if start_dt > end_dt:
            raise ValueError("Start date cannot be after end date")
        
        # Create event
        event = EventModel.create(
            name=name,
            start_date=start_dt,
            end_date=end_dt,
            **kwargs
        )
        
        return event.to_dict()
    
    @monitor_performance("event_get")
    def get_event(self, event_id: int) -> Dict[str, Any]:
        """Get event by ID."""
        event = EventModel.get_by_id(event_id)
        
        if not event:
            raise ValueError(f"Event with ID {event_id} not found")
        
        result = event.to_dict()
        
        # Add additional metadata
        result['positions_count'] = event.get_positions_count()
        result['attendants_count'] = event.get_attendants_count()
        
        return result
    
    @monitor_performance("event_list")
    def list_events(self, **filters) -> List[Dict[str, Any]]:
        """List events with optional filters."""
        events = EventModel.list_all(**filters)
        
        result = []
        for event in events:
            event_data = event.to_dict()
            event_data['positions_count'] = event.get_positions_count()
            event_data['attendants_count'] = event.get_attendants_count()
            result.append(event_data)
        
        log_event("event.list_retrieved", {
            "count": len(result),
            "filters": filters
        })
        
        return result
    
    @monitor_performance("event_update")
    @validate_contract("event_update")
    def update_event(self, event_id: int, **updates) -> Dict[str, Any]:
        """Update event."""
        event = EventModel.get_by_id(event_id)
        
        if not event:
            raise ValueError(f"Event with ID {event_id} not found")
        
        # Parse date fields if provided
        if 'start_date' in updates and isinstance(updates['start_date'], str):
            updates['start_date'] = datetime.strptime(updates['start_date'], "%Y-%m-%d").date()
        
        if 'end_date' in updates and isinstance(updates['end_date'], str):
            updates['end_date'] = datetime.strptime(updates['end_date'], "%Y-%m-%d").date()
        
        # Validate date range if both dates are being updated
        if 'start_date' in updates and 'end_date' in updates:
            if updates['start_date'] > updates['end_date']:
                raise ValueError("Start date cannot be after end date")
        
        success = event.update(**updates)
        
        if not success:
            raise ValueError("Failed to update event")
        
        return event.to_dict()
    
    @monitor_performance("event_delete")
    def delete_event(self, event_id: int) -> bool:
        """Delete event."""
        event = EventModel.get_by_id(event_id)
        
        if not event:
            raise ValueError(f"Event with ID {event_id} not found")
        
        # Check if event has assignments
        if event.get_attendants_count() > 0:
            raise ValueError("Cannot delete event with existing assignments")
        
        return event.delete()
    
    @monitor_performance("event_copy")
    def copy_event(self, event_id: int, new_name: str) -> Dict[str, Any]:
        """Copy event with all configurations."""
        event = EventModel.get_by_id(event_id)
        
        if not event:
            raise ValueError(f"Event with ID {event_id} not found")
        
        # Check if new name is unique
        existing_events = EventModel.list_all()
        existing_names = [e.name for e in existing_events]
        
        if new_name in existing_names:
            raise ValueError(f"Event with name '{new_name}' already exists")
        
        new_event = event.copy(new_name)
        
        return new_event.to_dict()
    
    def get_event_statistics(self, event_id: int) -> Dict[str, Any]:
        """Get comprehensive statistics for an event."""
        event = EventModel.get_by_id(event_id)
        
        if not event:
            raise ValueError(f"Event with ID {event_id} not found")
        
        stats = {
            'event': event.to_dict(),
            'positions_count': event.get_positions_count(),
            'attendants_count': event.get_attendants_count(),
            'assignment_completion': 0.0
        }
        
        # Calculate assignment completion percentage
        positions_count = stats['positions_count']
        if positions_count > 0:
            try:
                from scheduler.models import Assignment
                assigned_positions = Assignment.objects.filter(
                    position__event_id=event_id
                ).count()
                stats['assignment_completion'] = (assigned_positions / positions_count) * 100
            except:
                pass
        
        log_event("event.statistics_retrieved", {
            "event_id": event_id,
            "positions_count": stats['positions_count'],
            "attendants_count": stats['attendants_count']
        })
        
        return stats
    
    def search_events(self, query: str, **filters) -> List[Dict[str, Any]]:
        """Search events by name or location."""
        events = EventModel.list_all(**filters)
        
        # Filter by search query
        query_lower = query.lower()
        filtered_events = []
        
        for event in events:
            if (query_lower in event.name.lower() or 
                query_lower in event.location.lower()):
                filtered_events.append(event)
        
        result = []
        for event in filtered_events:
            event_data = event.to_dict()
            event_data['positions_count'] = event.get_positions_count()
            event_data['attendants_count'] = event.get_attendants_count()
            result.append(event_data)
        
        log_event("event.search_performed", {
            "query": query,
            "results_count": len(result)
        })
        
        return result
    
    def get_upcoming_events(self, days_ahead: int = 30) -> List[Dict[str, Any]]:
        """Get events starting within specified days."""
        from datetime import timedelta
        
        today = date.today()
        future_date = today + timedelta(days=days_ahead)
        
        filters = {
            'start_date_after': today,
            'start_date_before': future_date
        }
        
        return self.list_events(**filters)
