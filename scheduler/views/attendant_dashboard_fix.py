"""
Attendant dashboard view isolated to avoid circular imports
"""
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required


@login_required
def attendant_dashboard(request):
    """Attendant dashboard view"""
    from ..models import UserRole, Attendant, Assignment
    
    if request.user.role != UserRole.ATTENDANT:
        return redirect('scheduler:dashboard')
    
    try:
        attendant = Attendant.objects.get(user=request.user)
    except Attendant.DoesNotExist:
        return redirect('scheduler:dashboard')
    
    # Get attendant's assignments
    assignments = Assignment.objects.filter(attendant=attendant).select_related('event', 'position').order_by('-event__start_date')
    
    # Get current event from session
    current_event_id = request.session.get('current_event_id')
    current_assignments = []
    if current_event_id:
        current_assignments = assignments.filter(event_id=current_event_id)
    
    context = {
        'attendant': attendant,
        'assignments': assignments[:10],  # Recent assignments
        'current_assignments': current_assignments,
        'user': request.user,
    }
    
    return render(request, 'scheduler/attendant_dashboard.html', context)
