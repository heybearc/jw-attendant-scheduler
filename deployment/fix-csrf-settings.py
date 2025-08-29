#!/usr/bin/env python3
"""
Fix CSRF settings for proxy configuration
"""

import os
import re

def update_settings_file():
    """Update Django settings.py to handle proxy CSRF configuration"""
    
    settings_file = '/opt/jw-attendant/jw_scheduler/settings.py'
    
    # Read current settings
    with open(settings_file, 'r') as f:
        content = f.read()
    
    # Replace hardcoded CSRF_TRUSTED_ORIGINS with environment variable configuration
    csrf_pattern = r'CSRF_TRUSTED_ORIGINS = \[[\s\S]*?\]'
    csrf_replacement = '''# CSRF trusted origins from environment
csrf_origins = os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',')
csrf_origins = [origin.strip() for origin in csrf_origins if origin.strip()]
CSRF_TRUSTED_ORIGINS = csrf_origins + [
    'http://127.0.0.1:8000',
    'http://localhost:8000',
]'''
    
    content = re.sub(csrf_pattern, csrf_replacement, content)
    
    # Add proxy configuration settings
    proxy_settings = '''
# Proxy configuration
USE_X_FORWARDED_HOST = os.getenv('USE_X_FORWARDED_HOST', 'False').lower() == 'true'
USE_X_FORWARDED_PORT = True

# SSL proxy configuration
if os.getenv('SECURE_PROXY_SSL_HEADER'):
    header_parts = os.getenv('SECURE_PROXY_SSL_HEADER').split(',')
    if len(header_parts) == 2:
        SECURE_PROXY_SSL_HEADER = (header_parts[0].strip(), header_parts[1].strip())

# Security settings
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = False  # Let proxy handle SSL
'''
    
    # Replace existing security settings
    security_pattern = r'# Security settings for development[\s\S]*?SECURE_SSL_REDIRECT = False'
    content = re.sub(security_pattern, proxy_settings.strip(), content)
    
    # Write updated settings
    with open(settings_file, 'w') as f:
        f.write(content)
    
    print("✓ Updated Django settings for proxy configuration")
    return True

if __name__ == '__main__':
    update_settings_file()
