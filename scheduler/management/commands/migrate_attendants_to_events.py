"""
Django management command to migrate attendants to event-scoped model.
Usage: python manage.py migrate_attendants_to_events
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from scheduler.models import Attendant, Event, Assignment


class Command(BaseCommand):
    help = 'Migrate existing attendants to be associated with events based on their assignment history'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without making changes',
        )
        parser.add_argument(
            '--default-event-id',
            type=int,
            help='ID of event to use as default for attendants with no assignments',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting attendant-to-event migration...')
        )

        # Get unassociated attendants
        unassociated = Attendant.objects.filter(event__isnull=True)
        total = unassociated.count()

        if total == 0:
            self.stdout.write(
                self.style.SUCCESS('All attendants already have event associations!')
            )
            return

        self.stdout.write(f'Found {total} attendants without event associations')

        # Get assignment-based associations
        attendant_events = self._get_attendant_event_map()
        
        # Get default event
        default_event = self._get_default_event(options.get('default_event_id'))
        if not default_event:
            self.stdout.write(
                self.style.ERROR('No events found! Create at least one event first.')
            )
            return

        self.stdout.write(f'Default event: {default_event.name}')

        if options['dry_run']:
            self._show_preview(unassociated, attendant_events, default_event)
        else:
            self._perform_migration(unassociated, attendant_events, default_event)

    def _get_attendant_event_map(self):
        """Get mapping of attendant to their most associated event."""
        attendant_events = {}
        
        assignments = Assignment.objects.select_related('attendant', 'event').all()
        
        for assignment in assignments:
            attendant_id = assignment.attendant.id
            event_id = assignment.event.id
            
            if attendant_id not in attendant_events:
                attendant_events[attendant_id] = {}
            
            attendant_events[attendant_id][event_id] = attendant_events[attendant_id].get(event_id, 0) + 1
        
        # Get primary event for each attendant
        primary_events = {}
        for attendant_id, event_counts in attendant_events.items():
            primary_event_id = max(event_counts, key=event_counts.get)
            primary_events[attendant_id] = primary_event_id
        
        return primary_events

    def _get_default_event(self, event_id=None):
        """Get the default event to use for attendants without assignments."""
        if event_id:
            try:
                return Event.objects.get(id=event_id)
            except Event.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'Event with ID {event_id} not found, using most recent')
                )
        
        return Event.objects.order_by('-start_date').first()

    def _show_preview(self, attendants, attendant_event_map, default_event):
        """Show preview of what would be migrated."""
        self.stdout.write('\n--- PREVIEW MODE (no changes will be made) ---')
        
        by_assignment = 0
        to_default = 0
        
        for attendant in attendants[:20]:  # Show first 20
            if attendant.id in attendant_event_map:
                event_id = attendant_event_map[attendant.id]
                try:
                    event = Event.objects.get(id=event_id)
                    self.stdout.write(f'  ✓ {attendant.get_full_name()} → {event.name}')
                    by_assignment += 1
                except Event.DoesNotExist:
                    self.stdout.write(f'  ⚠ {attendant.get_full_name()} → {default_event.name} (fallback)')
                    to_default += 1
            else:
                self.stdout.write(f'  ⚠ {attendant.get_full_name()} → {default_event.name} (no assignments)')
                to_default += 1
        
        if attendants.count() > 20:
            self.stdout.write(f'  ... and {attendants.count() - 20} more')
        
        self.stdout.write(f'\nSummary:')
        self.stdout.write(f'  By assignment history: ~{by_assignment}')
        self.stdout.write(f'  To default event: ~{to_default}')

    def _perform_migration(self, attendants, attendant_event_map, default_event):
        """Perform the actual migration."""
        migrated_by_assignment = 0
        migrated_to_default = 0
        
        with transaction.atomic():
            for attendant in attendants:
                if attendant.id in attendant_event_map:
                    event_id = attendant_event_map[attendant.id]
                    try:
                        event = Event.objects.get(id=event_id)
                        attendant.event = event
                        attendant.save()
                        migrated_by_assignment += 1
                        self.stdout.write(f'  ✓ {attendant.get_full_name()} → {event.name}')
                    except Event.DoesNotExist:
                        attendant.event = default_event
                        attendant.save()
                        migrated_to_default += 1
                        self.stdout.write(f'  ⚠ {attendant.get_full_name()} → {default_event.name} (fallback)')
                else:
                    attendant.event = default_event
                    attendant.save()
                    migrated_to_default += 1
                    self.stdout.write(f'  ⚠ {attendant.get_full_name()} → {default_event.name} (no assignments)')
        
        self.stdout.write(
            self.style.SUCCESS(f'\nMigration completed!')
        )
        self.stdout.write(f'  By assignment history: {migrated_by_assignment}')
        self.stdout.write(f'  To default event: {migrated_to_default}')
        self.stdout.write(f'  Total: {migrated_by_assignment + migrated_to_default}')
