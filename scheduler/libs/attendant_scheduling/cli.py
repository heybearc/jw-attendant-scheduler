"""
Attendant Scheduling CLI

Command-line interface for attendant scheduling library.
Implements SDD Article II: Libraries expose a CLI; text-in/text-out; JSON supported.
"""

import argparse
from typing import Dict, Any
from ..shared.cli_base import CLICommand, BaseCLI, JSONInputMixin, TextOutputMixin
from .services import AttendantService, SchedulingService

class CreateAttendantCommand(CLICommand, JSONInputMixin):
    """Create a new attendant."""
    
    def __init__(self):
        super().__init__("create-attendant", "Create a new attendant")
        self.service = AttendantService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--name', required=True, help='Attendant name')
        parser.add_argument('--email', required=True, help='Attendant email')
        parser.add_argument('--phone', help='Attendant phone number')
        parser.add_argument('--role', choices=['attendant', 'overseer', 'coordinator'], 
                          default='attendant', help='Attendant role')
        parser.add_argument('--congregation', help='Attendant congregation')
        parser.add_argument('--active', type=bool, default=True, help='Whether attendant is active')
        self.add_json_arguments(parser)
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        # Merge JSON input with command line arguments
        json_data = self.get_json_input(kwargs)
        kwargs.update(json_data)
        
        # Extract required fields
        name = kwargs.get('name')
        email = kwargs.get('email')
        
        if not all([name, email]):
            raise ValueError("name and email are required")
        
        # Optional fields
        optional_fields = {}
        for field in ['phone', 'role', 'congregation', 'active']:
            if kwargs.get(field) is not None:
                optional_fields[field] = kwargs[field]
        
        result = self.service.create_attendant(name, email, **optional_fields)
        
        return {
            "status": "success",
            "message": f"Attendant '{name}' created successfully",
            "attendant": result
        }

class ListAttendantsCommand(CLICommand, TextOutputMixin):
    """List attendants with optional filters."""
    
    def __init__(self):
        super().__init__("list-attendants", "List attendants")
        self.service = AttendantService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--active', type=bool, help='Filter by active status')
        parser.add_argument('--role', choices=['attendant', 'overseer', 'coordinator'],
                          help='Filter by role')
        parser.add_argument('--congregation', help='Filter by congregation')
        parser.add_argument('--search', help='Search by name or email')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        filters = {}
        
        # Build filters
        for field in ['active', 'role', 'congregation']:
            if kwargs.get(field) is not None:
                filters[field] = kwargs[field]
        
        # Handle search
        if kwargs.get('search'):
            attendants = self.service.search_attendants(kwargs['search'], **filters)
        else:
            attendants = self.service.list_attendants(**filters)
        
        return {
            "status": "success",
            "count": len(attendants),
            "attendants": attendants
        }
    
    def _format_as_text(self, data: Dict[str, Any]) -> str:
        """Format attendants as a table."""
        attendants = data.get('attendants', [])
        
        if not attendants:
            return "No attendants found"
        
        # Prepare table data
        table_data = []
        for attendant in attendants:
            table_data.append({
                'ID': attendant['id'],
                'Name': attendant['name'],
                'Email': attendant['email'],
                'Role': attendant['role'],
                'Congregation': attendant.get('congregation', ''),
                'Active': 'Yes' if attendant['active'] else 'No',
                'Assignments': attendant.get('assignments_count', 0)
            })
        
        return self.format_table(table_data)

class GetAttendantCommand(CLICommand):
    """Get attendant details by ID."""
    
    def __init__(self):
        super().__init__("get-attendant", "Get attendant details")
        self.service = AttendantService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('attendant_id', type=int, help='Attendant ID')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        attendant_id = kwargs['attendant_id']
        result = self.service.get_attendant(attendant_id)
        
        return {
            "status": "success",
            "attendant": result
        }

