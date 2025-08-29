#!/usr/bin/env python
"""
Bulk migration script to associate existing attendants with events.

This script helps migrate from global attendant management to event-scoped management.
Run this after adding the event ForeignKey to the Attendant model.

Usage:
    python bulk_migrate_attendants.py
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


def get_attendant_event_associations():
    """
    Analyze existing assignments to determine which attendants belong to which events.
    Returns a dictionary mapping attendant_id to most_likely_event_id.
    """
    attendant_events = {}
    
    # Get all assignments and count attendant participation per event
    assignments = Assignment.objects.select_related('attendant', 'event').all()
    
    for assignment in assignments:
        attendant_id = assignment.attendant.id
        event_id = assignment.event.id
        
        if attendant_id not in attendant_events:
            attendant_events[attendant_id] = {}
        
        if event_id not in attendant_events[attendant_id]:
            attendant_events[attendant_id][event_id] = 0
        
        attendant_events[attendant_id][event_id] += 1
    
    # For each attendant, find the event they're most associated with
    attendant_primary_event = {}
    for attendant_id, event_counts in attendant_events.items():
        # Get the event with the most assignments for this attendant
        primary_event_id = max(event_counts, key=event_counts.get)
        attendant_primary_event[attendant_id] = primary_event_id
    
    return attendant_primary_event


def migrate_attendants_to_events():
    """
    Main migration function to associate attendants with events.
    """
    print("🔄 Starting attendant-to-event migration...")
    
    # Get all attendants without event associations
    unassociated_attendants = Attendant.objects.filter(event__isnull=True)
    total_attendants = unassociated_attendants.count()
    
    if total_attendants == 0:
        print("✅ All attendants are already associated with events!")
        return
    
    print(f"📊 Found {total_attendants} attendants without event associations")
    
    # Get event associations based on assignments
    attendant_event_map = get_attendant_event_associations()
    
    # Get all events for fallback
    events = list(Event.objects.all().order_by('-start_date'))
    if not events:
        print("❌ No events found! Please create at least one event first.")
        return
    
    # Default event (most recent)
    default_event = events[0]
    print(f"📅 Default event for orphaned attendants: {default_event.name}")
    
    # Statistics
    migrated_by_assignment = 0
    migrated_to_default = 0
    
    with transaction.atomic():
        for attendant in unassociated_attendants:
            if attendant.id in attendant_event_map:
                # Associate with event based on assignment history
                event_id = attendant_event_map[attendant.id]
                try:
                    event = Event.objects.get(id=event_id)
                    attendant.event = event
                    attendant.save()
                    migrated_by_assignment += 1
                    print(f"  ✓ {attendant.get_full_name()} → {event.name} (based on assignments)")
                except Event.DoesNotExist:
                    # Fallback to default event
                    attendant.event = default_event
                    attendant.save()
                    migrated_to_default += 1
                    print(f"  ⚠ {attendant.get_full_name()} → {default_event.name} (fallback)")
            else:
                # No assignment history, use default event
                attendant.event = default_event
                attendant.save()
                migrated_to_default += 1
                print(f"  ⚠ {attendant.get_full_name()} → {default_event.name} (no assignments)")
    
    print(f"\n📈 Migration Summary:")
    print(f"  • Migrated by assignment history: {migrated_by_assignment}")
    print(f"  • Migrated to default event: {migrated_to_default}")
    print(f"  • Total migrated: {migrated_by_assignment + migrated_to_default}")
    print(f"✅ Migration completed successfully!")


def show_migration_preview():
    """
    Show what the migration would do without actually doing it.
    """
    print("🔍 Migration Preview (no changes will be made)")
    print("=" * 60)
    
    unassociated_attendants = Attendant.objects.filter(event__isnull=True)
    total_attendants = unassociated_attendants.count()
    
    if total_attendants == 0:
        print("✅ All attendants are already associated with events!")
        return
    
    print(f"📊 Found {total_attendants} attendants without event associations")
    
    attendant_event_map = get_attendant_event_associations()
    events = list(Event.objects.all().order_by('-start_date'))
    
    if not events:
        print("❌ No events found! Please create at least one event first.")
        return
    
    default_event = events[0]
    
    print(f"\nAvailable Events:")
    for i, event in enumerate(events, 1):
        print(f"  {i}. {event.name} ({event.start_date})")
    
    print(f"\nDefault event: {default_event.name}")
    print(f"\nProposed migrations:")
    
    by_assignment = 0
    to_default = 0
    
    for attendant in unassociated_attendants[:10]:  # Show first 10
        if attendant.id in attendant_event_map:
            event_id = attendant_event_map[attendant.id]
            try:
                event = Event.objects.get(id=event_id)
                print(f"  ✓ {attendant.get_full_name()} → {event.name} (based on assignments)")
                by_assignment += 1
            except Event.DoesNotExist:
                print(f"  ⚠ {attendant.get_full_name()} → {default_event.name} (fallback)")
                to_default += 1
        else:
            print(f"  ⚠ {attendant.get_full_name()} → {default_event.name} (no assignments)")
            to_default += 1
    
    if total_attendants > 10:
        print(f"  ... and {total_attendants - 10} more attendants")
    
    print(f"\nSummary:")
    print(f"  • Would migrate by assignment history: ~{by_assignment}")
    print(f"  • Would migrate to default event: ~{to_default}")


def interactive_migration():
    """
    Interactive migration with user choices.
    """
    print("🎯 Interactive Attendant Migration")
    print("=" * 50)
    
    # Show preview first
    show_migration_preview()
    
    print("\nOptions:")
    print("1. Run automatic migration")
    print("2. Show detailed preview only")
    print("3. Exit without changes")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == "1":
        confirm = input("\n⚠️  This will modify the database. Continue? (yes/no): ").strip().lower()
        if confirm in ['yes', 'y']:
            migrate_attendants_to_events()
        else:
            print("❌ Migration cancelled.")
    elif choice == "2":
        show_migration_preview()
    else:
        print("👋 Exiting without changes.")


if __name__ == "__main__":
    print("🚀 JW Attendant Scheduler - Bulk Attendant Migration")
    print("=" * 60)
    
    try:
        interactive_migration()
    except KeyboardInterrupt:
        print("\n\n❌ Migration interrupted by user.")
    except Exception as e:
        print(f"\n❌ Error during migration: {str(e)}")
        import traceback
        traceback.print_exc()
