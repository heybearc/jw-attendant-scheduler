from django.shortcuts import render, get_object_or_404, redirect
from .views.count_views import count_entry, count_reports, create_count_session, update_count_session, delete_count_session
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods, require_POST
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.contrib.auth import get_user_model
from django.db import transaction
from django.contrib.auth import login
from django.utils import timezone
from django.conf import settings
import json
import csv
import io
from datetime import datetime, timedelta

from .models import (
    Attendant, Event, Assignment, LanyardAssignment, UserRole, EventStatus, EventType,
    Department, StationRange, OverseerAssignment, AttendantOverseerAssignment,
    EventPosition, PositionShift, CountSession, PositionCount
)
from .forms import AttendantForm, EventForm, AssignmentForm, UserInvitationForm, BulkAssignmentForm

# Get User model
User = get_user_model()

# Health check endpoint for deployment monitoring
@login_required
def health_check(request):
    """Simple health check endpoint for monitoring"""
    return JsonResponse({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0'
    })

@login_required
def position_templates(request):
    """Position templates management page"""
    return render(request, 'scheduler/position_templates.html')

# Event-centric views

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
    
    # Redirect to event detail page instead of global dashboard
    return redirect('scheduler:event_detail', event_id=event.id)


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


@login_required
def event_create(request):
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
def event_edit(request, event_id):
    """Edit an existing event"""
    event = get_object_or_404(Event, id=event_id)
    
    if request.method == 'POST':
        # Handle status change requests
        if request.POST.get('mark_completed'):
            event.mark_completed()
            messages.success(request, f'Event "{event.name}" marked as completed.')
            return redirect('scheduler:event_selection')
        
        elif request.POST.get('mark_cancelled'):
            event.mark_cancelled()
            messages.success(request, f'Event "{event.name}" marked as cancelled.')
            return redirect('scheduler:event_selection')
        
        elif request.POST.get('archive_event'):
            event.archive()
            messages.success(request, f'Event "{event.name}" archived successfully.')
            return redirect('scheduler:event_selection')
        
        # Handle delete request with safety checks
        elif request.POST.get('delete_event'):
            if event.can_be_deleted():
                event_name = event.name
                event.delete()
                messages.success(request, f'Event "{event_name}" deleted successfully.')
                return redirect('scheduler:event_selection')
            else:
                messages.error(request, f'Cannot delete "{event.name}" - it has active assignments. Archive or cancel it first.')
        
        # Handle edit request
        else:
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
        'title': f'Edit Event: {event.name}',
        'can_delete': event.can_be_deleted(),
        'assignment_count': event.assignments.count()
    }
    
    return render(request, 'scheduler/event_form.html', context)


@login_required
def event_detail(request, event_id):
    """Event management dashboard with tabbed interface"""
    event = get_object_or_404(Event, id=event_id)
    
    # Set this event as selected in session
    request.session['selected_event_id'] = event.id
    
    # Get event-scoped data
    attendants = Attendant.objects.filter(events=event)
    assignments = Assignment.objects.filter(event=event).select_related('attendant')
    
    # Calculate stats
    assignments_by_position = {}
    for assignment in assignments:
        if assignment.position not in assignments_by_position:
            assignments_by_position[assignment.position] = []
        assignments_by_position[assignment.position].append(assignment)

    # Calculate days until event
    from django.utils import timezone
    if event.start_date:
        days_until = (event.start_date - timezone.now().date()).days
        days_until_event = max(0, days_until) if days_until >= 0 else 0
    else:
        days_until_event = 0

    # Get event-scoped lanyards
    event_lanyards = LanyardAssignment.objects.filter(
        event=event
    ).select_related('attendant')
    
    # Get event positions and shifts for new system
    event_positions = EventPosition.objects.filter(event=event).prefetch_related('shifts').order_by('position_number')

    context = {
        'event': event,
        'attendants_count': attendants.count(),
        'assignments_count': assignments.count(),
        'positions_count': len(assignments_by_position),
        'days_until_event': days_until_event,
        'assignments': assignments,
        'assignments_by_position': assignments_by_position,
        'event_attendants': attendants,
        'event_lanyards': event_lanyards,
        'event_positions': event_positions,
    }
    
    return render(request, 'scheduler/event_detail.html', context)


@login_required
def event_positions(request, event_id):
    """Manage event positions and shift windows"""
    event = get_object_or_404(Event, id=event_id)
    positions = EventPosition.objects.filter(event=event).prefetch_related('shifts').order_by('position_number')
    
    context = {
        'event': event,
        'positions': positions,
    }
    
    return render(request, 'scheduler/event_positions.html', context)


@login_required
def bulk_create_positions(request, event_id):
    """Create multiple numbered positions for an event"""
    if request.method == 'POST':
        event = get_object_or_404(Event, id=event_id)
        position_count = int(request.POST.get('position_count', 0))
        
        if position_count > 0:
            created_count = 0
            for i in range(1, position_count + 1):
                position, created = EventPosition.objects.get_or_create(
                    event=event,
                    position_number=i,
                    defaults={'name': f'Position {i}'}
                )
                if created:
                    created_count += 1
            
            messages.success(request, f'Created {created_count} new positions.')
        else:
            messages.error(request, 'Please specify a valid number of positions.')
    
    return redirect('scheduler:event_positions', event_id=event_id)


@login_required
def add_single_position(request, event_id):
    """Add a single position with specific number"""
    if request.method == 'POST':
        event = get_object_or_404(Event, id=event_id)
        position_number = int(request.POST.get('position_number', 0))
        
        if position_number > 0:
            position, created = EventPosition.objects.get_or_create(
                event=event,
                position_number=position_number,
                defaults={'name': f'Position {position_number}'}
            )
            
            if created:
                messages.success(request, f'Added Position {position_number}.')
            else:
                messages.warning(request, f'Position {position_number} already exists.')
        else:
            messages.error(request, 'Please specify a valid position number.')
    
    return redirect('scheduler:event_positions', event_id=event_id)


@login_required
def add_position_range(request, event_id):
    """Add a range of positions"""
    if request.method == 'POST':
        event = get_object_or_404(Event, id=event_id)
        start_position = int(request.POST.get('start_position', 0))
        end_position = int(request.POST.get('end_position', 0))
        
        if start_position > 0 and end_position > 0 and start_position <= end_position:
            created_count = 0
            existing_count = 0
            
            for i in range(start_position, end_position + 1):
                position, created = EventPosition.objects.get_or_create(
                    event=event,
                    position_number=i,
                    defaults={'name': f'Position {i}'}
                )
                if created:
                    created_count += 1
                else:
                    existing_count += 1
            
            if created_count > 0:
                messages.success(request, f'Added {created_count} new positions ({start_position}-{end_position}).')
            if existing_count > 0:
                messages.info(request, f'{existing_count} positions already existed in this range.')
        else:
            messages.error(request, 'Please specify a valid position range (start ≤ end).')
    
    return redirect('scheduler:event_positions', event_id=event_id)


@login_required
def bulk_apply_shifts(request, event_id):
    """Apply shift window to positions in an event (all or range)"""
    if request.method == 'POST':
        event = get_object_or_404(Event, id=event_id)
        apply_type = request.POST.get('apply_type', 'all')
        is_all_day_bulk = request.POST.get('is_all_day_bulk') == 'on'
        shift_start_time = request.POST.get('shift_start')
        shift_end_time = request.POST.get('shift_end')
        
        from datetime import datetime, time
        from django.utils import timezone
        
        try:
            # Determine target positions
            if apply_type == 'range':
                position_start = int(request.POST.get('position_start', 1))
                position_end = int(request.POST.get('position_end', 1))
                positions = EventPosition.objects.filter(
                    event=event,
                    position_number__gte=position_start,
                    position_number__lte=position_end
                )
                target_desc = f'positions {position_start}-{position_end}'
            else:
                positions = EventPosition.objects.filter(event=event)
                target_desc = 'all positions'
            
            if is_all_day_bulk:
                # All-day shift
                event_date = event.start_date
                shift_start = timezone.make_aware(datetime.combine(event_date, time(0, 0)))
                shift_end = timezone.make_aware(datetime.combine(event_date, time(23, 59)))
                shift_desc = 'all-day shift'
            elif shift_start_time and shift_end_time:
                # Parse time strings and combine with event date
                start_time = datetime.strptime(shift_start_time, '%H:%M').time()
                end_time = datetime.strptime(shift_end_time, '%H:%M').time()
                event_date = event.start_date
                
                shift_start = timezone.make_aware(datetime.combine(event_date, start_time))
                shift_end = timezone.make_aware(datetime.combine(event_date, end_time))
                shift_desc = f'{shift_start_time}-{shift_end_time} shift'
            else:
                messages.error(request, 'Please provide both start and end times or select all-day.')
                return redirect('scheduler:event_positions', event_id=event_id)
            
            # Apply to target positions
            created_count = 0
            for position in positions:
                shift, created = PositionShift.objects.get_or_create(
                    position=position,
                    shift_start=shift_start,
                    shift_end=shift_end,
                    defaults={'is_all_day': is_all_day_bulk}
                )
                if created:
                    created_count += 1
            
            messages.success(request, f'Applied {shift_desc} to {created_count} of {target_desc}.')
            
        except ValueError as e:
            messages.error(request, f'Invalid time format. Please use HH:MM format (e.g., 08:00).')
        except Exception as e:
            messages.error(request, f'Error applying shifts: {str(e)}')
    
    return redirect('scheduler:event_positions', event_id=event_id)