class UpdateAttendantCommand(CLICommand, JSONInputMixin):
    """Update an attendant."""
    
    def __init__(self):
        super().__init__("update-attendant", "Update an attendant")
        self.service = AttendantService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('attendant_id', type=int, help='Attendant ID')
        parser.add_argument('--name', help='Attendant name')
        parser.add_argument('--email', help='Attendant email')
        parser.add_argument('--phone', help='Attendant phone number')
        parser.add_argument('--role', choices=['attendant', 'overseer', 'coordinator'],
                          help='Attendant role')
        parser.add_argument('--congregation', help='Attendant congregation')
        parser.add_argument('--active', type=bool, help='Whether attendant is active')
        self.add_json_arguments(parser)
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        attendant_id = kwargs.pop('attendant_id')
        
        # Merge JSON input
        json_data = self.get_json_input(kwargs)
        kwargs.update(json_data)
        
        # Remove None values
        updates = {k: v for k, v in kwargs.items() if v is not None and k not in ['json_input', 'json_file']}
        
        if not updates:
            raise ValueError("No updates provided")
        
        result = self.service.update_attendant(attendant_id, **updates)
        
        return {
            "status": "success",
            "message": f"Attendant {attendant_id} updated successfully",
            "attendant": result
        }

class DeleteAttendantCommand(CLICommand):
    """Delete an attendant."""
    
    def __init__(self):
        super().__init__("delete-attendant", "Delete an attendant")
        self.service = AttendantService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('attendant_id', type=int, help='Attendant ID')
        parser.add_argument('--force', action='store_true', 
                          help='Force deletion (bypass safety checks)')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        attendant_id = kwargs['attendant_id']
        
        # Get attendant details for confirmation
        try:
            attendant = self.service.get_attendant(attendant_id)
        except ValueError as e:
            return {"status": "error", "message": str(e)}
        
        # Safety check unless forced
        if not kwargs.get('force') and attendant.get('assignments_count', 0) > 0:
            return {
                "status": "error",
                "message": f"Attendant has {attendant['assignments_count']} assignments. Use --force to delete anyway."
            }
        
        success = self.service.delete_attendant(attendant_id)
        
        if success:
            return {
                "status": "success",
                "message": f"Attendant '{attendant['name']}' deleted successfully"
            }
        else:
            return {
                "status": "error",
                "message": "Failed to delete attendant"
            }

class CreateAssignmentCommand(CLICommand, JSONInputMixin):
    """Create assignment between attendant and position."""
    
    def __init__(self):
        super().__init__("assign", "Create assignment")
        self.service = SchedulingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--attendant-id', type=int, required=True, help='Attendant ID')
        parser.add_argument('--position-id', type=int, required=True, help='Position ID')
        parser.add_argument('--force', action='store_true', help='Force assignment despite conflicts')
        parser.add_argument('--notes', help='Assignment notes')
        self.add_json_arguments(parser)
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        # Merge JSON input
        json_data = self.get_json_input(kwargs)
        kwargs.update(json_data)
        
        attendant_id = kwargs.get('attendant_id')
        position_id = kwargs.get('position_id')
        
        if not all([attendant_id, position_id]):
            raise ValueError("attendant_id and position_id are required")
        
        # Optional fields
        optional_fields = {}
        for field in ['force', 'notes']:
            if kwargs.get(field) is not None:
                optional_fields[field] = kwargs[field]
        
        result = self.service.create_assignment(attendant_id, position_id, **optional_fields)
        
        return {
            "status": "success",
            "message": f"Assignment created successfully",
            "assignment": result
        }

