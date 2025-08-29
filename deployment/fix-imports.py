#!/usr/bin/env python3
"""
Fix import errors in views.py
"""

def fix_views_imports():
    """Remove problematic imports from views.py"""
    
    views_file = '/opt/jw-attendant/scheduler/views.py'
    
    with open(views_file, 'r') as f:
        content = f.read()
    
    # Remove the problematic import lines
    lines = content.split('\n')
    fixed_lines = []
    
    skip_import_block = False
    
    for line in lines:
        # Skip the event_views import block
        if '# Import event-centric views' in line:
            skip_import_block = True
            continue
        elif skip_import_block and line.strip().startswith('from .views.event_views'):
            continue
        elif skip_import_block and line.strip().startswith('event_selection, select_event'):
            continue  
        elif skip_import_block and line.strip().startswith(')'):
            skip_import_block = False
            continue
        else:
            skip_import_block = False
            fixed_lines.append(line)
    
    # Write the fixed content
    with open(views_file, 'w') as f:
        f.write('\n'.join(fixed_lines))
    
    print("✓ Fixed import errors in views.py")

if __name__ == '__main__':
    fix_views_imports()