@login_required
def add_position_shift(request, position_id):
    """Add shift window to a specific position"""
    if request.method == 'POST':
        position = get_object_or_404(EventPosition, id=position_id)
        is_all_day = request.POST.get('is_all_day') == 'on'
        shift_start = request.POST.get('shift_start')
        shift_end = request.POST.get('shift_end')
        
        from datetime import datetime, time
        from django.utils import timezone
        
        try:
            if is_all_day:
                # All-day shift: combine event date with 00:00 and 23:59
                event_date = position.event.start_date
                start_datetime = timezone.make_aware(datetime.combine(event_date, time(0, 0)))
                end_datetime = timezone.make_aware(datetime.combine(event_date, time(23, 59)))
                
                PositionShift.objects.create(
                    position=position,
                    shift_start=start_datetime,
                    shift_end=end_datetime,
                    is_all_day=True
                )
                messages.success(request, f'Added all-day shift to Position {position.position_number}.')
            elif shift_start and shift_end:
                # Parse time strings and combine with event date
                try:
                    start_time = datetime.strptime(shift_start, '%H:%M').time()
                    end_time = datetime.strptime(shift_end, '%H:%M').time()
                    event_date = position.event.start_date
                    
                    start_datetime = timezone.make_aware(datetime.combine(event_date, start_time))
                    end_datetime = timezone.make_aware(datetime.combine(event_date, end_time))
                    
                    PositionShift.objects.create(
                        position=position,
                        shift_start=start_datetime,
                        shift_end=end_datetime,
                        is_all_day=False
                    )
                    messages.success(request, f'Added shift window to Position {position.position_number}.')
                except ValueError:
                    messages.error(request, 'Invalid time format. Please use HH:MM format.')
            else:
                messages.error(request, 'Please provide both start and end times or select all-day.')
        except Exception as e:
            messages.error(request, f'Error creating shift: {str(e)}')
    
    return redirect('scheduler:event_positions', event_id=position.event.id)


@login_required
@csrf_protect
@require_POST
def delete_shift(request, shift_id):
    """Delete a position shift"""
    shift = get_object_or_404(PositionShift, id=shift_id)
    event_id = shift.position.event.id
    position_number = shift.position.position_number
    
    try:
        shift.delete()
        messages.success(request, f'Shift deleted from Position {position_number}.')
    except Exception as e:
        messages.error(request, f'Error deleting shift: {str(e)}')
    
    return JsonResponse({'success': True})


@login_required
@csrf_protect
@require_POST
def delete_position(request, position_id):
    """Delete a position and all its shifts"""
    position = get_object_or_404(EventPosition, id=position_id)
    event_id = position.event.id
    position_number = position.position_number
    
    try:
        position.delete()
        messages.success(request, f'Position {position_number} and all its shifts deleted.')
    except Exception as e:
        messages.error(request, f'Error deleting position: {str(e)}')
    
    return JsonResponse({'success': True})


@login_required
@csrf_protect
@require_POST
def update_position_name(request, position_id):
    """Update position name via AJAX"""
    position = get_object_or_404(EventPosition, id=position_id)
    
    try:
        import json
        data = json.loads(request.body)
        position.position_name = data.get('name', '')
        position.save()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
def event_list(request):
    """List events - role-based filtering"""
    # Attendant users can only see events they're assigned to
    if request.user.role == UserRole.ATTENDANT:
        try:
            attendant = request.user.attendant_profile
            if attendant:
                events = attendant.events.all().order_by('-start_date')
            else:
                events = Event.objects.none()
        except:
            events = Event.objects.none()
    else:
        # Admin/overseer users can see all events
        events = Event.objects.all().order_by('-start_date')
    
    # Search functionality
    search_query = request.GET.get('search', '')
    if search_query:
        events = events.filter(
            Q(name__icontains=search_query) |
            Q(location__icontains=search_query) |
            Q(description__icontains=search_query)
        )
    
    context = {
        'events': events,
        'search_query': search_query,
    }
    
    return render(request, 'scheduler/event_list.html', context)


@login_required
def assignment_list(request):
    """List assignments with event-scoped filtering - role-based access"""
    # Block attendant users from accessing this view
    if request.user.role == UserRole.ATTENDANT:
        messages.error(request, 'Access denied. You can view your assignments from your dashboard.')
        return redirect('scheduler:attendant_dashboard')
    
    selected_event_id = request.session.get('selected_event_id')
    if not selected_event_id:
        messages.warning(request, 'Please select an event first.')
        return redirect('scheduler:event_selection')
    
    selected_event = get_object_or_404(Event, id=selected_event_id)
    assignments = Assignment.objects.filter(event=selected_event).select_related('attendant').order_by('shift_start', 'position')
    
    context = {
        'assignments': assignments,
        'selected_event': selected_event,
    }
    
    return render(request, 'scheduler/assignment_list.html', context)


@login_required
def assignment_create(request):
    """Create a new assignment"""
    selected_event_id = request.session.get('selected_event_id')
    if not selected_event_id:
        messages.warning(request, 'Please select an event first.')
        return redirect('scheduler:event_selection')
    
    selected_event = get_object_or_404(Event, id=selected_event_id)
    
    if request.method == 'POST':
        form = AssignmentForm(request.POST)
        if form.is_valid():
            assignment = form.save(commit=False)
            assignment.event = selected_event
            assignment.save()
            messages.success(request, 'Assignment created successfully.')
            return redirect('scheduler:assignment_list')
    else:
        form = AssignmentForm()
        # Filter attendants by selected event
        form.fields['attendant'].queryset = Attendant.objects.filter(events=selected_event)
    
    context = {
        'form': form,
        'selected_event': selected_event,
        'title': 'Create Assignment'
    }
    
    return render(request, 'scheduler/assignment_form.html', context)


@login_required
def assignment_edit(request, assignment_id):
    """Edit an existing assignment"""
    assignment = get_object_or_404(Assignment, id=assignment_id)
    
    if request.method == 'POST':
        form = AssignmentForm(request.POST, instance=assignment)
        if form.is_valid():
            form.save()
            messages.success(request, 'Assignment updated successfully.')
            return redirect('scheduler:assignment_list')
    else:
        form = AssignmentForm(instance=assignment)
        # Filter attendants by assignment's event
        form.fields['attendant'].queryset = Attendant.objects.filter(events=assignment.event)
    
    context = {
        'form': form,
        'assignment': assignment,
        'title': f'Edit Assignment: {assignment.attendant.get_full_name()}'
    }
    
    return render(request, 'scheduler/assignment_form.html', context)


@login_required
def reports(request):
    """Advanced reports dashboard with analytics"""
    selected_event_id = request.session.get('selected_event_id')
    if not selected_event_id:
        messages.warning(request, 'Please select an event first.')
        return redirect('scheduler:event_selection')
    
    selected_event = get_object_or_404(Event, id=selected_event_id)
    
    # Generate comprehensive report data
    assignments = Assignment.objects.filter(event=selected_event)
    attendants = Attendant.objects.filter(events=selected_event)
    
    # Basic statistics
    stats = {
        'total_assignments': assignments.count(),
        'total_attendants': attendants.count(),
        'assignments_by_position': assignments.values('position').annotate(count=Count('id')).order_by('-count'),
        'attendants_by_congregation': attendants.values('congregation').annotate(count=Count('id')).order_by('-count'),
        'assignments_by_day': assignments.extra({
            'day': "date(shift_start)"
        }).values('day').annotate(count=Count('id')).order_by('day'),
    }
    
    # Experience level distribution
    experience_stats = {}
    for attendant in attendants:
        level = attendant.experience_level
        experience_stats[level] = experience_stats.get(level, 0) + 1
    
    # Serving position distribution
    serving_stats = {}
    for attendant in attendants:
        if attendant.serving_as:
            for position in attendant.serving_as:
                serving_stats[position] = serving_stats.get(position, 0) + 1
    
    # Assignment duration analysis
    assignment_durations = []
    for assignment in assignments:
        duration = assignment.get_duration_hours()
        if duration > 0:
            assignment_durations.append(duration)
    
    duration_stats = {
        'avg_duration': sum(assignment_durations) / len(assignment_durations) if assignment_durations else 0,
        'total_hours': sum(assignment_durations),
        'min_duration': min(assignment_durations) if assignment_durations else 0,
        'max_duration': max(assignment_durations) if assignment_durations else 0,
    }
    
    # Oversight coverage
    oversight_stats = {
        'attendants_with_oversight': AttendantOverseerAssignment.objects.filter(
            overseer_assignment__event=selected_event
        ).count(),
        'total_overseers': OverseerAssignment.objects.filter(event=selected_event).count(),
    }
    
    context = {
        'selected_event': selected_event,
        'stats': stats,
        'experience_stats': experience_stats,
        'serving_stats': serving_stats,
        'duration_stats': duration_stats,
        'oversight_stats': oversight_stats,
    }
    
    return render(request, 'scheduler/reports.html', context)


