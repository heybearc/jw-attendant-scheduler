"""
Django management command for Count Tracking Library CLI.
"""

from scheduler.libs.count_tracking.cli import CountTrackingCLI

class Command(CountTrackingCLI):
    """Count tracking command."""
    pass
