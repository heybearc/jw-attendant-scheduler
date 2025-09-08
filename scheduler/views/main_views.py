"""
Main views that were originally in views.py
"""
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required


def home(request):
    """Home page view - redirect to event selection for authenticated users"""
    if request.user.is_authenticated:
        # Check if user has a selected event in session
        if 'current_event_id' in request.session:
            return redirect('scheduler:event_dashboard', event_id=request.session['current_event_id'])
        else:
            return redirect('scheduler:event_selection')
    else:
        return render(request, 'scheduler/home.html')


def event_selection(request):
    """Event selection view"""
    from ..models import Event
    events = Event.objects.all().order_by('-start_date')
    return render(request, 'scheduler/event_selection.html', {'events': events})


def select_event(request, event_id):
    """Select an event and redirect to its dashboard"""
    request.session['current_event_id'] = event_id
    return redirect('scheduler:event_dashboard', event_id=event_id)


def set_current_event(request, event_id):
    """Set current event in session"""
    request.session['current_event_id'] = event_id
    return redirect('scheduler:event_dashboard', event_id=event_id)


def copy_event(request, event_id):
    """Copy an existing event"""
    # Implementation would go here
    return redirect('scheduler:event_selection')


def event_dashboard(request, event_id):
    """Event dashboard view"""
    from ..models import Event
    from django.shortcuts import get_object_or_404
    
    event = get_object_or_404(Event, id=event_id)
    request.session['current_event_id'] = event_id
    
    context = {
        'event': event,
    }
    return render(request, 'scheduler/event_dashboard.html', context)
