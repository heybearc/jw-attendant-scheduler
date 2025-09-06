"""
Django management command for Event Management Library CLI.
"""

from scheduler.libs.event_management.cli import EventCLI

class Command(EventCLI):
    """Event management command."""
    pass
