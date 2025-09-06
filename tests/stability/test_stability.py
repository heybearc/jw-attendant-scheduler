"""
Stability tests for the JW Attendant Scheduler application.
These tests verify the application's stability under various conditions.
"""

import time
import unittest
import requests
import threading
import random
from concurrent.futures import ThreadPoolExecutor
from django.test import LiveServerTestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.db import connection
from django.conf import settings
from django.core.management import call_command

from scheduler.models import (
    Event, EventType, EventStatus, EventPosition, 
    CountSession, PositionCount, User, UserRole,
    Attendant, Assignment, Shift
)

User = get_user_model()


class StabilityBaseTestCase(LiveServerTestCase):
    """Base class for stability tests with common setup."""
    
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create test users with different roles
        cls.admin_user = User.objects.create_user(
            username='admin_user',
            email='admin@example.com',
            password='adminpassword',
            role=UserRole.ADMIN,
            is_admin=True
        )
        
        cls.overseer_user = User.objects.create_user(
            username='overseer_user',
            email='overseer@example.com',
            password='overseerpassword',
            role=UserRole.OVERSEER
        )
        
        cls.attendant_user = User.objects.create_user(
            username='attendant_user',
            email='attendant@example.com',
            password='attendantpassword',
            role=UserRole.ATTENDANT
        )
        
        # Create test events
        cls.event1 = Event.objects.create(
            name='Test Event 1',
            event_type=EventType.CIRCUIT_ASSEMBLY,
            start_date='2025-10-01',
            end_date='2025-10-02',
            status=EventStatus.CURRENT
        )
        
        cls.event2 = Event.objects.create(
            name='Test Event 2',
            event_type=EventType.REGIONAL_CONVENTION,
            start_date='2025-11-01',
            end_date='2025-11-03',
            status=EventStatus.UPCOMING
        )
        
        # Create test positions
        for i in range(1, 21):
            EventPosition.objects.create(
                event=cls.event1,
                position_number=i,
                position_name=f'Position {i}'
            )
            
            EventPosition.objects.create(
                event=cls.event2,
                position_number=i,
                position_name=f'Position {i}'
            )
        
        # Create test attendants
        for i in range(1, 51):
            Attendant.objects.create(
                first_name=f'First{i}',
                last_name=f'Last{i}',
                email=f'attendant{i}@example.com',
                phone=f'555-555-{i:04d}',
                is_active=True
            )
        
        # Create test count sessions
        cls.count_session1 = CountSession.objects.create(
            event=cls.event1,
            session_name='Morning Count',
            count_time='2025-10-01 09:00:00'
        )
        
        cls.count_session2 = CountSession.objects.create(
            event=cls.event1,
            session_name='Afternoon Count',
            count_time='2025-10-01 14:00:00'
        )
        
        # Create position counts
        for position in cls.event1.positions.all():
            PositionCount.objects.create(
                count_session=cls.count_session1,
                position=position,
                count=random.randint(5, 20)
            )
            
            PositionCount.objects.create(
                count_session=cls.count_session2,
                position=position,
                count=random.randint(5, 20)
            )
        
        # Set up clients
        cls.admin_client = Client()
        cls.admin_client.login(username='admin_user', password='adminpassword')
        
        cls.overseer_client = Client()
        cls.overseer_client.login(username='overseer_user', password='overseerpassword')
        
        cls.attendant_client = Client()
        cls.attendant_client.login(username='attendant_user', password='attendantpassword')
    
    @classmethod
    def tearDownClass(cls):
        # Clean up test data
        User.objects.all().delete()
        Event.objects.all().delete()
        Attendant.objects.all().delete()
        super().tearDownClass()


