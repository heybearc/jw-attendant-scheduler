from django.core.management.base import BaseCommand
from django.utils import timezone
from scheduler.models import Event, EventStatus


class Command(BaseCommand):
    help = 'Update event statuses based on current date'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )

    def handle(self, *args, **options):
        today = timezone.now().date()
        dry_run = options['dry_run']
        
        # Find events that need status updates
        events_to_complete = Event.objects.filter(
            end_date__lt=today,
            status__in=[EventStatus.CURRENT, EventStatus.UPCOMING]
        )
        
        events_to_upcoming = Event.objects.filter(
            start_date__gt=today,
            status=EventStatus.CURRENT
        )
        
        events_to_current = Event.objects.filter(
            start_date__lte=today,
            end_date__gte=today,
            status=EventStatus.UPCOMING
        )
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes will be made'))
            
            if events_to_complete.exists():
                self.stdout.write(f'Would mark {events_to_complete.count()} events as COMPLETED:')
                for event in events_to_complete:
                    self.stdout.write(f'  - {event.name} (ended {event.end_date})')
            
            if events_to_upcoming.exists():
                self.stdout.write(f'Would mark {events_to_upcoming.count()} events as UPCOMING:')
                for event in events_to_upcoming:
                    self.stdout.write(f'  - {event.name} (starts {event.start_date})')
            
            if events_to_current.exists():
                self.stdout.write(f'Would mark {events_to_current.count()} events as CURRENT:')
                for event in events_to_current:
                    self.stdout.write(f'  - {event.name} ({event.start_date} to {event.end_date})')
                    
            if not any([events_to_complete.exists(), events_to_upcoming.exists(), events_to_current.exists()]):
                self.stdout.write(self.style.SUCCESS('All event statuses are up to date'))
        else:
            updated_count = 0
            
            # Update completed events
            completed_count = events_to_complete.update(status=EventStatus.COMPLETED)
            if completed_count > 0:
                self.stdout.write(f'Marked {completed_count} events as COMPLETED')
                updated_count += completed_count
            
            # Update upcoming events
            upcoming_count = events_to_upcoming.update(status=EventStatus.UPCOMING)
            if upcoming_count > 0:
                self.stdout.write(f'Marked {upcoming_count} events as UPCOMING')
                updated_count += upcoming_count
            
            # Update current events
            current_count = events_to_current.update(status=EventStatus.CURRENT)
            if current_count > 0:
                self.stdout.write(f'Marked {current_count} events as CURRENT')
                updated_count += current_count
            
            if updated_count == 0:
                self.stdout.write(self.style.SUCCESS('All event statuses are up to date'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Updated {updated_count} event statuses'))
