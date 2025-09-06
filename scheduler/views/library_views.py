"""
Library-First Views

Views that use the new SDD library-first architecture.
These views demonstrate how to integrate the libraries with Django views.
"""

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json

# Import the new libraries
try:
    from scheduler.libs import scheduler_libs
    from scheduler.libs.shared.observability import log_event
    LIBRARIES_AVAILABLE = True
except ImportError:
    # Fallback to direct model access if libraries aren't available
    from scheduler.models import Event, Attendant, Assignment
    LIBRARIES_AVAILABLE = False
    def log_event(event_type, data=None):
        pass

@login_required
def library_event_list(request):
    """Event list using Event Management Library."""
    try:
        if LIBRARIES_AVAILABLE:
            # Use the Event Management Library
            events = scheduler_libs.events.list_events()
            
            # Log the library usage
            log_event("library.event_list_accessed", {
                "user_id": request.user.id,
                "events_count": len(events)
            })
        else:
            # Fallback to direct model access
            events = [
                {
                    'id': event.id,
                    'name': event.name,
                    'start_date': event.start_date.isoformat(),
                    'end_date': event.end_date.isoformat(),
                    'status': getattr(event, 'status', 'active'),
                    'positions_count': getattr(event, 'positions', []).count() if hasattr(event, 'positions') else 0,
                    'attendants_count': 0
                }
                for event in Event.objects.all()
            ]
        
        return render(request, 'scheduler/library/event_list.html', {
            'events': events,
            'using_libraries': LIBRARIES_AVAILABLE
        })
        
    except Exception as e:
        messages.error(request, f"Error loading events: {str(e)}")
        return redirect('home')

@login_required
def library_event_detail(request, event_id):
    """Event detail using Event Management Library."""
    try:
        if LIBRARIES_AVAILABLE:
            # Use the Event Management Library
            event = scheduler_libs.events.get_event(event_id)
            
            # Get event schedule using Attendant Scheduling Library
            schedule = scheduler_libs.attendants.get_schedule(event_id=event_id)
            
            # Log the library usage
            log_event("library.event_detail_accessed", {
                "user_id": request.user.id,
                "event_id": event_id
            })
        else:
            # Fallback to direct model access
            event_obj = get_object_or_404(Event, id=event_id)
            event = {
                'id': event_obj.id,
                'name': event_obj.name,
                'start_date': event_obj.start_date.isoformat(),
                'end_date': event_obj.end_date.isoformat(),
                'status': getattr(event_obj, 'status', 'active'),
                'positions_count': 0,
                'attendants_count': 0
            }
            schedule = {'assignments': [], 'unassigned_positions': []}
        
        return render(request, 'scheduler/library/event_detail.html', {
            'event': event,
            'schedule': schedule,
            'using_libraries': LIBRARIES_AVAILABLE
        })
        
    except Exception as e:
        messages.error(request, f"Error loading event: {str(e)}")
        return redirect('library_event_list')

@login_required
def library_attendant_list(request):
    """Attendant list using Attendant Scheduling Library."""
    try:
        if LIBRARIES_AVAILABLE:
            # Use the Attendant Scheduling Library
            attendants = scheduler_libs.attendants.list_attendants()
            
            # Log the library usage
            log_event("library.attendant_list_accessed", {
                "user_id": request.user.id,
                "attendants_count": len(attendants)
            })
        else:
            # Fallback to direct model access
            attendants = [
                {
                    'id': attendant.id,
                    'name': attendant.name,
                    'email': attendant.email,
                    'role': getattr(attendant, 'role', 'attendant'),
                    'active': getattr(attendant, 'active', True),
                    'assignments_count': 0
                }
                for attendant in Attendant.objects.all()
            ]
        
        return render(request, 'scheduler/library/attendant_list.html', {
            'attendants': attendants,
            'using_libraries': LIBRARIES_AVAILABLE
        })
        
    except Exception as e:
        messages.error(request, f"Error loading attendants: {str(e)}")
        return redirect('home')

@login_required
def library_attendant_detail(request, attendant_id):
    """Attendant detail using Attendant Scheduling Library."""
    try:
        if LIBRARIES_AVAILABLE:
            # Use the Attendant Scheduling Library
            attendant = scheduler_libs.attendants.get_attendant(attendant_id)
            
            # Get attendant schedule
            schedule = scheduler_libs.attendants.get_attendant_schedule(attendant_id)
            
            # Log the library usage
            log_event("library.attendant_detail_accessed", {
                "user_id": request.user.id,
                "attendant_id": attendant_id
            })
        else:
            # Fallback to direct model access
            attendant_obj = get_object_or_404(Attendant, id=attendant_id)
            attendant = {
                'id': attendant_obj.id,
                'name': attendant_obj.name,
                'email': attendant_obj.email,
                'role': getattr(attendant_obj, 'role', 'attendant'),
                'active': getattr(attendant_obj, 'active', True),
                'assignments_count': 0
            }
            schedule = {'assignments': []}
        
        return render(request, 'scheduler/library/attendant_detail.html', {
            'attendant': attendant,
            'schedule': schedule,
            'using_libraries': LIBRARIES_AVAILABLE
        })
        
    except Exception as e:
        messages.error(request, f"Error loading attendant: {str(e)}")
        return redirect('library_attendant_list')

