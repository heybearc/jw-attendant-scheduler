"""
Dashboard view isolated to avoid circular imports
"""
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
from datetime import datetime, timedelta
from django.utils import timezone


@login_required
def dashboard(request):
    """Main dashboard view"""
    from ..models import Event, Assignment, Attendant, UserRole
    
    # Get current event from session
    current_event_id = request.session.get('current_event_id')
    current_event = None
    if current_event_id:
        try:
            current_event = Event.objects.get(id=current_event_id)
        except Event.DoesNotExist:
            pass
    
    # Get recent events
    recent_events = Event.objects.all().order_by('-start_date')[:5]
    
    # Get statistics
    total_events = Event.objects.count()
    total_attendants = Attendant.objects.count()
    
    # Get recent activity
    recent_assignments = Assignment.objects.select_related('attendant', 'position', 'event').order_by('-id')[:10]
    
    context = {
        'current_event': current_event,
        'recent_events': recent_events,
        'total_events': total_events,
        'total_attendants': total_attendants,
        'recent_assignments': recent_assignments,
        'user': request.user,
    }
    
    return render(request, 'scheduler/dashboard.html', context)
