"""
Django management command for Attendant Scheduling Library CLI.
"""

from scheduler.libs.attendant_scheduling.cli import AttendantCLI

class Command(AttendantCLI):
    """Attendant scheduling command."""
    pass