@login_required
def oversight_dashboard(request):
    """Oversight dashboard for supervisors"""
    selected_event_id = request.session.get('selected_event_id')
    if not selected_event_id:
        messages.warning(request, 'Please select an event first.')
        return redirect('scheduler:event_selection')
    
    selected_event = get_object_or_404(Event, id=selected_event_id)
    
    # Get oversight assignments for this event
    overseer_assignments = OverseerAssignment.objects.filter(
        event=selected_event
    ).select_related('overseer', 'department', 'station_range')
    
    # Get departments and station ranges
    departments = Department.objects.all()
    station_ranges = StationRange.objects.all()
    
    # Get attendant-overseer assignments
    attendant_assignments = AttendantOverseerAssignment.objects.filter(
        overseer_assignment__event=selected_event
    ).select_related('attendant', 'overseer_assignment__overseer')
    
    # Statistics
    stats = {
        'total_overseers': overseer_assignments.count(),
        'total_departments': departments.count(),
        'total_station_ranges': station_ranges.count(),
        'attendants_with_oversight': attendant_assignments.count(),
    }
    
    context = {
        'selected_event': selected_event,
        'overseer_assignments': overseer_assignments,
        'departments': departments,
        'station_ranges': station_ranges,
        'attendant_assignments': attendant_assignments,
        'stats': stats,
    }
    
    return render(request, 'scheduler/oversight_dashboard.html', context)


@login_required
def user_list(request):
    """List all users (admin only)"""
    if request.user.role not in ['admin', 'overseer'] and not request.user.is_staff:
        messages.error(request, 'You do not have permission to view users.')
        return redirect('scheduler:dashboard')
    
    users = User.objects.all().order_by('last_name', 'first_name')
    
    context = {
        'users': users,
    }
    
    return render(request, 'scheduler/user_list.html', context)


@login_required
def user_create(request):
    """Create a new user (admin only)"""
    if request.user.role not in ['admin', 'overseer'] and not request.user.is_staff:
        messages.error(request, 'You do not have permission to create users.')
        return redirect('scheduler:dashboard')
    
    if request.method == 'POST':
        form = UserCreateForm(request.POST)
        if form.is_valid():
            user = form.save()
            messages.success(request, f'User {user.get_full_name()} created successfully.')
            return redirect('scheduler:user_list')
    else:
        form = UserCreateForm()
    
    context = {
        'form': form,
        'title': 'Create User'
    }
    
    return render(request, 'scheduler/user_form.html', context)


@login_required
def attendant_dashboard(request):
    """Personal dashboard for attendant users"""
    if request.user.role != UserRole.ATTENDANT:
        return redirect('scheduler:dashboard')
    
    # Get attendant record linked to this user
    try:
        attendant = request.user.attendant
    except:
        messages.error(request, 'No attendant record found for your account.')
        return redirect('scheduler:dashboard')
    
    # Get attendant's assignments for display (read-only)
    assignments = Assignment.objects.filter(
        attendant=attendant
    ).select_related('event').order_by('-shift_start')[:10]
    
    context = {
        'attendant': attendant,
        'user': request.user,
        'assignments': assignments,
    }
    
    return render(request, 'scheduler/attendant_dashboard.html', context)


@login_required
def attendant_profile(request):
    """Attendant profile view and edit"""
    if request.user.role != UserRole.ATTENDANT:
        return redirect('scheduler:dashboard')
    
    try:
        attendant = request.user.attendant
    except:
        messages.error(request, 'No attendant record found for your account.')
        return redirect('scheduler:dashboard')
    
    if request.method == 'POST':
        form = AttendantForm(request.POST, instance=attendant)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated successfully.')
            return redirect('scheduler:attendant_profile')
    else:
        form = AttendantForm(instance=attendant)
    
    context = {
        'form': form,
        'attendant': attendant,
        'title': 'My Profile'
    }
    
    return render(request, 'scheduler/attendant_profile.html', context)


@login_required
def toggle_attendant_status(request, attendant_id):
    """Toggle attendant active/inactive status"""
    attendant = get_object_or_404(Attendant, id=attendant_id)
    attendant.is_active = not attendant.is_active
    attendant.save()
    
    status = "activated" if attendant.is_active else "deactivated"
    messages.success(request, f'Attendant {attendant.get_full_name()} has been {status}.')
    
    return redirect('scheduler:attendant_list')


@login_required
def user_invite(request):
    """Invite a new user via email"""
    if request.user.role not in ['admin', 'overseer'] and not request.user.is_staff:
        messages.error(request, 'You do not have permission to invite users.')
        return redirect('scheduler:dashboard')
    
    if request.method == 'POST':
        form = UserInvitationForm(request.POST)
        if form.is_valid():
            # Create invitation logic here
            email = form.cleaned_data['email']
            messages.success(request, f'Invitation sent to {email}.')
            return redirect('scheduler:user_list')
    else:
        form = UserInvitationForm()
    
    context = {
        'form': form,
        'title': 'Invite User'
    }
    
    return render(request, 'scheduler/user_invite.html', context)


@login_required
def user_activate(request, token):
    """Activate user account via token"""
    # User activation logic here
    messages.success(request, 'Account activated successfully.')
    return redirect('scheduler:login')


@login_required
def attendant_assignments_api(request, attendant_id):
    """API endpoint for attendant assignments"""
    attendant = get_object_or_404(Attendant, id=attendant_id)
    assignments = Assignment.objects.filter(attendant=attendant).values(
        'id', 'position', 'shift_start', 'shift_end', 'event__name'
    )
    
    return JsonResponse({
        'assignments': list(assignments)
    })


@login_required
def check_conflicts_api(request):
    """API endpoint for checking assignment conflicts"""
    # Conflict checking logic here
    return JsonResponse({
        'conflicts': []
    })


@login_required
def bulk_assignment_create(request):
    """Bulk create assignments using new position system"""
    selected_event_id = request.session.get('selected_event_id')
    if not selected_event_id:
        messages.warning(request, 'Please select an event first.')
        return redirect('scheduler:event_selection')
    
    selected_event = get_object_or_404(Event, id=selected_event_id)
    
    if request.method == 'POST':
        form = BulkAssignmentForm(request.POST, event_id=selected_event_id)
        if form.is_valid():
            # Create assignments for each attendant-position_shift combination
            attendants = form.cleaned_data['attendants']
            position_shifts = form.cleaned_data['position_shifts']
            notes = form.cleaned_data.get('notes', '')
            allow_overrides = form.cleaned_data.get('allow_overrides', False)
            
            created_count = 0
            skipped_count = 0
            
            for attendant in attendants:
                for position_shift in position_shifts:
                    try:
                        # Check if assignment already exists
                        existing = Assignment.objects.filter(
                            event=selected_event,
                            attendant=attendant,
                            position=position_shift.position.position_number,
                            shift_start=position_shift.shift_start,
                            shift_end=position_shift.shift_end
                        ).first()
                        
                        if existing and not allow_overrides:
                            skipped_count += 1
                            continue
                        
                        # Create or update assignment
                        assignment, created = Assignment.objects.update_or_create(
                            event=selected_event,
                            attendant=attendant,
                            position=position_shift.position.position_number,
                            shift_start=position_shift.shift_start,
                            shift_end=position_shift.shift_end,
                            defaults={
                                'notes': notes,
                                'position_shift': position_shift
                            }
                        )
                        
                        if created:
                            created_count += 1
                        
                    except Exception as e:
                        messages.warning(request, f'Could not create assignment for {attendant.get_full_name()} at position {position_shift.position.position_number}: {str(e)}')
            
            if created_count > 0:
                messages.success(request, f'Successfully created {created_count} assignments.')
            if skipped_count > 0:
                messages.info(request, f'Skipped {skipped_count} existing assignments. Use "Allow overrides" to update existing assignments.')
            
            return redirect('scheduler:assignment_list')
    else:
        form = BulkAssignmentForm(event_id=selected_event_id)
        # Filter attendants by selected event
        form.fields['attendants'].queryset = Attendant.objects.filter(events=selected_event)
        # Pre-select the event
        form.fields['event'].initial = selected_event
        form.fields['event'].widget = forms.HiddenInput()
    
    context = {
        'form': form,
        'selected_event': selected_event,
        'title': 'Bulk Create Assignments'
    }
    
    return render(request, 'scheduler/bulk_assignment_form.html', context)


@login_required
def bulk_assignment_update(request):
    """Bulk update assignments"""
    selected_event_id = request.session.get('selected_event_id')
    if not selected_event_id:
        messages.warning(request, 'Please select an event first.')
        return redirect('scheduler:event_selection')
    
    # Bulk update logic here
    messages.success(request, 'Assignments updated successfully.')
    return redirect('scheduler:assignment_list')


