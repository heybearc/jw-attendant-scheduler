"""
Attendant Scheduling Services

Business logic and service layer for attendant scheduling.
"""

from typing import Dict, Any, List, Optional
from datetime import date, datetime, timedelta
from ..shared.observability import log_event, monitor_performance
from ..shared.contracts import validate_contract
from .models import AttendantModel, ScheduleModel

class AttendantService:
    """Service layer for attendant management operations."""
    
    @monitor_performance("attendant_create")
    @validate_contract("attendant_create")
    def create_attendant(self, name: str, email: str, **kwargs) -> Dict[str, Any]:
        """Create a new attendant."""
        # Validate email uniqueness
        existing_attendants = AttendantModel.list_all()
        existing_emails = [a.email for a in existing_attendants]
        
        if email in existing_emails:
            raise ValueError(f"Attendant with email '{email}' already exists")
        
        # Create attendant
        attendant = AttendantModel.create(name=name, email=email, **kwargs)
        
        return attendant.to_dict()
    
    @monitor_performance("attendant_get")
    def get_attendant(self, attendant_id: int) -> Dict[str, Any]:
        """Get attendant by ID."""
        attendant = AttendantModel.get_by_id(attendant_id)
        
        if not attendant:
            raise ValueError(f"Attendant with ID {attendant_id} not found")
        
        result = attendant.to_dict()
        
        # Add additional metadata
        result['assignments_count'] = attendant.get_assignments_count()
        result['active_assignments'] = attendant.get_active_assignments()
        
        return result
    
    @monitor_performance("attendant_list")
    def list_attendants(self, **filters) -> List[Dict[str, Any]]:
        """List attendants with optional filters."""
        attendants = AttendantModel.list_all(**filters)
        
        result = []
        for attendant in attendants:
            attendant_data = attendant.to_dict()
            attendant_data['assignments_count'] = attendant.get_assignments_count()
            result.append(attendant_data)
        
        log_event("attendant.list_retrieved", {
            "count": len(result),
            "filters": filters
        })
        
        return result
    
    @monitor_performance("attendant_update")
    @validate_contract("attendant_update")
    def update_attendant(self, attendant_id: int, **updates) -> Dict[str, Any]:
        """Update attendant."""
        attendant = AttendantModel.get_by_id(attendant_id)
        
        if not attendant:
            raise ValueError(f"Attendant with ID {attendant_id} not found")
        
        # Check email uniqueness if updating email
        if 'email' in updates:
            existing_attendants = AttendantModel.list_all()
            existing_emails = [a.email for a in existing_attendants if a.id != attendant_id]
            
            if updates['email'] in existing_emails:
                raise ValueError(f"Attendant with email '{updates['email']}' already exists")
        
        success = attendant.update(**updates)
        
        if not success:
            raise ValueError("Failed to update attendant")
        
        return attendant.to_dict()
    
    @monitor_performance("attendant_delete")
    def delete_attendant(self, attendant_id: int) -> bool:
        """Delete attendant."""
        attendant = AttendantModel.get_by_id(attendant_id)
        
        if not attendant:
            raise ValueError(f"Attendant with ID {attendant_id} not found")
        
        # Check if attendant has active assignments
        active_assignments = attendant.get_active_assignments()
        if active_assignments:
            raise ValueError(f"Cannot delete attendant with {len(active_assignments)} active assignments")
        
        return attendant.delete()
    
    def search_attendants(self, query: str, **filters) -> List[Dict[str, Any]]:
        """Search attendants by name or email."""
        attendants = AttendantModel.list_all(**filters)
        
        # Filter by search query
        query_lower = query.lower()
        filtered_attendants = []
        
        for attendant in attendants:
            if (query_lower in attendant.name.lower() or 
                query_lower in attendant.email.lower()):
                filtered_attendants.append(attendant)
        
        result = []
        for attendant in filtered_attendants:
            attendant_data = attendant.to_dict()
            attendant_data['assignments_count'] = attendant.get_assignments_count()
            result.append(attendant_data)
        
        log_event("attendant.search_performed", {
            "query": query,
            "results_count": len(result)
        })
        
        return result

