#!/usr/bin/env python3
"""
Add health check endpoint and fix SSL configuration
"""

import os
import re

def add_health_check_view():
    """Add a simple health check view to the Django application"""
    
    views_file = '/opt/jw-attendant/scheduler/views.py'
    
    # Read current views
    with open(views_file, 'r') as f:
        content = f.read()
    
    # Add health check view if not already present
    if 'def health_check' not in content:
        health_check_view = '''
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
        
        # Add the view after imports
        import_pattern = r'(from django\.utils import timezone\n)'
        content = re.sub(import_pattern, r'\1' + health_check_view, content)
        
        with open(views_file, 'w') as f:
            f.write(content)
        
        print("✓ Added health check view")

def add_health_check_url():
    """Add health check URL to Django URLs"""
    
    urls_file = '/opt/jw-attendant/scheduler/urls.py'
    
    with open(urls_file, 'r') as f:
        content = f.read()
    
    # Add health check URL if not present
    if 'health/' not in content:
        # Find the urlpatterns list and add the health check URL
        pattern = r'(urlpatterns = \[[\s\S]*?)(    # Authentication URLs)'
        replacement = r'\1    path("health/", views.health_check, name="health_check"),\n    \2'
        content = re.sub(pattern, replacement, content)
        
        with open(urls_file, 'w') as f:
            f.write(content)
        
        print("✓ Added health check URL")

def fix_ssl_settings():
    """Fix SSL and security settings for production"""
    
    settings_file = '/opt/jw-attendant/jw_scheduler/settings.py'
    
    with open(settings_file, 'r') as f:
        content = f.read()
    
    # Add additional SSL/security settings
    ssl_settings = '''
# Additional security settings for production
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Trust proxy headers
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True
'''
    
    # Add SSL settings at the end of the file
    if 'SECURE_BROWSER_XSS_FILTER' not in content:
        content += ssl_settings
        
        with open(settings_file, 'w') as f:
            f.write(content)
        
        print("✓ Added SSL security settings")

if __name__ == '__main__':
    add_health_check_view()
    add_health_check_url()
    fix_ssl_settings()
    print("✓ Health check and SSL configuration complete")
