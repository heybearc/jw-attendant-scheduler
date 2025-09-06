"""
Count Tracking CLI

Command-line interface for count tracking library.
Implements SDD Article II: Libraries expose a CLI; text-in/text-out; JSON supported.
"""

import argparse
from typing import Dict, Any
from ..shared.cli_base import CLICommand, BaseCLI, JSONInputMixin, TextOutputMixin
from .services import CountTrackingService

class CreateSessionCommand(CLICommand, JSONInputMixin):
    """Create a new count session."""
    
    def __init__(self):
        super().__init__("create-session", "Create a new count session")
        self.service = CountTrackingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--event-id', type=int, required=True, help='Event ID')
        parser.add_argument('--position-id', type=int, required=True, help='Position ID')
        parser.add_argument('--force', action='store_true', help='Force creation even if active session exists')
        parser.add_argument('--notes', help='Session notes')
        self.add_json_arguments(parser)
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        # Merge JSON input with command line arguments
        json_data = self.get_json_input(kwargs)
        kwargs.update(json_data)
        
        event_id = kwargs.get('event_id')
        position_id = kwargs.get('position_id')
        
        if not all([event_id, position_id]):
            raise ValueError("event_id and position_id are required")
        
        # Optional fields
        optional_fields = {}
        for field in ['force', 'notes']:
            if kwargs.get(field) is not None:
                optional_fields[field] = kwargs[field]
        
        result = self.service.create_count_session(event_id, position_id, **optional_fields)
        
        return {
            "status": "success",
            "message": f"Count session created successfully",
            "session": result
        }

class ListSessionsCommand(CLICommand, TextOutputMixin):
    """List count sessions with optional filters."""
    
    def __init__(self):
        super().__init__("list-sessions", "List count sessions")
        self.service = CountTrackingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--event-id', type=int, help='Filter by event ID')
        parser.add_argument('--position-id', type=int, help='Filter by position ID')
        parser.add_argument('--status', choices=['pending', 'active', 'completed', 'cancelled'],
                          help='Filter by status')
        parser.add_argument('--date-from', help='Filter sessions from date (YYYY-MM-DD)')
        parser.add_argument('--date-to', help='Filter sessions to date (YYYY-MM-DD)')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        filters = {}
        
        # Build filters
        for field in ['event_id', 'position_id', 'status', 'date_from', 'date_to']:
            if kwargs.get(field) is not None:
                filters[field] = kwargs[field]
        
        sessions = self.service.list_count_sessions(**filters)
        
        return {
            "status": "success",
            "count": len(sessions),
            "sessions": sessions
        }
    
    def _format_as_text(self, data: Dict[str, Any]) -> str:
        """Format sessions as a table."""
        sessions = data.get('sessions', [])
        
        if not sessions:
            return "No count sessions found"
        
        # Prepare table data
        table_data = []
        for session in sessions:
            table_data.append({
                'ID': session['id'],
                'Event ID': session['event_id'],
                'Position': session.get('position_name', f"ID {session['position_id']}"),
                'Status': session['status'],
                'Total Count': session.get('total_count', 0),
                'Records': session.get('records_count', 0),
                'Created': session.get('created_at', '')[:19] if session.get('created_at') else ''
            })
        
        return self.format_table(table_data)

class GetSessionCommand(CLICommand):
    """Get count session details by ID."""
    
    def __init__(self):
        super().__init__("get-session", "Get count session details")
        self.service = CountTrackingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('session_id', type=int, help='Session ID')
        parser.add_argument('--summary', action='store_true', help='Include detailed summary')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        session_id = kwargs['session_id']
        
        if kwargs.get('summary'):
            result = self.service.get_session_summary(session_id)
        else:
            session = self.service.get_count_session(session_id)
            result = {"session": session}
        
        return {
            "status": "success",
            **result
        }

class StartSessionCommand(CLICommand):
    """Start a count session."""
    
    def __init__(self):
        super().__init__("start-session", "Start a count session")
        self.service = CountTrackingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('session_id', type=int, help='Session ID')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        session_id = kwargs['session_id']
        result = self.service.start_count_session(session_id)
        
        return {
            "status": "success",
            "message": f"Count session {session_id} started successfully",
            "session": result
        }

