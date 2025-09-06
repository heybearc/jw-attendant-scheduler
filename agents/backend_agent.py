#!/usr/bin/env python3
"""
Backend Agent for JW Attendant Scheduler
This agent fixes view-related issues in the staging environment.
"""

import argparse
import logging
import os
import subprocess
import sys
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("backend_agent.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class BackendAgent:
    """Backend Agent for fixing view-related issues in the staging environment."""
    
    def __init__(self, ssh_config, staging_server):
        """Initialize the Backend Agent."""
        self.ssh_config = ssh_config
        self.staging_server = staging_server
        self.app_path = "/opt/jw-attendant-staging"
        self.views_path = f"{self.app_path}/scheduler/views"
        self.fixed_issues = []
    
    def run_ssh_command(self, command):
        """Run a command on the staging server via SSH."""
        full_command = f"ssh -F {self.ssh_config} {self.staging_server} '{command}'"
        logger.info(f"Running command: {full_command}")
        
        try:
            result = subprocess.run(
                full_command,
                shell=True,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            logger.error(f"Command failed: {e}")
            logger.error(f"Error output: {e.stderr}")
            return None
    
    def check_views_structure(self):
        """Check the structure of the views module."""
        logger.info("Checking views structure...")
        
        # Check if views directory exists
        result = self.run_ssh_command(f"[ -d {self.views_path} ] && echo 'exists' || echo 'not exists'")
        
        if result and "exists" in result:
            logger.info("Views directory exists")
            
            # Check if __init__.py exists
            result = self.run_ssh_command(f"[ -f {self.views_path}/__init__.py ] && echo 'exists' || echo 'not exists'")
            
            if result and "exists" in result:
                logger.info("__init__.py exists in views directory")
            else:
                logger.warning("__init__.py does not exist in views directory")
                self.create_init_file()
        else:
            logger.warning("Views directory does not exist")
            self.create_views_structure()
    
    def create_views_structure(self):
        """Create the views directory structure."""
        logger.info("Creating views directory structure...")
        
        self.run_ssh_command(f"mkdir -p {self.views_path}")
        self.create_init_file()
        self.fixed_issues.append("Created views directory structure")
    
    def create_init_file(self):
        """Create the __init__.py file in the views directory."""
        logger.info("Creating __init__.py file...")
        
        init_content = """\"\"\"
Views package initialization
\"\"\"

from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from scheduler.models import Event, CountSession, PositionCount, EventPosition, UserRole

def home(request):
    \"\"\"Home page view - redirect to event selection for authenticated users\"\"\"
    if request.user.is_authenticated:
        # Check if user has a selected event in session
        selected_event_id = request.session.get('selected_event_id')
        if selected_event_id:
            return redirect('event_detail', event_id=selected_event_id)
        else:
            return redirect('event_list')
    else:
        return render(request, 'scheduler/home.html')

@login_required
def dashboard(request):
    \"\"\"Dashboard view - shows overview of events and assignments\"\"\"
    # Get events based on user role
    if request.user.role == 'attendant':
        # Attendants only see events they're assigned to
        try:
            attendant = request.user.attendant_profile
            if attendant:
                events = attendant.events.all().order_by('-start_date')
            else:
                events = []
        except:
            events = []
    else:
        # Admins and overseers see all events
        events = Event.objects.all().order_by('-start_date')
    
    # Get current event from session
    selected_event_id = request.session.get('selected_event_id')
    selected_event = None
    if selected_event_id:
        try:
            selected_event = Event.objects.get(id=selected_event_id)
        except Event.DoesNotExist:
            pass
    
    context = {
        'events': events,
        'selected_event': selected_event
    }
    
    return render(request, 'scheduler/dashboard.html', context)

@login_required
def event_selection(request):
    \"\"\"Event selection view - allows users to select an event\"\"\"
    events = Event.objects.all().order_by('-start_date')
    
    context = {
        'events': events
    }
    
    return render(request, 'scheduler/event_selection.html', context)

@login_required
def select_event(request, event_id):
    \"\"\"Select an event and store it in the session\"\"\"
    try:
        event = Event.objects.get(id=event_id)
        request.session['selected_event_id'] = event.id
        messages.success(request, f'Selected event: {event.name}')
        return redirect('event_detail', event_id=event.id)
    except Event.DoesNotExist:
        messages.error(request, 'Event not found')
        return redirect('event_list')

@login_required
def set_current_event(request, event_id):
    \"\"\"Set the current event in the session\"\"\"
    try:
        event = Event.objects.get(id=event_id)
        request.session['selected_event_id'] = event.id
        messages.success(request, f'Current event set to: {event.name}')
        return redirect('dashboard')
    except Event.DoesNotExist:
        messages.error(request, 'Event not found')
        return redirect('dashboard')

# Import count views
from .count_views import *
"""
        
        # Write the init file
        self.run_ssh_command(f"cat > {self.views_path}/__init__.py << 'EOF'\n{init_content}\nEOF")
        self.fixed_issues.append("Created __init__.py file in views directory")
    
    def create_count_views(self):
        """Create the count_views.py file in the views directory."""
        logger.info("Creating count_views.py file...")
        
        count_views_content = """\"\"\"
Count views for JW Attendant Scheduler
\"\"\"

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils import timezone
from scheduler.models import Event, CountSession, PositionCount, EventPosition

@login_required
def count_entry(request, event_id, session_id=None):
    \"\"\"Count entry view - allows users to enter counts for a session\"\"\"
    event = get_object_or_404(Event, id=event_id)
    if not session_id:
        count_session = event.count_sessions.order_by('-count_time').first()
        if not count_session:
            messages.warning(request, "No count sessions found. Please create a count session first.")
            return redirect('event_detail', event_id=event.id)
    else:
        count_session = get_object_or_404(CountSession, id=session_id, event=event)
    
    position_counts = []
    for position in event.positions.all().order_by('position_number'):
        try:
            position_count = PositionCount.objects.get(count_session=count_session, position=position)
        except PositionCount.DoesNotExist:
            position_count = PositionCount(count_session=count_session, position=position, count=0)
            position_count.save()
        
        position_counts.append(position_count)
    
    if request.method == 'POST':
        # Handle AJAX requests for auto-save
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            count_id = request.POST.get('count_id')
            count_value = request.POST.get('count_value')
            notes = request.POST.get('notes')
            
            try:
                position_count = PositionCount.objects.get(id=count_id)
                position_count.count = count_value
                if notes:
                    position_count.notes = notes
                position_count.save()
                return JsonResponse({'success': True})
            except PositionCount.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Count not found'})
        
        # Handle form submission
        for position_count in position_counts:
            count_key = f'count_{position_count.id}'
            notes_key = f'notes_{position_count.id}'
            
            if count_key in request.POST:
                position_count.count = request.POST.get(count_key)
            
            if notes_key in request.POST:
                position_count.notes = request.POST.get(notes_key)
            
            position_count.save()
        
        # Check if the session is complete
        if 'complete' in request.POST:
            count_session.is_complete = True
            count_session.save()
            messages.success(request, "Count session marked as complete.")
        
        messages.success(request, "Counts saved successfully.")
        return redirect('count_entry', event_id=event.id, session_id=count_session.id)
    
    context = {
        'event': event,
        'count_session': count_session,
        'position_counts': position_counts,
        'count_sessions': event.count_sessions.all().order_by('-count_time')
    }
    
    return render(request, 'scheduler/count_entry.html', context)

@login_required
def count_reports(request, event_id):
    \"\"\"Count reports view - shows reports for count sessions\"\"\"
    event = get_object_or_404(Event, id=event_id)
    count_sessions = event.count_sessions.all().order_by('-count_time')
    
    if not count_sessions:
        messages.warning(request, "No count sessions found. Please create a count session first.")
        return redirect('event_detail', event_id=event.id)
    
    # Get all positions for the event
    positions = event.positions.all().order_by('position_number')
    
    # Get counts for each position in each session
    position_data = []
    for position in positions:
        position_info = {
            'position': position,
            'counts': []
        }
        
        for session in count_sessions:
            try:
                count = PositionCount.objects.get(count_session=session, position=position)
                position_info['counts'].append(count)
            except PositionCount.DoesNotExist:
                position_info['counts'].append(None)
        
        position_data.append(position_info)
    
    # Calculate totals for each session
    session_totals = []
    for session in count_sessions:
        total = PositionCount.objects.filter(count_session=session).aggregate(total=models.Sum('count'))['total'] or 0
        session_totals.append(total)
    
    context = {
        'event': event,
        'count_sessions': count_sessions,
        'position_data': position_data,
        'session_totals': session_totals
    }
    
    return render(request, 'scheduler/count_reports.html', context)

@login_required
def create_count_session(request, event_id):
    \"\"\"Create a new count session\"\"\"
    event = get_object_or_404(Event, id=event_id)
    
    if request.method == 'POST':
        session_name = request.POST.get('session_name')
        count_time = request.POST.get('count_time')
        
        if not session_name or not count_time:
            messages.error(request, "Please provide both session name and count time.")
            return redirect('event_detail', event_id=event.id)
        
        count_session = CountSession(
            event=event,
            session_name=session_name,
            count_time=count_time
        )
        count_session.save()
        
        messages.success(request, f"Count session '{session_name}' created successfully.")
        return redirect('count_entry', event_id=event.id, session_id=count_session.id)
    
    context = {
        'event': event
    }
    
    return render(request, 'scheduler/count_session_form.html', context)

@login_required
def update_count_session(request, event_id, session_id):
    \"\"\"Update an existing count session\"\"\"
    event = get_object_or_404(Event, id=event_id)
    count_session = get_object_or_404(CountSession, id=session_id, event=event)
    
    if request.method == 'POST':
        session_name = request.POST.get('session_name')
        count_time = request.POST.get('count_time')
        
        if not session_name or not count_time:
            messages.error(request, "Please provide both session name and count time.")
            return redirect('event_detail', event_id=event.id)
        
        count_session.session_name = session_name
        count_session.count_time = count_time
        count_session.save()
        
        messages.success(request, f"Count session '{session_name}' updated successfully.")
        return redirect('count_entry', event_id=event.id, session_id=count_session.id)
    
    context = {
        'event': event,
        'count_session': count_session,
        'is_update': True
    }
    
    return render(request, 'scheduler/count_session_form.html', context)

@login_required
def delete_count_session(request, event_id, session_id):
    \"\"\"Delete a count session\"\"\"
    event = get_object_or_404(Event, id=event_id)
    count_session = get_object_or_404(CountSession, id=session_id, event=event)
    
    if request.method == 'POST':
        session_name = count_session.session_name
        count_session.delete()
        messages.success(request, f"Count session '{session_name}' deleted successfully.")
    
    return redirect('event_detail', event_id=event.id)
"""
        
        # Write the count_views file
        self.run_ssh_command(f"cat > {self.views_path}/count_views.py << 'EOF'\n{count_views_content}\nEOF")
        self.fixed_issues.append("Created count_views.py file in views directory")
    
    def update_main_views_file(self):
        """Update the main views.py file to import from the views package."""
        logger.info("Updating main views.py file...")
        
        views_content = """# Import views from the views package
from scheduler.views import *
"""
        
        # Write the views file
        self.run_ssh_command(f"cat > {self.app_path}/scheduler/views.py << 'EOF'\n{views_content}\nEOF")
        self.fixed_issues.append("Updated main views.py file")
    
    def fix_url_patterns(self):
        """Fix URL patterns for count times feature."""
        logger.info("Fixing URL patterns...")
        
        # Check if the URL patterns already include count times
        result = self.run_ssh_command(f"grep -n 'count_entry' {self.app_path}/scheduler/urls.py")
        
        if result:
            logger.info("Count times URL patterns already exist")
        else:
            logger.info("Adding count times URL patterns...")
            
            url_patterns = """
# Count Times Feature URLs
path('events/<int:event_id>/counts/', views.count_entry, name='count_entry'),
path('events/<int:event_id>/counts/<int:session_id>/', views.count_entry, name='count_entry'),
path('events/<int:event_id>/count-reports/', views.count_reports, name='count_reports'),
path('events/<int:event_id>/count-sessions/', views.create_count_session, name='create_count_session'),
path('events/<int:event_id>/count-sessions/<int:session_id>/update/', views.update_count_session, name='update_count_session'),
path('events/<int:event_id>/count-sessions/<int:session_id>/delete/', views.delete_count_session, name='delete_count_session'),
"""
            
            # Add the URL patterns to the urls.py file
            self.run_ssh_command(f"cat >> {self.app_path}/scheduler/urls.py << 'EOF'\n{url_patterns}\nEOF")
            self.fixed_issues.append("Added count times URL patterns")
    
    def restart_service(self):
        """Restart the staging service."""
        logger.info("Restarting staging service...")
        
        self.run_ssh_command("systemctl restart jw-attendant-staging")
        self.fixed_issues.append("Restarted staging service")
    
    def fix_all_issues(self):
        """Fix all view-related issues."""
        logger.info("Fixing all view-related issues...")
        
        self.check_views_structure()
        self.create_count_views()
        self.update_main_views_file()
        self.fix_url_patterns()
        self.restart_service()
        
        logger.info("Fixed issues:")
        for issue in self.fixed_issues:
            logger.info(f"- {issue}")

def main():
    """Main function to run the Backend Agent."""
    parser = argparse.ArgumentParser(description="Backend Agent for fixing view-related issues")
    parser.add_argument("--ssh-config", required=True, help="Path to SSH config file")
    parser.add_argument("--staging-server", required=True, help="Name of staging server in SSH config")
    
    args = parser.parse_args()
    
    agent = BackendAgent(args.ssh_config, args.staging_server)
    agent.fix_all_issues()

if __name__ == "__main__":
    main()
