"""
Library-First Architecture Package

Main package for all JW Attendant Scheduler libraries.
Implements SDD Article I: Library-First architecture.
"""

__version__ = "1.0.0"
__author__ = "JW Attendant Scheduler Team"

# Library imports
from .shared import observability, contracts, cli_base
from .event_management import EventManagementLib
from .attendant_scheduling import AttendantSchedulingLib
from .count_tracking import CountTrackingLib
from .oversight_management import OversightManagementLib

# Main library interfaces
__all__ = [
    "EventManagementLib",
    "AttendantSchedulingLib", 
    "CountTrackingLib",
    "observability",
    "contracts",
    "cli_base"
]

# Convenience class for accessing all libraries
class JWSchedulerLibs:
    """Main interface for all JW Scheduler libraries."""
    
    def __init__(self):
        self.events = EventManagementLib()
        self.attendants = AttendantSchedulingLib()
        self.counts = CountTrackingLib()
    
    def get_library_info(self):
        """Get information about available libraries."""
        return {
            "libraries": [
                {
                    "name": "Event Management",
                    "class": "EventManagementLib",
                    "description": "Manage events, positions, and event lifecycle",
                    "cli_command": "python manage.py event"
                },
                {
                    "name": "Attendant Scheduling", 
                    "class": "AttendantSchedulingLib",
                    "description": "Manage attendants, assignments, and scheduling",
                    "cli_command": "python manage.py attendant"
                },
                {
                    "name": "Count Tracking",
                    "class": "CountTrackingLib", 
                    "description": "Track attendance counts and analytics",
                    "cli_command": "python manage.py count"
                }
            ],
            "shared_utilities": [
                "observability - Structured logging and monitoring",
                "contracts - API contract validation",
                "cli_base - Base CLI framework"
            ]
        }

# Global instance for easy access
scheduler_libs = JWSchedulerLibs()