@login_required
def bulk_assignment_delete(request):
    """Bulk delete assignments"""
    if request.method == 'POST':
        assignment_ids = request.POST.getlist('assignment_ids')
        Assignment.objects.filter(id__in=assignment_ids).delete()
        messages.success(request, f'{len(assignment_ids)} assignments deleted successfully.')
    
    return redirect('scheduler:assignment_list')


def is_staff_or_superuser(user):
    """Check if user is staff or superuser"""
    return user.is_staff or user.is_superuser


def is_not_attendant(user):
    """Check if user is not an attendant (for restricting attendant access)"""
    return user.role != UserRole.ATTENDANT


def is_attendant_only(user):
    """Check if user is attendant role only"""
    return user.role == UserRole.ATTENDANT


def home(request):
    """Home page view - redirect to event selection for authenticated users"""
    if request.user.is_authenticated:
        # Check if user has a selected event in session
        selected_event_id = request.session.get('selected_event_id')
        if selected_event_id:
            try:
                Event.objects.get(id=selected_event_id)
                return redirect('scheduler:dashboard')
            except Event.DoesNotExist:
                # Clear invalid event from session
                request.session.pop('selected_event_id', None)
        
        # Redirect to event selection if no valid event selected
        return redirect('scheduler:event_selection')
    return render(request, 'scheduler/home.html')


@login_required
def dashboard(request):
    """Main dashboard view with statistics and overview - now event-aware"""
    # Redirect attendant users to their personal dashboard
    if request.user.role == UserRole.ATTENDANT:
        return redirect('scheduler:attendant_dashboard')
    
    # Get selected event from session or current event
    selected_event_id = request.session.get('selected_event_id')
    selected_event = None
    if selected_event_id:
        try:
            selected_event = Event.objects.get(id=selected_event_id)
        except Event.DoesNotExist:
            request.session.pop('selected_event_id', None)
    
    # If no selected event, redirect to event selection
    if not selected_event:
        return redirect('scheduler:event_selection')
    
    # Event-scoped statistics
    stats = {
        'total_attendants': Attendant.objects.count(),
        'total_events': Event.objects.count(),
        'upcoming_events': Event.objects.filter(status=EventStatus.UPCOMING).count(),
        'event_assignments': Assignment.objects.filter(event=selected_event).count(),
        'event_attendants': Assignment.objects.filter(event=selected_event).values('attendant').distinct().count(),
    }
    
    # Recent activity
    recent_attendants = Attendant.objects.order_by('-created_at')[:5]
    recent_events = Event.objects.order_by('-created_at')[:5]
    recent_assignments = Assignment.objects.select_related('attendant', 'event').order_by('-created_at')[:10]
    
    # User-specific data based on role
    user_data = {}
    if request.user.role in [UserRole.OVERSEER, UserRole.ASSISTANT_OVERSEER]:
        user_data['overseer_assignments'] = OverseerAssignment.objects.filter(
            overseer=request.user
        ).select_related('event', 'department', 'station_range')[:5]
    
    context = {
        'selected_event': selected_event,
        'stats': stats,
        'recent_attendants': recent_attendants,
        'recent_events': recent_events,
        'recent_assignments': recent_assignments,
        'user_data': user_data,
    }
    
    return render(request, 'scheduler/dashboard.html', context)


@login_required
def attendant_create(request):
    """Create a new attendant for the selected event"""
    # Get selected event from session
    selected_event_id = request.session.get('selected_event_id')
    selected_event = None
    if selected_event_id:
        try:
            selected_event = Event.objects.get(id=selected_event_id)
        except Event.DoesNotExist:
            request.session.pop('selected_event_id', None)

    # If no selected event, redirect to event selection
    if not selected_event:
        messages.warning(request, 'Please select an event first.')
        return redirect('scheduler:event_selection')

    if request.method == 'POST':
        form = AttendantForm(request.POST)
        if form.is_valid():
            attendant = form.save()
            # Associate attendant with selected event
            attendant.events.add(selected_event)
            messages.success(request, f'Attendant {attendant.get_full_name()} created successfully for {selected_event.name}.')
            return redirect('scheduler:attendant_detail', attendant_id=attendant.id)
    else:
        form = AttendantForm()
    
    context = {
        'form': form,
        'title': f'Add New Attendant - {selected_event.name}',
        'selected_event': selected_event,
    }
    return render(request, 'scheduler/attendant_form.html', context)


@login_required
@user_passes_test(is_not_attendant)
def attendant_list(request):
    """List attendants with event-scoped filtering and pagination - restricted access"""
    # Block attendant users from accessing this view
    if request.user.role == UserRole.ATTENDANT:
        messages.error(request, 'Access denied. You do not have permission to view all attendants.')
        return redirect('scheduler:attendant_dashboard')
    
    # Get selected event from session
    selected_event_id = request.session.get('selected_event_id')
    selected_event = None
    if selected_event_id:
        try:
            selected_event = Event.objects.get(id=selected_event_id)
        except Event.DoesNotExist:
            request.session.pop('selected_event_id', None)
    
    # If no selected event, redirect to event selection
    if not selected_event:
        return redirect('scheduler:event_selection')
    
    # Get attendants - event-scoped by default
    show_inactive = request.GET.get('show_inactive', 'false').lower() == 'true'
    show_all_attendants = request.GET.get('show_all', 'false').lower() == 'true'
    
    if show_all_attendants:
        # Show all attendants (admin override)
        attendants = Attendant.objects.all().order_by('last_name', 'first_name')
    else:
        # Show only attendants for the selected event (default behavior)
        attendants = Attendant.objects.filter(event=selected_event).order_by('last_name', 'first_name')
    
    # Filter out attendants with management roles using Python filtering
    # since SQLite doesn't support JSON contains operations well
    management_roles = {'keyman', 'overseer', 'assistant_overseer', 'other_department'}
    attendant_ids_to_exclude = []
    
    for attendant in attendants:
        if attendant.serving_as and any(role in attendant.serving_as for role in management_roles):
            attendant_ids_to_exclude.append(attendant.id)
    
    attendants = attendants.exclude(id__in=attendant_ids_to_exclude)
    
    # Search functionality
    search_query = request.GET.get('search', '')
    if search_query:
        attendants = attendants.filter(
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query) |
            Q(email__icontains=search_query) |
            Q(congregation__icontains=search_query)
        )
    
    # Filter by serving position (using Python filtering for SQLite compatibility)
    serving_as_filter = request.GET.get('serving_as', '')
    if serving_as_filter:
        filtered_ids = []
        for attendant in attendants:
            if attendant.serving_as and serving_as_filter in attendant.serving_as:
                filtered_ids.append(attendant.id)
        attendants = attendants.filter(id__in=filtered_ids)
    
    # Remove experience level filter (field was removed)
    experience_filter = ''  # Set to empty string for template compatibility
    
    # Filter by congregation
    congregation_filter = request.GET.get('congregation', '')
    if congregation_filter:
        attendants = attendants.filter(congregation__icontains=congregation_filter)
    
    # Advanced filters
    has_phone_filter = request.GET.get('has_phone', '')
    if has_phone_filter == 'yes':
        attendants = attendants.exclude(phone__isnull=True).exclude(phone='')
    elif has_phone_filter == 'no':
        attendants = attendants.filter(Q(phone__isnull=True) | Q(phone=''))
    
    has_emergency_contact_filter = request.GET.get('has_emergency_contact', '')
    if has_emergency_contact_filter == 'yes':
        attendants = attendants.exclude(emergency_contact__isnull=True).exclude(emergency_contact='')
    elif has_emergency_contact_filter == 'no':
        attendants = attendants.filter(Q(emergency_contact__isnull=True) | Q(emergency_contact=''))
    
    preferred_positions_filter = request.GET.get('preferred_positions', '')
    if preferred_positions_filter:
        attendants = attendants.filter(preferred_positions__icontains=preferred_positions_filter)
    
    # Pagination
    paginator = Paginator(attendants, 25)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'selected_event': selected_event,
        'search_query': search_query,
        'serving_as_filter': serving_as_filter,
        'experience_filter': experience_filter,
        'congregation_filter': congregation_filter,
        'has_phone_filter': has_phone_filter,
        'has_emergency_contact_filter': has_emergency_contact_filter,
        'preferred_positions_filter': preferred_positions_filter,
        'show_inactive': show_inactive,
        'show_all_attendants': show_all_attendants,
    }
    
    return render(request, 'scheduler/attendant_list.html', context)


@login_required
def attendant_detail(request, attendant_id):
    """View attendant details and assignments - role-based access"""
    attendant = get_object_or_404(Attendant, id=attendant_id)
    
    # Attendant users can only view their own profile
    if request.user.role == UserRole.ATTENDANT:
        try:
            if request.user.attendant_profile != attendant:
                messages.error(request, 'Access denied. You can only view your own profile.')
                return redirect('scheduler:attendant_dashboard')
        except:
            messages.error(request, 'Access denied.')
            return redirect('scheduler:attendant_dashboard')
    
    assignments = Assignment.objects.filter(attendant=attendant).select_related('event').order_by('-shift_start')
    
    context = {
        'attendant': attendant,
        'assignments': assignments,
    }
    
    return render(request, 'scheduler/attendant_detail.html', context)


