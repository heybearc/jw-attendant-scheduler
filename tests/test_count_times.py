"""
Tests for Count Times Feature
"""

from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from scheduler.models import (
    Event, EventType, EventStatus, EventPosition, 
    CountSession, PositionCount, User, UserRole
)

User = get_user_model()


class CountTimesModelTests(TestCase):
    """Test the count times models"""
    
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword',
            role=UserRole.OVERSEER
        )
        
        # Create test event
        self.event = Event.objects.create(
            name='Test Event',
            event_type=EventType.CIRCUIT_ASSEMBLY,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=1),
            status=EventStatus.CURRENT
        )
        
        # Create test positions
        self.position1 = EventPosition.objects.create(
            event=self.event,
            position_number=1,
            position_name='Main Gate'
        )
        
        self.position2 = EventPosition.objects.create(
            event=self.event,
            position_number=2,
            position_name='Parking Lot'
        )
        
        # Create test count session
        self.count_session = CountSession.objects.create(
            event=self.event,
            session_name='Morning Count',
            count_time=timezone.now()
        )
        
        # Create test position counts
        self.position_count1 = PositionCount.objects.create(
            count_session=self.count_session,
            position=self.position1,
            count=10,
            notes='Test notes'
        )
        
        self.position_count2 = PositionCount.objects.create(
            count_session=self.count_session,
            position=self.position2,
            count=20
        )
    
    def test_count_session_creation(self):
        """Test that count session is created correctly"""
        self.assertEqual(self.count_session.event, self.event)
        self.assertEqual(self.count_session.session_name, 'Morning Count')
        self.assertFalse(self.count_session.is_completed)
    
    def test_position_count_creation(self):
        """Test that position count is created correctly"""
        self.assertEqual(self.position_count1.count_session, self.count_session)
        self.assertEqual(self.position_count1.position, self.position1)
        self.assertEqual(self.position_count1.count, 10)
        self.assertEqual(self.position_count1.notes, 'Test notes')
    
    def test_calculate_total(self):
        """Test that total count is calculated correctly"""
        total = self.count_session.calculate_total()
        self.assertEqual(total, 30)
        self.assertEqual(self.count_session.total_count, 30)
    
    def test_count_session_position_relationship(self):
        """Test the relationship between count session and positions"""
        position_counts = self.count_session.position_counts.all()
        self.assertEqual(position_counts.count(), 2)
        self.assertIn(self.position_count1, position_counts)
        self.assertIn(self.position_count2, position_counts)


