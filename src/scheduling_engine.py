"""
Scheduling Engine for JW Attendant Scheduler

Advanced scheduling algorithms for optimizing volunteer assignments.
Includes conflict detection, workload balancing, and preference matching.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
from models import Volunteer, Event, Assignment, db
import json


class SchedulingEngine:
    """Advanced scheduling engine with optimization algorithms"""
    
    def __init__(self):
        self.positions = [
            'Gate Attendant',
            'Parking Attendant', 
            'Information Desk',
            'Security',
            'First Aid',
            'Audio/Video',
            'Stage Management',
            'Cleaning Crew',
            'Food Service',
            'Literature Counter'
        ]
        
        self.shift_durations = {
            'short': 2,  # 2 hours
            'medium': 4,  # 4 hours
            'long': 6    # 6 hours
        }
    
    def optimize_event_schedule(self, event: Event) -> List[Dict[str, Any]]:
        """
        Optimize schedule for an entire event using advanced algorithms
        """
        volunteers = Volunteer.query.all()
        optimized_assignments = []
        
        # Generate time slots based on event duration
        time_slots = self._generate_time_slots(event)
        
        # Create assignment matrix
        assignment_matrix = self._create_assignment_matrix(volunteers, time_slots)
        
        # Apply optimization algorithms
        optimized_matrix = self._apply_optimization_algorithms(
            assignment_matrix, volunteers, time_slots, event
        )
        
        # Convert matrix back to assignments
        optimized_assignments = self._matrix_to_assignments(
            optimized_matrix, volunteers, time_slots, event
        )
        
        return optimized_assignments
    
    def _generate_time_slots(self, event: Event) -> List[Dict[str, Any]]:
        """Generate time slots for the event"""
        time_slots = []
        current_date = event.start_date
        
        while current_date <= event.end_date:
            # Morning session (8:00 AM - 12:00 PM)
            morning_start = datetime.combine(current_date, datetime.min.time().replace(hour=8))
            morning_end = datetime.combine(current_date, datetime.min.time().replace(hour=12))
            
            time_slots.append({
                'start': morning_start,
                'end': morning_end,
                'session': 'morning',
                'date': current_date
            })
            
            # Afternoon session (1:00 PM - 5:00 PM)
            afternoon_start = datetime.combine(current_date, datetime.min.time().replace(hour=13))
            afternoon_end = datetime.combine(current_date, datetime.min.time().replace(hour=17))
            
            time_slots.append({
                'start': afternoon_start,
                'end': afternoon_end,
                'session': 'afternoon',
                'date': current_date
            })
            
            # Evening session (6:00 PM - 9:00 PM) - only for multi-day events
            if event.event_type.value in ['Regional Convention']:
                evening_start = datetime.combine(current_date, datetime.min.time().replace(hour=18))
                evening_end = datetime.combine(current_date, datetime.min.time().replace(hour=21))
                
                time_slots.append({
                    'start': evening_start,
                    'end': evening_end,
                    'session': 'evening',
                    'date': current_date
                })
            
            current_date += timedelta(days=1)
        
        return time_slots
    
    def _create_assignment_matrix(self, volunteers: List[Volunteer], time_slots: List[Dict]) -> Dict:
        """Create initial assignment matrix"""
        matrix = {}
        
        for volunteer in volunteers:
            matrix[volunteer.id] = {}
            for i, slot in enumerate(time_slots):
                matrix[volunteer.id][i] = {
                    'assigned': False,
                    'position': None,
                    'preference_score': self._calculate_preference_score(volunteer, slot),
                    'availability_score': self._calculate_availability_score(volunteer, slot)
                }
        
        return matrix
    
    def _calculate_preference_score(self, volunteer: Volunteer, time_slot: Dict) -> float:
        """Calculate preference score for volunteer-timeslot combination"""
        score = 1.0  # Base score
        
        # Parse availability preferences
        if volunteer.availability:
            try:
                preferences = json.loads(volunteer.availability)
                
                # Check session preference
                if 'preferred_sessions' in preferences:
                    if time_slot['session'] in preferences['preferred_sessions']:
                        score += 0.5
                
                # Check day preference
                if 'preferred_days' in preferences:
                    day_name = time_slot['date'].strftime('%A').lower()
                    if day_name in preferences['preferred_days']:
                        score += 0.3
                        
            except (json.JSONDecodeError, KeyError):
                # If availability is not JSON, treat as text
                availability_text = volunteer.availability.lower()
                session = time_slot['session']
                
                if session in availability_text:
                    score += 0.5
                if 'flexible' in availability_text or 'any' in availability_text:
                    score += 0.2
        
        return score
    
    def _calculate_availability_score(self, volunteer: Volunteer, time_slot: Dict) -> float:
        """Calculate availability score based on existing assignments"""
        # Check for existing assignments that would conflict
        existing_assignments = Assignment.query.filter_by(volunteer_id=volunteer.id).all()
        
        for assignment in existing_assignments:
            if (assignment.shift_start <= time_slot['end'] and 
                assignment.shift_end >= time_slot['start']):
                return 0.0  # Not available due to conflict
        
        return 1.0  # Available
    
    def _apply_optimization_algorithms(self, matrix: Dict, volunteers: List[Volunteer], 
                                     time_slots: List[Dict], event: Event) -> Dict:
        """Apply various optimization algorithms"""
        
        # Algorithm 1: Fair Distribution
        matrix = self._apply_fair_distribution(matrix, volunteers, time_slots)
        
        # Algorithm 2: Experience Level Matching
        matrix = self._apply_experience_matching(matrix, volunteers, time_slots)
        
        # Algorithm 3: Workload Balancing
        matrix = self._apply_workload_balancing(matrix, volunteers, time_slots)
        
        return matrix
    
    def _apply_fair_distribution(self, matrix: Dict, volunteers: List[Volunteer], 
                               time_slots: List[Dict]) -> Dict:
        """Ensure fair distribution of assignments among volunteers"""
        
        # Calculate target assignments per volunteer
        total_positions_needed = len(time_slots) * len(self.positions)
        target_per_volunteer = total_positions_needed / len(volunteers)
        
        # Track assignments per volunteer
        volunteer_assignment_count = {v.id: 0 for v in volunteers}
        
        # Assign positions starting with highest preference scores
        for slot_idx, slot in enumerate(time_slots):
            for position in self.positions:
                # Find best available volunteer for this position/slot
                best_volunteer = None
                best_score = 0
                
                for volunteer in volunteers:
                    if (matrix[volunteer.id][slot_idx]['availability_score'] > 0 and
                        not matrix[volunteer.id][slot_idx]['assigned'] and
                        volunteer_assignment_count[volunteer.id] < target_per_volunteer * 1.2):
                        
                        total_score = (
                            matrix[volunteer.id][slot_idx]['preference_score'] +
                            matrix[volunteer.id][slot_idx]['availability_score'] +
                            self._get_experience_bonus(volunteer, position)
                        )
                        
                        if total_score > best_score:
                            best_score = total_score
                            best_volunteer = volunteer
                
                # Assign the position
                if best_volunteer:
                    matrix[best_volunteer.id][slot_idx]['assigned'] = True
                    matrix[best_volunteer.id][slot_idx]['position'] = position
                    volunteer_assignment_count[best_volunteer.id] += 1
        
        return matrix
    
    def _apply_experience_matching(self, matrix: Dict, volunteers: List[Volunteer], 
                                 time_slots: List[Dict]) -> Dict:
        """Match volunteer experience levels to appropriate positions"""
        
        # Define position difficulty levels
        position_difficulty = {
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
        
        # Adjust assignments based on experience matching
        for volunteer in volunteers:
            for slot_idx in range(len(time_slots)):
                if matrix[volunteer.id][slot_idx]['assigned']:
                    position = matrix[volunteer.id][slot_idx]['position']
                    required_level = position_difficulty.get(position, 'Beginner')
                    
                    # Check if volunteer meets experience requirement
                    if not self._meets_experience_requirement(volunteer.experience_level, required_level):
                        # Try to reassign to more suitable position
                        matrix = self._reassign_for_experience(matrix, volunteer.id, slot_idx, volunteers)
        
        return matrix
    
    def _apply_workload_balancing(self, matrix: Dict, volunteers: List[Volunteer], 
                                time_slots: List[Dict]) -> Dict:
        """Balance workload across volunteers"""
        
        # Calculate current workload for each volunteer
        workloads = {}
        for volunteer in volunteers:
            workloads[volunteer.id] = sum(
                1 for slot_idx in range(len(time_slots))
                if matrix[volunteer.id][slot_idx]['assigned']
            )
        
        # Identify overloaded and underloaded volunteers
        avg_workload = sum(workloads.values()) / len(workloads)
        overloaded = [v_id for v_id, load in workloads.items() if load > avg_workload * 1.3]
        underloaded = [v_id for v_id, load in workloads.items() if load < avg_workload * 0.7]
        
        # Redistribute assignments
        for overloaded_id in overloaded:
            for underloaded_id in underloaded:
                if workloads[overloaded_id] > workloads[underloaded_id] + 1:
                    # Find a suitable assignment to transfer
                    transferred = self._transfer_assignment(
                        matrix, overloaded_id, underloaded_id, time_slots
                    )
                    if transferred:
                        workloads[overloaded_id] -= 1
                        workloads[underloaded_id] += 1
        
        return matrix
    
    def _get_experience_bonus(self, volunteer: Volunteer, position: str) -> float:
        """Get experience bonus for volunteer-position combination"""
        experience_levels = {'Beginner': 1, 'Intermediate': 2, 'Experienced': 3}
        volunteer_level = experience_levels.get(volunteer.experience_level, 1)
        
        # Positions that benefit from experience
        experience_positions = {
            'Security': 3,
            'Stage Management': 3,
            'Audio/Video': 3,
            'First Aid': 3,
            'Information Desk': 2,
            'Literature Counter': 2
        }
        
        required_level = experience_positions.get(position, 1)
        
        if volunteer_level >= required_level:
            return 0.5  # Bonus for meeting requirements
        else:
            return -0.3  # Penalty for not meeting requirements
    
    def _meets_experience_requirement(self, volunteer_level: str, required_level: str) -> bool:
        """Check if volunteer meets experience requirement"""
        levels = {'Beginner': 1, 'Intermediate': 2, 'Experienced': 3}
        return levels.get(volunteer_level, 1) >= levels.get(required_level, 1)
    
    def _reassign_for_experience(self, matrix: Dict, volunteer_id: int, slot_idx: int, 
                               volunteers: List[Volunteer]) -> Dict:
        """Reassign volunteer to more suitable position based on experience"""
        # Implementation for reassignment logic
        # This is a simplified version - full implementation would be more complex
        return matrix
    
    def _transfer_assignment(self, matrix: Dict, from_volunteer: int, to_volunteer: int, 
                           time_slots: List[Dict]) -> bool:
        """Transfer an assignment from one volunteer to another"""
        # Find a suitable assignment to transfer
        for slot_idx in range(len(time_slots)):
            if (matrix[from_volunteer][slot_idx]['assigned'] and
                not matrix[to_volunteer][slot_idx]['assigned'] and
                matrix[to_volunteer][slot_idx]['availability_score'] > 0):
                
                # Transfer the assignment
                position = matrix[from_volunteer][slot_idx]['position']
                matrix[from_volunteer][slot_idx]['assigned'] = False
                matrix[from_volunteer][slot_idx]['position'] = None
                matrix[to_volunteer][slot_idx]['assigned'] = True
                matrix[to_volunteer][slot_idx]['position'] = position
                
                return True
        
        return False
    
    def _matrix_to_assignments(self, matrix: Dict, volunteers: List[Volunteer], 
                             time_slots: List[Dict], event: Event) -> List[Dict[str, Any]]:
        """Convert assignment matrix back to assignment objects"""
        assignments = []
        
        for volunteer in volunteers:
            for slot_idx, slot in enumerate(time_slots):
                if matrix[volunteer.id][slot_idx]['assigned']:
                    assignment_data = {
                        'volunteer_id': volunteer.id,
                        'event_id': event.id,
                        'position': matrix[volunteer.id][slot_idx]['position'],
                        'shift_start': slot['start'],
                        'shift_end': slot['end'],
                        'notes': f"Auto-assigned via optimization algorithm"
                    }
                    assignments.append(assignment_data)
        
        return assignments
