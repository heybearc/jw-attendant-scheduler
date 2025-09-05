#!/usr/bin/env python3
"""
PostgreSQL Database Setup Script for JW Attendant Scheduler
Creates database, user, and sets up proper permissions
"""

import os
import sys
import subprocess
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def run_command(command, check=True):
    """Run a shell command and return the result"""
    try:
        result = subprocess.run(command, shell=True, check=check, 
                              capture_output=True, text=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Error: {e.stderr}")
        if check:
            sys.exit(1)
        return None

def create_database_and_user():
    """Create PostgreSQL database and user"""
    
    # Database configuration
    db_config = {
        'host': '10.92.3.21',
        'port': '5432',
        'admin_user': 'postgres',
        'admin_password': 'postgres',  # Default, should be changed
        'db_name': 'jw_attendant_scheduler',
        'db_user': 'jw_attendant_user',
        'db_password': 'jw_secure_2024!'
    }
    
    try:
        # Connect to PostgreSQL as admin
        print("Connecting to PostgreSQL server...")
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['admin_user'],
            password=db_config['admin_password'],
            database='postgres'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Create database
        print(f"Creating database '{db_config['db_name']}'...")
        cursor.execute(f"""
            SELECT 1 FROM pg_database WHERE datname = '{db_config['db_name']}'
        """)
        
        if not cursor.fetchone():
            cursor.execute(f"CREATE DATABASE {db_config['db_name']}")
            print(f"✅ Database '{db_config['db_name']}' created successfully")
        else:
            print(f"ℹ️  Database '{db_config['db_name']}' already exists")
        
        # Create user
        print(f"Creating user '{db_config['db_user']}'...")
        cursor.execute(f"""
            SELECT 1 FROM pg_user WHERE usename = '{db_config['db_user']}'
        """)
        
        if not cursor.fetchone():
            cursor.execute(f"""
                CREATE USER {db_config['db_user']} 
                WITH PASSWORD '{db_config['db_password']}'
            """)
            print(f"✅ User '{db_config['db_user']}' created successfully")
        else:
            print(f"ℹ️  User '{db_config['db_user']}' already exists")
            # Update password
            cursor.execute(f"""
                ALTER USER {db_config['db_user']} 
                WITH PASSWORD '{db_config['db_password']}'
            """)
            print(f"✅ Password updated for user '{db_config['db_user']}'")
        
        # Grant privileges
        print("Granting privileges...")
        cursor.execute(f"""
            GRANT ALL PRIVILEGES ON DATABASE {db_config['db_name']} 
            TO {db_config['db_user']}
        """)
        
        # Connect to the new database to grant schema privileges
        cursor.close()
        conn.close()
        
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['admin_user'],
            password=db_config['admin_password'],
            database=db_config['db_name']
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        cursor.execute(f"""
            GRANT ALL ON SCHEMA public TO {db_config['db_user']}
        """)
        cursor.execute(f"""
            GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public 
            TO {db_config['db_user']}
        """)
        cursor.execute(f"""
            GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public 
            TO {db_config['db_user']}
        """)
        cursor.execute(f"""
            ALTER DEFAULT PRIVILEGES IN SCHEMA public 
            GRANT ALL ON TABLES TO {db_config['db_user']}
        """)
        cursor.execute(f"""
            ALTER DEFAULT PRIVILEGES IN SCHEMA public 
            GRANT ALL ON SEQUENCES TO {db_config['db_user']}
        """)
        
        print("✅ All privileges granted successfully")
        
        cursor.close()
        conn.close()
        
        # Test connection with new user
        print("Testing connection with new user...")
        test_conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['db_user'],
            password=db_config['db_password'],
            database=db_config['db_name']
        )
        test_conn.close()
        print("✅ Connection test successful")
        
        # Generate .env file
        env_content = f"""# PostgreSQL Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME={db_config['db_name']}
DB_USER={db_config['db_user']}
DB_PASSWORD={db_config['db_password']}
DB_HOST={db_config['host']}
DB_PORT={db_config['port']}

# Django Settings
DEBUG=False
SECRET_KEY=your_production_secret_key_here
ALLOWED_HOSTS=10.92.3.22,10.92.3.24,localhost,127.0.0.1

# Static Files
STATIC_ROOT=/opt/jw-attendant-staging/staticfiles/
"""
        
        with open('.env.production', 'w') as f:
            f.write(env_content)
        
        print("✅ PostgreSQL setup completed successfully!")
        print(f"📝 Database: {db_config['db_name']}")
        print(f"👤 User: {db_config['db_user']}")
        print(f"🔐 Password: {db_config['db_password']}")
        print(f"📄 Environment file created: .env.production")
        print("\nNext steps:")
        print("1. Copy .env.production to staging/production servers")
        print("2. Run Django migrations: python manage.py migrate")
        print("3. Create superuser: python manage.py createsuperuser")
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ PostgreSQL Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Setting up PostgreSQL for JW Attendant Scheduler...")
    print("=" * 50)
    
    if create_database_and_user():
        print("\n✅ Setup completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Setup failed!")
        sys.exit(1)