class GetScheduleCommand(CLICommand, TextOutputMixin):
    """Get schedule for an event or attendant."""
    
    def __init__(self):
        super().__init__("schedule", "Get schedule")
        self.service = SchedulingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--event-id', type=int, help='Event ID')
        parser.add_argument('--attendant-id', type=int, help='Attendant ID')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        event_id = kwargs.get('event_id')
        attendant_id = kwargs.get('attendant_id')
        
        if not event_id and not attendant_id:
            raise ValueError("Either event_id or attendant_id is required")
        
        if event_id and attendant_id:
            raise ValueError("Specify either event_id or attendant_id, not both")
        
        if event_id:
            result = self.service.get_event_schedule(event_id)
            result['schedule_type'] = 'event'
        else:
            result = self.service.get_attendant_schedule(attendant_id)
            result['schedule_type'] = 'attendant'
        
        return {
            "status": "success",
            **result
        }
    
    def _format_as_text(self, data: Dict[str, Any]) -> str:
        """Format schedule as text."""
        schedule_type = data.get('schedule_type', 'unknown')
        assignments = data.get('assignments', [])
        
        if schedule_type == 'event':
            header = f"Event Schedule (ID: {data.get('event_id')})"
            completion = data.get('completion_percentage', 0)
            header += f"\nCompletion: {completion:.1f}%"
        else:
            header = f"Attendant Schedule: {data.get('attendant_name', 'Unknown')}"
        
        if not assignments:
            return f"{header}\n\nNo assignments found"
        
        # Prepare table data
        table_data = []
        for assignment in assignments:
            table_data.append({
                'Assignment ID': assignment['id'],
                'Attendant': assignment['attendant_name'],
                'Position': assignment['position_name'],
                'Event': assignment['event_name'],
                'Event Date': assignment['event_start_date']
            })
        
        return f"{header}\n\n{self.format_table(table_data)}"

class CheckConflictsCommand(CLICommand):
    """Check for scheduling conflicts."""
    
    def __init__(self):
        super().__init__("check-conflicts", "Check scheduling conflicts")
        self.service = SchedulingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--attendant-id', type=int, required=True, help='Attendant ID')
        parser.add_argument('--position-id', type=int, required=True, help='Position ID')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        attendant_id = kwargs['attendant_id']
        position_id = kwargs['position_id']
        
        result = self.service.check_conflicts(attendant_id, position_id)
        
        return {
            "status": "success",
            **result
        }

class GetAvailabilityCommand(CLICommand):
    """Get attendant availability for date range."""
    
    def __init__(self):
        super().__init__("availability", "Get attendant availability")
        self.service = SchedulingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--attendant-id', type=int, required=True, help='Attendant ID')
        parser.add_argument('--start-date', required=True, help='Start date (YYYY-MM-DD)')
        parser.add_argument('--end-date', required=True, help='End date (YYYY-MM-DD)')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        attendant_id = kwargs['attendant_id']
        start_date = kwargs['start_date']
        end_date = kwargs['end_date']
        
        result = self.service.get_availability(attendant_id, start_date, end_date)
        
        return {
            "status": "success",
            **result
        }

class AutoAssignCommand(CLICommand):
    """Auto-assign attendants to positions."""
    
    def __init__(self):
        super().__init__("auto-assign", "Auto-assign positions")
        self.service = SchedulingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('--event-id', type=int, required=True, help='Event ID')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        event_id = kwargs['event_id']
        
        result = self.service.auto_assign_positions(event_id)
        
        return {
            "status": "success",
            **result
        }

class RemoveAssignmentCommand(CLICommand):
    """Remove an assignment."""
    
    def __init__(self):
        super().__init__("unassign", "Remove assignment")
        self.service = SchedulingService()
    
    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument('assignment_id', type=int, help='Assignment ID')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        assignment_id = kwargs['assignment_id']
        
        success = self.service.remove_assignment(assignment_id)
        
        if success:
            return {
                "status": "success",
                "message": f"Assignment {assignment_id} removed successfully"
            }
        else:
            return {
                "status": "error",
                "message": "Failed to remove assignment"
            }

class AttendantCLI(BaseCLI):
    """Attendant Scheduling CLI interface."""
    
    help = "Attendant Scheduling CLI - Manage attendants and assignments"
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Register attendant commands
        self.add_command(CreateAttendantCommand())
        self.add_command(ListAttendantsCommand())
        self.add_command(GetAttendantCommand())
        self.add_command(UpdateAttendantCommand())
        self.add_command(DeleteAttendantCommand())
        
        # Register scheduling commands
        self.add_command(CreateAssignmentCommand())
        self.add_command(GetScheduleCommand())
        self.add_command(CheckConflictsCommand())
        self.add_command(GetAvailabilityCommand())
        self.add_command(AutoAssignCommand())
        self.add_command(RemoveAssignmentCommand())
