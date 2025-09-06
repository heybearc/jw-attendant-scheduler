"""
Event Management CLI

Command-line interface for event management library.
Implements SDD Article II: Libraries expose a CLI; text-in/text-out; JSON supported.
"""

import argparse
from typing import Dict, Any
from ..shared.cli_base import CLICommand, BaseCLI, JSONInputMixin, TextOutputMixin
from .services import EventService

class CreateEventCommand(CLICommand, JSONInputMixin):
    """Create a new event."""
    
    def __init__(self):
        super().__init__("create", "Create a new event")
        self.service = EventService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--name', required=True, help='Event name')
        parser.add_argument('--start-date', required=True, help='Start date (YYYY-MM-DD)')
        parser.add_argument('--end-date', required=True, help='End date (YYYY-MM-DD)')
        parser.add_argument('--location', help='Event location')
        parser.add_argument('--status', choices=['draft', 'active', 'completed', 'cancelled'], 
                          default='draft', help='Event status')
        self.add_json_arguments(parser)
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        # Merge JSON input with command line arguments
        json_data = self.get_json_input(kwargs)
        kwargs.update(json_data)
        
        # Extract required fields
        name = kwargs.get('name')
        start_date = kwargs.get('start_date')
        end_date = kwargs.get('end_date')
        
        if not all([name, start_date, end_date]):
            raise ValueError("name, start_date, and end_date are required")
        
        # Optional fields
        optional_fields = {}
        if kwargs.get('location'):
            optional_fields['location'] = kwargs['location']
        if kwargs.get('status'):
            optional_fields['status'] = kwargs['status']
        
        result = self.service.create_event(name, start_date, end_date, **optional_fields)
        
        return {
            "status": "success",
            "message": f"Event '{name}' created successfully",
            "event": result
        }

class ListEventsCommand(CLICommand, TextOutputMixin):
    """List events with optional filters."""
    
    def __init__(self):
        super().__init__("list", "List events")
        self.service = EventService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--status', choices=['draft', 'active', 'completed', 'cancelled'],
                          help='Filter by status')
        parser.add_argument('--start-date-after', help='Filter events starting after date (YYYY-MM-DD)')
        parser.add_argument('--start-date-before', help='Filter events starting before date (YYYY-MM-DD)')
        parser.add_argument('--search', help='Search by name or location')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        filters = {}
        
        # Build filters
        if kwargs.get('status'):
            filters['status'] = kwargs['status']
        if kwargs.get('start_date_after'):
            filters['start_date_after'] = kwargs['start_date_after']
        if kwargs.get('start_date_before'):
            filters['start_date_before'] = kwargs['start_date_before']
        
        # Handle search
        if kwargs.get('search'):
            events = self.service.search_events(kwargs['search'], **filters)
        else:
            events = self.service.list_events(**filters)
        
        return {
            "status": "success",
            "count": len(events),
            "events": events
        }
    
    def _format_as_text(self, data: Dict[str, Any]) -> str:
        """Format events as a table."""
        events = data.get('events', [])
        
        if not events:
            return "No events found"
        
        # Prepare table data
        table_data = []
        for event in events:
            table_data.append({
                'ID': event['id'],
                'Name': event['name'],
                'Start Date': event['start_date'],
                'End Date': event['end_date'],
                'Status': event['status'],
                'Positions': event.get('positions_count', 0),
                'Attendants': event.get('attendants_count', 0)
            })
        
        return self.format_table(table_data)

class GetEventCommand(CLICommand):
    """Get event details by ID."""
    
    def __init__(self):
        super().__init__("get", "Get event details")
        self.service = EventService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('event_id', type=int, help='Event ID')
        parser.add_argument('--stats', action='store_true', help='Include statistics')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        event_id = kwargs['event_id']
        
        if kwargs.get('stats'):
            result = self.service.get_event_statistics(event_id)
        else:
            event = self.service.get_event(event_id)
            result = {"event": event}
        
        return {
            "status": "success",
            **result
        }

