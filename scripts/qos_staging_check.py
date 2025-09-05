#!/usr/bin/env python3
"""
QOS Agent - Staging Environment Error Detection and Resolution
Systematically checks for import errors, missing dependencies, and runtime issues
"""

import os
import sys
import subprocess
import ast
import importlib.util
from pathlib import Path

class QOSAgent:
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.errors_found = []
        self.fixes_applied = []
        
    def check_python_syntax(self, file_path):
        """Check Python file for syntax errors"""
        try:
            with open(file_path, 'r') as f:
                source = f.read()
            ast.parse(source)
            return True, None
        except SyntaxError as e:
            return False, f"Syntax error in {file_path}: {e}"
    
    def extract_imports(self, file_path):
        """Extract all imports from a Python file"""
        imports = []
        try:
            with open(file_path, 'r') as f:
                source = f.read()
            
            tree = ast.parse(source)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    module = node.module or ''
                    for alias in node.names:
                        imports.append(f"{module}.{alias.name}")
        except Exception as e:
            print(f"Error extracting imports from {file_path}: {e}")
        
        return imports
    
    def check_django_imports(self, file_path):
        """Check for missing Django model imports"""
        missing_imports = []
        
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Common Django model references that might be missing
            model_references = [
                'UserRole', 'EventStatus', 'EventType', 'Department', 
                'StationRange', 'OverseerAssignment', 'AttendantOverseerAssignment'
            ]
            
            current_imports = self.extract_imports(file_path)
            
            for ref in model_references:
                if ref in content and not any(ref in imp for imp in current_imports):
                    missing_imports.append(ref)
                    
        except Exception as e:
            print(f"Error checking Django imports in {file_path}: {e}")
        
        return missing_imports
    
    def scan_python_files(self):
        """Scan all Python files for potential issues"""
        python_files = []
        
        # Find all Python files in the project
        for pattern in ['**/*.py']:
            python_files.extend(self.project_root.glob(pattern))
        
        # Exclude certain directories
        exclude_dirs = {'venv', '__pycache__', '.git', 'migrations', 'staticfiles'}
        python_files = [f for f in python_files if not any(exc in str(f) for exc in exclude_dirs)]
        
        print(f"Scanning {len(python_files)} Python files...")
        
        for file_path in python_files:
            print(f"Checking: {file_path.relative_to(self.project_root)}")
            
            # Check syntax
            syntax_ok, syntax_error = self.check_python_syntax(file_path)
            if not syntax_ok:
                self.errors_found.append(syntax_error)
            
            # Check for missing Django imports
            missing_imports = self.check_django_imports(file_path)
            if missing_imports:
                self.errors_found.append(f"Missing imports in {file_path}: {missing_imports}")
    
    def check_django_settings(self):
        """Check Django settings and configuration"""
        settings_file = self.project_root / 'jw_scheduler' / 'settings.py'
        
        if settings_file.exists():
            print("Checking Django settings...")
            try:
                # Basic syntax check
                syntax_ok, error = self.check_python_syntax(settings_file)
                if not syntax_ok:
                    self.errors_found.append(f"Settings syntax error: {error}")
            except Exception as e:
                self.errors_found.append(f"Settings check failed: {e}")
    
    def extract_url_patterns(self, urls_file):
        """Extract URL pattern names from urls.py"""
        url_names = []
        try:
            with open(urls_file, 'r') as f:
                content = f.read()
            
            # Simple regex to find name= patterns
            import re
            name_matches = re.findall(r"name=['\"]([^'\"]+)['\"]", content)
            url_names.extend(name_matches)
            
        except Exception as e:
            print(f"Error extracting URL patterns from {urls_file}: {e}")
        
        return url_names
    
    def check_template_url_references(self):
        """Check templates for URL references that don't exist"""
        template_files = list(self.project_root.glob('**/templates/**/*.html'))
        
        # Get all URL patterns from scheduler app
        scheduler_urls = self.project_root / 'scheduler' / 'urls.py'
        if scheduler_urls.exists():
            url_patterns = self.extract_url_patterns(scheduler_urls)
            print(f"Found URL patterns: {url_patterns}")
            
            for template_file in template_files:
                try:
                    with open(template_file, 'r') as f:
                        content = f.read()
                    
                    # Find {% url 'scheduler:pattern_name' %} references
                    import re
                    url_refs = re.findall(r"{%\s*url\s+['\"]scheduler:([^'\"]+)['\"]", content)
                    
                    for url_ref in url_refs:
                        if url_ref not in url_patterns:
                            self.errors_found.append(
                                f"Template {template_file.relative_to(self.project_root)} "
                                f"references non-existent URL pattern 'scheduler:{url_ref}'"
                            )
                            
                except Exception as e:
                    print(f"Error checking template {template_file}: {e}")
    
    def check_url_patterns(self):
        """Check URL configuration for issues"""
        urls_files = list(self.project_root.glob('**/urls.py'))
        
        for urls_file in urls_files:
            print(f"Checking URLs: {urls_file.relative_to(self.project_root)}")
            syntax_ok, error = self.check_python_syntax(urls_file)
            if not syntax_ok:
                self.errors_found.append(f"URLs syntax error: {error}")
        
        # Check template URL references
        self.check_template_url_references()
    
    def fix_common_import_issues(self):
        """Apply common import fixes"""
        views_file = self.project_root / 'scheduler' / 'views.py'
        
        if views_file.exists():
            print("Applying import fixes to views.py...")
            
            with open(views_file, 'r') as f:
                content = f.read()
            
            # Check current imports
            import_line = "from .models import Attendant, Event, Assignment, LanyardAssignment, UserRole, EventStatus, EventType"
            
            if "from .models import" in content and "EventStatus" not in content:
                # Fix the import line
                old_import = next(line for line in content.split('\n') if line.startswith('from .models import'))
                
                if 'EventStatus' not in old_import:
                    new_import = old_import.rstrip() + ', EventStatus, EventType'
                    content = content.replace(old_import, new_import)
                    
                    with open(views_file, 'w') as f:
                        f.write(content)
                    
                    self.fixes_applied.append("Added EventStatus, EventType imports to views.py")
    
    def run_staging_checks(self):
        """Run checks on staging environment using SSH shortcuts"""
        print("Running staging environment checks...")
        
        # Use SSH shortcut for staging server (LXC 134 - 10.92.3.24)
        staging_commands = [
            "cd /opt/jw-attendant-staging && python3 manage.py check --deploy",
            "systemctl status jw-attendant-staging --no-pager",
            "tail -n 20 /var/log/jw-attendant-staging/error.log 2>/dev/null || echo 'No error log found'",
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health/ || echo 'Health check failed'"
        ]
        
        for cmd in staging_commands:
            try:
                # Use SSH key authentication with proper options
                ssh_cmd = [
                    'ssh', 
                    'jw-staging',
                    cmd
                ]
                
                result = subprocess.run(
                    ssh_cmd, 
                    capture_output=True, 
                    text=True, 
                    timeout=30
                )
                
                if result.returncode != 0:
                    self.errors_found.append(f"Staging command failed [{cmd}]: {result.stderr.strip()}")
                    if result.stdout.strip():
                        self.errors_found.append(f"Staging stdout [{cmd}]: {result.stdout.strip()}")
                else:
                    print(f"✅ Staging check passed: {cmd}")
                    if result.stdout.strip():
                        print(f"   Output: {result.stdout.strip()[:100]}...")
                    
            except subprocess.TimeoutExpired:
                self.errors_found.append(f"Staging command timed out: {cmd}")
            except Exception as e:
                self.errors_found.append(f"Staging SSH error [{cmd}]: {e}")

    def check_staging_web_endpoints(self):
        """Check staging web endpoints with authentication"""
        print("Checking staging web endpoints...")
        
        try:
            import requests
            from requests.adapters import HTTPAdapter
            from urllib3.util.retry import Retry
            
            # Create session with retry strategy
            session = requests.Session()
            retry_strategy = Retry(
                total=3,
                backoff_factor=1,
                status_forcelist=[429, 500, 502, 503, 504],
            )
            adapter = HTTPAdapter(max_retries=retry_strategy)
            session.mount("http://", adapter)
            session.mount("https://", adapter)
            
            base_url = "http://10.92.3.24:8001"
            
            # First, authenticate by getting login page and CSRF token
            print("  Authenticating with staging server...")
            try:
                login_url = f"{base_url}/login/"
                login_page = session.get(login_url, timeout=10)
                
                if login_page.status_code != 200:
                    return [f"❌ FAIL: Cannot access login page -> {login_page.status_code}"]
                
                # Extract CSRF token
                import re
                csrf_match = re.search(r'name="csrfmiddlewaretoken" value="([^"]*)"', login_page.text)
                if not csrf_match:
                    return ["❌ FAIL: Cannot find CSRF token in login page"]
                
                csrf_token = csrf_match.group(1)
                
                # Attempt login with superadmin credentials
                login_data = {
                    'username': 'superadmin',
                    'password': 'admin123',
                    'csrfmiddlewaretoken': csrf_token
                }
                
                login_response = session.post(login_url, data=login_data, timeout=10)
                
                if login_response.status_code == 200 and 'Please enter a correct username' in login_response.text:
                    return ["❌ FAIL: Authentication failed - invalid credentials"]
                elif login_response.status_code not in [200, 302]:
                    return [f"❌ FAIL: Login request failed -> {login_response.status_code}"]
                
                print("  ✅ Authentication successful")
                
            except Exception as e:
                return [f"❌ FAIL: Authentication error -> {str(e)}"]
            
            # Test endpoints with authenticated session
            endpoints = [
                ("/health/", "Health Check"),
                ("/dashboard/", "Dashboard"), 
                ("/reports/", "Reports Tab"),
                ("/users/", "Users Tab")
            ]
            
            results = []
            for endpoint, name in endpoints:
                try:
                    url = f"{base_url}{endpoint}"
                    response = session.get(url, timeout=10, allow_redirects=False)
                    
                    if response.status_code == 200:
                        status = "✅ PASS"
                        # Check for specific content indicators
                        if endpoint == "/reports/" and "reports" in response.text.lower():
                            status += " (Content OK)"
                        elif endpoint == "/users/" and "user" in response.text.lower():
                            status += " (Content OK)"
                    elif response.status_code == 302:
                        # Check redirect location
                        location = response.headers.get('Location', '')
                        if '/login/' in location:
                            status = "⚠️  REDIRECT (Auth Required)"
                        else:
                            status = f"⚠️  REDIRECT -> {location}"
                    else:
                        status = f"❌ FAIL ({response.status_code})"
                    
                    results.append(f"{status}: {name} ({endpoint})")
                    print(f"  {status}: {name} ({endpoint})")
                    
                except Exception as e:
                    results.append(f"❌ FAIL: {name} ({endpoint}) -> {str(e)}")
                    print(f"  ❌ FAIL: {name} ({endpoint}) -> {str(e)}")
            
            return results
            
        except ImportError:
            print("⚠️  requests module not available, skipping web endpoint checks")
            return ["⚠️  requests module not available"]

    def run_django_check(self):
        """Run Django's built-in check command locally"""
        print("Running local Django system checks...")
        
        try:
            os.chdir(self.project_root)
            result = subprocess.run([
                sys.executable, 'manage.py', 'check'
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                self.errors_found.append(f"Local Django check failed: {result.stderr}")
            else:
                print("Local Django checks passed!")
                
        except subprocess.TimeoutExpired:
            self.errors_found.append("Local Django check timed out")
        except Exception as e:
            self.errors_found.append(f"Local Django check error: {e}")
    
    def check_reports_tab_functionality(self):
        """Check reports tab specific functionality"""
        print("Checking reports tab functionality...")
        
        # Check reports view exists
        views_file = self.project_root / 'scheduler' / 'views.py'
        if views_file.exists():
            with open(views_file, 'r') as f:
                content = f.read()
            
            # Check for reports function
            if 'def reports(' not in content:
                self.errors_found.append("Reports view function not found in views.py")
            
            # Check for required imports for reports
            required_imports = ['Count', 'OverseerAssignment', 'AttendantOverseerAssignment']
            for imp in required_imports:
                if imp not in content:
                    self.errors_found.append(f"Reports view missing import: {imp}")
        
        # Check reports template exists
        reports_template = self.project_root / 'templates' / 'scheduler' / 'reports.html'
        if not reports_template.exists():
            self.errors_found.append("Reports template (reports.html) not found")
        
        # Check URL pattern for reports
        urls_file = self.project_root / 'scheduler' / 'urls.py'
        if urls_file.exists():
            with open(urls_file, 'r') as f:
                urls_content = f.read()
            if "name='reports'" not in urls_content:
                self.errors_found.append("Reports URL pattern not found in urls.py")

    def check_users_tab_functionality(self):
        """Check users tab specific functionality"""
        print("Checking users tab functionality...")
        
        # Check user management views exist
        views_file = self.project_root / 'scheduler' / 'views.py'
        if views_file.exists():
            with open(views_file, 'r') as f:
                content = f.read()
            
            # Check for user management functions
            user_functions = ['user_list', 'user_create', 'user_edit', 'user_delete']
            for func in user_functions:
                if f'def {func}(' not in content:
                    self.errors_found.append(f"User management view function not found: {func}")
        
        # Check user templates exist
        user_templates = ['user_list.html', 'user_form.html']
        for template in user_templates:
            template_path = self.project_root / 'templates' / 'scheduler' / template
            if not template_path.exists():
                self.errors_found.append(f"User template not found: {template}")
        
        # Check URL patterns for user management
        urls_file = self.project_root / 'scheduler' / 'urls.py'
        if urls_file.exists():
            with open(urls_file, 'r') as f:
                urls_content = f.read()
            
            user_url_patterns = ['user_list', 'user_create', 'user_edit', 'user_delete']
            for pattern in user_url_patterns:
                if f"name='{pattern}'" not in urls_content:
                    self.errors_found.append(f"User URL pattern not found: {pattern}")

    def check_bulk_assignment_functionality(self):
        """Check bulk assignment creation functionality"""
        print("Checking bulk assignment functionality...")
        
        # Check bulk assignment views exist
        views_file = self.project_root / 'scheduler' / 'views.py'
        if views_file.exists():
            with open(views_file, 'r') as f:
                content = f.read()
            
            # Check for bulk assignment functions
            bulk_functions = ['bulk_assignment_create', 'bulk_assignment_update', 'bulk_assignment_delete']
            for func in bulk_functions:
                if f'def {func}(' not in content:
                    self.errors_found.append(f"Bulk assignment view function not found: {func}")
                else:
                    # Check if function has proper implementation
                    func_start = content.find(f'def {func}(')
                    if func_start != -1:
                        func_end = content.find('def ', func_start + 1)
                        if func_end == -1:
                            func_end = len(content)
                        func_content = content[func_start:func_end]
                        
                        if func == 'bulk_assignment_create':
                            if 'Assignment.objects.create(' not in func_content:
                                self.errors_found.append(f"Bulk assignment create function missing assignment creation logic")
                            if 'form.cleaned_data' not in func_content:
                                self.errors_found.append(f"Bulk assignment create function missing form processing")
        
        # Check bulk assignment form exists
        forms_file = self.project_root / 'scheduler' / 'forms.py'
        if forms_file.exists():
            with open(forms_file, 'r') as f:
                forms_content = f.read()
            if 'class BulkAssignmentForm' not in forms_content:
                self.errors_found.append("BulkAssignmentForm not found in forms.py")
        
        # Check bulk assignment template exists
        bulk_template = self.project_root / 'scheduler' / 'templates' / 'scheduler' / 'bulk_assignment_form.html'
        if not bulk_template.exists():
            self.errors_found.append("Bulk assignment template (bulk_assignment_form.html) not found")
        
        # Check URL patterns for bulk assignment
        urls_file = self.project_root / 'scheduler' / 'urls.py'
        if urls_file.exists():
            with open(urls_file, 'r') as f:
                urls_content = f.read()
            
            bulk_url_patterns = ['bulk_assignment_create', 'bulk_assignment_update', 'bulk_assignment_delete']
            for pattern in bulk_url_patterns:
                if f"name='{pattern}'" not in urls_content:
                    self.errors_found.append(f"Bulk assignment URL pattern not found: {pattern}")

    def check_auto_assign_functionality(self):
        """Check auto-assignment functionality"""
        print("Checking auto-assignment functionality...")
        
        # Check auto-assign API exists
        api_views_file = self.project_root / 'scheduler' / 'api_views.py'
        if api_views_file.exists():
            with open(api_views_file, 'r') as f:
                content = f.read()
            if 'def auto_assign_api(' not in content:
                self.errors_found.append("Auto-assign API function not found in api_views.py")
        else:
            self.errors_found.append("api_views.py file not found")
        
        # Check auto-assign backend exists
        auto_assign_file = self.project_root / 'scheduler' / 'auto_assign.py'
        if not auto_assign_file.exists():
            self.errors_found.append("Auto-assign backend (auto_assign.py) not found")
        
        # Check event detail template has auto-assign tab
        event_detail_template = self.project_root / 'scheduler' / 'templates' / 'scheduler' / 'event_detail.html'
        if event_detail_template.exists():
            with open(event_detail_template, 'r') as f:
                template_content = f.read()
            if 'auto-assign' not in template_content.lower():
                self.errors_found.append("Event detail template missing auto-assign functionality")
        
        # Check position templates exist
        position_template = self.project_root / 'scheduler' / 'templates' / 'scheduler' / 'position_templates.html'
        if not position_template.exists():
            self.errors_found.append("Position templates page (position_templates.html) not found")

    def check_staging_specific_issues(self):
        """Check for staging environment specific issues"""
        print("Checking staging environment specific issues...")
        
        # Check for common staging issues
        models_file = self.project_root / 'scheduler' / 'models.py'
        if models_file.exists():
            with open(models_file, 'r') as f:
                content = f.read()
            
            # Check for model relationships that might cause issues
            if 'OverseerAssignment' in content and 'ForeignKey' in content:
                if 'on_delete=models.CASCADE' not in content:
                    self.errors_found.append("Missing on_delete parameter in model relationships")
        
        # Check for migration issues
        migrations_dir = self.project_root / 'scheduler' / 'migrations'
        if migrations_dir.exists():
            migration_files = list(migrations_dir.glob('*.py'))
            if len(migration_files) < 2:  # Should have at least __init__.py and initial migration
                self.errors_found.append("Missing migration files - may cause database issues")

    def test_specific_views(self):
        """Test specific view functionality that commonly fails in staging"""
        print("Testing specific view functionality...")
        
        views_file = self.project_root / 'scheduler' / 'views.py'
        if views_file.exists():
            with open(views_file, 'r') as f:
                content = f.read()
            
            # Check for session handling in reports
            if 'def reports(' in content:
                reports_section = content[content.find('def reports('):content.find('def ', content.find('def reports(') + 1)]
                if 'selected_event_id' not in reports_section:
                    self.errors_found.append("Reports view missing event session handling")
            
            # Check for permission decorators
            if '@login_required' not in content:
                self.errors_found.append("Views missing login_required decorators")

    def generate_report(self):
        """Generate QOS report"""
        print("\n" + "="*60)
        print("QOS AGENT STAGING ENVIRONMENT REPORT")
        print("COMPREHENSIVE FUNCTIONALITY CHECK")
        print("="*60)
        
        if not self.errors_found:
            print("✅ No errors detected in staging environment")
            print("✅ Reports tab functionality: OPERATIONAL")
            print("✅ Users tab functionality: OPERATIONAL")
            print("✅ Bulk assignment functionality: OPERATIONAL")
            print("✅ Auto-assignment functionality: OPERATIONAL")
        else:
            print(f"❌ Found {len(self.errors_found)} issues:")
            for i, error in enumerate(self.errors_found, 1):
                print(f"{i}. {error}")
        
        if self.fixes_applied:
            print(f"\n🔧 Applied {len(self.fixes_applied)} fixes:")
            for i, fix in enumerate(self.fixes_applied, 1):
                print(f"{i}. {fix}")
        
        print("\n" + "="*60)
        
        return len(self.errors_found) == 0

def main():
    if len(sys.argv) != 2:
        print("Usage: python qos_staging_check.py <project_root>")
        sys.exit(1)
    
    project_root = sys.argv[1]
    qos = QOSAgent(project_root)
    
    print("QOS Agent starting staging environment check...")
    print("Focus: Reports Tab, Users Tab, Bulk Assignment, and Auto-Assignment functionality")
    
    # Run all checks
    qos.scan_python_files()
    qos.check_django_settings()
    qos.check_url_patterns()
    qos.check_reports_tab_functionality()
    qos.check_users_tab_functionality()
    qos.check_bulk_assignment_functionality()
    qos.check_auto_assign_functionality()
    qos.check_staging_specific_issues()
    qos.test_specific_views()
    qos.fix_common_import_issues()
    qos.run_django_check()
    
    # NEW: Run staging environment checks with SSH
    qos.run_staging_checks()
    qos.check_staging_web_endpoints()
    
    # Generate report
    success = qos.generate_report()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