@login_required
@require_http_methods(["POST"])
def library_create_assignment(request):
    """Create assignment using Attendant Scheduling Library."""
    try:
        data = json.loads(request.body)
        attendant_id = data.get('attendant_id')
        position_id = data.get('position_id')
        
        if not attendant_id or not position_id:
            return JsonResponse({
                'success': False,
                'error': 'attendant_id and position_id are required'
            })
        
        if LIBRARIES_AVAILABLE:
            # Use the Attendant Scheduling Library
            assignment = scheduler_libs.attendants.create_assignment(
                attendant_id=attendant_id,
                position_id=position_id,
                force=data.get('force', False)
            )
            
            # Log the library usage
            log_event("library.assignment_created", {
                "user_id": request.user.id,
                "attendant_id": attendant_id,
                "position_id": position_id,
                "assignment_id": assignment.get('id')
            })
            
            return JsonResponse({
                'success': True,
                'assignment': assignment
            })
        else:
            # Fallback implementation
            return JsonResponse({
                'success': False,
                'error': 'Libraries not available - using fallback mode'
            })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

@login_required
def library_count_sessions(request, event_id):
    """Count sessions using Count Tracking Library."""
    try:
        if LIBRARIES_AVAILABLE:
            # Use the Count Tracking Library
            sessions = scheduler_libs.counts.list_count_sessions(event_id=event_id)
            
            # Get event details
            event = scheduler_libs.events.get_event(event_id)
            
            # Log the library usage
            log_event("library.count_sessions_accessed", {
                "user_id": request.user.id,
                "event_id": event_id,
                "sessions_count": len(sessions)
            })
        else:
            # Fallback to empty data
            sessions = []
            event = {'id': event_id, 'name': f'Event {event_id}'}
        
        return render(request, 'scheduler/library/count_sessions.html', {
            'event': event,
            'sessions': sessions,
            'using_libraries': LIBRARIES_AVAILABLE
        })
        
    except Exception as e:
        messages.error(request, f"Error loading count sessions: {str(e)}")
        return redirect('library_event_detail', event_id=event_id)

@login_required
@require_http_methods(["POST"])
def library_record_count(request):
    """Record count using Count Tracking Library."""
    try:
        data = json.loads(request.body)
        session_id = data.get('session_id')
        count_type = data.get('count_type')
        count_value = data.get('count_value')
        
        if not all([session_id, count_type, count_value is not None]):
            return JsonResponse({
                'success': False,
                'error': 'session_id, count_type, and count_value are required'
            })
        
        if LIBRARIES_AVAILABLE:
            # Use the Count Tracking Library
            record = scheduler_libs.counts.record_count(
                session_id=session_id,
                count_type=count_type,
                count_value=count_value,
                notes=data.get('notes', '')
            )
            
            # Log the library usage
            log_event("library.count_recorded", {
                "user_id": request.user.id,
                "session_id": session_id,
                "count_type": count_type,
                "count_value": count_value,
                "record_id": record.get('id')
            })
            
            return JsonResponse({
                'success': True,
                'record': record
            })
        else:
            # Fallback implementation
            return JsonResponse({
                'success': False,
                'error': 'Libraries not available - using fallback mode'
            })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

@login_required
def library_dashboard(request):
    """Dashboard using all libraries for comprehensive view."""
    try:
        dashboard_data = {
            'events': [],
            'attendants': [],
            'recent_assignments': [],
            'active_count_sessions': [],
            'using_libraries': LIBRARIES_AVAILABLE
        }
        
        if LIBRARIES_AVAILABLE:
            # Get recent events
            dashboard_data['events'] = scheduler_libs.events.list_events()[:5]
            
            # Get active attendants
            dashboard_data['attendants'] = scheduler_libs.attendants.list_attendants(active=True)[:10]
            
            # Get active count sessions
            dashboard_data['active_count_sessions'] = scheduler_libs.counts.get_active_sessions()
            
            # Log the library usage
            log_event("library.dashboard_accessed", {
                "user_id": request.user.id,
                "events_count": len(dashboard_data['events']),
                "attendants_count": len(dashboard_data['attendants']),
                "active_sessions_count": len(dashboard_data['active_count_sessions'])
            })
        
        return render(request, 'scheduler/library/dashboard.html', dashboard_data)
        
    except Exception as e:
        messages.error(request, f"Error loading dashboard: {str(e)}")
        return redirect('home')

@login_required
def library_api_info(request):
    """API information showing available library interfaces."""
    try:
        if LIBRARIES_AVAILABLE:
            library_info = scheduler_libs.get_library_info()
            
            # Add runtime status
            library_info['runtime_status'] = {
                'libraries_loaded': True,
                'django_integration': True,
                'observability_active': True
            }
            
            # Log the library usage
            log_event("library.api_info_accessed", {
                "user_id": request.user.id
            })
        else:
            library_info = {
                'libraries': [],
                'shared_utilities': [],
                'runtime_status': {
                    'libraries_loaded': False,
                    'django_integration': False,
                    'observability_active': False
                }
            }
        
        if request.headers.get('Accept') == 'application/json':
            return JsonResponse(library_info)
        
        return render(request, 'scheduler/library/api_info.html', {
            'library_info': library_info,
            'using_libraries': LIBRARIES_AVAILABLE
        })
        
    except Exception as e:
        if request.headers.get('Accept') == 'application/json':
            return JsonResponse({
                'error': str(e),
                'libraries_loaded': False
            })
        
        messages.error(request, f"Error loading API info: {str(e)}")
        return redirect('home')