@login_required
def event_list(request):
    """List all events"""
    events = Event.objects.all().order_by('-start_date')
    
    # Search functionality
    search_query = request.GET.get('search', '')
    if search_query:
        events = events.filter(
            models.Q(name__icontains=search_query) |
            models.Q(location__icontains=search_query) |
            models.Q(description__icontains=search_query)
        )
    
    # Date range filtering
    date_range_filter = request.GET.get('date_range', 'all')
    now = timezone.now().date()
    if date_range_filter == 'upcoming':
        events = events.filter(start_date__gte=now)
    elif date_range_filter == 'this_month':
        start_of_month = now.replace(day=1)
        if now.month == 12:
            end_of_month = start_of_month.replace(year=now.year + 1, month=1) - timedelta(days=1)
        else:
            end_of_month = start_of_month.replace(month=now.month + 1) - timedelta(days=1)
        events = events.filter(start_date__range=[start_of_month, end_of_month])
    elif date_range_filter == 'next_month':
        if now.month == 12:
            next_month_start = now.replace(year=now.year + 1, month=1, day=1)
            next_month_end = next_month_start.replace(month=2) - timedelta(days=1)
        else:
            next_month_start = now.replace(month=now.month + 1, day=1)
            if now.month == 11:
                next_month_end = next_month_start.replace(year=now.year + 1, month=1) - timedelta(days=1)
            else:
                next_month_end = next_month_start.replace(month=now.month + 2) - timedelta(days=1)
        events = events.filter(start_date__range=[next_month_start, next_month_end])
    elif date_range_filter == 'past':
        events = events.filter(end_date__lt=now)
    
    # Advanced filters
    event_type_filter = request.GET.get('event_type', '')
    if event_type_filter:
        events = events.filter(event_type=event_type_filter)
    
    min_stations_filter = request.GET.get('min_stations', '')
    if min_stations_filter:
        try:
            min_stations = int(min_stations_filter)
            events = events.filter(total_stations__gte=min_stations)
        except ValueError:
            pass
    
    location_search_filter = request.GET.get('location_search', '')
    if location_search_filter:
        events = events.filter(location__icontains=location_search_filter)
    
    # Pagination
    paginator = Paginator(events, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search_query': search_query,
        'status_filter': status_filter,
        'type_filter': type_filter,
        'date_range_filter': date_range_filter,
        'event_type_filter': event_type_filter,
        'min_stations_filter': min_stations_filter,
        'location_search_filter': location_search_filter,
    }
def attendant_edit(request, attendant_id):
    """Edit an existing attendant"""
    attendant = get_object_or_404(Attendant, id=attendant_id)
    
    if request.method == 'POST':
        form = AttendantForm(request.POST, instance=attendant)
        if form.is_valid():
            attendant = form.save()
            messages.success(request, f'Attendant {attendant.get_full_name()} updated successfully.')
            return redirect('scheduler:attendant_detail', attendant_id=attendant.id)
    else:
        form = AttendantForm(instance=attendant)
    
    return render(request, 'scheduler/attendant_form.html', {
        'form': form, 
        'title': f'Edit {attendant.get_full_name()}',
        'attendant': attendant
    })


@login_required
def import_attendants(request):
    # Get selected event from session
    selected_event_id = request.session.get('selected_event_id')
    selected_event = None
    if selected_event_id:
        try:
            selected_event = Event.objects.get(id=selected_event_id)
        except Event.DoesNotExist:
            request.session.pop('selected_event_id', None)

    # If no selected event, redirect to event selection
    if not selected_event:
        return redirect('scheduler:event_selection')

    if request.method == 'POST':
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            messages.error(request, 'Please select a CSV file to upload.')
            return render(request, 'scheduler/import_attendants.html', {'selected_event': selected_event})
        
        if not csv_file.name.endswith('.csv'):
            messages.error(request, 'Please upload a CSV file.')
            return render(request, 'scheduler/import_attendants.html', {'selected_event': selected_event})
        
        try:
            # Read and process CSV
            csv_data = csv_file.read().decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(csv_data))
            
            created_count = 0
            updated_count = 0
            error_count = 0
            errors = []
            
            for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 because row 1 is headers
                try:
                    # Extract data from CSV row
                    first_name = row.get('First Name', '').strip()
                    last_name = row.get('Last Name', '').strip()
                    email = row.get('Email', '').strip().lower()
                    
                    if not first_name or not last_name:
                        errors.append(f'Row {row_num}: First Name and Last Name are required')
                        error_count += 1
                        continue
                    
                    # Parse serving_as field
                    serving_as_str = row.get('Serving As', '').strip()
                    serving_as = []
                    if serving_as_str:
                        # Split by comma and clean up
                        positions = [pos.strip().lower().replace(' ', '_') for pos in serving_as_str.split(',')]
                        # Map common variations
                        position_map = {
                            'elder': 'elder',
                            'ministerial_servant': 'ministerial_servant',
                            'ms': 'ministerial_servant',
                            'regular_pioneer': 'regular_pioneer',
                            'rp': 'regular_pioneer',
                            'auxiliary_pioneer': 'auxiliary_pioneer',
                            'ap': 'auxiliary_pioneer',
                            'publisher': 'publisher',
                            'exemplary': 'exemplary',
                            'keyman': 'keyman',
                            'overseer': 'overseer',
                            'assistant_overseer': 'assistant_overseer',
                            'other_department': 'other_department'
                        }
                        serving_as = [position_map.get(pos, 'publisher') for pos in positions]
                    
                    if not serving_as:
                        serving_as = ['publisher']
                    
                    # Try to find existing attendant by email first, then by name
                    attendant = None
                    if email:
                        try:
                            attendant = Attendant.objects.get(email=email)
                        except Attendant.DoesNotExist:
                            pass
                    
                    if not attendant:
                        # Try to find by name
                        try:
                            attendant = Attendant.objects.get(
                                first_name__iexact=first_name,
                                last_name__iexact=last_name
                            )
                        except Attendant.DoesNotExist:
                            pass
                        except Attendant.MultipleObjectsReturned:
                            # If multiple found, use the first one
                            attendant = Attendant.objects.filter(
                                first_name__iexact=first_name,
                                last_name__iexact=last_name
                            ).first()
                    
                    if attendant:
                        # Update existing attendant
                        attendant.phone = row.get('Phone', '').strip()
                        attendant.congregation = row.get('Congregation', '').strip()
                        attendant.serving_as = serving_as
                        attendant.availability_notes = row.get('Availability Notes', '').strip()
                        attendant.save()
                        # Associate with selected event (many-to-many)
                        attendant.events.add(selected_event)
                        updated_count += 1
                    else:
                        # Create new attendant
                        attendant = Attendant.objects.create(
                            first_name=first_name,
                            last_name=last_name,
                            email=email,
                            phone=row.get('Phone', '').strip(),
                            congregation=row.get('Congregation', '').strip(),
                            serving_as=serving_as,
                            availability_notes=row.get('Availability Notes', '').strip(),
                        )
                        # Associate with selected event (many-to-many)
                        attendant.events.add(selected_event)
                        created_count += 1
                        
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
                    error_count += 1
            
            # Show results
            if created_count > 0:
                messages.success(request, f'Successfully created {created_count} new attendants.')
            if updated_count > 0:
                messages.success(request, f'Successfully updated {updated_count} existing attendants.')
            if skipped_count > 0:
                messages.info(request, f'Skipped {skipped_count} attendants (no changes detected).')
            if error_count > 0:
                # Show first few errors as examples
                error_sample = errors[:10]  # Show first 10 errors
                error_msg = f'Encountered {error_count} errors during import.\n' + '\n'.join(error_sample)
                if len(errors) > 10:
                    error_msg += f'\n... and {len(errors) - 10} more errors.'
                messages.error(request, error_msg)
                
                # Show duplicate emails found in CSV
                if csv_duplicates:
                    dup_msg = f'Duplicate emails found in CSV file: {", ".join(sorted(csv_duplicates))}'
                    messages.warning(request, dup_msg)
            return redirect('scheduler:event_detail', event_id=selected_event.id)
            
        except Exception as e:
            messages.error(request, f'Error processing CSV file: {str(e)}')
            return redirect('scheduler:import_attendants')
    
    return render(request, 'scheduler/import_attendants.html', {
        'selected_event': selected_event
    })


