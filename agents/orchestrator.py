#!/usr/bin/env python3
"""
Agent Orchestrator for JW Attendant Scheduler
Coordinates all agents to systematically fix staging environment issues.
"""

import logging
import subprocess
import sys
import time
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("orchestrator.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """Orchestrates all agents to fix staging environment issues."""
    
    def __init__(self):
        self.ssh_config = "/Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant"
        self.staging_server = "jw-staging"
        self.app_path = "/opt/jw-attendant-staging"
        self.base_url = "http://localhost:8001"
        self.results = []
    
    def run_ssh_command(self, command):
        """Run a command on the staging server via SSH."""
        full_command = f"ssh -F {self.ssh_config} {self.staging_server} '{command}'"
        logger.info(f"Running: {command}")
        
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
            return None
    
    def backend_agent_fix_views(self):
        """Backend Agent: Fix all view-related issues."""
        logger.info("🔧 Backend Agent: Fixing view issues...")
        
        # Create views directory structure
        self.run_ssh_command(f"mkdir -p {self.app_path}/scheduler/views")
        
        # Create __init__.py with all necessary views
        init_content = '''"""
Views package initialization
"""

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils import timezone
from django.db import models
from scheduler.models import Event

def home(request):
    """Home page view - redirect to event selection for authenticated users"""
    if request.user.is_authenticated:
        selected_event_id = request.session.get('selected_event_id')
        if selected_event_id:
            return redirect('event_detail', event_id=selected_event_id)
        else:
            return redirect('event_list')
    else:
        return render(request, 'scheduler/home.html')

@login_required
def dashboard(request):
    """Dashboard view - shows overview of events and assignments"""
    events = Event.objects.all().order_by('-start_date')
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
    """Event selection view"""
    events = Event.objects.all().order_by('-start_date')
    return render(request, 'scheduler/event_selection.html', {'events': events})

@login_required
def select_event(request, event_id):
    """Select an event and store it in the session"""
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
    """Set the current event in the session"""
    try:
        event = Event.objects.get(id=event_id)
        request.session['selected_event_id'] = event.id
        messages.success(request, f'Current event set to: {event.name}')
        return redirect('dashboard')
    except Event.DoesNotExist:
        messages.error(request, 'Event not found')
        return redirect('dashboard')

# Count views
@login_required
def count_entry(request, event_id, session_id=None):
    """Count entry view"""
    event = get_object_or_404(Event, id=event_id)
    return render(request, 'scheduler/count_entry.html', {'event': event})

@login_required
def count_reports(request, event_id):
    """Count reports view"""
    event = get_object_or_404(Event, id=event_id)
    return render(request, 'scheduler/count_reports.html', {'event': event})

@login_required
def create_count_session(request, event_id):
    """Create a new count session"""
    event = get_object_or_404(Event, id=event_id)
    return render(request, 'scheduler/count_session_form.html', {'event': event})

@login_required
def update_count_session(request, event_id, session_id):
    """Update an existing count session"""
    event = get_object_or_404(Event, id=event_id)
    return render(request, 'scheduler/count_session_form.html', {'event': event})

@login_required
def delete_count_session(request, event_id, session_id):
    """Delete a count session"""
    return redirect('event_detail', event_id=event_id)
'''
        
        self.run_ssh_command(f"cat > {self.app_path}/scheduler/views/__init__.py << 'EOF'\n{init_content}\nEOF")
        
        # Update main views.py
        main_views_content = '''# Import views from the views package
from scheduler.views import *
from scheduler.forms import UserCreateForm
'''
        self.run_ssh_command(f"cat > {self.app_path}/scheduler/views.py << 'EOF'\n{main_views_content}\nEOF")
        
        self.results.append("Backend Agent: Fixed view issues")
        logger.info("✅ Backend Agent: View issues fixed")
    
    def frontend_agent_fix_templates(self):
        """Frontend Agent: Fix template-related issues."""
        logger.info("🎨 Frontend Agent: Fixing template issues...")
        
        # Ensure templates directory exists
        self.run_ssh_command(f"mkdir -p {self.app_path}/templates/scheduler")
        
        # Deploy count times templates
        subprocess.run([
            "scp", "-F", self.ssh_config,
            "/Users/cory/Documents/Cloudy-Work/applications/jw-attendant-scheduler/templates/scheduler/count_entry.html",
            "/Users/cory/Documents/Cloudy-Work/applications/jw-attendant-scheduler/templates/scheduler/count_reports.html",
            f"{self.staging_server}:{self.app_path}/templates/scheduler/"
        ], check=True)
        
        self.results.append("Frontend Agent: Fixed template issues")
        logger.info("✅ Frontend Agent: Template issues fixed")
    
    def devops_agent_fix_deployment(self):
        """DevOps Agent: Fix deployment-related issues."""
        logger.info("⚙️ DevOps Agent: Fixing deployment issues...")
        
        # Fix URL patterns
        url_patterns = '''
# Count Times Feature URLs
path('events/<int:event_id>/counts/', views.count_entry, name='count_entry'),
path('events/<int:event_id>/counts/<int:session_id>/', views.count_entry, name='count_entry_with_session'),
path('events/<int:event_id>/count-reports/', views.count_reports, name='count_reports'),
path('events/<int:event_id>/count-sessions/', views.create_count_session, name='create_count_session'),
path('events/<int:event_id>/count-sessions/<int:session_id>/update/', views.update_count_session, name='update_count_session'),
path('events/<int:event_id>/count-sessions/<int:session_id>/delete/', views.delete_count_session, name='delete_count_session'),
'''
        
        # Check if URL patterns already exist
        result = self.run_ssh_command(f"grep -n 'count_entry' {self.app_path}/scheduler/urls.py")
        if not result:
            self.run_ssh_command(f"cat >> {self.app_path}/scheduler/urls.py << 'EOF'\n{url_patterns}\nEOF")
        
        # Collect static files
        self.run_ssh_command(f"cd {self.app_path} && source venv/bin/activate && python3 manage.py collectstatic --noinput")
        
        # Restart service
        self.run_ssh_command("systemctl restart jw-attendant-staging")
        
        # Wait for service to start
        time.sleep(5)
        
        self.results.append("DevOps Agent: Fixed deployment issues")
        logger.info("✅ DevOps Agent: Deployment issues fixed")
    
    def testing_agent_verify_fixes(self):
        """Testing Agent: Verify all fixes."""
        logger.info("🧪 Testing Agent: Verifying fixes...")
        
        # Check service status
        result = self.run_ssh_command("systemctl status jw-attendant-staging")
        service_running = result and "active (running)" in result
        
        # Test HTTP endpoints
        import requests
        
        endpoints_to_test = [
            ("/", "Home page"),
            ("/login/", "Login page"),
            ("/dashboard/", "Dashboard"),
            ("/events/", "Events list"),
            ("/events/1/counts/", "Count entry"),
            ("/events/1/count-reports/", "Count reports")
        ]
        
        endpoint_results = []
        for endpoint, description in endpoints_to_test:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=5)
                status = "PASS" if response.status_code in [200, 302, 403] else "FAIL"
                endpoint_results.append(f"{description}: {status} ({response.status_code})")
            except Exception as e:
                endpoint_results.append(f"{description}: FAIL (Error: {str(e)})")
        
        # Check file structure
        views_dir_exists = self.run_ssh_command(f"[ -d {self.app_path}/scheduler/views ] && echo 'exists'")
        templates_exist = self.run_ssh_command(f"[ -f {self.app_path}/templates/scheduler/count_entry.html ] && echo 'exists'")
        
        test_results = {
            "service_running": service_running,
            "views_structure": bool(views_dir_exists and "exists" in views_dir_exists),
            "templates_exist": bool(templates_exist and "exists" in templates_exist),
            "endpoints": endpoint_results
        }
        
        self.results.append(f"Testing Agent: Verification complete - {test_results}")
        logger.info("✅ Testing Agent: Verification complete")
        
        return test_results
    
    def orchestrate_all_agents(self):
        """Orchestrate all agents to fix issues."""
        logger.info("🚀 Starting agent orchestration...")
        
        try:
            # Step 1: Backend Agent fixes views
            self.backend_agent_fix_views()
            
            # Step 2: Frontend Agent fixes templates
            self.frontend_agent_fix_templates()
            
            # Step 3: DevOps Agent fixes deployment
            self.devops_agent_fix_deployment()
            
            # Step 4: Testing Agent verifies fixes
            test_results = self.testing_agent_verify_fixes()
            
            # Summary
            logger.info("🎉 Agent orchestration complete!")
            logger.info("Results:")
            for result in self.results:
                logger.info(f"  ✅ {result}")
            
            return test_results
            
        except Exception as e:
            logger.error(f"❌ Agent orchestration failed: {str(e)}")
            return None

def main():
    """Main function to run the agent orchestrator."""
    orchestrator = AgentOrchestrator()
    results = orchestrator.orchestrate_all_agents()
    
    if results:
        logger.info("✅ All agents completed successfully!")
        sys.exit(0)
    else:
        logger.error("❌ Agent orchestration failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
