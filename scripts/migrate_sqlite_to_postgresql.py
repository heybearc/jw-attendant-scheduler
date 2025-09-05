#!/usr/bin/env python3
"""
SQLite to PostgreSQL Migration Script for JW Attendant Scheduler
Migrates data from SQLite database to PostgreSQL
"""

import os
import sys
import django
import json
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).parent.parent
sys.path.insert(0, str(project_dir))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jw_scheduler.settings')
django.setup()

from django.core.management import call_command
from django.db import connections
from django.conf import settings

def backup_sqlite_data():
    """Create a JSON backup of SQLite data"""
    print("📦 Creating backup of SQLite data...")
    
    backup_file = 'data_backup.json'
    
    try:
        # Use Django's dumpdata command to create a backup
        with open(backup_file, 'w') as f:
            call_command('dumpdata', 
                        '--natural-foreign', 
                        '--natural-primary',
                        '--exclude=contenttypes',
                        '--exclude=auth.permission',
                        '--exclude=sessions.session',
                        stdout=f)
        
        print(f"✅ Data backup created: {backup_file}")
        return backup_file
        
    except Exception as e:
        print(f"❌ Error creating backup: {e}")
        return None

def test_postgresql_connection():
    """Test PostgreSQL connection"""
    print("🔍 Testing PostgreSQL connection...")
    
    try:
        db_conn = connections['default']
        with db_conn.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"✅ PostgreSQL connection successful: {version[0]}")
            return True
            
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        return False

def migrate_to_postgresql():
    """Run Django migrations on PostgreSQL"""
    print("🔄 Running Django migrations on PostgreSQL...")
    
    try:
        # Run migrations
        call_command('migrate', '--run-syncdb')
        print("✅ Migrations completed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

def load_data_to_postgresql(backup_file):
    """Load data from backup into PostgreSQL"""
    print("📥 Loading data into PostgreSQL...")
    
    try:
        # Load data from backup
        call_command('loaddata', backup_file)
        print("✅ Data loaded successfully")
        return True
        
    except Exception as e:
        print(f"❌ Data loading failed: {e}")
        return False

def verify_migration():
    """Verify the migration was successful"""
    print("✅ Verifying migration...")
    
    try:
        from django.contrib.auth.models import User
        from scheduler.models import Event, Attendant, Assignment
        
        # Count records
        user_count = User.objects.count()
        event_count = Event.objects.count()
        attendant_count = Attendant.objects.count()
        assignment_count = Assignment.objects.count()
        
        print(f"📊 Migration verification:")
        print(f"   Users: {user_count}")
        print(f"   Events: {event_count}")
        print(f"   Attendants: {attendant_count}")
        print(f"   Assignments: {assignment_count}")
        
        if user_count > 0 or event_count > 0:
            print("✅ Migration verification successful")
            return True
        else:
            print("⚠️  No data found - this might be a fresh installation")
            return True
            
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

def main():
    """Main migration function"""
    print("🚀 Starting SQLite to PostgreSQL migration...")
    print("=" * 50)
    
    # Check if we're using PostgreSQL
    if 'postgresql' not in settings.DATABASES['default']['ENGINE']:
        print("❌ Django is not configured for PostgreSQL")
        print("Please set DB_ENGINE=django.db.backends.postgresql in your .env file")
        return False
    
    # Test PostgreSQL connection
    if not test_postgresql_connection():
        return False
    
    # Check if SQLite backup exists
    sqlite_db = project_dir / 'db.sqlite3'
    if not sqlite_db.exists():
        print("⚠️  No SQLite database found - proceeding with fresh PostgreSQL setup")
        
        # Just run migrations for fresh setup
        if migrate_to_postgresql():
            print("✅ Fresh PostgreSQL setup completed!")
            return True
        else:
            return False
    
    # Temporarily switch to SQLite to backup data
    print("📋 Switching to SQLite to backup existing data...")
    original_db_config = settings.DATABASES['default'].copy()
    
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': sqlite_db,
    }
    
    # Reconnect to SQLite
    connections.close_all()
    
    # Backup SQLite data
    backup_file = backup_sqlite_data()
    if not backup_file:
        return False
    
    # Switch back to PostgreSQL
    print("🔄 Switching back to PostgreSQL...")
    settings.DATABASES['default'] = original_db_config
    connections.close_all()
    
    # Run migrations on PostgreSQL
    if not migrate_to_postgresql():
        return False
    
    # Load data into PostgreSQL
    if not load_data_to_postgresql(backup_file):
        return False
    
    # Verify migration
    if not verify_migration():
        return False
    
    print("\n🎉 Migration completed successfully!")
    print("📝 Next steps:")
    print("1. Test the application with PostgreSQL")
    print("2. Create a superuser if needed: python manage.py createsuperuser")
    print("3. Update production/staging environments")
    print(f"4. Keep backup file safe: {backup_file}")
    
    return True

if __name__ == "__main__":
    if main():
        sys.exit(0)
    else:
        sys.exit(1)
