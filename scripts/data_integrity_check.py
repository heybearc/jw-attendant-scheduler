#!/usr/bin/env python3
"""
Data Integrity Check Script - QA Agent Implementation
Safe command execution with auto-correction
"""

import os
import sys
import subprocess
import json
from typing import Tuple, Dict, Any

def validate_and_fix_command(cmd: str) -> Tuple[bool, str]:
    """Validate and auto-correct shell commands"""
    
    # Fix f-string escaping issues
    if "f\"" in cmd and "\\'" in cmd:
        # Replace problematic escaping
        cmd = cmd.replace("\\'", '"')
        cmd = cmd.replace('f"', "f'")
        cmd = cmd.replace('"', "'")
    
    # Check for unmatched quotes/parentheses
    quote_count = cmd.count("'") + cmd.count('"')
    if quote_count % 2 != 0:
        return False, "Unmatched quotes detected"
    
    paren_balance = cmd.count('(') - cmd.count(')')
    if paren_balance != 0:
        return False, "Unmatched parentheses detected"
    
    return True, cmd

def safe_django_shell_command(python_code: str) -> str:
    """Create safe Django shell command"""
    # Escape the Python code properly
    escaped_code = python_code.replace('"', '\\"').replace("'", "\\'")
    
    # Use here-doc for complex commands
    safe_cmd = f'''python3 manage.py shell << 'EOF'
{python_code}
EOF'''
    
    return safe_cmd

def check_data_integrity():
    """Check data integrity with safe commands"""
    
    # Safe Python code for Django shell
    integrity_check = '''
from scheduler.models import *

print("=== Data Integrity Verification ===")
print(f"Users: {User.objects.count()}")
print(f"Attendants: {Attendant.objects.count()}")
print(f"Events: {Event.objects.count()}")
print(f"Assignments: {Assignment.objects.count()}")

print("\\n=== Sample Data ===")
first_user = User.objects.first()
if first_user:
    print(f"First User: {first_user.username}")
else:
    print("First User: None")

first_attendant = Attendant.objects.first()
if first_attendant:
    print(f"First Attendant: {first_attendant.first_name} {first_attendant.last_name}")
else:
    print("First Attendant: None")

first_event = Event.objects.first()
if first_event:
    print(f"First Event: {first_event.name}")
else:
    print("First Event: None")

first_assignment = Assignment.objects.first()
if first_assignment:
    print(f"Assignment: {first_assignment.position}")
else:
    print("Assignment: None")

print("\\n=== Integrity Check Complete ===")
'''
    
    return integrity_check

def execute_safe_command(host: str, base_path: str, python_code: str) -> Dict[str, Any]:
    """Execute command safely with error handling"""
    
    # Create temporary script file
    script_content = f'''#!/bin/bash
cd {base_path}
source venv/bin/activate
{safe_django_shell_command(python_code)}
'''
    
    # Write script to remote host
    script_path = f"/tmp/integrity_check_{os.getpid()}.sh"
    
    try:
        # Copy script to remote host
        with open(f"/tmp/local_script.sh", "w") as f:
            f.write(script_content)
        
        subprocess.run([
            "scp", "/tmp/local_script.sh", f"{host}:{script_path}"
        ], check=True, capture_output=True)
        
        # Make executable and run
        result = subprocess.run([
            "ssh", host, f"chmod +x {script_path} && {script_path} && rm {script_path}"
        ], capture_output=True, text=True)
        
        # Clean up local file
        os.remove("/tmp/local_script.sh")
        
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
        
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "returncode": -1
        }

if __name__ == "__main__":
    print("QA Agent - Data Integrity Check")
    print("=" * 40)
    
    # Check staging environment
    python_code = check_data_integrity()
    result = execute_safe_command(
        "jw-staging", 
        "/opt/jw-attendant-staging", 
        python_code
    )
    
    if result["success"]:
        print("✅ Data integrity check completed successfully")
        print(result["stdout"])
    else:
        print("❌ Data integrity check failed")
        print(f"Error: {result['stderr']}")
        sys.exit(1)
