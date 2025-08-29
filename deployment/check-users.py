#!/usr/bin/env python3
"""
Check user accounts and create superuser if needed
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jw_scheduler.settings')
django.setup()

from django.contrib.auth import get_user_model

def check_users():
    """Check existing users and create superuser if needed"""
    User = get_user_model()
    
    print(f"Total users: {User.objects.count()}")
    print(f"Superusers: {User.objects.filter(is_superuser=True).count()}")
    print(f"Active users: {User.objects.filter(is_active=True).count()}")
    
    # List all users
    for user in User.objects.all():
        print(f"User: {user.username} - Active: {user.is_active} - Superuser: {user.is_superuser}")
    
    # Create superuser if none exists
    if not User.objects.filter(is_superuser=True).exists():
        print("Creating superuser...")
        User.objects.create_superuser(
            username='superadmin',
            email='admin@cloudigan.net',
            password='Cloudy_92!'
        )
        print("✓ Superuser created: superadmin / Cloudy_92!")

if __name__ == '__main__':
    check_users()
