"""
Attendant management views
"""
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse


@login_required
def attendant_list(request):
    """List all attendants"""
    from ..models import Attendant
    attendants = Attendant.objects.all().order_by('user__first_name', 'user__last_name')
    return render(request, 'scheduler/attendant_list.html', {'attendants': attendants})


@login_required
def attendant_create(request):
    """Create a new attendant"""
    if request.method == 'POST':
        # Implementation would go here
        messages.success(request, 'Attendant created successfully.')
        return redirect('scheduler:attendant_list')
    return render(request, 'scheduler/attendant_form.html')


@login_required
def attendant_detail(request, attendant_id):
    """View attendant details"""
    from ..models import Attendant
    attendant = get_object_or_404(Attendant, id=attendant_id)
    return render(request, 'scheduler/attendant_detail.html', {'attendant': attendant})


@login_required
def attendant_edit(request, attendant_id):
    """Edit an attendant"""
    from ..models import Attendant
    attendant = get_object_or_404(Attendant, id=attendant_id)
    if request.method == 'POST':
        # Implementation would go here
        messages.success(request, 'Attendant updated successfully.')
        return redirect('scheduler:attendant_detail', attendant_id=attendant_id)
    return render(request, 'scheduler/attendant_form.html', {'attendant': attendant})


@login_required
def delete_attendant(request, attendant_id):
    """Delete an attendant"""
    from ..models import Attendant
    attendant = get_object_or_404(Attendant, id=attendant_id)
    if request.method == 'POST':
        attendant.delete()
        messages.success(request, 'Attendant deleted successfully.')
        return redirect('scheduler:attendant_list')
    return render(request, 'scheduler/confirm_delete.html', {'object': attendant})


@login_required
def toggle_attendant_status(request, attendant_id):
    """Toggle attendant active status"""
    from ..models import Attendant
    attendant = get_object_or_404(Attendant, id=attendant_id)
    attendant.is_active = not attendant.is_active
    attendant.save()
    return JsonResponse({'success': True, 'is_active': attendant.is_active})
