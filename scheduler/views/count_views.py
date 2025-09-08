"""
Count Times Feature - Views
"""

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db import transaction
from django.contrib import messages

from ..models import Event, CountSession, PositionCount, EventPosition, UserRole


@login_required
def count_entry(request, event_id, session_id=None):
    """
    View for entering position counts for a specific count session
    Allows both oversight and attendants to enter counts for their assigned positions
    """
    event = get_object_or_404(Event, id=event_id)
    
    # If no session_id provided, get the latest count session or create one
    if not session_id:
        count_session = event.count_sessions.order_by('-count_time').first()
        if not count_session:
            # No count sessions exist, redirect to event detail
            messages.warning(request, "No count sessions found. Please create a count session first.")
            return redirect('scheduler:event_detail', event_id=event.id)
    else:
        count_session = get_object_or_404(CountSession, id=session_id, event=event)
    
    # Filter positions based on user role
    if request.user.role == UserRole.ATTENDANT:
        # Attendants can only see positions they are assigned to
        from ..models import Assignment
        assigned_positions = Assignment.objects.filter(
            attendant__user=request.user,
            event=event
        ).values_list('position', flat=True)
        
        # Find EventPositions that match assigned position names
        available_positions = event.positions.filter(
            position_name__in=assigned_positions
        )
        
        if not available_positions.exists():
            messages.warning(request, "You are not assigned to any positions for count entry.")
            return redirect('scheduler:attendant_dashboard')
    else:
        # Oversight can see all positions
        available_positions = event.positions.all()
    
    # Get or create position counts for available positions
    position_counts = []
    for position in available_positions:
        position_count, created = PositionCount.objects.get_or_create(
            count_session=count_session,
            position=position,
            defaults={'count': None}
        )
        position_counts.append(position_count)
    
    # Sort position counts by position number
    position_counts.sort(key=lambda pc: pc.position.position_number)
    
    # Handle form submission
    if request.method == 'POST':
        with transaction.atomic():
            for position_count in position_counts:
                count_key = f'count_{position_count.id}'
                notes_key = f'notes_{position_count.id}'
                
                if count_key in request.POST:
                    try:
                        count_value = request.POST.get(count_key)
                        if count_value.strip():
                            position_count.count = int(count_value)
                        else:
                            position_count.count = None
                    except ValueError:
                        position_count.count = None
                
                position_count.notes = request.POST.get(notes_key, '')
                position_count.entered_by = request.user
                position_count.save()
            
            # Update session status - only mark complete if ALL positions have counts
            all_positions_entered = all(
                pc.count is not None 
                for pc in PositionCount.objects.filter(count_session=count_session)
            )
            if all_positions_entered:
                count_session.is_completed = True
                count_session.save()
            
            # Recalculate total count from all positions
            count_session.calculate_total()
        
        # Handle AJAX requests
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'total_count': count_session.total_count or 0,
                'is_completed': count_session.is_completed
            })
        
        messages.success(request, "Count data saved successfully.")
        return redirect('count_entry', event_id=event.id, session_id=count_session.id)
    
    context = {
        'event': event,
        'count_session': count_session,
        'position_counts': position_counts,
    }
    
    return render(request, 'scheduler/count_entry.html', context)


@login_required
@require_http_methods(["POST"])
def create_count_session(request, event_id):
    """Create a new count session for an event"""
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Handle JSON data from frontend
        import json
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            data = request.POST
        
        # Parse time string to time object
        time_str = data.get('count_time')
        try:
            hour, minute = map(int, time_str.split(':'))
            # Use event date or today's date
            count_date = event.start_date if event.start_date else timezone.now().date()
            count_time = timezone.datetime.combine(
                count_date,
                timezone.datetime.min.time().replace(hour=hour, minute=minute)
            )
            # Make timezone aware
            count_time = timezone.make_aware(count_time)
        except (ValueError, AttributeError):
            return JsonResponse({'success': False, 'error': 'Invalid time format. Use HH:MM'})
        
        # Create count session
        session = CountSession.objects.create(
            event=event,
            session_name=data.get('session_name'),
            count_time=count_time,
        )
        
        # Create position counts for all positions
        for position in event.positions.all():
            PositionCount.objects.create(
                count_session=session,
                position=position
            )
        
        return JsonResponse({
            'success': True, 
            'id': session.id,
            'name': session.session_name,
            'time': session.count_time.strftime('%m/%d/%Y %H:%M')
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["PUT", "POST"])
def update_count_session(request, event_id, session_id):
    """Update an existing count session"""
    try:
        event = get_object_or_404(Event, id=event_id)
        session = get_object_or_404(CountSession, id=session_id, event=event)
        
        # Handle JSON data from frontend
        import json
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            data = request.POST
        
        # Parse time string to time object
        time_str = data.get('count_time')
        try:
            hour, minute = map(int, time_str.split(':'))
            # Use existing date or event date
            count_date = session.count_time.date() if session.count_time else event.start_date
            if not count_date:
                count_date = timezone.now().date()
            count_time = timezone.datetime.combine(
                count_date,
                timezone.datetime.min.time().replace(hour=hour, minute=minute)
            )
            # Make timezone aware
            count_time = timezone.make_aware(count_time)
        except (ValueError, AttributeError):
            return JsonResponse({'success': False, 'error': 'Invalid time format. Use HH:MM'})
        
        # Update session
        session.session_name = data.get('session_name')
        session.count_time = count_time
        session.save()
        
        return JsonResponse({
            'success': True, 
            'id': session.id,
            'name': session.session_name,
            'time': session.count_time.strftime('%m/%d/%Y %H:%M')
        })
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
            'message': f'Count session "{session_name}" deleted successfully.'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
def count_reports(request, event_id):
    """View for displaying count reports for an event"""
    event = get_object_or_404(Event, id=event_id)
    
    # Get all count sessions for this event
    count_sessions = event.count_sessions.all().order_by('count_time')
    
    # Get all positions for this event
    positions = event.positions.all().order_by('position_number')
    
    # Build report data structure
    report_data = []
    for position in positions:
        position_data = {
            'position': position,
            'counts': []
        }
        
        for session in count_sessions:
            try:
                position_count = PositionCount.objects.get(
                    count_session=session,
                    position=position
                )
                position_data['counts'].append({
                    'session': session,
                    'count': position_count.count,
                    'notes': position_count.notes
                })
            except PositionCount.DoesNotExist:
                position_data['counts'].append({
                    'session': session,
                    'count': None,
                    'notes': ''
                })
        
        report_data.append(position_data)
    
    context = {
        'event': event,
        'count_sessions': count_sessions,
        'report_data': report_data,
        'total_counts': [session.total_count or 0 for session in count_sessions]
    }
    
    return render(request, 'scheduler/count_reports.html', context)
