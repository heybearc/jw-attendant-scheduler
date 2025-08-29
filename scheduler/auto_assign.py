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

from .models import Attendant, Event, Assignment

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
    
    def auto_assign_positions(self, positions: List[Dict]) -> Dict:
        """Main auto-assignment method"""
        logger.info(f"Auto-assigning {len(positions)} positions for {self.event.name}")
        
        self.metrics['total_positions'] = len(positions)
        available_attendants = self._get_available_attendants()
        
        # Priority-based assignment
        for position in self._prioritize_positions(positions):
            best_attendant = self._find_best_attendant(position, available_attendants)
            
            if best_attendant:
                assignment = Assignment.objects.create(
                    event=self.event,
                    attendant=best_attendant,
                    position=position['name'],
                    start_time=position.get('start_time'),
                    end_time=position.get('end_time'),
                    status='confirmed'
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
        return Attendant.objects.filter(is_active=True)
    
    def _prioritize_positions(self, positions):
        """Sort positions by priority"""
        priority_map = {
            'Sound': 100, 'Stage': 95, 'Attendant Captain': 90,
            'Platform': 80, 'Usher': 70, 'Parking': 60
        }
        return sorted(positions, 
                     key=lambda p: priority_map.get(p['name'], 50), 
                     reverse=True)
    
    def _find_best_attendant(self, position, attendants):
        """Find best attendant using scoring algorithm"""
        best_attendant = None
        best_score = -1
        
        for attendant in attendants:
            score = self._calculate_score(attendant, position)
            if score > best_score and self._is_available(attendant, position):
                best_score = score
                best_attendant = attendant
        
        return best_attendant
    
    def _calculate_score(self, attendant, position):
        """Calculate attendant fitness score"""
        score = 0
        
        # Experience bonus
        if hasattr(attendant, 'experience') and position['name'] in attendant.experience:
            score += 40
        
        # Leadership positions for elders/MS
        if position['name'] in ['Sound', 'Stage'] and attendant.serving_as in ['elder', 'ministerial_servant']:
            score += 20
        
        # Workload balance
        current_assignments = Assignment.objects.filter(
            attendant=attendant, event=self.event
        ).count()
        score += max(0, 20 - (current_assignments * 5))
        
        return score
    
    def _is_available(self, attendant, position):
        """Check attendant availability"""
        if not position.get('start_time') or not position.get('end_time'):
            return True
        
        conflicts = Assignment.objects.filter(
            attendant=attendant,
            event=self.event,
            start_time__lt=position['end_time'],
            end_time__gt=position['start_time']
        )
        
        return not conflicts.exists()


def auto_assign_event(event_id: int, position_requirements: List[Dict]) -> Dict:
    """Public API for auto-assignment"""
    try:
        event = Event.objects.get(id=event_id)
        engine = AutoAssignmentEngine(event)
        return engine.auto_assign_positions(position_requirements)
    except Event.DoesNotExist:
        return {'success': False, 'error': 'Event not found'}
    except Exception as e:
        logger.error(f"Auto-assignment failed: {e}")
        return {'success': False, 'error': str(e)}
