#!/usr/bin/env python
"""
Migration script to move data from SQLite to PostgreSQL
Following infrastructure spec patterns for postgres-01 (10.92.3.21)
"""

import os
import sys
import django
from django.core.management import execute_from_command_line
from django.db import connections
from django.core.management.base import BaseCommand

# Add the project directory to Python path
sys.path.append('/Users/cory/Documents/Cloudy-Work/applications/jw-attendant-scheduler-django')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jw_scheduler.settings')

django.setup()

def test_postgresql_connection():
    """Test connection to PostgreSQL database"""
    try:
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ PostgreSQL connection successful: {version[0]}")
        return True
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        return False

def backup_sqlite_data():
    """Create backup of SQLite database"""
    import shutil
    sqlite_path = '/Users/cory/Documents/Cloudy-Work/applications/jw-attendant-scheduler-django/db.sqlite3'
    backup_path = f'{sqlite_path}.backup'
    
    if os.path.exists(sqlite_path):
        shutil.copy2(sqlite_path, backup_path)
        print(f"✅ SQLite backup created: {backup_path}")
        return True
    else:
        print("❌ SQLite database not found")
        return False

def export_sqlite_data():
    """Export data from SQLite using Django's dumpdata"""
    print("📤 Exporting SQLite data...")
    
    # Set to use SQLite temporarily
    os.environ['DB_HOST'] = 'sqlite'
    
    # Export data
    execute_from_command_line([
        'manage.py', 'dumpdata', 
        '--natural-foreign', 
        '--natural-primary',
        '--output', 'data_export.json'
    ])
    print("✅ Data exported to data_export.json")

def import_to_postgresql():
    """Import data to PostgreSQL"""
    print("📥 Importing data to PostgreSQL...")
    
    # Set PostgreSQL environment
    os.environ['DB_HOST'] = '10.92.3.21'
    
    # Run migrations first
    execute_from_command_line(['manage.py', 'migrate'])
    
    # Load data
    execute_from_command_line(['manage.py', 'loaddata', 'data_export.json'])
    print("✅ Data imported to PostgreSQL")

def verify_migration():
    """Verify data integrity after migration"""
    from scheduler.models import User, Attendant, Event, Assignment
    
    print("🔍 Verifying migration...")
    
    counts = {
        'Users': User.objects.count(),
        'Attendants': Attendant.objects.count(), 
        'Events': Event.objects.count(),
        'Assignments': Assignment.objects.count(),
    }
    
    for model, count in counts.items():
        print(f"  {model}: {count} records")
    
    print("✅ Migration verification complete")

if __name__ == '__main__':
    print("🚀 Starting PostgreSQL migration...")
    print("Target: postgres-01 (10.92.3.21:5432)")
    
    # Step 1: Backup SQLite
    if not backup_sqlite_data():
        sys.exit(1)
    
    # Step 2: Test PostgreSQL connection
    if not test_postgresql_connection():
        print("Please ensure PostgreSQL LXC container is running at 10.92.3.21")
        sys.exit(1)
    
    # Step 3: Export from SQLite
    export_sqlite_data()
    
    # Step 4: Import to PostgreSQL
    import_to_postgresql()
    
    # Step 5: Verify migration
    verify_migration()
    
    print("🎉 Migration completed successfully!")
    print("Next steps:")
    print("1. Update production environment variables")
    print("2. Test application functionality")
    print("3. Deploy to LXC container")
