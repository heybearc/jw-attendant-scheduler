"""
Test suite for oversight management features in Phase 2
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from datetime import datetime, timedelta

from scheduler.models import (
    Event, Attendant, Assignment, Department, StationRange,
    OverseerAssignment, AttendantOverseerAssignment, UserRole, EventStatus
)

User = get_user_model()


class OversightManagementTestCase(TestCase):
    """Test oversight management functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.client = Client()
        
        # Create test users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            role=UserRole.ADMIN,
            is_staff=True
        )
        
        self.overseer_user = User.objects.create_user(
            username='overseer',
            email='overseer@test.com',
            password='testpass123',
            role=UserRole.OVERSEER,
            first_name='John',
            last_name='Overseer'
        )
        
        self.attendant_user = User.objects.create_user(
            username='attendant',
            email='attendant@test.com',
            password='testpass123',
            role=UserRole.ATTENDANT
        )
        
        # Create test event
        self.event = Event.objects.create(
            name='Test Assembly',
            event_type='circuit_assembly',
            start_date=timezone.now().date() + timedelta(days=30),
            end_date=timezone.now().date() + timedelta(days=32),
            location='Test Hall',
            status=EventStatus.UPCOMING
        )
        
        # Create test attendant
        self.attendant = Attendant.objects.create(
            first_name='Jane',
            last_name='Attendant',
            email='jane@test.com',
            phone='555-1234',
            congregation='Test Congregation',
            experience_level='intermediate'
        )
        self.attendant.events.add(self.event)
        
        # Create test department and station range
        self.department = Department.objects.create(
            name='Security',
            description='Security department'
        )
        
        self.station_range = StationRange.objects.create(
            name='Stations 1-10',
            start_station=1,
            end_station=10,
            description='Main entrance stations'
        )
    
    def test_department_creation(self):
        """Test department creation"""
        self.client.login(username='admin', password='testpass123')
        
        response = self.client.post('/scheduler/departments/create/', {
            'name': 'Parking',
            'description': 'Parking management'
        })
        
        self.assertEqual(response.status_code, 302)  # Redirect after creation
        self.assertTrue(Department.objects.filter(name='Parking').exists())
    
    def test_station_range_creation(self):
        """Test station range creation"""
        self.client.login(username='admin', password='testpass123')
        
        response = self.client.post('/scheduler/station-ranges/create/', {
            'name': 'Stations 11-20',
            'start_station': 11,
            'end_station': 20,
            'description': 'Side entrance stations'
        })
        
        self.assertEqual(response.status_code, 302)
        self.assertTrue(StationRange.objects.filter(name='Stations 11-20').exists())
    
    def test_overseer_assignment_creation(self):
        """Test overseer assignment creation"""
        self.client.login(username='admin', password='testpass123')
        
        # Set event in session
        session = self.client.session
        session['selected_event_id'] = self.event.id
        session.save()
        
        response = self.client.post('/scheduler/overseer-assignments/create/', {
            'overseer': self.overseer_user.id,
            'department': self.department.id,
            'station_range': self.station_range.id
        })
        
        self.assertEqual(response.status_code, 302)
        self.assertTrue(OverseerAssignment.objects.filter(
            overseer=self.overseer_user,
            event=self.event
        ).exists())
    
    def test_attendant_overseer_assignment(self):
        """Test attendant to overseer assignment"""
        # Create overseer assignment first
        overseer_assignment = OverseerAssignment.objects.create(
            overseer=self.overseer_user,
            event=self.event,
            department=self.department
        )
        
        self.client.login(username='admin', password='testpass123')
        
        # Set event in session
        session = self.client.session
        session['selected_event_id'] = self.event.id
        session.save()
        
        response = self.client.post('/scheduler/attendant-overseer-assignments/create/', {
            'attendant': self.attendant.id,
            'overseer_assignment': overseer_assignment.id
        })
        
        self.assertEqual(response.status_code, 302)
        self.assertTrue(AttendantOverseerAssignment.objects.filter(
            attendant=self.attendant,
            overseer_assignment=overseer_assignment
        ).exists())
    
    def test_oversight_dashboard_access(self):
        """Test oversight dashboard access and data"""
        # Create test data
        overseer_assignment = OverseerAssignment.objects.create(
            overseer=self.overseer_user,
            event=self.event,
            department=self.department,
            station_range=self.station_range
        )
        
        AttendantOverseerAssignment.objects.create(
            attendant=self.attendant,
            overseer_assignment=overseer_assignment
        )
        
        self.client.login(username='admin', password='testpass123')
        
        # Set event in session
        session = self.client.session
        session['selected_event_id'] = self.event.id
        session.save()
        
        response = self.client.get('/scheduler/oversight/')
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'John Overseer')
        self.assertContains(response, 'Security')
        self.assertContains(response, 'Stations 1-10')
    
    def test_permission_restrictions(self):
        """Test that attendant users cannot access oversight management"""
        self.client.login(username='attendant', password='testpass123')
        
        response = self.client.get('/scheduler/departments/')
        self.assertEqual(response.status_code, 302)  # Redirect due to permission denied
        
        response = self.client.post('/scheduler/departments/create/', {
            'name': 'Unauthorized Department'
        })
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Department.objects.filter(name='Unauthorized Department').exists())


