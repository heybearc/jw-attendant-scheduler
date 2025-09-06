"""
Count Tracking Library

Standalone library for managing count tracking with CLI interface.
Implements SDD Article I: Library-First architecture.
"""

from .models import CountSessionModel, CountRecordModel
from .services import CountTrackingService
from .cli import CountTrackingCLI

class CountTrackingLib:
    """Main interface for Count Tracking Library."""
    
    def __init__(self):
        self.service = CountTrackingService()
    
    # Count Session Management
    def create_count_session(self, event_id: int, position_id: int, **kwargs) -> dict:
        """Create a new count session."""
        return self.service.create_count_session(event_id, position_id, **kwargs)
    
    def get_count_session(self, session_id: int) -> dict:
        """Get count session by ID."""
        return self.service.get_count_session(session_id)
    
    def list_count_sessions(self, **filters) -> list:
        """List count sessions with optional filters."""
        return self.service.list_count_sessions(**filters)
    
    def update_count_session(self, session_id: int, **updates) -> dict:
        """Update count session."""
        return self.service.update_count_session(session_id, **updates)
    
    def delete_count_session(self, session_id: int) -> bool:
        """Delete count session."""
        return self.service.delete_count_session(session_id)
    
    # Count Recording
    def record_count(self, session_id: int, count_type: str, count_value: int, **kwargs) -> dict:
        """Record a count entry."""
        return self.service.record_count(session_id, count_type, count_value, **kwargs)
    
    def update_count_record(self, record_id: int, **updates) -> dict:
        """Update count record."""
        return self.service.update_count_record(record_id, **updates)
    
    def delete_count_record(self, record_id: int) -> bool:
        """Delete count record."""
        return self.service.delete_count_record(record_id)
    
    # Count Analytics
    def get_session_summary(self, session_id: int) -> dict:
        """Get summary statistics for a count session."""
        return self.service.get_session_summary(session_id)
    
    def get_event_count_summary(self, event_id: int) -> dict:
        """Get count summary for an entire event."""
        return self.service.get_event_count_summary(event_id)
    
    def get_count_trends(self, event_id: int, **filters) -> dict:
        """Get count trends and analytics."""
        return self.service.get_count_trends(event_id, **filters)
    
    # Time-based Operations
    def start_count_session(self, session_id: int) -> dict:
        """Start a count session (mark as active)."""
        return self.service.start_count_session(session_id)
    
    def end_count_session(self, session_id: int) -> dict:
        """End a count session (mark as completed)."""
        return self.service.end_count_session(session_id)
    
    def get_active_sessions(self, event_id: int = None) -> list:
        """Get currently active count sessions."""
        return self.service.get_active_sessions(event_id)
    
    # Bulk Operations
    def bulk_record_counts(self, session_id: int, count_records: list) -> dict:
        """Record multiple counts in bulk."""
        return self.service.bulk_record_counts(session_id, count_records)
    
    def export_count_data(self, event_id: int, format: str = 'json') -> dict:
        """Export count data for an event."""
        return self.service.export_count_data(event_id, format)

__all__ = [
    "CountTrackingLib", 
    "CountSessionModel", 
    "CountRecordModel", 
    "CountTrackingService", 
    "CountTrackingCLI"
]
