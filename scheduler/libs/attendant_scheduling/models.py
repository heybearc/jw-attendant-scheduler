"""
Attendant Scheduling Models

Data models for attendant scheduling library.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, date, time
from django.db import models
from ..shared.observability import log_event, EventLogger

class AttendantModel:
    """Attendant model interface for the library."""
    
    def __init__(self, django_attendant=None):
        """Initialize with optional Django model instance."""
        self._django_attendant = django_attendant
    
    @classmethod
    def from_django(cls, django_attendant):
        """Create AttendantModel from Django Attendant instance."""
        return cls(django_attendant)
    
    @classmethod
    def create(cls, name: str, email: str, **kwargs) -> 'AttendantModel':
        """Create new attendant."""
        from scheduler.models import Attendant
        
        django_attendant = Attendant.objects.create(
            name=name,
            email=email,
            **kwargs
        )
        
        # Log attendant creation
        EventLogger.attendant_created(
            attendant_id=django_attendant.id,
            attendant_name=name,
            created_by=kwargs.get('created_by', 0)
        )
        
        return cls(django_attendant)
    
    @classmethod
    def get_by_id(cls, attendant_id: int) -> Optional['AttendantModel']:
        """Get attendant by ID."""
        from scheduler.models import Attendant
        
        try:
            django_attendant = Attendant.objects.get(id=attendant_id)
            return cls(django_attendant)
        except Attendant.DoesNotExist:
            return None
    
    @classmethod
    def list_all(cls, **filters) -> List['AttendantModel']:
        """List all attendants with optional filters."""
        from scheduler.models import Attendant
        
        queryset = Attendant.objects.all()
        
        # Apply filters
        if 'active' in filters:
            queryset = queryset.filter(active=filters['active'])
        if 'role' in filters:
            queryset = queryset.filter(role=filters['role'])
        if 'congregation' in filters:
            queryset = queryset.filter(congregation=filters['congregation'])
        
        return [cls(attendant) for attendant in queryset.order_by('name')]
    
    @property
    def id(self) -> int:
        """Attendant ID."""
        return self._django_attendant.id if self._django_attendant else None
    
    @property
    def name(self) -> str:
        """Attendant name."""
        return self._django_attendant.name if self._django_attendant else ""
    
    @property
    def email(self) -> str:
        """Attendant email."""
        return self._django_attendant.email if self._django_attendant else ""
    
    @property
    def phone(self) -> str:
        """Attendant phone."""
        return getattr(self._django_attendant, 'phone', '') if self._django_attendant else ""
    
    @property
    def role(self) -> str:
        """Attendant role."""
        return getattr(self._django_attendant, 'role', 'attendant') if self._django_attendant else "attendant"
    
    @property
    def congregation(self) -> str:
        """Attendant congregation."""
        return getattr(self._django_attendant, 'congregation', '') if self._django_attendant else ""
    
    @property
    def active(self) -> bool:
        """Whether attendant is active."""
        return getattr(self._django_attendant, 'active', True) if self._django_attendant else True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        if not self._django_attendant:
            return {}
        
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
            'congregation': self.congregation,
            'active': self.active,
            'created_at': getattr(self._django_attendant, 'created_at', None)
        }
    
    def update(self, **kwargs) -> bool:
        """Update attendant fields."""
        if not self._django_attendant:
            return False
        
        updated_fields = []
        for field, value in kwargs.items():
            if hasattr(self._django_attendant, field):
                setattr(self._django_attendant, field, value)
                updated_fields.append(field)
        
        if updated_fields:
            self._django_attendant.save(update_fields=updated_fields)
            
            # Log update
            log_event("attendant.updated", {
                "attendant_id": self.id,
                "updated_fields": updated_fields
            })
            
            return True
        
        return False
    
    def delete(self) -> bool:
        """Delete attendant."""
        if not self._django_attendant:
            return False
        
        attendant_id = self.id
        attendant_name = self.name
        
        self._django_attendant.delete()
        
        # Log deletion
        log_event("attendant.deleted", {
            "attendant_id": attendant_id,
            "attendant_name": attendant_name
        })
        
        return True
    
    def get_assignments_count(self) -> int:
        """Get number of assignments for this attendant."""
        if not self._django_attendant:
            return 0
        
        try:
            from scheduler.models import Assignment
            return Assignment.objects.filter(attendant=self._django_attendant).count()
        except:
            return 0
    
    def get_active_assignments(self) -> List[Dict[str, Any]]:
        """Get active assignments for this attendant."""
        if not self._django_attendant:
            return []
        
        try:
            from scheduler.models import Assignment
            assignments = Assignment.objects.filter(
                attendant=self._django_attendant,
                position__event__status='active'
            ).select_related('position', 'position__event')
            
            return [
                {
                    'id': assignment.id,
                    'position_name': assignment.position.name,
                    'event_name': assignment.position.event.name,
                    'event_start_date': assignment.position.event.start_date.isoformat(),
                    'assigned_date': assignment.assigned_date.isoformat() if hasattr(assignment, 'assigned_date') else None
                }
                for assignment in assignments
            ]
        except:
            return []
    
    def __str__(self) -> str:
        """String representation."""
        return f"Attendant({self.name}, {self.email})"
    
    def __repr__(self) -> str:
        """Detailed representation."""
        return f"AttendantModel(id={self.id}, name='{self.name}', role='{self.role}')"

class ScheduleModel:
    """Schedule model for managing assignments and availability."""
    
    def __init__(self, event_id: int = None, attendant_id: int = None):
        """Initialize schedule model."""
        self.event_id = event_id
        self.attendant_id = attendant_id
    
    def get_assignments(self) -> List[Dict[str, Any]]:
        """Get assignments based on filters."""
        from scheduler.models import Assignment
        
        queryset = Assignment.objects.select_related('attendant', 'position', 'position__event')
        
        if self.event_id:
            queryset = queryset.filter(position__event_id=self.event_id)
        
        if self.attendant_id:
            queryset = queryset.filter(attendant_id=self.attendant_id)
        
        assignments = []
        for assignment in queryset:
            assignments.append({
                'id': assignment.id,
                'attendant_id': assignment.attendant.id,
                'attendant_name': assignment.attendant.name,
                'position_id': assignment.position.id,
                'position_name': assignment.position.name,
                'event_id': assignment.position.event.id,
                'event_name': assignment.position.event.name,
                'event_start_date': assignment.position.event.start_date.isoformat(),
                'assigned_date': getattr(assignment, 'assigned_date', None)
            })
        
        return assignments
    
    def get_unassigned_positions(self) -> List[Dict[str, Any]]:
        """Get positions without assignments."""
        if not self.event_id:
            return []
        
        try:
            from scheduler.models import Position, Assignment
            
            # Get all positions for the event
            positions = Position.objects.filter(event_id=self.event_id)
            
            # Get assigned position IDs
            assigned_position_ids = Assignment.objects.filter(
                position__event_id=self.event_id
            ).values_list('position_id', flat=True)
            
            # Filter unassigned positions
            unassigned_positions = positions.exclude(id__in=assigned_position_ids)
            
            return [
                {
                    'id': position.id,
                    'name': position.name,
                    'description': getattr(position, 'description', ''),
                    'requirements': getattr(position, 'requirements', ''),
                    'time_slot': getattr(position, 'time_slot', '')
                }
                for position in unassigned_positions
            ]
        except:
            return []
    
    def get_schedule_summary(self) -> Dict[str, Any]:
        """Get schedule summary statistics."""
        assignments = self.get_assignments()
        unassigned = self.get_unassigned_positions()
        
        summary = {
            'total_assignments': len(assignments),
            'unassigned_positions': len(unassigned),
            'assignments': assignments,
            'unassigned_positions': unassigned
        }
        
        if self.event_id:
            summary['event_id'] = self.event_id
            # Calculate completion percentage
            total_positions = len(assignments) + len(unassigned)
            if total_positions > 0:
                summary['completion_percentage'] = (len(assignments) / total_positions) * 100
            else:
                summary['completion_percentage'] = 0
        
        if self.attendant_id:
            summary['attendant_id'] = self.attendant_id
        
        return summary
    
    def check_conflicts(self, attendant_id: int, position_id: int) -> List[Dict[str, Any]]:
        """Check for scheduling conflicts."""
        conflicts = []
        
        try:
            from scheduler.models import Assignment, Position
            
            # Get the position details
            position = Position.objects.get(id=position_id)
            
            # Check for existing assignments for this attendant on the same event
            existing_assignments = Assignment.objects.filter(
                attendant_id=attendant_id,
                position__event=position.event
            ).select_related('position')
            
            for assignment in existing_assignments:
                conflicts.append({
                    'type': 'same_event',
                    'message': f"Attendant already assigned to '{assignment.position.name}' for this event",
                    'assignment_id': assignment.id,
                    'position_name': assignment.position.name
                })
            
            # Check for time conflicts if positions have time slots
            if hasattr(position, 'time_slot') and position.time_slot:
                time_conflicts = Assignment.objects.filter(
                    attendant_id=attendant_id,
                    position__time_slot=position.time_slot,
                    position__event__start_date=position.event.start_date
                ).exclude(position__event=position.event).select_related('position', 'position__event')
                
                for conflict in time_conflicts:
                    conflicts.append({
                        'type': 'time_conflict',
                        'message': f"Time conflict with '{conflict.position.name}' at {conflict.position.event.name}",
                        'assignment_id': conflict.id,
                        'conflicting_event': conflict.position.event.name
                    })
        
        except Exception as e:
            conflicts.append({
                'type': 'error',
                'message': f"Error checking conflicts: {str(e)}"
            })
        
        return conflicts