class ReportsTestCase(TestCase):
    """Test advanced reporting features"""
    
    def setUp(self):
        """Set up test data"""
        self.client = Client()
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role=UserRole.OVERSEER
        )
        
        # Create test event
        self.event = Event.objects.create(
            name='Test Convention',
            event_type='regional_convention',
            start_date=timezone.now().date() + timedelta(days=30),
            end_date=timezone.now().date() + timedelta(days=32),
            location='Convention Center',
            status=EventStatus.UPCOMING
        )
        
        # Create test attendants
        self.attendants = []
        for i in range(5):
            attendant = Attendant.objects.create(
                first_name=f'Attendant{i}',
                last_name='Test',
                email=f'attendant{i}@test.com',
                phone=f'555-000{i}',
                congregation=f'Congregation {i % 2 + 1}',
                experience_level=['beginner', 'intermediate', 'experienced'][i % 3],
                serving_as=['elder', 'ministerial_servant', 'publisher'][i % 3]
            )
            attendant.events.add(self.event)
            self.attendants.append(attendant)
        
        # Create test assignments
        for i, attendant in enumerate(self.attendants):
            Assignment.objects.create(
                attendant=attendant,
                event=self.event,
                position=f'Position {i % 3 + 1}',
                shift_start=timezone.now() + timedelta(days=30, hours=8 + i),
                shift_end=timezone.now() + timedelta(days=30, hours=12 + i),
                notes=f'Test assignment {i}'
            )
    
    def test_reports_dashboard_data(self):
        """Test reports dashboard shows correct statistics"""
        self.client.login(username='testuser', password='testpass123')
        
        # Set event in session
        session = self.client.session
        session['selected_event_id'] = self.event.id
        session.save()
        
        response = self.client.get('/scheduler/reports/')
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Convention')
        
        # Check that statistics are present in context
        context = response.context
        self.assertEqual(context['stats']['total_assignments'], 5)
        self.assertEqual(context['stats']['total_attendants'], 5)
        
        # Check experience level distribution
        self.assertIn('experience_stats', context)
        self.assertIn('serving_stats', context)
        self.assertIn('duration_stats', context)
    
    def test_reports_without_selected_event(self):
        """Test reports redirect when no event selected"""
        self.client.login(username='testuser', password='testpass123')
        
        response = self.client.get('/scheduler/reports/')
        
        self.assertEqual(response.status_code, 302)  # Redirect to event selection


