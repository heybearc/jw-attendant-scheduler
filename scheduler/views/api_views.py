"""
API Views for JW Attendant Scheduler
Backend Agent Implementation
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
import json
import logging

from ..models import Event, Assignment, Attendant
from ..auto_assign import auto_assign_event

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def auto_assign_api(request):
    """
    Auto-assign positions for an event
    
    POST /api/auto-assign/
    {
        "event_id": 1,
        "positions": [
            {"name": "Sound", "start_time": "2025-08-30T09:00:00Z", "end_time": "2025-08-30T12:00:00Z"},
            {"name": "Stage", "start_time": "2025-08-30T09:00:00Z", "end_time": "2025-08-30T12:00:00Z"}
        ]
    }
    """
    
    try:
        data = json.loads(request.body)
        event_id = data.get('event_id')
        positions = data.get('positions', [])
        
        if not event_id or not positions:
            return JsonResponse({
                'success': False,
                'error': 'event_id and positions are required'
            }, status=400)
        
        # Verify event exists and user has permission
        event = get_object_or_404(Event, id=event_id)
        
        # Check user permissions (admin/overseer only)
        if not request.user.is_staff and request.user.role not in ['admin', 'overseer']:
            return JsonResponse({
                'success': False,
                'error': 'Insufficient permissions'
            }, status=403)
        
        # Execute auto-assignment
        result = auto_assign_event(event_id, positions)
        
        if result['success']:
            # Format assignments for response
            assignments_data = []
            for assignment in result['assignments']:
                assignments_data.append({
                    'id': assignment.id,
                    'attendant': {
                        'id': assignment.attendant.id,
                        'name': f"{assignment.attendant.first_name} {assignment.attendant.last_name}",
                        'email': assignment.attendant.email
                    },
                    'position': assignment.position,
                    'start_time': assignment.start_time.isoformat() if assignment.start_time else None,
                    'end_time': assignment.end_time.isoformat() if assignment.end_time else None,
                    'status': assignment.status
                })
            
            return JsonResponse({
                'success': True,
                'assignments': assignments_data,
                'metrics': result['metrics'],
                'message': f"Successfully assigned {result['metrics']['assigned_positions']} positions"
            })
        else:
            return JsonResponse({
                'success': False,
                'error': result.get('error', 'Auto-assignment failed'),
                'metrics': result.get('metrics', {})
            }, status=500)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Auto-assignment API error: {e}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)


@require_http_methods(["GET"])
@login_required
def assignment_conflicts_api(request):
    """
    Check for assignment conflicts
    
    GET /api/conflicts/?event_id=1&attendant_id=2&start_time=2025-08-30T09:00:00Z&end_time=2025-08-30T12:00:00Z
    """
    
    try:
        event_id = request.GET.get('event_id')
        attendant_id = request.GET.get('attendant_id')
        start_time = request.GET.get('start_time')
        end_time = request.GET.get('end_time')
        
        if not all([event_id, attendant_id, start_time, end_time]):
            return JsonResponse({
                'success': False,
                'error': 'event_id, attendant_id, start_time, and end_time are required'
            }, status=400)
        
        # Check for conflicts
        conflicts = Assignment.objects.filter(
            attendant_id=attendant_id,
            event_id=event_id,
            start_time__lt=end_time,
            end_time__gt=start_time
        ).select_related('event', 'attendant')
        
        conflicts_data = []
        for conflict in conflicts:
            conflicts_data.append({
                'id': conflict.id,
                'position': conflict.position,
                'start_time': conflict.start_time.isoformat() if conflict.start_time else None,
                'end_time': conflict.end_time.isoformat() if conflict.end_time else None,
                'event': conflict.event.name
            })
        
        return JsonResponse({
            'success': True,
            'has_conflicts': len(conflicts_data) > 0,
            'conflicts': conflicts_data
        })
        
    except Exception as e:
        logger.error(f"Conflict check API error: {e}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)


@require_http_methods(["GET"])
@login_required
def attendant_availability_api(request):
    """
    Get attendant availability for an event
    
    GET /api/availability/?event_id=1
    """
    
    try:
        event_id = request.GET.get('event_id')
        
        if not event_id:
            return JsonResponse({
                'success': False,
                'error': 'event_id is required'
            }, status=400)
        
        event = get_object_or_404(Event, id=event_id)
        
        # Get all active attendants
        attendants = Attendant.objects.filter(is_active=True)
        
        availability_data = []
        for attendant in attendants:
            # Get existing assignments for this event
            assignments = Assignment.objects.filter(
                attendant=attendant,
                event=event
            )
            
            availability_data.append({
                'id': attendant.id,
                'name': f"{attendant.first_name} {attendant.last_name}",
                'email': attendant.email,
                'serving_as': attendant.serving_as,
                'current_assignments': len(assignments),
                'assignments': [
                    {
                        'position': a.position,
                        'start_time': a.start_time.isoformat() if a.start_time else None,
                        'end_time': a.end_time.isoformat() if a.end_time else None
                    }
                    for a in assignments
                ]
            })
        
        return JsonResponse({
            'success': True,
            'event': {
                'id': event.id,
                'name': event.name,
                'start_date': event.start_date.isoformat(),
                'end_date': event.end_date.isoformat()
            },
            'attendants': availability_data
        })
        
    except Exception as e:
        logger.error(f"Availability API error: {e}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)