@login_required
def download_sample_csv(request):
    """Download a sample CSV file for attendant import"""
    import csv
    from django.http import HttpResponse
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="attendants_sample.csv"'
    
    writer = csv.writer(response)
    writer.writerow([
        'First Name', 'Last Name', 'Email', 'Phone', 'Congregation', 
        'Serving As', 'Preferred Positions', 'Emergency Contact', 'Emergency Phone'
    ])
    
    # Add sample data rows
    writer.writerow([
        'John', 'Smith', 'john.smith@example.com', '555-0101', 'North Congregation',
        'Elder, Regular Pioneer', 'Security, Gate', 'Jane Smith', '555-0102'
    ])
    writer.writerow([
        'Mary', 'Johnson', 'mary.johnson@example.com', '555-0201', 'South Congregation',
        'Auxiliary Pioneer', 'Information Desk, First Aid', 'Bob Johnson', '555-0202'
    ])
    writer.writerow([
        'David', 'Brown', 'david.brown@example.com', '555-0301', 'East Congregation',
        'Ministerial Servant', 'Parking, Ushering', 'Sarah Brown', '555-0302'
    ])
    writer.writerow([
        'Lisa', 'Davis', 'lisa.davis@example.com', '555-0401', 'West Congregation',
        'Publisher, Exemplary', 'General', 'Mike Davis', '555-0402'
    ])
    
    return response


@login_required
@user_passes_test(is_not_attendant)
def lanyard_tracking(request):
    """Event-scoped lanyard tracking page for managing badge assignments"""
    # Get selected event from session
    selected_event_id = request.session.get('selected_event_id')
    selected_event = None
    if selected_event_id:
        try:
            selected_event = Event.objects.get(id=selected_event_id)
        except Event.DoesNotExist:
            request.session.pop('selected_event_id', None)
    
    # If no selected event, redirect to event selection
    if not selected_event:
        return redirect('scheduler:event_selection')
    
    # Get or create lanyard assignments for selected event
    lanyard_assignments = []
    # Initialize 100 badge numbers if they don't exist
    existing_badges = set(LanyardAssignment.objects.filter(event=selected_event).values_list('badge_number', flat=True))
    for badge_num in range(1, 101):
        if badge_num not in existing_badges:
            LanyardAssignment.objects.create(
                event=selected_event,
                badge_number=badge_num
            )
    
    lanyard_assignments = LanyardAssignment.objects.filter(event=selected_event).order_by('badge_number')
    
    # Get attendants assigned to this event for dropdown
    event_attendants = Attendant.objects.filter(
        assignment__event=selected_event
    ).distinct().order_by('last_name', 'first_name')
    
    # Also include all active attendants as backup
    all_active_attendants = Attendant.objects.filter(is_active=True).order_by('last_name', 'first_name')
    
    context = {
        'selected_event': selected_event,
        'lanyard_assignments': lanyard_assignments,
        'event_attendants': event_attendants,
        'all_active_attendants': all_active_attendants,
    }
    return render(request, 'scheduler/lanyard_tracking.html', context)


@login_required
@require_POST
def assign_lanyard(request):
    """Assign or unassign a lanyard to an attendant"""
    assignment_id = request.POST.get('assignment_id')
    attendant_id = request.POST.get('attendant_id')
    
    try:
        assignment = LanyardAssignment.objects.get(id=assignment_id)
        
        if attendant_id:
            attendant = Attendant.objects.get(id=attendant_id)
            assignment.attendant = attendant
            if not assignment.checked_out:
                assignment.checked_out = True
                assignment.checked_out_at = timezone.now()
        else:
            assignment.attendant = None
            assignment.checked_out = False
            assignment.checked_out_at = None
            assignment.returned = False
            assignment.returned_at = None
        
        assignment.save()
        
        return JsonResponse({
            'success': True,
            'attendant_name': assignment.attendant.get_full_name() if assignment.attendant else '',
            'attendant_phone': assignment.attendant.phone if assignment.attendant else '',
            'checked_out': assignment.checked_out,
            'returned': assignment.returned
        })
    
    except (LanyardAssignment.DoesNotExist, Attendant.DoesNotExist):
        return JsonResponse({'success': False, 'error': 'Invalid assignment or attendant'})


@login_required
@require_POST
def toggle_lanyard_status(request):
    """Toggle check-out/return status of a lanyard"""
    assignment_id = request.POST.get('assignment_id')
    action = request.POST.get('action')  # 'checkout' or 'return'
    
    try:
        assignment = LanyardAssignment.objects.get(id=assignment_id)
        
        if action == 'checkout':
            assignment.checked_out = True
            assignment.checked_out_at = timezone.now()
        elif action == 'return':
            assignment.returned = True
            assignment.returned_at = timezone.now()
        elif action == 'undo_checkout':
            assignment.checked_out = False
            assignment.checked_out_at = None
        elif action == 'undo_return':
            assignment.returned = False
            assignment.returned_at = None
        
        assignment.save()
        
        return JsonResponse({
            'success': True,
            'checked_out': assignment.checked_out,
            'returned': assignment.returned
        })
    
    except LanyardAssignment.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Invalid assignment'})


@login_required
def export_attendants(request):
    """Export attendants in various formats"""
    format_type = request.GET.get('format', 'csv')
    attendants = Attendant.objects.all().order_by('last_name', 'first_name')
    
    # Apply filters if provided
    search = request.GET.get('search')
    if search:
        attendants = attendants.filter(
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(email__icontains=search) |
            Q(congregation__icontains=search)
        )
    
    serving_as = request.GET.get('serving_as')
    if serving_as:
        attendants = attendants.filter(serving_as__contains=[serving_as])
    
    if format_type == 'excel':
        from .utils import export_attendants_excel
        return export_attendants_excel(attendants)
    else:
        from .utils import export_attendants_csv
        return export_attendants_csv(attendants)


@login_required
def export_events(request):
    """Export events in CSV format"""
    events = Event.objects.all().order_by('-start_date')
    
    # Apply filters if provided
    search = request.GET.get('search')
    if search:
        events = events.filter(
            Q(name__icontains=search) |
            Q(location__icontains=search)
        )
    
    status = request.GET.get('status')
    if status:
        events = events.filter(status=status)
    
    from .utils import export_events_csv
    return export_events_csv(events)


@login_required
def export_assignments(request):
    """Export assignments in various formats"""
    format_type = request.GET.get('format', 'csv')
    assignments = Assignment.objects.all().select_related('attendant', 'event').order_by('-created_at')
    
    # Apply filters if provided
    event_id = request.GET.get('event')
    if event_id:
        assignments = assignments.filter(event_id=event_id)
    
    attendant_id = request.GET.get('attendant')
    if attendant_id:
        assignments = assignments.filter(attendant_id=attendant_id)
    
    if format_type == 'pdf':
        from .utils import export_assignments_pdf
        return export_assignments_pdf(assignments)
    elif format_type == 'excel':
        from .utils import export_assignments_excel
        return export_assignments_excel(assignments)
    else:
        from .utils import export_assignments_csv
        return export_assignments_csv(assignments)


@login_required
def export_event_schedule(request, event_id):
    """Export detailed event schedule as PDF"""
    event = get_object_or_404(Event, id=event_id)
    from .utils import export_event_schedule_pdf
    return export_event_schedule_pdf(event)


@login_required
@user_passes_test(is_staff_or_superuser)
@csrf_protect
@require_POST
def delete_attendant(request, attendant_id):
    """Delete an attendant (staff/superuser only)"""
    attendant = get_object_or_404(Attendant, id=attendant_id)
    
    try:
        attendant_name = attendant.get_full_name()
        attendant.delete()
        messages.success(request, f'Attendant {attendant_name} has been deleted successfully.')
    except Exception as e:
        messages.error(request, f'Error deleting attendant: {str(e)}')
    
    return redirect('scheduler:attendant_list')


@login_required
@user_passes_test(lambda u: u.is_staff or u.is_superuser or getattr(u, 'role', None) == 'admin')
def user_edit(request, user_id):
    """Admin-only user editing - not event-scoped"""
    user_obj = get_object_or_404(User, id=user_id)
    
    if request.method == 'POST':
        # Update user fields
        user_obj.username = request.POST.get('username', user_obj.username)
        user_obj.email = request.POST.get('email', user_obj.email)
        user_obj.first_name = request.POST.get('first_name', user_obj.first_name)
        user_obj.last_name = request.POST.get('last_name', user_obj.last_name)
        user_obj.role = request.POST.get('role', user_obj.role)
        user_obj.is_active = 'is_active' in request.POST
        user_obj.is_staff = 'is_staff' in request.POST
        
        try:
            user_obj.save()
            messages.success(request, f'User {user_obj.username} updated successfully.')
        except Exception as e:
            messages.error(request, f'Error updating user: {str(e)}')
        
        return redirect('scheduler:user_edit', user_id=user_id)
    
    # Get available attendants (not linked to other users)
    available_attendants = Attendant.objects.filter(user__isnull=True)
    
    # Find suggested attendants based on name/email matching
    suggested_attendants = []
    if user_obj.first_name and user_obj.last_name:
        suggested_attendants = Attendant.objects.filter(
            user__isnull=True,
            first_name__iexact=user_obj.first_name,
            last_name__iexact=user_obj.last_name
        )[:3]
    
    if not suggested_attendants and user_obj.email:
        suggested_attendants = Attendant.objects.filter(
            user__isnull=True,
            email__iexact=user_obj.email
        )[:3]
    
    context = {
        'user_obj': user_obj,
        'available_attendants': available_attendants,
        'suggested_attendants': suggested_attendants,
    }
    
    return render(request, 'scheduler/user_edit.html', context)


