#!/usr/bin/env python
"""
Sample data creation script for JW Attendant Scheduler Django
Creates test data for development and testing purposes.
"""

import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jw_scheduler.settings')
django.setup()

from scheduler.models import (
    User, Attendant, Event, Assignment, Department, 
    StationRange, OverseerAssignment, AttendantOverseerAssignment,
    UserRole, EventType, EventStatus
)


def create_sample_data():
    """Create comprehensive sample data for testing"""
    
    print("Creating sample data for JW Attendant Scheduler...")
    
    # Create additional users with different roles
    users_data = [
        {'username': 'overseer1', 'email': 'overseer1@example.com', 'role': UserRole.OVERSEER, 'first_name': 'John', 'last_name': 'Smith'},
        {'username': 'overseer2', 'email': 'overseer2@example.com', 'role': UserRole.ASSISTANT_OVERSEER, 'first_name': 'David', 'last_name': 'Johnson'},
        {'username': 'keyman1', 'email': 'keyman1@example.com', 'role': UserRole.KEYMAN, 'first_name': 'Michael', 'last_name': 'Brown'},
        {'username': 'attendant1', 'email': 'attendant1@example.com', 'role': UserRole.ATTENDANT, 'first_name': 'Robert', 'last_name': 'Davis'},
        {'username': 'attendant2', 'email': 'attendant2@example.com', 'role': UserRole.ATTENDANT, 'first_name': 'William', 'last_name': 'Wilson'},
    ]
    
    created_users = []
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data['email'],
                'role': user_data['role'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'is_active': True
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"Created user: {user.username} ({user.get_role_display()})")
        created_users.append(user)
    
    # Create attendants
    attendants_data = [
        {
            'first_name': 'James', 'last_name': 'Anderson', 'email': 'james.anderson@example.com',
            'phone': '555-0101', 'congregation': 'North Congregation', 'serving_as': ['elder'],
            'experience_level': 'expert', 'preferred_positions': 'Gate, Information Desk'
        },
        {
            'first_name': 'Mary', 'last_name': 'Taylor', 'email': 'mary.taylor@example.com',
            'phone': '555-0102', 'congregation': 'South Congregation', 'serving_as': ['regular_pioneer'],
            'experience_level': 'experienced', 'preferred_positions': 'Parking, Ushering'
        },
        {
            'first_name': 'Christopher', 'last_name': 'Martinez', 'email': 'chris.martinez@example.com',
            'phone': '555-0103', 'congregation': 'East Congregation', 'serving_as': ['ministerial_servant'],
            'experience_level': 'intermediate', 'preferred_positions': 'Security, Gate'
        },
        {
            'first_name': 'Jennifer', 'last_name': 'Garcia', 'email': 'jennifer.garcia@example.com',
            'phone': '555-0104', 'congregation': 'West Congregation', 'serving_as': ['auxiliary_pioneer'],
            'experience_level': 'experienced', 'preferred_positions': 'Information Desk, First Aid'
        },
        {
            'first_name': 'Daniel', 'last_name': 'Rodriguez', 'email': 'daniel.rodriguez@example.com',
            'phone': '555-0105', 'congregation': 'Central Congregation', 'serving_as': ['publisher'],
            'experience_level': 'beginner', 'preferred_positions': 'Parking, General'
        },
        {
            'first_name': 'Sarah', 'last_name': 'Lee', 'email': 'sarah.lee@example.com',
            'phone': '555-0106', 'congregation': 'North Congregation', 'serving_as': ['regular_pioneer'],
            'experience_level': 'intermediate', 'preferred_positions': 'Ushering, Information'
        },
        {
            'first_name': 'Matthew', 'last_name': 'White', 'email': 'matthew.white@example.com',
            'phone': '555-0107', 'congregation': 'South Congregation', 'serving_as': ['elder'],
            'experience_level': 'expert', 'preferred_positions': 'Security, Gate, Oversight'
        },
        {
            'first_name': 'Lisa', 'last_name': 'Thompson', 'email': 'lisa.thompson@example.com',
            'phone': '555-0108', 'congregation': 'East Congregation', 'serving_as': ['publisher'],
            'experience_level': 'intermediate', 'preferred_positions': 'First Aid, Information'
        }
    ]
    
    created_attendants = []
    for att_data in attendants_data:
        attendant, created = Attendant.objects.get_or_create(
            email=att_data['email'],
            defaults=att_data
        )
        if created:
            print(f"Created attendant: {attendant.get_full_name()} - {attendant.congregation}")
        created_attendants.append(attendant)
    
    # Create events
    today = timezone.now().date()
    events_data = [
        {
            'name': '2025 Regional Convention - "Exercise Faith"',
            'event_type': EventType.REGIONAL_CONVENTION,
            'start_date': today + timedelta(days=30),
            'end_date': today + timedelta(days=32),
            'location': 'Convention Center Arena',
            'status': EventStatus.UPCOMING,
            'total_stations': 50,
            'expected_attendants': 8000,
            'description': 'Three-day regional convention with multiple sessions and demonstrations.'
        },
        {
            'name': 'Circuit Assembly - Fall 2025',
            'event_type': EventType.CIRCUIT_ASSEMBLY,
            'start_date': today + timedelta(days=60),
            'end_date': today + timedelta(days=60),
            'location': 'Assembly Hall',
            'status': EventStatus.UPCOMING,
            'total_stations': 25,
            'expected_attendants': 1200,
            'description': 'One-day circuit assembly with spiritual program.'
        },
        {
            'name': 'Special Assembly Day - Spring 2025',
            'event_type': EventType.SPECIAL_ASSEMBLY_DAY,
            'start_date': today - timedelta(days=30),
            'end_date': today - timedelta(days=30),
            'location': 'Kingdom Hall Complex',
            'status': EventStatus.COMPLETED,
            'total_stations': 15,
            'expected_attendants': 800,
            'description': 'Special assembly day with baptism and spiritual program.'
        }
    ]
    
    created_events = []
    for event_data in events_data:
        event, created = Event.objects.get_or_create(
            name=event_data['name'],
            defaults=event_data
        )
        if created:
            print(f"Created event: {event.name} - {event.start_date}")
        created_events.append(event)
    
    # Set the first event as current
    if created_events:
        created_events[0].set_as_current()
        print(f"Set current event: {created_events[0].name}")
    
    # Create departments
    departments_data = [
        {'name': 'Security', 'description': 'Security and safety oversight'},
        {'name': 'Parking', 'description': 'Parking lot management and direction'},
        {'name': 'Information', 'description': 'Information desks and assistance'},
        {'name': 'Ushering', 'description': 'Seating assistance and crowd management'},
        {'name': 'First Aid', 'description': 'Medical assistance and first aid'},
        {'name': 'Gate', 'description': 'Entry and exit point management'},
    ]
    
    created_departments = []
    for dept_data in departments_data:
        department, created = Department.objects.get_or_create(
            name=dept_data['name'],
            defaults=dept_data
        )
        if created:
            print(f"Created department: {department.name}")
        created_departments.append(department)
    
    # Create station ranges
    station_ranges_data = [
        {'name': 'Stations 1-10', 'start_station': 1, 'end_station': 10, 'description': 'Main entrance area'},
        {'name': 'Stations 11-20', 'start_station': 11, 'end_station': 20, 'description': 'East wing'},
        {'name': 'Stations 21-30', 'start_station': 21, 'end_station': 30, 'description': 'West wing'},
        {'name': 'Stations 31-40', 'start_station': 31, 'end_station': 40, 'description': 'Upper level'},
        {'name': 'Stations 41-50', 'start_station': 41, 'end_station': 50, 'description': 'Parking areas'},
    ]
    
    created_station_ranges = []
    for sr_data in station_ranges_data:
        station_range, created = StationRange.objects.get_or_create(
            name=sr_data['name'],
            defaults=sr_data
        )
        if created:
            print(f"Created station range: {station_range.name}")
        created_station_ranges.append(station_range)
    
    # Create assignments for the current event
    current_event = created_events[0] if created_events else None
    if current_event and created_attendants:
        positions = ['Gate 1', 'Gate 2', 'Information Desk', 'Parking Lot A', 'Parking Lot B', 
                    'Security Main', 'Ushering Section 1', 'Ushering Section 2', 'First Aid Station']
        
        assignment_count = 0
        for i, attendant in enumerate(created_attendants[:len(positions)]):
            # Create assignments for different days of the event
            for day_offset in range(3):  # 3-day event
                shift_date = current_event.start_date + timedelta(days=day_offset)
                shift_start = timezone.make_aware(datetime.combine(shift_date, datetime.min.time().replace(hour=8)))
                shift_end = timezone.make_aware(datetime.combine(shift_date, datetime.min.time().replace(hour=17)))
                
                assignment, created = Assignment.objects.get_or_create(
                    attendant=attendant,
                    event=current_event,
                    position=positions[i % len(positions)],
                    shift_start=shift_start,
                    defaults={
                        'shift_end': shift_end,
                        'notes': f'Day {day_offset + 1} assignment for {positions[i % len(positions)]}'
                    }
                )
                if created:
                    assignment_count += 1
        
        print(f"Created {assignment_count} assignments for {current_event.name}")
    
    # Create overseer assignments
    overseers = [user for user in created_users if user.role in [UserRole.OVERSEER, UserRole.ASSISTANT_OVERSEER]]
    if overseers and current_event and created_departments and created_station_ranges:
        for i, overseer in enumerate(overseers[:3]):  # Assign first 3 overseers
            department = created_departments[i % len(created_departments)]
            station_range = created_station_ranges[i % len(created_station_ranges)]
            
            overseer_assignment, created = OverseerAssignment.objects.get_or_create(
                overseer=overseer,
                event=current_event,
                defaults={
                    'department': department,
                    'station_range': station_range
                }
            )
            if created:
                print(f"Created overseer assignment: {overseer.username} -> {department.name}")
    
    print("\n=== SAMPLE DATA CREATION COMPLETE ===")
    print(f"Users: {User.objects.count()}")
    print(f"Attendants: {Attendant.objects.count()}")
    print(f"Events: {Event.objects.count()}")
    print(f"Assignments: {Assignment.objects.count()}")
    print(f"Departments: {Department.objects.count()}")
    print(f"Station Ranges: {StationRange.objects.count()}")
    print(f"Overseer Assignments: {OverseerAssignment.objects.count()}")


if __name__ == '__main__':
    create_sample_data()