class SchedulingService:
    """Service layer for scheduling operations."""
    
    @monitor_performance("assignment_create")
    @validate_contract("assignment_create")
    def create_assignment(self, attendant_id: int, position_id: int, **kwargs) -> Dict[str, Any]:
        """Create assignment between attendant and position."""
        # Validate attendant exists
        attendant = AttendantModel.get_by_id(attendant_id)
        if not attendant:
            raise ValueError(f"Attendant with ID {attendant_id} not found")
        
        # Check for conflicts
        schedule = ScheduleModel()
        conflicts = schedule.check_conflicts(attendant_id, position_id)
        
        if conflicts and not kwargs.get('force', False):
            raise ValueError(f"Assignment conflicts detected: {[c['message'] for c in conflicts]}")
        
        # Create assignment
        try:
            from scheduler.models import Assignment, Position
            
            position = Position.objects.get(id=position_id)
            
            assignment = Assignment.objects.create(
                attendant_id=attendant_id,
                position_id=position_id,
                assigned_date=datetime.now().date(),
                **{k: v for k, v in kwargs.items() if k != 'force'}
            )
            
            # Log assignment creation
            log_event("assignment.created", {
                "assignment_id": assignment.id,
                "attendant_id": attendant_id,
                "position_id": position_id,
                "event_id": position.event.id
            })
            
            return {
                'id': assignment.id,
                'attendant_id': attendant_id,
                'attendant_name': attendant.name,
                'position_id': position_id,
                'position_name': position.name,
                'event_id': position.event.id,
                'event_name': position.event.name,
                'assigned_date': assignment.assigned_date.isoformat()
            }
            
        except Exception as e:
            raise ValueError(f"Failed to create assignment: {str(e)}")
    
    @monitor_performance("schedule_get")
    def get_event_schedule(self, event_id: int, **filters) -> Dict[str, Any]:
        """Get schedule for an event."""
        schedule = ScheduleModel(event_id=event_id)
        
        summary = schedule.get_schedule_summary()
        
        log_event("schedule.event_retrieved", {
            "event_id": event_id,
            "total_assignments": summary['total_assignments'],
            "unassigned_positions": summary['unassigned_positions']
        })
        
        return summary
    
    @monitor_performance("attendant_schedule_get")
    def get_attendant_schedule(self, attendant_id: int, **filters) -> Dict[str, Any]:
        """Get schedule for a specific attendant."""
        schedule = ScheduleModel(attendant_id=attendant_id)
        
        summary = schedule.get_schedule_summary()
        
        # Add attendant details
        attendant = AttendantModel.get_by_id(attendant_id)
        if attendant:
            summary['attendant_name'] = attendant.name
            summary['attendant_email'] = attendant.email
        
        log_event("schedule.attendant_retrieved", {
            "attendant_id": attendant_id,
            "total_assignments": summary['total_assignments']
        })
        
        return summary
    
    @monitor_performance("assignment_update")
    def update_assignment(self, assignment_id: int, **updates) -> Dict[str, Any]:
        """Update assignment."""
        try:
            from scheduler.models import Assignment
            
            assignment = Assignment.objects.select_related(
                'attendant', 'position', 'position__event'
            ).get(id=assignment_id)
            
            # Update fields
            updated_fields = []
            for field, value in updates.items():
                if hasattr(assignment, field):
                    setattr(assignment, field, value)
                    updated_fields.append(field)
            
            if updated_fields:
                assignment.save(update_fields=updated_fields)
                
                # Log update
                log_event("assignment.updated", {
                    "assignment_id": assignment_id,
                    "updated_fields": updated_fields
                })
            
            return {
                'id': assignment.id,
                'attendant_id': assignment.attendant.id,
                'attendant_name': assignment.attendant.name,
                'position_id': assignment.position.id,
                'position_name': assignment.position.name,
                'event_id': assignment.position.event.id,
                'event_name': assignment.position.event.name,
                'assigned_date': assignment.assigned_date.isoformat() if hasattr(assignment, 'assigned_date') else None
            }
            
        except Exception as e:
            raise ValueError(f"Failed to update assignment: {str(e)}")
    
    @monitor_performance("assignment_remove")
    def remove_assignment(self, assignment_id: int) -> bool:
        """Remove assignment."""
        try:
            from scheduler.models import Assignment
            
            assignment = Assignment.objects.get(id=assignment_id)
            
            # Log removal before deletion
            log_event("assignment.removed", {
                "assignment_id": assignment_id,
                "attendant_id": assignment.attendant.id,
                "position_id": assignment.position.id
            })
            
            assignment.delete()
            return True
            
        except Exception as e:
            raise ValueError(f"Failed to remove assignment: {str(e)}")
    
    def check_conflicts(self, attendant_id: int, position_id: int) -> Dict[str, Any]:
        """Check for scheduling conflicts."""
        schedule = ScheduleModel()
        conflicts = schedule.check_conflicts(attendant_id, position_id)
        
        return {
            'has_conflicts': len(conflicts) > 0,
            'conflicts': conflicts
        }
    
    def get_availability(self, attendant_id: int, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get attendant availability for date range."""
        # Parse dates
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        # Get attendant
        attendant = AttendantModel.get_by_id(attendant_id)
        if not attendant:
            raise ValueError(f"Attendant with ID {attendant_id} not found")
        
        # Get assignments in date range
        try:
            from scheduler.models import Assignment
            
            assignments = Assignment.objects.filter(
                attendant_id=attendant_id,
                position__event__start_date__gte=start_dt,
                position__event__end_date__lte=end_dt
            ).select_related('position', 'position__event')
            
            busy_dates = []
            for assignment in assignments:
                busy_dates.append({
                    'date': assignment.position.event.start_date.isoformat(),
                    'event_name': assignment.position.event.name,
                    'position_name': assignment.position.name
                })
            
            return {
                'attendant_id': attendant_id,
                'attendant_name': attendant.name,
                'start_date': start_date,
                'end_date': end_date,
                'busy_dates': busy_dates,
                'available_days': (end_dt - start_dt).days + 1 - len(busy_dates)
            }
            
        except Exception as e:
            raise ValueError(f"Failed to get availability: {str(e)}")
    
    def auto_assign_positions(self, event_id: int, **preferences) -> Dict[str, Any]:
        """Auto-assign attendants to positions based on preferences."""
        # Get event schedule
        schedule = ScheduleModel(event_id=event_id)
        summary = schedule.get_schedule_summary()
        
        unassigned_positions = summary['unassigned_positions']
        if not unassigned_positions:
            return {
                'status': 'completed',
                'message': 'All positions are already assigned',
                'assignments_created': 0
            }
        
        # Get available attendants
        attendants = AttendantModel.list_all(active=True)
        
        assignments_created = 0
        errors = []
        
        for position in unassigned_positions:
            # Find best attendant for this position
            best_attendant = None
            
            for attendant in attendants:
                # Check conflicts
                conflicts = schedule.check_conflicts(attendant.id, position['id'])
                
                if not conflicts:
                    best_attendant = attendant
                    break
            
            if best_attendant:
                try:
                    self.create_assignment(
                        attendant_id=best_attendant.id,
                        position_id=position['id'],
                        force=False
                    )
                    assignments_created += 1
                except Exception as e:
                    errors.append(f"Failed to assign {best_attendant.name} to {position['name']}: {str(e)}")
            else:
                errors.append(f"No available attendant found for position: {position['name']}")
        
        log_event("auto_assignment.completed", {
            "event_id": event_id,
            "assignments_created": assignments_created,
            "errors_count": len(errors)
        })
        
        return {
            'status': 'completed',
            'assignments_created': assignments_created,
            'total_positions': len(unassigned_positions),
            'errors': errors
        }
