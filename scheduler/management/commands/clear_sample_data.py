from django.core.management.base import BaseCommand
from django.db import transaction
from scheduler.models import (
    User, Attendant, Event, Assignment, Department, 
    StationRange, OverseerAssignment, AttendantOverseerAssignment
)


class Command(BaseCommand):
    help = 'Clear all sample data from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of all sample data',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'This will delete ALL data from the database. '
                    'Use --confirm to proceed.'
                )
            )
            return

        self.stdout.write('Starting data cleanup...')

        with transaction.atomic():
            # Delete in reverse order of dependencies
            deleted_counts = {}
            
            # Delete assignments first (they reference attendants and events)
            count = Assignment.objects.count()
            Assignment.objects.all().delete()
            deleted_counts['Assignments'] = count
            
            # Delete overseer assignments
            count = OverseerAssignment.objects.count()
            OverseerAssignment.objects.all().delete()
            deleted_counts['Overseer Assignments'] = count
            
            count = AttendantOverseerAssignment.objects.count()
            AttendantOverseerAssignment.objects.all().delete()
            deleted_counts['Attendant Overseer Assignments'] = count
            
            # Delete attendants
            count = Attendant.objects.count()
            Attendant.objects.all().delete()
            deleted_counts['Attendants'] = count
            
            # Delete events
            count = Event.objects.count()
            Event.objects.all().delete()
            deleted_counts['Events'] = count
            
            # Delete departments
            count = Department.objects.count()
            Department.objects.all().delete()
            deleted_counts['Departments'] = count
            
            # Delete station ranges
            count = StationRange.objects.count()
            StationRange.objects.all().delete()
            deleted_counts['Station Ranges'] = count
            
            # Delete non-admin users (keep superusers)
            count = User.objects.filter(is_superuser=False).count()
            User.objects.filter(is_superuser=False).delete()
            deleted_counts['Users (non-admin)'] = count

        self.stdout.write(
            self.style.SUCCESS('Successfully cleared sample data:')
        )
        
        for model, count in deleted_counts.items():
            self.stdout.write(f'  - {model}: {count} deleted')
        
        self.stdout.write(
            self.style.SUCCESS('Database cleanup complete!')
        )