class UpdateEventCommand(CLICommand, JSONInputMixin):
    """Update an event."""
    
    def __init__(self):
        super().__init__("update", "Update an event")
        self.service = EventService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('event_id', type=int, help='Event ID')
        parser.add_argument('--name', help='Event name')
        parser.add_argument('--start-date', help='Start date (YYYY-MM-DD)')
        parser.add_argument('--end-date', help='End date (YYYY-MM-DD)')
        parser.add_argument('--location', help='Event location')
        parser.add_argument('--status', choices=['draft', 'active', 'completed', 'cancelled'],
                          help='Event status')
        self.add_json_arguments(parser)
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        event_id = kwargs.pop('event_id')
        
        # Merge JSON input
        json_data = self.get_json_input(kwargs)
        kwargs.update(json_data)
        
        # Remove None values
        updates = {k: v for k, v in kwargs.items() if v is not None and k not in ['json_input', 'json_file']}
        
        if not updates:
            raise ValueError("No updates provided")
        
        result = self.service.update_event(event_id, **updates)
        
        return {
            "status": "success",
            "message": f"Event {event_id} updated successfully",
            "event": result
        }

class DeleteEventCommand(CLICommand):
    """Delete an event."""
    
    def __init__(self):
        super().__init__("delete", "Delete an event")
        self.service = EventService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('event_id', type=int, help='Event ID')
        parser.add_argument('--force', action='store_true', 
                          help='Force deletion (bypass safety checks)')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        event_id = kwargs['event_id']
        
        # Get event details for confirmation
        try:
            event = self.service.get_event(event_id)
        except ValueError as e:
            return {"status": "error", "message": str(e)}
        
        # Safety check unless forced
        if not kwargs.get('force') and event.get('attendants_count', 0) > 0:
            return {
                "status": "error",
                "message": f"Event has {event['attendants_count']} assigned attendants. Use --force to delete anyway."
            }
        
        success = self.service.delete_event(event_id)
        
        if success:
            return {
                "status": "success",
                "message": f"Event '{event['name']}' deleted successfully"
            }
        else:
            return {
                "status": "error",
                "message": "Failed to delete event"
            }

class CopyEventCommand(CLICommand):
    """Copy an event with all configurations."""
    
    def __init__(self):
        super().__init__("copy", "Copy an event")
        self.service = EventService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('event_id', type=int, help='Event ID to copy')
        parser.add_argument('new_name', help='Name for the new event')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        event_id = kwargs['event_id']
        new_name = kwargs['new_name']
        
        result = self.service.copy_event(event_id, new_name)
        
        return {
            "status": "success",
            "message": f"Event copied successfully as '{new_name}'",
            "event": result
        }

class UpcomingEventsCommand(CLICommand, TextOutputMixin):
    """Get upcoming events."""
    
    def __init__(self):
        super().__init__("upcoming", "Get upcoming events")
        self.service = EventService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--days', type=int, default=30,
                          help='Number of days to look ahead (default: 30)')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        days_ahead = kwargs.get('days', 30)
        events = self.service.get_upcoming_events(days_ahead)
        
        return {
            "status": "success",
            "days_ahead": days_ahead,
            "count": len(events),
            "events": events
        }
    
    def _format_as_text(self, data: Dict[str, Any]) -> str:
        """Format upcoming events as a table."""
        events = data.get('events', [])
        
        if not events:
            return f"No upcoming events in the next {data.get('days_ahead', 30)} days"
        
        # Prepare table data
        table_data = []
        for event in events:
            table_data.append({
                'ID': event['id'],
                'Name': event['name'],
                'Start Date': event['start_date'],
                'Status': event['status'],
                'Positions': event.get('positions_count', 0)
            })
        
        return self.format_table(table_data)

class EventCLI(BaseCLI):
    """Event Management CLI interface."""
    
    help = "Event Management CLI - Create, list, update, and manage events"
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Register commands
        self.add_command(CreateEventCommand())
        self.add_command(ListEventsCommand())
        self.add_command(GetEventCommand())
        self.add_command(UpdateEventCommand())
        self.add_command(DeleteEventCommand())
        self.add_command(CopyEventCommand())
        self.add_command(UpcomingEventsCommand())
