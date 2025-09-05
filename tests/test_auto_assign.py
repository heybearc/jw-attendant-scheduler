"""
Test Suite for Auto-Assignment Algorithm
Testing Agent Implementation
"""

import pytest
from django.test import TestCase
from django.utils import timezone
from datetime import datetime, timedelta

from scheduler.models import Event, Attendant, Assignment
from scheduler.auto_assign import AutoAssignmentEngine, auto_assign_event


class TestAutoAssignmentEngine(TestCase):
    """Test cases for auto-assignment functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.event = Event.objects.create(
            name="Test Circuit Assembly",
            event_type="circuit_assembly",
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=1),
            location="Test Hall",
            status="upcoming"
        )
        
        # Create test attendants
        self.attendant1 = Attendant.objects.create(
            first_name="John",
            last_name="Elder",
            email="john@test.com",
            serving_as="elder",
            is_active=True
        )
        
        self.attendant2 = Attendant.objects.create(
            first_name="Mike",
            last_name="Servant",
            email="mike@test.com", 
            serving_as="ministerial_servant",
            is_active=True
        )
        
        self.attendant3 = Attendant.objects.create(
            first_name="Bob",
            last_name="Publisher",
            email="bob@test.com",
            serving_as="publisher",
            is_active=True
        )
    
    def test_engine_initialization(self):
        """Test engine initializes correctly"""
        engine = AutoAssignmentEngine(self.event)
        self.assertEqual(engine.event, self.event)
        self.assertEqual(len(engine.assignments), 0)
        self.assertEqual(engine.metrics['total_positions'], 0)
    
    def test_get_available_attendants(self):
        """Test retrieval of available attendants"""
        engine = AutoAssignmentEngine(self.event)
        attendants = engine._get_available_attendants()
        self.assertEqual(attendants.count(), 3)
    
    def test_position_prioritization(self):
        """Test position priority sorting"""
        engine = AutoAssignmentEngine(self.event)
        positions = [
            {'name': 'Parking', 'priority': 60},
            {'name': 'Sound', 'priority': 100},
            {'name': 'Usher', 'priority': 70}
        ]
        
        prioritized = engine._prioritize_positions(positions)
        self.assertEqual(prioritized[0]['name'], 'Sound')
        self.assertEqual(prioritized[1]['name'], 'Usher')
        self.assertEqual(prioritized[2]['name'], 'Parking')
    
    def test_attendant_scoring(self):
        """Test attendant scoring algorithm"""
        engine = AutoAssignmentEngine(self.event)
        position = {'name': 'Sound', 'start_time': None, 'end_time': None}
        
        # Elder should score higher for Sound position
        elder_score = engine._calculate_score(self.attendant1, position)
        publisher_score = engine._calculate_score(self.attendant3, position)
        
        self.assertGreater(elder_score, publisher_score)
    
    def test_availability_check(self):
        """Test attendant availability checking"""
        engine = AutoAssignmentEngine(self.event)
        
        # Create existing assignment
        Assignment.objects.create(
            event=self.event,
            attendant=self.attendant1,
            position="Platform",
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=2)
        )
        
        # Test conflicting position
        conflicting_position = {
            'name': 'Sound',
            'start_time': timezone.now() + timedelta(minutes=30),
            'end_time': timezone.now() + timedelta(hours=1, minutes=30)
        }
        
        self.assertFalse(engine._is_available(self.attendant1, conflicting_position))
        self.assertTrue(engine._is_available(self.attendant2, conflicting_position))
    
    def test_auto_assignment_success(self):
        """Test successful auto-assignment"""
        positions = [
            {'name': 'Sound', 'start_time': None, 'end_time': None},
            {'name': 'Platform', 'start_time': None, 'end_time': None},
            {'name': 'Usher', 'start_time': None, 'end_time': None}
        ]
        
        result = auto_assign_event(self.event.id, positions)
        
        self.assertTrue(result['success'])
        self.assertEqual(result['metrics']['total_positions'], 3)
        self.assertGreater(result['metrics']['assigned_positions'], 0)
    
    def test_auto_assignment_with_conflicts(self):
        """Test auto-assignment with scheduling conflicts"""
        # Pre-assign attendant to create conflict
        Assignment.objects.create(
            event=self.event,
            attendant=self.attendant1,
            position="Existing",
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=2)
        )
        
        positions = [
            {
                'name': 'Sound',
                'start_time': timezone.now() + timedelta(minutes=30),
                'end_time': timezone.now() + timedelta(hours=1, minutes=30)
            }
        ]
        
        result = auto_assign_event(self.event.id, positions)
        
        # Should still succeed by assigning to different attendant
        self.assertTrue(result['success'])
    
    def test_workload_balancing(self):
        """Test workload balancing across attendants"""
        # Create multiple assignments for one attendant
        for i in range(3):
            Assignment.objects.create(
                event=self.event,
                attendant=self.attendant1,
                position=f"Position_{i}",
                start_time=timezone.now() + timedelta(hours=i*3),
                end_time=timezone.now() + timedelta(hours=i*3+1)
            )
        
        engine = AutoAssignmentEngine(self.event)
        position = {'name': 'New_Position', 'start_time': None, 'end_time': None}
        
        # Less loaded attendant should score higher
        score1 = engine._calculate_score(self.attendant1, position)  # 3 assignments
        score2 = engine._calculate_score(self.attendant2, position)  # 0 assignments
        
        self.assertGreater(score2, score1)
    
    def test_invalid_event(self):
        """Test handling of invalid event ID"""
        result = auto_assign_event(99999, [])
        self.assertFalse(result['success'])
        self.assertIn('Event not found', result['error'])


class TestAutoAssignmentIntegration(TestCase):
    """Integration tests for auto-assignment system"""
    
    def setUp(self):
        """Set up integration test data"""
        self.event = Event.objects.create(
            name="Integration Test Event",
            event_type="regional_convention",
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=3),
            location="Convention Center",
            status="upcoming"
        )
        
        # Create diverse attendant pool
        attendant_data = [
            ("Elder1", "Test", "elder"),
            ("Elder2", "Test", "elder"), 
            ("MS1", "Test", "ministerial_servant"),
            ("MS2", "Test", "ministerial_servant"),
            ("Pub1", "Test", "publisher"),
            ("Pub2", "Test", "publisher"),
            ("Pub3", "Test", "publisher"),
            ("Pub4", "Test", "publisher")
        ]
        
        for first, last, serving in attendant_data:
            Attendant.objects.create(
                first_name=first,
                last_name=last,
                email=f"{first.lower()}@test.com",
                serving_as=serving,
                is_active=True
            )
    
    def test_full_event_assignment(self):
        """Test assignment of complete event positions"""
        positions = [
            {'name': 'Sound', 'priority': 100},
            {'name': 'Stage', 'priority': 95},
            {'name': 'Attendant Captain', 'priority': 90},
            {'name': 'Platform', 'priority': 80},
            {'name': 'Usher', 'priority': 70},
            {'name': 'Usher', 'priority': 70},
            {'name': 'Parking', 'priority': 60},
            {'name': 'Parking', 'priority': 60}
        ]
        
        result = auto_assign_event(self.event.id, positions)
        
        self.assertTrue(result['success'])
        self.assertEqual(result['metrics']['total_positions'], 8)
        self.assertGreaterEqual(result['metrics']['assigned_positions'], 6)  # At least 75% assigned
        self.assertGreaterEqual(result['metrics']['attendants_used'], 4)  # Good distribution