class ConcurrentRequestsTestCase(StabilityBaseTestCase):
    """Test the application's stability under concurrent requests."""
    
    def test_concurrent_read_requests(self):
        """Test concurrent read requests to various endpoints."""
        urls = [
            reverse('event_list'),
            reverse('event_detail', args=[self.event1.id]),
            reverse('attendant_list'),
            reverse('count_entry', args=[self.event1.id, self.count_session1.id]),
            reverse('count_reports', args=[self.event1.id]),
        ]
        
        num_requests = 50
        max_workers = 10
        
        def make_request(url):
            response = self.admin_client.get(url)
            return response.status_code
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(make_request, random.choice(urls)) for _ in range(num_requests)]
            results = [future.result() for future in futures]
        
        # All requests should return 200 OK
        self.assertEqual(results.count(200), num_requests)
    
    def test_concurrent_write_requests(self):
        """Test concurrent write requests to various endpoints."""
        # Create test data for concurrent writes
        positions = list(self.event1.positions.all())
        attendants = list(Attendant.objects.all()[:20])
        
        def create_assignment():
            position = random.choice(positions)
            attendant = random.choice(attendants)
            data = {
                'event': self.event1.id,
                'position': position.id,
                'attendant': attendant.id,
                'date': '2025-10-01',
                'start_time': '09:00',
                'end_time': '12:00',
                'notes': f'Test assignment {time.time()}'
            }
            response = self.admin_client.post(reverse('assignment_create'), data)
            return response.status_code
        
        num_requests = 20
        max_workers = 5
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(create_assignment) for _ in range(num_requests)]
            results = [future.result() for future in futures]
        
        # Check if assignments were created
        self.assertGreater(Assignment.objects.filter(event=self.event1).count(), 0)
    
    def test_mixed_read_write_requests(self):
        """Test mixed read and write requests to various endpoints."""
        read_urls = [
            reverse('event_list'),
            reverse('event_detail', args=[self.event1.id]),
            reverse('attendant_list'),
            reverse('count_entry', args=[self.event1.id, self.count_session1.id]),
            reverse('count_reports', args=[self.event1.id]),
        ]
        
        def random_request():
            # 80% read, 20% write
            if random.random() < 0.8:
                url = random.choice(read_urls)
                response = self.admin_client.get(url)
            else:
                # Create a count entry
                position_count = random.choice(PositionCount.objects.filter(count_session=self.count_session1))
                data = {
                    f'count_{position_count.id}': random.randint(5, 30),
                    f'notes_{position_count.id}': f'Updated at {time.time()}'
                }
                response = self.admin_client.post(
                    reverse('count_entry', args=[self.event1.id, self.count_session1.id]),
                    data
                )
            return response.status_code
        
        num_requests = 50
        max_workers = 10
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(random_request) for _ in range(num_requests)]
            results = [future.result() for future in futures]
        
        # Check if all requests were successful (200 OK or 302 Found)
        for status_code in results:
            self.assertIn(status_code, [200, 302])


class DatabaseStabilityTestCase(StabilityBaseTestCase):
    """Test the database stability under various conditions."""
    
    def test_connection_pooling(self):
        """Test database connection pooling under load."""
        def db_operation():
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
            return result
        
        num_operations = 100
        max_workers = 20
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(db_operation) for _ in range(num_operations)]
            results = [future.result() for future in futures]
        
        # All operations should return (1,)
        self.assertEqual(results.count((1,)), num_operations)
    
    def test_transaction_isolation(self):
        """Test transaction isolation under concurrent writes."""
        def update_count():
            position_count = random.choice(PositionCount.objects.filter(count_session=self.count_session1))
            original_count = position_count.count
            new_count = original_count + 1
            position_count.count = new_count
            position_count.save()
            return position_count.id, new_count
        
        num_operations = 20
        max_workers = 5
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(update_count) for _ in range(num_operations)]
            results = [future.result() for future in futures]
        
        # Verify each position count was updated correctly
        for position_id, expected_count in results:
            position_count = PositionCount.objects.get(id=position_id)
            self.assertEqual(position_count.count, expected_count)
    
    def test_database_recovery(self):
        """Test database recovery after simulated errors."""
        # Simulate a transaction that fails
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM nonexistent_table")
        except Exception:
            pass
        
        # Verify database is still operational
        count = Event.objects.count()
        self.assertGreaterEqual(count, 2)


