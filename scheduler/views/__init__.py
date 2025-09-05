"""
Views package initialization
"""

# Import views from modules
from .count_views import *
from .event_views import *
from .mobile_views import *

# Define the home view directly to avoid circular imports
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required

def home(request):
    """Home page view - redirect to event selection for authenticated users"""
    if request.user.is_authenticated:
        # Check if user has a selected event in session
        selected_event_id = request.session.get('selected_event_id')
        if selected_event_id:
            return redirect('event_detail', event_id=selected_event_id)
        else:
            return redirect('event_list')
    else:
        return render(request, 'scheduler/home.html')