@login_required
@user_passes_test(lambda u: u.is_staff or u.is_superuser or getattr(u, 'role', None) == 'admin')
def user_delete(request, user_id):
    """Admin-only user deletion"""
    user_obj = get_object_or_404(User, id=user_id)
    
    # Prevent self-deletion
    if user_obj == request.user:
        messages.error(request, 'You cannot delete your own account.')
        return redirect('scheduler:user_list')
    
    if request.method == 'POST':
        username = user_obj.username
        try:
            user_obj.delete()
            messages.success(request, f'User {username} deleted successfully.')
        except Exception as e:
            messages.error(request, f'Error deleting user: {str(e)}')
        
        return redirect('scheduler:user_list')
    
    return redirect('scheduler:user_list')


@login_required
@user_passes_test(is_staff_or_superuser)
@csrf_protect
@require_POST
def link_attendant(request, user_id):
    """Link an attendant to a user"""
    user_obj = get_object_or_404(User, id=user_id)
    attendant_id = request.POST.get('attendant_id')
    
    if attendant_id:
        try:
            attendant = get_object_or_404(Attendant, id=attendant_id)
            if attendant.user:
                messages.error(request, f'Attendant {attendant.get_full_name()} is already linked to another user.')
            else:
                attendant.user = user_obj
                attendant.save()
                messages.success(request, f'Successfully linked {attendant.get_full_name()} to user {user_obj.username}.')
        except Exception as e:
            messages.error(request, f'Error linking attendant: {str(e)}')
    
    return redirect('scheduler:user_edit', user_id=user_id)


@login_required
@user_passes_test(is_staff_or_superuser)
@csrf_protect
@require_POST
def unlink_attendant(request, user_id):
    """Unlink an attendant from a user"""
    user_obj = get_object_or_404(User, id=user_id)
    
    try:
        if user_obj.attendant_profile:
            attendant_name = user_obj.attendant_profile.get_full_name()
            user_obj.attendant_profile.user = None
            user_obj.attendant_profile.save()
            messages.success(request, f'Successfully unlinked {attendant_name} from user {user_obj.username}.')
        else:
            messages.warning(request, 'No attendant is linked to this user.')
    except Exception as e:
        messages.error(request, f'Error unlinking attendant: {str(e)}')
    
    return redirect('scheduler:user_edit', user_id=user_id)


@login_required
def delete_user(request, user_id):
    """Delete a user (admin/overseer only)"""
    # Check permissions
    if not (request.user.role in ['admin', 'overseer'] or request.user.is_admin or request.user.is_staff or request.user.is_superuser):
        messages.error(request, 'You do not have permission to delete users.')
        return redirect('scheduler:user_list')
    
    if request.method != 'POST':
        messages.error(request, 'Invalid request method.')
        return redirect('scheduler:user_list')
    
    user_obj = get_object_or_404(User, id=user_id)
    
    # Prevent self-deletion
    if user_obj == request.user:
        messages.error(request, 'You cannot delete your own account.')
        return redirect('scheduler:user_list')
    
    try:
        username = user_obj.username
        # Unlink attendant if exists
        if hasattr(user_obj, 'attendant_profile') and user_obj.attendant_profile:
            user_obj.attendant_profile.user = None
            user_obj.attendant_profile.save()
        
        user_obj.delete()
        messages.success(request, f'User {username} has been deleted successfully.')
    except Exception as e:
        messages.error(request, f'Error deleting user: {str(e)}')
    
    return redirect('scheduler:user_list')


@login_required
@user_passes_test(lambda u: u.is_staff or u.is_superuser or getattr(u, 'role', None) == 'admin')
def user_create(request):
    """Admin-only user creation - not event-scoped"""
    if request.method == 'POST':
        form = UserCreateForm(request.POST)
        if form.is_valid():
            user = form.save()
            messages.success(request, f'User {user.username} created successfully.')
            return redirect('scheduler:user_list')
    else:
        form = UserCreateForm()
    
    return render(request, 'scheduler/user_create.html', {
        'form': form,
        'title': 'Create New User'
    })


@login_required
@user_passes_test(lambda u: u.is_staff or any(role in getattr(u.attendant_profile, 'serving_as', []) for role in ['overseer', 'assistant_overseer', 'keyman']))
@csrf_protect
@require_POST
def toggle_attendant_status(request, attendant_id):
    """Toggle attendant active/inactive status (management roles only)"""
    attendant = get_object_or_404(Attendant, id=attendant_id)
    
    try:
        attendant.is_active = not attendant.is_active
        attendant.save()
        
        status = "activated" if attendant.is_active else "deactivated"
        messages.success(request, f'Attendant {attendant.get_full_name()} has been {status}.')
    except Exception as e:
        messages.error(request, f'Error updating attendant status: {str(e)}')
    
    return redirect('scheduler:attendant_list')


@login_required
def attendant_dashboard(request):
    """Personal dashboard for attendant users - shows only their own data with proper isolation"""
    # Ensure only attendant users can access this view
    if request.user.role != UserRole.ATTENDANT:
        messages.error(request, 'Access denied. This page is for attendant users only.')
        return redirect('scheduler:dashboard')
    
    # Get the attendant profile for this user
    try:
        attendant = request.user.attendant_profile
        if not attendant:
            messages.warning(request, 'Your account is not linked to an attendant profile. Please contact an administrator.')
            return render(request, 'scheduler/attendant_dashboard.html', {'no_profile': True})
    except AttributeError:
        messages.warning(request, 'Your account is not linked to an attendant profile. Please contact an administrator.')
        return render(request, 'scheduler/attendant_dashboard.html', {'no_profile': True})
    
    # Get assignments for this attendant ONLY (strict data isolation)
    all_assignments = Assignment.objects.filter(
        attendant=attendant
    ).select_related('event').order_by('shift_start')
    
    # Categorize assignments by time
    now = timezone.now()
    current_assignments = all_assignments.filter(
        shift_start__lte=now,
        shift_end__gte=now
    )
    
    upcoming_assignments = all_assignments.filter(
        shift_start__gt=now
    ).order_by('shift_start')[:5]
    
    recent_assignments = all_assignments.filter(
        shift_end__lt=now
    ).order_by('-shift_end')[:10]
    
    # Get events this attendant is assigned to ONLY (their events only)
    assigned_events = attendant.events.all().order_by('-start_date')
    
    # Get oversight information for this attendant
    oversight_info = None
    try:
        attendant_oversight = AttendantOverseerAssignment.objects.filter(
            attendant=attendant
        ).select_related(
            'overseer_assignment__overseer',
            'overseer_assignment__department',
            'overseer_assignment__station_range'
        ).first()
        
        if attendant_oversight:
            oversight_info = attendant_oversight.overseer_assignment
    except:
        pass
    
    # Calculate statistics (only for this attendant's data)
    attendant_stats = {
        'total_assignments': all_assignments.count(),
        'current_assignments': current_assignments.count(),
        'upcoming_assignments': upcoming_assignments.count(),
        'events_assigned': assigned_events.count(),
    }
    
    context = {
        'attendant': attendant,
        'current_assignments': current_assignments,
        'upcoming_assignments': upcoming_assignments,
        'recent_assignments': recent_assignments,
        'assigned_events': assigned_events,
        'oversight_info': oversight_info,
        'stats': attendant_stats,
    }
    
    return render(request, 'scheduler/attendant_dashboard.html', context)


@login_required
def attendant_profile(request):
    """Allow attendant users to view and edit their own profile information only"""
    # Ensure only attendant users can access this view
    if request.user.role != UserRole.ATTENDANT:
        messages.error(request, 'Access denied. This page is for attendant users only.')
        return redirect('scheduler:dashboard')
    
    try:
        attendant = request.user.attendant_profile
        if not attendant:
            messages.error(request, 'Your account is not linked to an attendant profile. Please contact an administrator.')
            return redirect('scheduler:attendant_dashboard')
    except:
        messages.error(request, 'Your account is not linked to an attendant profile. Please contact an administrator.')
        return redirect('scheduler:attendant_dashboard')
    
    if request.method == 'POST':
        try:
            # Allow attendants to update limited profile fields only
            attendant.phone = request.POST.get('phone', '').strip()
            attendant.emergency_contact_name = request.POST.get('emergency_contact_name', '').strip()
            attendant.emergency_contact_phone = request.POST.get('emergency_contact_phone', '').strip()
            attendant.notes = request.POST.get('notes', '').strip()
            attendant.save()
            
            messages.success(request, 'Your profile has been updated successfully.')
            return redirect('scheduler:attendant_profile')
            
        except Exception as e:
            messages.error(request, f'Error updating profile: {str(e)}')
    
    context = {
        'attendant': attendant,
        'user': request.user,
    }
    
    return render(request, 'scheduler/attendant_profile.html', context)


# Oversight Management Views