class MemoryLeakTestCase(StabilityBaseTestCase):
    """Test for memory leaks during extended operation."""
    
    def test_repeated_operations(self):
        """Test repeated operations to check for memory leaks."""
        import resource
        
        # Get initial memory usage
        initial_memory = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        
        # Perform repeated operations
        for _ in range(100):
            response = self.admin_client.get(reverse('event_list'))
            self.assertEqual(response.status_code, 200)
            
            response = self.admin_client.get(reverse('event_detail', args=[self.event1.id]))
            self.assertEqual(response.status_code, 200)
            
            response = self.admin_client.get(reverse('count_reports', args=[self.event1.id]))
            self.assertEqual(response.status_code, 200)
        
        # Get final memory usage
        final_memory = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        
        # Check for significant memory increase (more than 50%)
        memory_increase_percent = ((final_memory - initial_memory) / initial_memory) * 100
        self.assertLess(memory_increase_percent, 50, 
                       f"Memory usage increased by {memory_increase_percent:.2f}% after repeated operations")


class ErrorHandlingTestCase(StabilityBaseTestCase):
    """Test the application's error handling capabilities."""
    
    def test_404_handling(self):
        """Test handling of 404 Not Found errors."""
        response = self.admin_client.get('/nonexistent-url/')
        self.assertEqual(response.status_code, 404)
        self.assertTemplateUsed(response, '404.html')
    
    def test_500_handling(self):
        """Test handling of 500 Internal Server Error."""
        # Create a view that will raise an exception
        def error_view(request):
            raise Exception("Test exception")
        
        from django.urls import path
        from django.conf.urls import handler500
        
        # Add the error view to the URLconf
        from django.urls import include, path
        
        urlpatterns = [
            path('error-test/', error_view),
        ]
        
        # Make a request to the error view
        with self.settings(DEBUG=False):
            response = self.client.get('/error-test/')
            self.assertEqual(response.status_code, 500)
            self.assertTemplateUsed(response, '500.html')
    
    def test_csrf_handling(self):
        """Test handling of CSRF errors."""
        from django.views.decorators.csrf import csrf_exempt
        
        @csrf_exempt
        def exempt_view(request):
            return HttpResponse("CSRF exempt view")
        
        # Add the exempt view to the URLconf
        urlpatterns = [
            path('csrf-exempt/', exempt_view),
        ]
        
        # Make a POST request without CSRF token
        response = self.client.post('/csrf-exempt/')
        self.assertEqual(response.status_code, 200)


class LoadTestCase(unittest.TestCase):
    """Test the application's behavior under load."""
    
    def setUp(self):
        self.base_url = 'http://localhost:8001'  # Staging server URL
    
    def test_load_homepage(self):
        """Test loading the homepage under load."""
        def load_homepage():
            try:
                response = requests.get(f"{self.base_url}/")
                return response.status_code
            except requests.RequestException:
                return None
        
        num_requests = 100
        max_workers = 20
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(load_homepage) for _ in range(num_requests)]
            results = [future.result() for future in futures]
        
        # Count successful responses
        successful = results.count(200)
        success_rate = (successful / num_requests) * 100
        
        print(f"Load test results: {successful} successful out of {num_requests} requests ({success_rate:.2f}%)")
        
        # Success rate should be at least 95%
        self.assertGreaterEqual(success_rate, 95)


class EnduranceTestCase(unittest.TestCase):
    """Test the application's behavior over an extended period."""
    
    def setUp(self):
        self.base_url = 'http://localhost:8001'  # Staging server URL
    
    def test_endurance(self):
        """Test the application's behavior over an extended period."""
        def make_request():
            try:
                response = requests.get(f"{self.base_url}/")
                return response.status_code
            except requests.RequestException:
                return None
        
        duration_seconds = 60  # Run for 1 minute
        interval_seconds = 1  # Make a request every second
        
        start_time = time.time()
        end_time = start_time + duration_seconds
        
        results = []
        
        while time.time() < end_time:
            results.append(make_request())
            time.sleep(interval_seconds)
        
        # Count successful responses
        successful = results.count(200)
        total_requests = len(results)
        success_rate = (successful / total_requests) * 100
        
        print(f"Endurance test results: {successful} successful out of {total_requests} requests ({success_rate:.2f}%)")
        
        # Success rate should be at least 95%
        self.assertGreaterEqual(success_rate, 95)


if __name__ == '__main__':
    unittest.main()
