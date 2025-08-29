#!/usr/bin/env python
"""
Migration script to associate existing attendants with events using many-to-many relationship.

This script migrates from the old single event association to the new many-to-many events field.
Run this after the database migration has been applied.

Usage:
    python migrate_to_m2m_events.py
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jw_scheduler.settings')
django.setup()

from django.db import transaction
from scheduler.models import Attendant, Event, Assignment
from django.contrib.auth.models import User


def migrate_attendants_to_m2m_events():
    """
    Migrate attendants to use many-to-many event relationships.
    Associates attendants with events based on their assignment history.
    """
    print("🔄 Starting many-to-many event association migration...")
    
    # Get all attendants
    all_attendants = Attendant.objects.all()
    total_attendants = all_attendants.count()
    
    if total_attendants == 0:
        print("✅ No attendants found!")
        return
    
    print(f"📊 Found {total_attendants} attendants to process")
    
    # Get all events for fallback
    events = list(Event.objects.all().order_by('-start_date'))
    if not events:
        print("❌ No events found! Please create at least one event first.")
        return
    
    # Default event (most recent)
    default_event = events[0]
    print(f"📅 Default event for attendants without assignments: {default_event.name}")
    
    # Statistics
    attendants_with_assignments = 0
    attendants_without_assignments = 0
    total_associations_created = 0
    
    with transaction.atomic():
        for attendant in all_attendants:
            # Get all assignments for this attendant
            assignments = Assignment.objects.filter(attendant=attendant)
            
            if assignments.exists():
                # Associate with all events where attendant has assignments
                event_ids = assignments.values_list('event_id', flat=True).distinct()
                events_for_attendant = Event.objects.filter(id__in=event_ids)
                
                for event in events_for_attendant:
                    attendant.events.add(event)
                    total_associations_created += 1
                
                attendants_with_assignments += 1
                assignment_count = assignments.count()
                event_count = events_for_attendant.count()
                print(f"  ✓ {attendant.get_full_name()} → {event_count} events ({assignment_count} assignments)")
            else:
                # No assignments, associate with default event
                attendant.events.add(default_event)
                total_associations_created += 1
                attendants_without_assignments += 1
                print(f"  ⚠ {attendant.get_full_name()} → {default_event.name} (no assignments)")
    
    print(f"\n📈 Migration Summary:")
    print(f"  • Attendants with assignments: {attendants_with_assignments}")
    print(f"  • Attendants without assignments: {attendants_without_assignments}")
    print(f"  • Total event associations created: {total_associations_created}")
    print(f"✅ Migration completed successfully!")


def show_migration_preview():
    """
    Show what the migration would do without actually doing it.
    """
    print("🔍 Migration Preview (no changes will be made)")
    print("=" * 60)
    
    all_attendants = Attendant.objects.all()
    total_attendants = all_attendants.count()
    
    if total_attendants == 0:
        print("✅ No attendants found!")
        return
    
    print(f"📊 Found {total_attendants} attendants to process")
    
    events = list(Event.objects.all().order_by('-start_date'))
    if not events:
        print("❌ No events found! Please create at least one event first.")
        return
    
    default_event = events[0]
    
    print(f"\nAvailable Events:")
    for i, event in enumerate(events, 1):
        print(f"  {i}. {event.name} ({event.start_date})")
    
    print(f"\nDefault event: {default_event.name}")
    print(f"\nProposed associations:")
    
    with_assignments = 0
    without_assignments = 0
    total_associations = 0
    
    for attendant in all_attendants[:20]:  # Show first 20
        assignments = Assignment.objects.filter(attendant=attendant)
        
        if assignments.exists():
            event_ids = assignments.values_list('event_id', flat=True).distinct()
            events_for_attendant = Event.objects.filter(id__in=event_ids)
            event_names = [e.name for e in events_for_attendant]
            
            print(f"  ✓ {attendant.get_full_name()} → {', '.join(event_names)}")
            with_assignments += 1
            total_associations += len(event_names)
        else:
            print(f"  ⚠ {attendant.get_full_name()} → {default_event.name} (no assignments)")
            without_assignments += 1
            total_associations += 1
    
    if total_attendants > 20:
        print(f"  ... and {total_attendants - 20} more attendants")
    
    print(f"\nSummary:")
    print(f"  • Would associate attendants with assignments: ~{with_assignments}")
    print(f"  • Would associate attendants to default event: ~{without_assignments}")
    print(f"  • Total associations to create: ~{total_associations}")


def interactive_migration():
    """
    Interactive migration with user choices.
    """
    print("🎯 Many-to-Many Event Association Migration")
    print("=" * 50)
    
    # Show preview first
    show_migration_preview()
    
    print("\nOptions:")
    print("1. Run migration")
    print("2. Show detailed preview only")
    print("3. Exit without changes")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == "1":
        confirm = input("\n⚠️  This will modify the database. Continue? (yes/no): ").strip().lower()
        if confirm in ['yes', 'y']:
            migrate_attendants_to_m2m_events()
        else:
            print("❌ Migration cancelled.")
    elif choice == "2":
        show_migration_preview()
    else:
        print("👋 Exiting without changes.")


if __name__ == "__main__":
    print("🚀 JW Attendant Scheduler - Many-to-Many Event Association Migration")
    print("=" * 70)
    
    try:
        interactive_migration()
    except KeyboardInterrupt:
        print("\n\n❌ Migration interrupted by user.")
    except Exception as e:
        print(f"\n❌ Error during migration: {str(e)}")
        import traceback
        traceback.print_exc()