@login_required
@user_passes_test(lambda u: u.role in ['admin', 'overseer'] or u.is_staff)
def department_list(request):
    """List all departments"""
    departments = Department.objects.all().order_by('name')
    
    context = {
        'departments': departments,
    }
    
    return render(request, 'scheduler/department_list.html', context)


@login_required
@user_passes_test(lambda u: u.role in ['admin', 'overseer'] or u.is_staff)
def department_create(request):
    """Create a new department"""
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        description = request.POST.get('description', '').strip()
        
        if name:
            Department.objects.create(name=name, description=description)
            messages.success(request, f'Department "{name}" created successfully.')
            return redirect('scheduler:department_list')
        else:
            messages.error(request, 'Department name is required.')
    
    return render(request, 'scheduler/department_form.html', {
        'title': 'Create Department'
    })


@login_required
@user_passes_test(lambda u: u.role in ['admin', 'overseer'] or u.is_staff)
def overseer_assignment_create(request):
    """Create overseer assignment for selected event"""
    selected_event_id = request.session.get('selected_event_id')
    if not selected_event_id:
        messages.warning(request, 'Please select an event first.')
        return redirect('scheduler:event_selection')
    
    selected_event = get_object_or_404(Event, id=selected_event_id)
    
    if request.method == 'POST':
        overseer_id = request.POST.get('overseer')
        department_id = request.POST.get('department')
        station_range_id = request.POST.get('station_range')
        
        try:
            overseer = get_object_or_404(User, id=overseer_id)
            department = Department.objects.get(id=department_id) if department_id else None
            station_range = StationRange.objects.get(id=station_range_id) if station_range_id else None
            
            # Check if overseer already has assignment for this event
            existing = OverseerAssignment.objects.filter(
                overseer=overseer, event=selected_event
            ).first()
            
            if existing:
                messages.error(request, f'{overseer.get_full_name()} already has an assignment for this event.')
            else:
                OverseerAssignment.objects.create(
                    overseer=overseer,
                    event=selected_event,
                    department=department,
                    station_range=station_range
                )
                messages.success(request, f'Overseer assignment created for {overseer.get_full_name()}.')
                return redirect('scheduler:oversight_dashboard')
        except Exception as e:
            messages.error(request, f'Error creating assignment: {str(e)}')
    
    # Get available overseers
    overseers = User.objects.filter(
        role__in=[UserRole.OVERSEER, UserRole.ASSISTANT_OVERSEER]
    ).order_by('last_name', 'first_name')
    
    departments = Department.objects.all().order_by('name')
    station_ranges = StationRange.objects.all().order_by('start_station')
    
    context = {
        'selected_event': selected_event,
        'overseers': overseers,
        'departments': departments,
        'station_ranges': station_ranges,
        'title': 'Create Overseer Assignment'
    }
    
    return render(request, 'scheduler/overseer_assignment_form.html', context)


# PDF Generation Views

@login_required
def export_schedule_pdf(request):
    """Export schedule as PDF for selected event"""
    selected_event_id = request.session.get('selected_event_id')
    if not selected_event_id:
        messages.warning(request, 'Please select an event first.')
        return redirect('scheduler:event_selection')
    
    selected_event = get_object_or_404(Event, id=selected_event_id)
    
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from io import BytesIO
        
        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        
        # Title
        title = Paragraph(f"Assignment Schedule - {selected_event.name}", title_style)
        elements.append(title)
        elements.append(Spacer(1, 12))
        
        # Event details
        event_info = [
            ['Event:', selected_event.name],
            ['Type:', selected_event.get_event_type_display()],
            ['Date:', f"{selected_event.start_date} to {selected_event.end_date}"],
            ['Location:', selected_event.location or 'TBD'],
        ]
        
        event_table = Table(event_info, colWidths=[1.5*inch, 4*inch])
        event_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(event_table)
        elements.append(Spacer(1, 20))
        
        # Assignments table
        assignments = Assignment.objects.filter(event=selected_event).select_related('attendant').order_by('shift_start', 'position')
        
        if assignments:
            # Table headers
            data = [['Name', 'Position', 'Start Time', 'End Time', 'Duration']]
            
            # Table data
            for assignment in assignments:
                data.append([
                    assignment.attendant.get_full_name(),
                    assignment.position,
                    assignment.shift_start.strftime('%m/%d %H:%M'),
                    assignment.shift_end.strftime('%H:%M'),
                    f"{assignment.get_duration_hours()}h"
                ])
            
            # Create table
            table = Table(data, colWidths=[2*inch, 1.5*inch, 1*inch, 1*inch, 0.8*inch])
            table.setStyle(TableStyle([
                # Header row
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                
                # Data rows
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                
                # Alternating row colors
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            
            elements.append(table)
        else:
            no_assignments = Paragraph("No assignments found for this event.", styles['Normal'])
            elements.append(no_assignments)
        
        # Build PDF
        doc.build(elements)
        
        # Return PDF response
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="schedule_{selected_event.name.replace(" ", "_")}.pdf"'
        
        return response
        
    except ImportError:
        messages.error(request, 'PDF generation requires reportlab package. Please install it: pip install reportlab')
        return redirect('scheduler:reports')
    except Exception as e:
        messages.error(request, f'Error generating PDF: {str(e)}')
        return redirect('scheduler:reports')


@login_required
def export_attendant_list_pdf(request):
    """Export attendant list as PDF for selected event"""
    selected_event_id = request.session.get('selected_event_id')
    if not selected_event_id:
        messages.warning(request, 'Please select an event first.')
        return redirect('scheduler:event_selection')
    
    selected_event = get_object_or_404(Event, id=selected_event_id)
    
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from io import BytesIO
        
        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        
        # Title
        title = Paragraph(f"Attendant List - {selected_event.name}", title_style)
        elements.append(title)
        elements.append(Spacer(1, 12))
        
        # Attendants table
        attendants = Attendant.objects.filter(events=selected_event).order_by('last_name', 'first_name')
        
        if attendants:
            # Table headers
            data = [['Name', 'Congregation', 'Phone', 'Serving As', 'Experience']]
            
            # Table data
            for attendant in attendants:
                data.append([
                    attendant.get_full_name(),
                    attendant.congregation,
                    attendant.phone or 'N/A',
                    attendant.get_serving_as_display(),
                    attendant.get_experience_level_display()
                ])
            
            # Create table
            table = Table(data, colWidths=[1.8*inch, 1.5*inch, 1.2*inch, 1.5*inch, 1*inch])
            table.setStyle(TableStyle([
                # Header row
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                
                # Data rows
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                
                # Alternating row colors
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            
            elements.append(table)
        else:
            no_attendants = Paragraph("No attendants found for this event.", styles['Normal'])
            elements.append(no_attendants)
        
        # Build PDF
        doc.build(elements)
        
        # Return PDF response
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="attendants_{selected_event.name.replace(" ", "_")}.pdf"'
        
        return response
        
    except ImportError:
        messages.error(request, 'PDF generation requires reportlab package. Please install it: pip install reportlab')
        return redirect('scheduler:attendant_list')
    except Exception as e:
        messages.error(request, f'Error generating PDF: {str(e)}')
        return redirect('scheduler:attendant_list')

# Count Session Management Views

@login_required
@require_http_methods(["POST"])
def create_count_session(request, event_id):
    """Create a new count session for an event"""
    try:
        event = get_object_or_404(Event, id=event_id)
        data = json.loads(request.body)
        
        # Parse time string to time object
        time_str = data.get('count_time')
        try:
            count_time = datetime.strptime(time_str, '%H:%M').time()
        except ValueError:
            return JsonResponse({'success': False, 'error': 'Invalid time format. Use HH:MM'})
        
        # Create count session
        session = CountSession.objects.create(
            event=event,
            session_name=data.get('session_name'),
            count_time=count_time,
            notes=data.get('notes', ''),
            is_active=data.get('is_active', True)
        )
        
        return JsonResponse({
            'success': True,
            'session_id': session.id,
            'message': f'Count session "{session.session_name}" created successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON data'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
@require_http_methods(["PUT"])
def update_count_session(request, event_id, session_id):
    """Update an existing count session"""
    try:
        event = get_object_or_404(Event, id=event_id)
        session = get_object_or_404(CountSession, id=session_id, event=event)
        data = json.loads(request.body)
        
        # Parse time string to time object
        time_str = data.get('count_time')
        try:
            count_time = datetime.strptime(time_str, '%H:%M').time()
        except ValueError:
            return JsonResponse({'success': False, 'error': 'Invalid time format. Use HH:MM'})
        
        # Update session
        session.session_name = data.get('session_name', session.session_name)
        session.count_time = count_time
        session.notes = data.get('notes', session.notes)
        session.is_active = data.get('is_active', session.is_active)
        session.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Count session "{session.session_name}" updated successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON data'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
@require_http_methods(["DELETE"])
def delete_count_session(request, event_id, session_id):
    """Delete a count session"""
    try:
        event = get_object_or_404(Event, id=event_id)
        session = get_object_or_404(CountSession, id=session_id, event=event)
        
        session_name = session.session_name
        session.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Count session "{session_name}" deleted successfully'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
