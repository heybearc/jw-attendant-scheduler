#!/usr/bin/env python
"""
Script to update existing attendant data to use the new serving_as field
This migrates data from the old jw_status field to the new serving_as JSON field
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('/Users/cory/Documents/Cloudy-Work/applications/jw-attendant-scheduler-django')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jw_scheduler.settings')
django.setup()

from scheduler.models import Attendant

def update_serving_as_data():
    """Update existing attendants to use the new serving_as field format"""
    
    # Since we removed jw_status field, we'll set default serving_as values
    # for existing attendants that don't have any serving_as data
    
    attendants_updated = 0
    
    for attendant in Attendant.objects.all():
        if not attendant.serving_as:
            # Set default to publisher if no serving positions are set
            attendant.serving_as = ['publisher']
            attendant.save()
            attendants_updated += 1
            print(f"Updated {attendant.get_full_name()} - set default serving_as to ['publisher']")
    
    print(f"\nUpdate complete! Updated {attendants_updated} attendants.")
    print("You can now manually update individual attendants through the admin interface")
    print("or the attendant forms to set their correct serving positions.")

if __name__ == '__main__':
    update_serving_as_data()