class EndSessionCommand(CLICommand):
    """End a count session."""
    
    def __init__(self):
        super().__init__("end-session", "End a count session")
        self.service = CountTrackingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('session_id', type=int, help='Session ID')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        session_id = kwargs['session_id']
        result = self.service.end_count_session(session_id)
        
        return {
            "status": "success",
            "message": f"Count session {session_id} ended successfully",
            "session": result
        }

class RecordCountCommand(CLICommand, JSONInputMixin):
    """Record a count entry."""
    
    def __init__(self):
        super().__init__("record", "Record a count entry")
        self.service = CountTrackingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--session-id', type=int, required=True, help='Session ID')
        parser.add_argument('--count-type', required=True, help='Count type (e.g., "attendees", "publishers")')
        parser.add_argument('--count-value', type=int, required=True, help='Count value')
        parser.add_argument('--notes', help='Record notes')
        self.add_json_arguments(parser)
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        # Merge JSON input
        json_data = self.get_json_input(kwargs)
        kwargs.update(json_data)
        
        session_id = kwargs.get('session_id')
        count_type = kwargs.get('count_type')
        count_value = kwargs.get('count_value')
        
        if not all([session_id is not None, count_type, count_value is not None]):
            raise ValueError("session_id, count_type, and count_value are required")
        
        # Optional fields
        optional_fields = {}
        if kwargs.get('notes'):
            optional_fields['notes'] = kwargs['notes']
        
        result = self.service.record_count(session_id, count_type, count_value, **optional_fields)
        
        return {
            "status": "success",
            "message": f"Count recorded: {count_type} = {count_value}",
            "record": result
        }

class BulkRecordCommand(CLICommand, JSONInputMixin):
    """Record multiple counts in bulk."""
    
    def __init__(self):
        super().__init__("bulk-record", "Record multiple counts")
        self.service = CountTrackingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--session-id', type=int, required=True, help='Session ID')
        self.add_json_arguments(parser)
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        session_id = kwargs.get('session_id')
        
        if not session_id:
            raise ValueError("session_id is required")
        
        # Get count records from JSON input
        json_data = self.get_json_input(kwargs)
        
        if 'records' not in json_data:
            raise ValueError("JSON input must contain 'records' array")
        
        count_records = json_data['records']
        
        if not isinstance(count_records, list):
            raise ValueError("'records' must be an array")
        
        result = self.service.bulk_record_counts(session_id, count_records)
        
        return {
            "status": "success",
            "message": f"Bulk record completed: {result['created_count']}/{result['total_submitted']} records created",
            **result
        }

class ActiveSessionsCommand(CLICommand, TextOutputMixin):
    """Get active count sessions."""
    
    def __init__(self):
        super().__init__("active-sessions", "Get active count sessions")
        self.service = CountTrackingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--event-id', type=int, help='Filter by event ID')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        event_id = kwargs.get('event_id')
        sessions = self.service.get_active_sessions(event_id)
        
        return {
            "status": "success",
            "count": len(sessions),
            "sessions": sessions
        }
    
    def _format_as_text(self, data: Dict[str, Any]) -> str:
        """Format active sessions as a table."""
        sessions = data.get('sessions', [])
        
        if not sessions:
            return "No active count sessions found"
        
        # Prepare table data
        table_data = []
        for session in sessions:
            table_data.append({
                'Session ID': session['id'],
                'Event ID': session['event_id'],
                'Position': session.get('position_name', f"ID {session['position_id']}"),
                'Current Count': session.get('total_count', 0),
                'Started': session.get('start_time', '')[:19] if session.get('start_time') else ''
            })
        
        return self.format_table(table_data)

class EventSummaryCommand(CLICommand, TextOutputMixin):
    """Get count summary for an event."""
    
    def __init__(self):
        super().__init__("event-summary", "Get event count summary")
        self.service = CountTrackingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('event_id', type=int, help='Event ID')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        event_id = kwargs['event_id']
        result = self.service.get_event_count_summary(event_id)
        
        return {
            "status": "success",
            **result
        }
    
    def _format_as_text(self, data: Dict[str, Any]) -> str:
        """Format event summary as text."""
        event_id = data.get('event_id')
        total_sessions = data.get('total_sessions', 0)
        total_count = data.get('total_count', 0)
        
        header = f"Event {event_id} Count Summary"
        header += f"\nTotal Sessions: {total_sessions}"
        header += f"\nTotal Count: {total_count}"
        
        # Sessions by status
        sessions_by_status = data.get('sessions_by_status', {})
        if sessions_by_status:
            header += "\n\nSessions by Status:"
            for status, count in sessions_by_status.items():
                header += f"\n  {status.title()}: {count}"
        
        # Count by position
        count_by_position = data.get('count_by_position', {})
        if count_by_position:
            header += "\n\nCount by Position:"
            table_data = []
            for position, stats in count_by_position.items():
                table_data.append({
                    'Position': position,
                    'Sessions': stats['sessions'],
                    'Total Count': stats['total_count']
                })
            
            header += f"\n{self.format_table(table_data)}"
        
        return header

