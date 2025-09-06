"""
Attendant Scheduling Library

Standalone library for managing attendant scheduling with CLI interface.
Implements SDD Article I: Library-First architecture.
"""

from .models import AttendantModel, ScheduleModel
from .services import AttendantService, SchedulingService
from .cli import AttendantCLI

class AttendantSchedulingLib:
    """Main interface for Attendant Scheduling Library."""
    
    def __init__(self):
        self.attendant_service = AttendantService()
        self.scheduling_service = SchedulingService()
    
    # Attendant Management
    def create_attendant(self, name: str, email: str, **kwargs) -> dict:
        """Create a new attendant."""
        return self.attendant_service.create_attendant(name, email, **kwargs)
    
    def get_attendant(self, attendant_id: int) -> dict:
        """Get attendant by ID."""
        return self.attendant_service.get_attendant(attendant_id)
    
    def list_attendants(self, **filters) -> list:
        """List attendants with optional filters."""
        return self.attendant_service.list_attendants(**filters)
    
    def update_attendant(self, attendant_id: int, **updates) -> dict:
        """Update attendant."""
        return self.attendant_service.update_attendant(attendant_id, **updates)
    
    def delete_attendant(self, attendant_id: int) -> bool:
        """Delete attendant."""
        return self.attendant_service.delete_attendant(attendant_id)
    
    # Scheduling Operations
    def create_assignment(self, attendant_id: int, position_id: int, **kwargs) -> dict:
        """Create assignment between attendant and position."""
        return self.scheduling_service.create_assignment(attendant_id, position_id, **kwargs)
    
    def get_schedule(self, event_id: int, **filters) -> dict:
        """Get schedule for an event."""
        return self.scheduling_service.get_event_schedule(event_id, **filters)
    
    def get_attendant_schedule(self, attendant_id: int, **filters) -> dict:
        """Get schedule for a specific attendant."""
        return self.scheduling_service.get_attendant_schedule(attendant_id, **filters)
    
    def update_assignment(self, assignment_id: int, **updates) -> dict:
        """Update assignment."""
        return self.scheduling_service.update_assignment(assignment_id, **updates)
    
    def remove_assignment(self, assignment_id: int) -> bool:
        """Remove assignment."""
        return self.scheduling_service.remove_assignment(assignment_id)
    
    # Advanced Scheduling
    def auto_assign_positions(self, event_id: int, **preferences) -> dict:
        """Auto-assign attendants to positions based on preferences."""
        return self.scheduling_service.auto_assign_positions(event_id, **preferences)
    
    def check_conflicts(self, attendant_id: int, position_id: int) -> dict:
        """Check for scheduling conflicts."""
        return self.scheduling_service.check_conflicts(attendant_id, position_id)
    
    def get_availability(self, attendant_id: int, start_date: str, end_date: str) -> dict:
        """Get attendant availability for date range."""
        return self.scheduling_service.get_availability(attendant_id, start_date, end_date)

__all__ = [
    "AttendantSchedulingLib", 
    "AttendantModel", 
    "ScheduleModel", 
    "AttendantService", 
    "SchedulingService", 
    "AttendantCLI"
]
