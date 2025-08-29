#!/usr/bin/env python3
"""
Fix syntax error in views.py caused by incorrect health check insertion
"""

def fix_views_syntax():
    """Fix the syntax error in views.py"""
    
    views_file = '/opt/jw-attendant/scheduler/views.py'
    
    # Read the file
    with open(views_file, 'r') as f:
        content = f.read()
    
    # Remove the incorrectly inserted health check code
    lines = content.split('\n')
    
    # Find and remove the problematic lines
    fixed_lines = []
    skip_next = False
    in_health_check = False
    
    for i, line in enumerate(lines):
        # Skip the incorrectly inserted health check imports and function
        if 'from django.http import JsonResponse' in line and i > 1000:
            in_health_check = True
            continue
        elif in_health_check and ('def health_check' in line or 'from django.views.decorators' in line or '@csrf_exempt' in line or '@require_http_methods' in line):
            continue
        elif in_health_check and line.strip() == '':
            continue
        elif in_health_check and ('return JsonResponse' in line or 'try:' in line or 'except Exception' in line or 'with connection.cursor()' in line or 'cursor.execute' in line or "'status':" in line or "'database':" in line or "'timestamp':" in line or "'error':" in line or 'status=500' in line):
            continue
        else:
            in_health_check = False
            fixed_lines.append(line)
    
    # Write the fixed content back
    with open(views_file, 'w') as f:
        f.write('\n'.join(fixed_lines))
    
    print("✓ Fixed syntax error in views.py")

def add_health_check_properly():
    """Add health check view at the end of the file properly"""
    
    views_file = '/opt/jw-attendant/scheduler/views.py'
    
    health_check_code = '''

# Health check endpoint
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """Simple health check endpoint"""
    try:
        # Test database connection
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': timezone.now().isoformat()
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }, status=500)
'''
    
    # Append the health check at the end
    with open(views_file, 'a') as f:
        f.write(health_check_code)
    
    print("✓ Added health check view properly")

if __name__ == '__main__':
    fix_views_syntax()
    add_health_check_properly()
    print("✓ Views.py syntax fixed and health check added")
