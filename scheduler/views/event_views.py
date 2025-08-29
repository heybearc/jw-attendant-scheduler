"""
Event-centric views for JW Attendant Scheduler
"""

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_http_methods
from django.utils import timezone
from datetime import datetime, timedelta
from django.db import transaction

from ..models import Event, EventStatus, EventType, Attendant, Assignment
from ..forms import EventForm


@login_required
def event_selection(request):
    """Event selection landing page - users choose/create event after login"""
    # Get current event if any
    current_event = Event.get_current_event()
    
    # Get all events organized by status
    # Admin/superuser can see all events, regular users see limited view
    if request.user.is_staff or request.user.is_superuser or getattr(request.user, 'role', None) == 'admin':
        upcoming_events = Event.objects.filter(status=EventStatus.UPCOMING).order_by('start_date')
        past_events = Event.objects.filter(status=EventStatus.COMPLETED).order_by('-start_date')[:20]
        current_events = Event.objects.filter(status=EventStatus.CURRENT).order_by('start_date')
    else:
        upcoming_events = Event.objects.filter(status=EventStatus.UPCOMING).order_by('start_date')[:5]
        past_events = Event.objects.filter(status=EventStatus.COMPLETED).order_by('-start_date')[:5]
        current_events = Event.objects.filter(status=EventStatus.CURRENT).order_by('start_date')[:3]
    
    # Check if user has selected an event in session
    selected_event_id = request.session.get('selected_event_id')
    selected_event = None
    if selected_event_id:
        try:
            selected_event = Event.objects.get(id=selected_event_id)
        except Event.DoesNotExist:
            # Clear invalid event from session
            request.session.pop('selected_event_id', None)
    
    context = {
        'current_event': current_event,
        'current_events': current_events,
        'upcoming_events': upcoming_events,
        'past_events': past_events,
        'selected_event': selected_event,
        'can_create_events': request.user.role in ['admin', 'overseer'],
        'is_admin': request.user.is_staff or request.user.is_superuser or getattr(request.user, 'role', None) == 'admin',
    }
    
    return render(request, 'scheduler/event_selection.html', context)


@login_required
@require_http_methods(["POST"])
def select_event(request, event_id):
    """Select an event for the current session"""
    event = get_object_or_404(Event, id=event_id)
    
    # Store selected event in session
    request.session['selected_event_id'] = event.id
    
    messages.success(request, f'Selected event: {event.name}')
    
    # Redirect to dashboard or requested page
    next_url = request.GET.get('next', 'scheduler:dashboard')
    return redirect(next_url)


@login_required
def create_event(request):
    """Create a new event (admin/overseer only)"""
    if request.user.role not in ['admin', 'overseer']:
        messages.error(request, 'You do not have permission to create events.')
        return redirect('scheduler:event_selection')
    
    if request.method == 'POST':
        form = EventForm(request.POST)
        if form.is_valid():
            event = form.save()
            
            # Auto-select the newly created event
            request.session['selected_event_id'] = event.id
            
            messages.success(request, f'Event "{event.name}" created successfully!')
            return redirect('scheduler:dashboard')
    else:
        form = EventForm()
    
    return render(request, 'scheduler/event_create.html', {
        'form': form
    })


@login_required
def edit_event(request, event_id):
    """Edit an existing event"""
    event = get_object_or_404(Event, id=event_id)
    
    if request.method == 'POST':
        # Handle delete request
        if request.POST.get('delete_event'):
            event_name = event.name
            event.delete()
            messages.success(request, f'Event "{event_name}" deleted successfully.')
            return redirect('scheduler:event_selection')
        
        # Handle edit request
        form = EventForm(request.POST, instance=event)
        if form.is_valid():
            event = form.save()
            messages.success(request, f'Event "{event.name}" updated successfully!')
            return redirect('scheduler:event_selection')
    else:
        form = EventForm(instance=event)
    
    context = {
        'form': form,
        'event': event,
        'title': f'Edit Event: {event.name}'
    }
    
    return render(request, 'scheduler/event_form.html', context)


@login_required
@require_http_methods(["POST"])
def set_current_event(request, event_id):
    """Set an event as the current active event (admin/overseer only)"""
    if request.user.role not in ['admin', 'overseer']:
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    event = get_object_or_404(Event, id=event_id)
    
    with transaction.atomic():
        # Set all other events to appropriate status based on dates
        today = timezone.now().date()
        
        # Update event statuses
        Event.objects.filter(end_date__lt=today).update(status=EventStatus.COMPLETED)
        Event.objects.filter(start_date__gt=today).update(status=EventStatus.UPCOMING)
        
        # Set this event as current
        event.set_as_current()
    
    return JsonResponse({
        'success': True,
        'message': f'"{event.name}" is now the current event'
    })


@login_required
def copy_event(request, event_id):
    """Copy an existing event with all configurations (admin/overseer only)"""
    if request.user.role not in ['admin', 'overseer']:
        messages.error(request, 'You do not have permission to copy events.')
        return redirect('scheduler:event_selection')
    
    source_event = get_object_or_404(Event, id=event_id)
    
    if request.method == 'POST':
        # Create a copy of the event
        new_event = Event.objects.create(
            name=f"{source_event.name} (Copy)",
            event_type=source_event.event_type,
            start_date=source_event.start_date + timedelta(days=365),  # Default to next year
            end_date=source_event.end_date + timedelta(days=365),
            location=source_event.location,
            description=source_event.description,
            status=EventStatus.UPCOMING,
            total_stations=source_event.total_stations,
            expected_attendants=source_event.expected_attendants
        )
        
        # Copy attendant assignments if requested
        if request.POST.get('copy_attendants'):
            for assignment in source_event.assignments.all():
                Assignment.objects.create(
                    attendant=assignment.attendant,
                    event=new_event,
                    position=assignment.position,
                    shift_start=assignment.shift_start.replace(year=new_event.start_date.year),
                    shift_end=assignment.shift_end.replace(year=new_event.end_date.year),
                    notes=assignment.notes
                )
        
        messages.success(request, f'Event copied as "{new_event.name}"')
        return redirect('scheduler:edit_event', event_id=new_event.id)
    
    context = {
        'source_event': source_event,
        'assignment_count': source_event.assignments.count()
    }
    
    return render(request, 'scheduler/copy_event.html', context)


@login_required
def event_dashboard(request):
    """Event-specific dashboard showing key metrics and quick actions"""
    selected_event_id = request.session.get('selected_event_id')
    if not selected_event_id:
        return redirect('scheduler:event_selection')
    
    event = get_object_or_404(Event, id=selected_event_id)
    
    # Get event statistics
    total_attendants = Attendant.objects.filter(
        assignments__event=event,
        is_active=True
    ).distinct().count()
    
    total_assignments = Assignment.objects.filter(event=event).count()
    
    # Get recent assignments
    recent_assignments = Assignment.objects.filter(
        event=event
    ).select_related('attendant').order_by('-created_at')[:10]
    
    # Check for scheduling conflicts
    conflicts = []
    # TODO: Implement conflict detection logic
    
    context = {
        'event': event,
        'total_attendants': total_attendants,
        'total_assignments': total_assignments,
        'recent_assignments': recent_assignments,
        'conflicts': conflicts,
        'days_until_event': (event.start_date - timezone.now().date()).days if event.start_date > timezone.now().date() else 0,
    }
    
    return render(request, 'scheduler/event_dashboard.html', context)