class PDFExportTestCase(TestCase):
    """Test PDF export functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.client = Client()
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role=UserRole.OVERSEER
        )
        
        # Create test event
        self.event = Event.objects.create(
            name='Test Assembly',
            event_type='circuit_assembly',
            start_date=timezone.now().date() + timedelta(days=30),
            end_date=timezone.now().date() + timedelta(days=32),
            location='Assembly Hall',
            status=EventStatus.UPCOMING
        )
        
        # Create test attendant and assignment
        self.attendant = Attendant.objects.create(
            first_name='John',
            last_name='Doe',
            email='john@test.com',
            phone='555-1234',
            congregation='Test Congregation',
            experience_level='experienced'
        )
        self.attendant.events.add(self.event)
        
        Assignment.objects.create(
            attendant=self.attendant,
            event=self.event,
            position='Security',
            shift_start=timezone.now() + timedelta(days=30, hours=8),
            shift_end=timezone.now() + timedelta(days=30, hours=12),
            notes='Test assignment'
        )
    
    def test_schedule_pdf_export_access(self):
        """Test schedule PDF export endpoint access"""
        self.client.login(username='testuser', password='testpass123')
        
        # Set event in session
        session = self.client.session
        session['selected_event_id'] = self.event.id
        session.save()
        
        response = self.client.get('/scheduler/export/schedule-pdf/')
        
        # Should either return PDF (200) or redirect with error message (302)
        self.assertIn(response.status_code, [200, 302])
        
        if response.status_code == 200:
            self.assertEqual(response['Content-Type'], 'application/pdf')
            self.assertIn('attachment', response['Content-Disposition'])
    
    def test_attendant_list_pdf_export_access(self):
        """Test attendant list PDF export endpoint access"""
        self.client.login(username='testuser', password='testpass123')
        
        # Set event in session
        session = self.client.session
        session['selected_event_id'] = self.event.id
        session.save()
        
        response = self.client.get('/scheduler/export/attendants-pdf/')
        
        # Should either return PDF (200) or redirect with error message (302)
        self.assertIn(response.status_code, [200, 302])
        
        if response.status_code == 200:
            self.assertEqual(response['Content-Type'], 'application/pdf')
            self.assertIn('attachment', response['Content-Disposition'])
    
    def test_pdf_export_without_event(self):
        """Test PDF export redirects when no event selected"""
        self.client.login(username='testuser', password='testpass123')
        
        response = self.client.get('/scheduler/export/schedule-pdf/')
        self.assertEqual(response.status_code, 302)  # Redirect to event selection
        
        response = self.client.get('/scheduler/export/attendants-pdf/')
        self.assertEqual(response.status_code, 302)  # Redirect to event selection


class EventScopedFunctionalityTestCase(TestCase):
    """Test event-scoped functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.client = Client()
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role=UserRole.OVERSEER
        )
        
        # Create multiple events
        self.event1 = Event.objects.create(
            name='Event 1',
            event_type='circuit_assembly',
            start_date=timezone.now().date() + timedelta(days=30),
            end_date=timezone.now().date() + timedelta(days=32),
            status=EventStatus.UPCOMING
        )
        
        self.event2 = Event.objects.create(
            name='Event 2',
            event_type='regional_convention',
            start_date=timezone.now().date() + timedelta(days=60),
            end_date=timezone.now().date() + timedelta(days=63),
            status=EventStatus.UPCOMING
        )
        
        # Create attendants for different events
        self.attendant1 = Attendant.objects.create(
            first_name='John',
            last_name='Event1',
            email='john1@test.com',
            congregation='Congregation 1'
        )
        self.attendant1.events.add(self.event1)
        
        self.attendant2 = Attendant.objects.create(
            first_name='Jane',
            last_name='Event2',
            email='jane2@test.com',
            congregation='Congregation 2'
        )
        self.attendant2.events.add(self.event2)
    
    def test_event_scoped_attendant_filtering(self):
        """Test that attendants are filtered by selected event"""
        self.client.login(username='testuser', password='testpass123')
        
        # Select event 1
        session = self.client.session
        session['selected_event_id'] = self.event1.id
        session.save()
        
        response = self.client.get('/scheduler/attendants/')
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'John Event1')
        self.assertNotContains(response, 'Jane Event2')
        
        # Switch to event 2
        session['selected_event_id'] = self.event2.id
        session.save()
        
        response = self.client.get('/scheduler/attendants/')
        
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, 'John Event1')
        self.assertContains(response, 'Jane Event2')
    
    def test_event_selection_required(self):
        """Test that views redirect when no event is selected"""
        self.client.login(username='testuser', password='testpass123')
        
        # Clear session
        session = self.client.session
        session.pop('selected_event_id', None)
        session.save()
        
        # Test various views that require event selection
        views_requiring_event = [
            '/scheduler/attendants/',
            '/scheduler/assignments/',
            '/scheduler/reports/',
            '/scheduler/oversight/'
        ]
        
        for url in views_requiring_event:
            response = self.client.get(url)
            self.assertEqual(response.status_code, 302, f"View {url} should redirect when no event selected")