class CountTimesViewTests(TestCase):
    """Test the count times views"""
    
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword',
            role=UserRole.OVERSEER
        )
        
        # Create test event
        self.event = Event.objects.create(
            name='Test Event',
            event_type=EventType.CIRCUIT_ASSEMBLY,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=1),
            status=EventStatus.CURRENT
        )
        
        # Create test positions
        self.position1 = EventPosition.objects.create(
            event=self.event,
            position_number=1,
            position_name='Main Gate'
        )
        
        self.position2 = EventPosition.objects.create(
            event=self.event,
            position_number=2,
            position_name='Parking Lot'
        )
        
        # Create test count session
        self.count_session = CountSession.objects.create(
            event=self.event,
            session_name='Morning Count',
            count_time=timezone.now()
        )
        
        # Create test position counts
        self.position_count1 = PositionCount.objects.create(
            count_session=self.count_session,
            position=self.position1,
            count=10
        )
        
        self.position_count2 = PositionCount.objects.create(
            count_session=self.count_session,
            position=self.position2,
            count=20
        )
        
        # Set up client
        self.client = Client()
        self.client.login(username='testuser', password='testpassword')
    
    def test_count_entry_view(self):
        """Test the count entry view"""
        url = reverse('count_entry', args=[self.event.id, self.count_session.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'scheduler/count_entry.html')
        self.assertEqual(response.context['event'], self.event)
        self.assertEqual(response.context['count_session'], self.count_session)
        self.assertEqual(len(response.context['position_counts']), 2)
    
    def test_count_entry_view_without_session_id(self):
        """Test the count entry view without session id"""
        url = reverse('count_entry', args=[self.event.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'scheduler/count_entry.html')
        self.assertEqual(response.context['event'], self.event)
        self.assertEqual(response.context['count_session'], self.count_session)
    
    def test_count_reports_view(self):
        """Test the count reports view"""
        url = reverse('count_reports', args=[self.event.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'scheduler/count_reports.html')
        self.assertEqual(response.context['event'], self.event)
        self.assertEqual(list(response.context['count_sessions']), [self.count_session])
        self.assertEqual(response.context['total_counts'], [30])
    
    def test_create_count_session(self):
        """Test creating a count session"""
        url = reverse('create_count_session', args=[self.event.id])
        data = {
            'session_name': 'Afternoon Count',
            'count_date': timezone.now().date().strftime('%Y-%m-%d'),
            'count_time': '14:00'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200)
        
        # Check that the count session was created
        self.assertEqual(CountSession.objects.count(), 2)
        new_session = CountSession.objects.get(session_name='Afternoon Count')
        self.assertEqual(new_session.event, self.event)
        
        # Check that position counts were created for all positions
        position_counts = new_session.position_counts.all()
        self.assertEqual(position_counts.count(), 2)
    
    def test_update_count_session(self):
        """Test updating a count session"""
        url = reverse('update_count_session', args=[self.event.id, self.count_session.id])
        data = {
            'session_name': 'Updated Count',
            'count_date': timezone.now().date().strftime('%Y-%m-%d'),
            'count_time': '15:00'
        }
        
        response = self.client.put(url, data, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # Check that the count session was updated
        self.count_session.refresh_from_db()
        self.assertEqual(self.count_session.session_name, 'Updated Count')
    
    def test_delete_count_session(self):
        """Test deleting a count session"""
        url = reverse('delete_count_session', args=[self.event.id, self.count_session.id])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 200)
        
        # Check that the count session was deleted
        self.assertEqual(CountSession.objects.count(), 0)
    
    def test_count_entry_submission(self):
        """Test submitting count entry form"""
        url = reverse('count_entry', args=[self.event.id, self.count_session.id])
        data = {
            f'count_{self.position_count1.id}': '15',
            f'notes_{self.position_count1.id}': 'Updated notes',
            f'count_{self.position_count2.id}': '25',
            f'notes_{self.position_count2.id}': 'New notes'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 302)  # Redirect after successful submission
        
        # Check that the position counts were updated
        self.position_count1.refresh_from_db()
        self.position_count2.refresh_from_db()
        
        self.assertEqual(self.position_count1.count, 15)
        self.assertEqual(self.position_count1.notes, 'Updated notes')
        self.assertEqual(self.position_count2.count, 25)
        self.assertEqual(self.position_count2.notes, 'New notes')
        
        # Check that the count session total was updated
        self.count_session.refresh_from_db()
        self.assertEqual(self.count_session.total_count, 40)
    
    def test_ajax_count_entry_submission(self):
        """Test submitting count entry form via AJAX"""
        url = reverse('count_entry', args=[self.event.id, self.count_session.id])
        data = {
            f'count_{self.position_count1.id}': '15',
            f'notes_{self.position_count1.id}': 'Updated notes',
            f'count_{self.position_count2.id}': '25',
            f'notes_{self.position_count2.id}': 'New notes'
        }
        
        response = self.client.post(
            url, 
            data,
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['success'], True)
        self.assertEqual(response.json()['total_count'], 40)


class CountTimesPermissionTests(TestCase):
    """Test permissions for count times feature"""
    
    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='adminpassword',
            role=UserRole.ADMIN,
            is_admin=True
        )
        
        # Create overseer user
        self.overseer_user = User.objects.create_user(
            username='overseeruser',
            email='overseer@example.com',
            password='overseerpassword',
            role=UserRole.OVERSEER
        )
        
        # Create attendant user
        self.attendant_user = User.objects.create_user(
            username='attendantuser',
            email='attendant@example.com',
            password='attendantpassword',
            role=UserRole.ATTENDANT
        )
        
        # Create test event
        self.event = Event.objects.create(
            name='Test Event',
            event_type=EventType.CIRCUIT_ASSEMBLY,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=1),
            status=EventStatus.CURRENT
        )
        
        # Create test position
        self.position = EventPosition.objects.create(
            event=self.event,
            position_number=1,
            position_name='Main Gate'
        )
        
        # Create test count session
        self.count_session = CountSession.objects.create(
            event=self.event,
            session_name='Morning Count',
            count_time=timezone.now()
        )
        
        # Create test position count
        self.position_count = PositionCount.objects.create(
            count_session=self.count_session,
            position=self.position,
            count=10
        )
        
        # Set up clients
        self.admin_client = Client()
        self.admin_client.login(username='adminuser', password='adminpassword')
        
        self.overseer_client = Client()
        self.overseer_client.login(username='overseeruser', password='overseerpassword')
        
        self.attendant_client = Client()
        self.attendant_client.login(username='attendantuser', password='attendantpassword')
    
    def test_admin_access(self):
        """Test that admin can access count times features"""
        # Count entry view
        url = reverse('count_entry', args=[self.event.id, self.count_session.id])
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # Count reports view
        url = reverse('count_reports', args=[self.event.id])
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # Create count session
        url = reverse('create_count_session', args=[self.event.id])
        data = {
            'session_name': 'Admin Count',
            'count_date': timezone.now().date().strftime('%Y-%m-%d'),
            'count_time': '14:00'
        }
        response = self.admin_client.post(url, data)
        self.assertEqual(response.status_code, 200)
    
    def test_overseer_access(self):
        """Test that overseer can access count times features"""
        # Count entry view
        url = reverse('count_entry', args=[self.event.id, self.count_session.id])
        response = self.overseer_client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # Count reports view
        url = reverse('count_reports', args=[self.event.id])
        response = self.overseer_client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # Create count session
        url = reverse('create_count_session', args=[self.event.id])
        data = {
            'session_name': 'Overseer Count',
            'count_date': timezone.now().date().strftime('%Y-%m-%d'),
            'count_time': '14:00'
        }
        response = self.overseer_client.post(url, data)
        self.assertEqual(response.status_code, 200)
    
    def test_attendant_access(self):
        """Test that attendant cannot access count times features"""
        # Count entry view
        url = reverse('count_entry', args=[self.event.id, self.count_session.id])
        response = self.attendant_client.get(url)
        self.assertEqual(response.status_code, 302)  # Redirect to login or dashboard
        
        # Count reports view
        url = reverse('count_reports', args=[self.event.id])
        response = self.attendant_client.get(url)
        self.assertEqual(response.status_code, 302)  # Redirect to login or dashboard
        
        # Create count session
        url = reverse('create_count_session', args=[self.event.id])
        data = {
            'session_name': 'Attendant Count',
            'count_date': timezone.now().date().strftime('%Y-%m-%d'),
            'count_time': '14:00'
        }
        response = self.attendant_client.post(url, data)
        self.assertEqual(response.status_code, 302)  # Redirect to login or dashboard