class CountTrendsCommand(CLICommand):
    """Get count trends and analytics."""
    
    def __init__(self):
        super().__init__("trends", "Get count trends")
        self.service = CountTrackingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('event_id', type=int, help='Event ID')
        parser.add_argument('--status', choices=['pending', 'active', 'completed'],
                          help='Filter by session status')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        event_id = kwargs['event_id']
        
        filters = {}
        if kwargs.get('status'):
            filters['status'] = kwargs['status']
        
        result = self.service.get_count_trends(event_id, **filters)
        
        return {
            "status": "success",
            **result
        }

class ExportDataCommand(CLICommand):
    """Export count data for an event."""
    
    def __init__(self):
        super().__init__("export", "Export count data")
        self.service = CountTrackingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('event_id', type=int, help='Event ID')
        parser.add_argument('--format', choices=['json', 'csv'], default='json',
                          help='Export format (default: json)')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        event_id = kwargs['event_id']
        format_type = kwargs.get('format', 'json')
        
        result = self.service.export_count_data(event_id, format_type)
        
        return {
            "status": "success",
            "message": f"Count data exported in {format_type} format",
            **result
        }

class UpdateSessionCommand(CLICommand, JSONInputMixin):
    """Update a count session."""
    
    def __init__(self):
        super().__init__("update-session", "Update a count session")
        self.service = CountTrackingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('session_id', type=int, help='Session ID')
        parser.add_argument('--status', choices=['pending', 'active', 'completed', 'cancelled'],
                          help='Session status')
        parser.add_argument('--notes', help='Session notes')
        self.add_json_arguments(parser)
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        session_id = kwargs.pop('session_id')
        
        # Merge JSON input
        json_data = self.get_json_input(kwargs)
        kwargs.update(json_data)
        
        # Remove None values
        updates = {k: v for k, v in kwargs.items() if v is not None and k not in ['json_input', 'json_file']}
        
        if not updates:
            raise ValueError("No updates provided")
        
        result = self.service.update_count_session(session_id, **updates)
        
        return {
            "status": "success",
            "message": f"Count session {session_id} updated successfully",
            "session": result
        }

class DeleteSessionCommand(CLICommand):
    """Delete a count session."""
    
    def __init__(self):
        super().__init__("delete-session", "Delete a count session")
        self.service = CountTrackingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('session_id', type=int, help='Session ID')
        parser.add_argument('--force', action='store_true', 
                          help='Force deletion (bypass safety checks)')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        session_id = kwargs['session_id']
        
        # Get session details for confirmation
        try:
            session = self.service.get_count_session(session_id)
        except ValueError as e:
            return {"status": "error", "message": str(e)}
        
        # Safety check unless forced
        if not kwargs.get('force') and session.get('records_count', 0) > 0:
            return {
                "status": "error",
                "message": f"Session has {session['records_count']} count records. Use --force to delete anyway."
            }
        
        success = self.service.delete_count_session(session_id)
        
        if success:
            return {
                "status": "success",
                "message": f"Count session {session_id} deleted successfully"
            }
        else:
            return {
                "status": "error",
                "message": "Failed to delete count session"
            }

class CountTrackingCLI(BaseCLI):
    """Count Tracking CLI interface."""
    
    help = "Count Tracking CLI - Manage count sessions and records"
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Register session commands
        self.add_command(CreateSessionCommand())
        self.add_command(ListSessionsCommand())
        self.add_command(GetSessionCommand())
        self.add_command(UpdateSessionCommand())
        self.add_command(DeleteSessionCommand())
        self.add_command(StartSessionCommand())
        self.add_command(EndSessionCommand())
        self.add_command(ActiveSessionsCommand())
        
        # Register count recording commands
        self.add_command(RecordCountCommand())
        self.add_command(BulkRecordCommand())
        
        # Register analytics commands
        self.add_command(EventSummaryCommand())
        self.add_command(CountTrendsCommand())
        self.add_command(ExportDataCommand())
