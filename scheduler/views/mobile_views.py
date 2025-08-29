"""
Mobile Views for JW Attendant Scheduler
Frontend Agent Implementation
"""

from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Q

from ..models import Assignment, Event, Attendant


@login_required
def mobile_dashboard(request):
    """Mobile-optimized dashboard for attendants"""
    
    # Get current user's attendant profile
    try:
        attendant = Attendant.objects.get(email=request.user.email)
    except Attendant.DoesNotExist:
        # Redirect to profile creation if attendant doesn't exist
        return redirect('attendant_profile')
    
    # Get current and upcoming assignments
    now = timezone.now()
    
    # Current assignments (today and next 7 days)
    current_assignments = Assignment.objects.filter(
        attendant=attendant,
        event__start_date__gte=now.date(),
        event__start_date__lte=now.date() + timedelta(days=7)
    ).select_related('event').order_by('start_time')
    
    # Upcoming assignments (beyond 7 days)
    upcoming_assignments = Assignment.objects.filter(
        attendant=attendant,
        event__start_date__gt=now.date() + timedelta(days=7)
    ).select_related('event').order_by('start_time')
    
    # All assignments for count
    all_assignments = Assignment.objects.filter(attendant=attendant)
    
    context = {
        'attendant': attendant,
        'assignments': all_assignments,
        'current_assignments': current_assignments,
        'upcoming_assignments': upcoming_assignments,
        'user': request.user,
    }
    
    return render(request, 'scheduler/mobile_dashboard.html', context)


@login_required
def mobile_assignment_detail(request, assignment_id):
    """Mobile-optimized assignment detail view"""
    
    try:
        attendant = Attendant.objects.get(email=request.user.email)
        assignment = Assignment.objects.get(
            id=assignment_id, 
            attendant=attendant
        )
    except (Attendant.DoesNotExist, Assignment.DoesNotExist):
        return redirect('mobile_dashboard')
    
    context = {
        'assignment': assignment,
        'attendant': attendant,
    }
    
    return render(request, 'scheduler/mobile_assignment_detail.html', context)


@login_required 
def mobile_event_list(request):
    """Mobile-optimized event list for attendant"""
    
    try:
        attendant = Attendant.objects.get(email=request.user.email)
    except Attendant.DoesNotExist:
        return redirect('attendant_profile')
    
    # Get events where attendant has assignments
    attendant_events = Event.objects.filter(
        assignments__attendant=attendant
    ).distinct().order_by('start_date')
    
    # Get all upcoming events
    upcoming_events = Event.objects.filter(
        start_date__gte=timezone.now().date(),
        status__in=['upcoming', 'current']
    ).order_by('start_date')
    
    context = {
        'attendant_events': attendant_events,
        'upcoming_events': upcoming_events,
        'attendant': attendant,
    }
    
    return render(request, 'scheduler/mobile_event_list.html', context)
