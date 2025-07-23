"""
Test cases for database models
"""

import pytest
from datetime import datetime, date
from src.models import Volunteer, Event, Assignment, User, EventType, db


class TestVolunteer:
    """Test cases for Volunteer model"""
    
    def test_volunteer_creation(self):
        """Test creating a new volunteer"""
        volunteer = Volunteer(
            first_name="John",
            last_name="Doe",
            email="john.doe@example.com",
            phone="555-1234",
            congregation="Test Congregation",
            experience_level="Intermediate"
        )
        assert volunteer.first_name == "John"
        assert volunteer.last_name == "Doe"
        assert volunteer.email == "john.doe@example.com"


class TestEvent:
    """Test cases for Event model"""
    
    def test_event_creation(self):
        """Test creating a new event"""
        event = Event(
            name="Regional Convention 2024",
            event_type=EventType.REGIONAL_CONVENTION,
            start_date=date(2024, 7, 1),
            end_date=date(2024, 7, 3),
            location="Convention Center"
        )
        assert event.name == "Regional Convention 2024"
        assert event.event_type == EventType.REGIONAL_CONVENTION
        assert event.location == "Convention Center"


class TestAssignment:
    """Test cases for Assignment model"""
    
    def test_assignment_creation(self):
        """Test creating a new assignment"""
        assignment = Assignment(
            volunteer_id=1,
            event_id=1,
            position="Gate Attendant",
            shift_start=datetime(2024, 7, 1, 8, 0),
            shift_end=datetime(2024, 7, 1, 12, 0)
        )
        assert assignment.position == "Gate Attendant"
        assert assignment.volunteer_id == 1
        assert assignment.event_id == 1
