"""
Auto-Assignment Algorithm for JW Attendant Scheduler
Backend Agent Implementation
"""

from django.db import models
from django.utils import timezone
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging
from collections import defaultdict

from .models import Attendant, Event, Assignment, EventPosition, PositionShift

logger = logging.getLogger(__name__)


class AutoAssignmentEngine:
    """Intelligent attendant assignment system"""
    
    def __init__(self, event: Event):
        self.event = event
        self.assignments = []
        self.conflicts = []
        self.metrics = {
            'total_positions': 0,
            'assigned_positions': 0,
            'unassigned_positions': 0,
            'attendants_used': 0
        }
    
    def auto_assign_positions(self) -> Dict:
        """Main auto-assignment method using new position system"""
        logger.info(f"Auto-assigning positions for {self.event.name}")
        
        # Get all position shifts for this event
        position_shifts = PositionShift.objects.filter(
            position__event=self.event
        ).select_related('position').order_by('position__position_number', 'shift_start')
        
        self.metrics['total_positions'] = position_shifts.count()
        available_attendants = self._get_available_attendants()
        
        # Priority-based assignment
        for position_shift in self._prioritize_position_shifts(position_shifts):
            best_attendant = self._find_best_attendant_for_shift(position_shift, available_attendants)
            
            if best_attendant:
                assignment = Assignment.objects.create(
                    event=self.event,
                    attendant=best_attendant,
                    position=f"Position {position_shift.position.position_number}" + 
                            (f" - {position_shift.position.position_name}" if position_shift.position.position_name else ""),
                    shift_start=position_shift.shift_start,
                    shift_end=position_shift.shift_end,
                    notes=f"Auto-assigned to {position_shift.position.position_name or f'Position {position_shift.position.position_number}'}"
                )
                self.assignments.append(assignment)
                self.metrics['assigned_positions'] += 1
            else:
                self.metrics['unassigned_positions'] += 1
        
        self.metrics['attendants_used'] = len(set(a.attendant.id for a in self.assignments))
        
        return {
            'assignments': self.assignments,
            'metrics': self.metrics,
            'success': self.metrics['assigned_positions'] > 0
        }
    
    def _get_available_attendants(self):
        """Get available attendants for event"""
        return Attendant.objects.filter(is_active=True, events=self.event)
    
    def _prioritize_position_shifts(self, position_shifts):
        """Sort position shifts by priority and time"""
        # Priority based on position number (lower numbers = higher priority)
        return sorted(position_shifts, 
                     key=lambda ps: (ps.position.position_number, ps.shift_start))
    
    def _find_best_attendant_for_shift(self, position_shift, attendants):
        """Find best attendant for a specific position shift"""
        best_attendant = None
        best_score = -1
        
        for attendant in attendants:
            score = self._calculate_shift_score(attendant, position_shift)
            if score > best_score and self._is_available_for_shift(attendant, position_shift):
                best_score = score
                best_attendant = attendant
        
        return best_attendant
    
    def _calculate_shift_score(self, attendant, position_shift):
        """Calculate attendant fitness score for position shift"""
        score = 0
        
        # Base score for active attendants
        score += 10
        
        # Leadership positions (positions 1-10) for elders/MS
        if position_shift.position.position_number <= 10 and attendant.serving_as in ['elder', 'ministerial_servant']:
            score += 20
        
        # Workload balance - prefer attendants with fewer assignments
        current_assignments = Assignment.objects.filter(
            attendant=attendant, event=self.event
        ).count()
        score += max(0, 20 - (current_assignments * 3))
        
        # Time preference - slightly prefer earlier shifts
        if position_shift.shift_start.hour < 12:
            score += 5
        
        return score
    
    def _is_available_for_shift(self, attendant, position_shift):
        """Check if attendant is available for specific shift"""
        conflicts = Assignment.objects.filter(
            attendant=attendant,
            event=self.event,
            shift_start__lt=position_shift.shift_end,
            shift_end__gt=position_shift.shift_start
        )
        
        return not conflicts.exists()


def auto_assign_event(event_id: int) -> Dict:
    """Public API for auto-assignment using new position system"""
    try:
        event = Event.objects.get(id=event_id)
        engine = AutoAssignmentEngine(event)
        return engine.auto_assign_positions()
    except Event.DoesNotExist:
        return {'success': False, 'error': 'Event not found'}
    except Exception as e:
        logger.error(f"Auto-assignment failed: {e}")
        return {'success': False, 'error': str(e)}
