"""
Conflict Detector for JW Attendant Scheduler

Advanced conflict detection system for volunteer assignments.
Detects time overlaps, availability conflicts, and constraint violations.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
from models import Volunteer, Event, Assignment, db


class ConflictDetector:
    """Advanced conflict detection for volunteer assignments"""
    
    def __init__(self):
        self.conflict_types = {
            'TIME_OVERLAP': 'Volunteer has overlapping time assignments',
            'AVAILABILITY_CONFLICT': 'Volunteer not available during this time',
            'EXPERIENCE_MISMATCH': 'Volunteer experience level insufficient for position',
            'WORKLOAD_EXCEEDED': 'Volunteer assigned too many shifts',
            'POSITION_CONFLICT': 'Position already filled for this time slot',
            'EVENT_CONFLICT': 'Volunteer assigned to multiple events simultaneously'
        }
    
    def check_conflicts(self, assignment: Assignment) -> List[Dict[str, Any]]:
        """
        Check for all types of conflicts for a given assignment
        Returns list of conflicts found
        """
        conflicts = []
        
        # Check time overlap conflicts
        time_conflicts = self._check_time_overlaps(assignment)
        conflicts.extend(time_conflicts)
        
        # Check availability conflicts
        availability_conflicts = self._check_availability(assignment)
        conflicts.extend(availability_conflicts)
        
        # Check experience level conflicts
        experience_conflicts = self._check_experience_requirements(assignment)
        conflicts.extend(experience_conflicts)
        
        # Check workload conflicts
        workload_conflicts = self._check_workload_limits(assignment)
        conflicts.extend(workload_conflicts)
        
        # Check position conflicts
        position_conflicts = self._check_position_availability(assignment)
        conflicts.extend(position_conflicts)
        
        # Check event conflicts
        event_conflicts = self._check_event_conflicts(assignment)
        conflicts.extend(event_conflicts)
        
        return conflicts
    
    def _check_time_overlaps(self, assignment: Assignment) -> List[Dict[str, Any]]:
        """Check for time overlap conflicts with existing assignments"""
        conflicts = []
        
        # Query for overlapping assignments for the same volunteer
        overlapping_assignments = Assignment.query.filter(
            Assignment.volunteer_id == assignment.volunteer_id,
            Assignment.id != getattr(assignment, 'id', None),  # Exclude self if updating
            Assignment.shift_start < assignment.shift_end,
            Assignment.shift_end > assignment.shift_start
        ).all()
        
        for overlap in overlapping_assignments:
            conflicts.append({
                'type': 'TIME_OVERLAP',
                'severity': 'HIGH',
                'message': self.conflict_types['TIME_OVERLAP'],
                'details': {
                    'conflicting_assignment_id': overlap.id,
                    'conflicting_shift_start': overlap.shift_start.isoformat(),
                    'conflicting_shift_end': overlap.shift_end.isoformat(),
                    'conflicting_position': overlap.position
                }
            })
        
        return conflicts
    
    def _check_availability(self, assignment: Assignment) -> List[Dict[str, Any]]:
        """Check volunteer availability for the assigned time"""
        conflicts = []
        
        volunteer = Volunteer.query.get(assignment.volunteer_id)
        if not volunteer:
            return conflicts
        
        # Parse volunteer availability
        if volunteer.availability:
            try:
                import json
                availability_data = json.loads(volunteer.availability)
                
                # Check if volunteer is available during this time
                if not self._is_available_during_time(availability_data, assignment):
                    conflicts.append({
                        'type': 'AVAILABILITY_CONFLICT',
                        'severity': 'MEDIUM',
                        'message': self.conflict_types['AVAILABILITY_CONFLICT'],
                        'details': {
                            'volunteer_availability': volunteer.availability,
                            'requested_time': f"{assignment.shift_start} - {assignment.shift_end}"
                        }
                    })
                    
            except (json.JSONDecodeError, KeyError):
                # If availability is text-based, do basic checking
                availability_text = volunteer.availability.lower()
                shift_day = assignment.shift_start.strftime('%A').lower()
                shift_time = assignment.shift_start.strftime('%H:%M')
                
                # Basic text-based availability checking
                if ('not available' in availability_text and 
                    (shift_day in availability_text or shift_time in availability_text)):
                    conflicts.append({
                        'type': 'AVAILABILITY_CONFLICT',
                        'severity': 'MEDIUM',
                        'message': self.conflict_types['AVAILABILITY_CONFLICT'],
                        'details': {
                            'volunteer_availability': volunteer.availability,
                            'requested_time': f"{assignment.shift_start} - {assignment.shift_end}"
                        }
                    })
        
        return conflicts
    
    def _check_experience_requirements(self, assignment: Assignment) -> List[Dict[str, Any]]:
        """Check if volunteer meets experience requirements for position"""
        conflicts = []
        
        volunteer = Volunteer.query.get(assignment.volunteer_id)
        if not volunteer:
            return conflicts
        
        # Define position requirements
        position_requirements = {
            'Security': 'Experienced',
            'Stage Management': 'Experienced',
            'Audio/Video': 'Experienced',
            'First Aid': 'Experienced',
            'Information Desk': 'Intermediate',
            'Literature Counter': 'Intermediate',
            'Gate Attendant': 'Beginner',
            'Parking Attendant': 'Beginner',
            'Cleaning Crew': 'Beginner',
            'Food Service': 'Beginner'
        }
        
        required_level = position_requirements.get(assignment.position, 'Beginner')
        volunteer_level = volunteer.experience_level or 'Beginner'
        
        experience_hierarchy = {'Beginner': 1, 'Intermediate': 2, 'Experienced': 3}
        
        if experience_hierarchy.get(volunteer_level, 1) < experience_hierarchy.get(required_level, 1):
            conflicts.append({
                'type': 'EXPERIENCE_MISMATCH',
                'severity': 'MEDIUM',
                'message': self.conflict_types['EXPERIENCE_MISMATCH'],
                'details': {
                    'volunteer_level': volunteer_level,
                    'required_level': required_level,
                    'position': assignment.position
                }
            })
        
        return conflicts
    
    def _check_workload_limits(self, assignment: Assignment) -> List[Dict[str, Any]]:
        """Check if assignment would exceed volunteer workload limits"""
        conflicts = []
        
        # Get event to determine workload limits
        event = Event.query.get(assignment.event_id)
        if not event:
            return conflicts
        
        # Calculate current workload for volunteer in this event
        existing_assignments = Assignment.query.filter_by(
            volunteer_id=assignment.volunteer_id,
            event_id=assignment.event_id
        ).filter(Assignment.id != getattr(assignment, 'id', None)).all()
        
        # Calculate total hours
        total_hours = sum([
            (a.shift_end - a.shift_start).total_seconds() / 3600 
            for a in existing_assignments
        ])
        
        # Add current assignment hours
        assignment_hours = (assignment.shift_end - assignment.shift_start).total_seconds() / 3600
        total_hours += assignment_hours
        
        # Define workload limits based on event type
        workload_limits = {
            'Regional Convention': 24,  # 24 hours max over 3 days
            'Circuit Assembly': 12,     # 12 hours max over 2 days
            'Local Congregation': 8     # 8 hours max for single day
        }
        
        max_hours = workload_limits.get(event.event_type.value, 8)
        
        if total_hours > max_hours:
            conflicts.append({
                'type': 'WORKLOAD_EXCEEDED',
                'severity': 'LOW',
                'message': self.conflict_types['WORKLOAD_EXCEEDED'],
                'details': {
                    'current_hours': total_hours,
                    'max_hours': max_hours,
                    'event_type': event.event_type.value
                }
            })
        
        return conflicts
    
    def _check_position_availability(self, assignment: Assignment) -> List[Dict[str, Any]]:
        """Check if position is already filled for the time slot"""
        conflicts = []
        
        # Define position limits (how many people can fill each position simultaneously)
        position_limits = {
            'Gate Attendant': 2,
            'Parking Attendant': 3,
            'Information Desk': 2,
            'Security': 4,
            'First Aid': 1,
            'Audio/Video': 2,
            'Stage Management': 1,
            'Cleaning Crew': 5,
            'Food Service': 4,
            'Literature Counter': 2
        }
        
        max_for_position = position_limits.get(assignment.position, 1)
        
        # Count existing assignments for this position during overlapping time
        overlapping_count = Assignment.query.filter(
            Assignment.event_id == assignment.event_id,
            Assignment.position == assignment.position,
            Assignment.id != getattr(assignment, 'id', None),
            Assignment.shift_start < assignment.shift_end,
            Assignment.shift_end > assignment.shift_start
        ).count()
        
        if overlapping_count >= max_for_position:
            conflicts.append({
                'type': 'POSITION_CONFLICT',
                'severity': 'HIGH',
                'message': self.conflict_types['POSITION_CONFLICT'],
                'details': {
                    'position': assignment.position,
                    'current_count': overlapping_count,
                    'max_allowed': max_for_position
                }
            })
        
        return conflicts
    
    def _check_event_conflicts(self, assignment: Assignment) -> List[Dict[str, Any]]:
        """Check for conflicts with other events"""
        conflicts = []
        
        # Check if volunteer is assigned to other events during the same time
        other_event_assignments = Assignment.query.join(Event).filter(
            Assignment.volunteer_id == assignment.volunteer_id,
            Assignment.event_id != assignment.event_id,
            Assignment.id != getattr(assignment, 'id', None),
            Assignment.shift_start < assignment.shift_end,
            Assignment.shift_end > assignment.shift_start
        ).all()
        
        for other_assignment in other_event_assignments:
            conflicts.append({
                'type': 'EVENT_CONFLICT',
                'severity': 'HIGH',
                'message': self.conflict_types['EVENT_CONFLICT'],
                'details': {
                    'conflicting_event_id': other_assignment.event_id,
                    'conflicting_event_name': other_assignment.event.name,
                    'conflicting_position': other_assignment.position
                }
            })
        
        return conflicts
    
    def _is_available_during_time(self, availability_data: dict, assignment: Assignment) -> bool:
        """Check if volunteer is available during the assignment time"""
        
        # Check blocked times
        if 'blocked_times' in availability_data:
            for blocked_period in availability_data['blocked_times']:
                blocked_start = datetime.fromisoformat(blocked_period['start'])
                blocked_end = datetime.fromisoformat(blocked_period['end'])
                
                if (assignment.shift_start < blocked_end and 
                    assignment.shift_end > blocked_start):
                    return False
        
        # Check available days
        if 'available_days' in availability_data:
            assignment_day = assignment.shift_start.strftime('%A').lower()
            if assignment_day not in [day.lower() for day in availability_data['available_days']]:
                return False
        
        # Check available time ranges
        if 'available_times' in availability_data:
            assignment_time = assignment.shift_start.time()
            available = False
            
            for time_range in availability_data['available_times']:
                start_time = datetime.strptime(time_range['start'], '%H:%M').time()
                end_time = datetime.strptime(time_range['end'], '%H:%M').time()
                
                if start_time <= assignment_time <= end_time:
                    available = True
                    break
            
            if not available:
                return False
        
        return True
    
    def get_conflict_summary(self, conflicts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a summary of conflicts"""
        if not conflicts:
            return {'status': 'no_conflicts', 'total': 0}
        
        severity_counts = {'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
        type_counts = {}
        
        for conflict in conflicts:
            severity = conflict.get('severity', 'LOW')
            conflict_type = conflict.get('type', 'UNKNOWN')
            
            severity_counts[severity] += 1
            type_counts[conflict_type] = type_counts.get(conflict_type, 0) + 1
        
        # Determine overall status
        if severity_counts['HIGH'] > 0:
            status = 'critical_conflicts'
        elif severity_counts['MEDIUM'] > 0:
            status = 'moderate_conflicts'
        else:
            status = 'minor_conflicts'
        
        return {
            'status': status,
            'total': len(conflicts),
            'by_severity': severity_counts,
            'by_type': type_counts,
            'blocking': severity_counts['HIGH'] > 0
        }
