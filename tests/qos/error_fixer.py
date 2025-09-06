#!/usr/bin/env python3
"""
Error Fixer for JW Attendant Scheduler
This script automatically identifies and fixes common errors in the staging environment.
"""

import argparse
import json
import logging
import os
import re
import sys
import time
from datetime import datetime

import django
import requests
from django.core.management import call_command
from django.db import connection
from django.db.utils import OperationalError, ProgrammingError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("error_fixer.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ErrorFixer:
    """Class to identify and fix common errors in the staging environment."""
    
    def __init__(self, settings_module, output_dir="./results"):
        """Initialize the ErrorFixer with Django settings module."""
        self.settings_module = settings_module
        self.output_dir = output_dir
        self.errors_found = []
        self.errors_fixed = []
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Set up Django environment
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", settings_module)
        django.setup()
        
        # Import Django models after setup
        from django.contrib.auth.models import User
        from django.contrib.contenttypes.models import ContentType
        from django.contrib.sessions.models import Session
        
        # Import application models
        from scheduler.models import (
            Event, EventType, EventStatus, EventPosition, 
            CountSession, PositionCount, Attendant, Assignment, Shift
        )
        
        self.models = {
            'User': User,
            'ContentType': ContentType,
            'Session': Session,
            'Event': Event,
            'EventType': EventType,
            'EventStatus': EventStatus,
            'EventPosition': EventPosition,
            'CountSession': CountSession,
            'PositionCount': PositionCount,
            'Attendant': Attendant,
            'Assignment': Assignment,
            'Shift': Shift
        }
    
    def check_database_connection(self):
        """Check if the database connection is working."""
        logger.info("Checking database connection...")
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                
            if result[0] == 1:
                logger.info("Database connection is working")
                return True
            else:
                logger.error("Database connection test failed")
                self.errors_found.append({
                    "type": "database_connection",
                    "message": "Database connection test failed"
                })
                return False
        
        except OperationalError as e:
            logger.error(f"Database connection error: {str(e)}")
            self.errors_found.append({
                "type": "database_connection",
                "message": str(e)
            })
            return False
    
    def check_database_migrations(self):
        """Check if all migrations have been applied."""
        logger.info("Checking database migrations...")
        
        try:
            # Check for unapplied migrations
            from django.db.migrations.executor import MigrationExecutor
            executor = MigrationExecutor(connection)
            plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
            
            if plan:
                logger.warning(f"Found {len(plan)} unapplied migrations")
                self.errors_found.append({
                    "type": "unapplied_migrations",
                    "message": f"Found {len(plan)} unapplied migrations",
                    "migrations": [f"{migration[0]}.{migration[1]}" for migration in plan]
                })
                return False
            else:
                logger.info("All migrations have been applied")
                return True
        
        except Exception as e:
            logger.error(f"Error checking migrations: {str(e)}")
            self.errors_found.append({
                "type": "migration_check_error",
                "message": str(e)
            })
            return False
    
    def apply_migrations(self):
        """Apply all pending migrations."""
        logger.info("Applying migrations...")
        
        try:
            call_command('migrate')
            logger.info("Migrations applied successfully")
            self.errors_fixed.append({
                "type": "unapplied_migrations",
                "message": "Applied all pending migrations"
            })
            return True
        
        except Exception as e:
            logger.error(f"Error applying migrations: {str(e)}")
            return False
    
    def check_database_integrity(self):
        """Check database integrity for common issues."""
        logger.info("Checking database integrity...")
        integrity_issues = []
        
        try:
            # Check for orphaned records
            for model_name, model_class in self.models.items():
                if hasattr(model_class, 'event') and model_name not in ['Event', 'EventType', 'EventStatus']:
                    try:
                        orphaned_count = model_class.objects.filter(event__isnull=True).count()
                        if orphaned_count > 0:
                            logger.warning(f"Found {orphaned_count} orphaned {model_name} records")
                            integrity_issues.append({
                                "model": model_name,
                                "issue": "orphaned_records",
                                "count": orphaned_count
                            })
                    except Exception as e:
                        logger.error(f"Error checking {model_name} for orphaned records: {str(e)}")
            
            # Check for duplicate records
            # Example: Check for duplicate position numbers within the same event
            from django.db.models import Count
            duplicate_positions = self.models['EventPosition'].objects.values(
                'event', 'position_number'
            ).annotate(
                count=Count('id')
            ).filter(count__gt=1)
            
            if duplicate_positions.exists():
                logger.warning(f"Found {duplicate_positions.count()} duplicate position numbers")
                integrity_issues.append({
                    "model": "EventPosition",
                    "issue": "duplicate_position_numbers",
                    "count": duplicate_positions.count()
                })
            
            if integrity_issues:
                self.errors_found.append({
                    "type": "database_integrity",
                    "message": f"Found {len(integrity_issues)} integrity issues",
                    "issues": integrity_issues
                })
                return False
            else:
                logger.info("No database integrity issues found")
                return True
        
        except Exception as e:
            logger.error(f"Error checking database integrity: {str(e)}")
            self.errors_found.append({
                "type": "database_integrity_check_error",
                "message": str(e)
            })
            return False
    
    def fix_database_integrity(self):
        """Fix database integrity issues."""
        logger.info("Fixing database integrity issues...")
        
        try:
            # Fix orphaned records
            for model_name, model_class in self.models.items():
                if hasattr(model_class, 'event') and model_name not in ['Event', 'EventType', 'EventStatus']:
                    try:
                        orphaned_count = model_class.objects.filter(event__isnull=True).count()
                        if orphaned_count > 0:
                            logger.info(f"Deleting {orphaned_count} orphaned {model_name} records")
                            model_class.objects.filter(event__isnull=True).delete()
                            self.errors_fixed.append({
                                "type": "orphaned_records",
                                "model": model_name,
                                "count": orphaned_count,
                                "message": f"Deleted {orphaned_count} orphaned {model_name} records"
                            })
                    except Exception as e:
                        logger.error(f"Error fixing orphaned {model_name} records: {str(e)}")
            
            # Fix duplicate position numbers
            from django.db.models import Count
            duplicate_positions = self.models['EventPosition'].objects.values(
                'event', 'position_number'
            ).annotate(
                count=Count('id')
            ).filter(count__gt=1)
            
            if duplicate_positions.exists():
                logger.info(f"Fixing {duplicate_positions.count()} duplicate position numbers")
                
                for dup in duplicate_positions:
                    event_id = dup['event']
                    position_number = dup['position_number']
                    
                    # Get all positions with this number in this event, ordered by ID
                    positions = self.models['EventPosition'].objects.filter(
                        event_id=event_id,
                        position_number=position_number
                    ).order_by('id')
                    
                    # Keep the first one, renumber the rest
                    max_position = self.models['EventPosition'].objects.filter(
                        event_id=event_id
                    ).order_by('-position_number').first().position_number
                    
                    for i, position in enumerate(positions[1:], 1):
                        position.position_number = max_position + i
                        position.save()
                
                self.errors_fixed.append({
                    "type": "duplicate_position_numbers",
                    "model": "EventPosition",
                    "count": duplicate_positions.count(),
                    "message": f"Fixed {duplicate_positions.count()} duplicate position numbers"
                })
            
            logger.info("Database integrity issues fixed")
            return True
        
        except Exception as e:
            logger.error(f"Error fixing database integrity: {str(e)}")
            return False
    
    def check_static_files(self):
        """Check if static files are properly collected."""
        logger.info("Checking static files...")
        
        try:
            from django.conf import settings
            static_root = settings.STATIC_ROOT
            
            if not os.path.exists(static_root):
                logger.warning(f"Static root directory does not exist: {static_root}")
                self.errors_found.append({
                    "type": "static_files",
                    "message": f"Static root directory does not exist: {static_root}"
                })
                return False
            
            # Check for key static files
            key_files = [
                'css/bootstrap.min.css',
                'js/bootstrap.bundle.min.js',
                'js/jquery.min.js'
            ]
            
            missing_files = []
            for file_path in key_files:
                full_path = os.path.join(static_root, file_path)
                if not os.path.exists(full_path):
                    missing_files.append(file_path)
            
            if missing_files:
                logger.warning(f"Missing {len(missing_files)} key static files")
                self.errors_found.append({
                    "type": "static_files",
                    "message": f"Missing {len(missing_files)} key static files",
                    "missing_files": missing_files
                })
                return False
            else:
                logger.info("Static files are properly collected")
                return True
        
        except Exception as e:
            logger.error(f"Error checking static files: {str(e)}")
            self.errors_found.append({
                "type": "static_files_check_error",
                "message": str(e)
            })
            return False
    
    def collect_static_files(self):
        """Collect static files."""
        logger.info("Collecting static files...")
        
        try:
            call_command('collectstatic', interactive=False)
            logger.info("Static files collected successfully")
            self.errors_fixed.append({
                "type": "static_files",
                "message": "Collected static files"
            })
            return True
        
        except Exception as e:
            logger.error(f"Error collecting static files: {str(e)}")
            return False
    
    def check_template_errors(self):
        """Check for common template errors."""
        logger.info("Checking for template errors...")
        
        try:
            from django.template.loader import get_template
            from django.template import TemplateDoesNotExist, TemplateSyntaxError
            
            # List of key templates to check
            key_templates = [
                'scheduler/base.html',
                'scheduler/home.html',
                'scheduler/dashboard.html',
                'scheduler/event_list.html',
                'scheduler/event_detail.html',
                'scheduler/attendant_list.html',
                'scheduler/count_entry.html',
                'scheduler/count_reports.html'
            ]
            
            template_errors = []
            for template_name in key_templates:
                try:
                    template = get_template(template_name)
                    # Try to render the template with an empty context
                    template.render({})
                except TemplateDoesNotExist:
                    template_errors.append({
                        "template": template_name,
                        "error": "Template does not exist"
                    })
                except TemplateSyntaxError as e:
                    template_errors.append({
                        "template": template_name,
                        "error": f"Syntax error: {str(e)}"
                    })
                except Exception as e:
                    template_errors.append({
                        "template": template_name,
                        "error": str(e)
                    })
            
            if template_errors:
                logger.warning(f"Found {len(template_errors)} template errors")
                self.errors_found.append({
                    "type": "template_errors",
                    "message": f"Found {len(template_errors)} template errors",
                    "errors": template_errors
                })
                return False
            else:
                logger.info("No template errors found")
                return True
        
        except Exception as e:
            logger.error(f"Error checking templates: {str(e)}")
            self.errors_found.append({
                "type": "template_check_error",
                "message": str(e)
            })
            return False
    
    def check_url_patterns(self):
        """Check for URL pattern errors."""
        logger.info("Checking URL patterns...")
        
        try:
            from django.urls import get_resolver
            resolver = get_resolver()
            
            # Check for duplicate URL patterns
            url_patterns = {}
            duplicate_patterns = []
            
            for pattern in resolver.url_patterns:
                if hasattr(pattern, 'pattern'):
                    pattern_str = str(pattern.pattern)
                    if pattern_str in url_patterns:
                        duplicate_patterns.append({
                            "pattern": pattern_str,
                            "view1": url_patterns[pattern_str],
                            "view2": str(pattern.callback)
                        })
                    else:
                        url_patterns[pattern_str] = str(pattern.callback)
            
            if duplicate_patterns:
                logger.warning(f"Found {len(duplicate_patterns)} duplicate URL patterns")
                self.errors_found.append({
                    "type": "url_patterns",
                    "message": f"Found {len(duplicate_patterns)} duplicate URL patterns",
                    "duplicates": duplicate_patterns
                })
                return False
            else:
                logger.info("No URL pattern errors found")
                return True
        
        except Exception as e:
            logger.error(f"Error checking URL patterns: {str(e)}")
            self.errors_found.append({
                "type": "url_pattern_check_error",
                "message": str(e)
            })
            return False
    
    def check_permissions(self):
        """Check for permission issues."""
        logger.info("Checking permissions...")
        
        try:
            from django.contrib.auth.models import Group, Permission
            
            # Check if all required groups exist
            required_groups = ['Admin', 'Overseer', 'Attendant']
            missing_groups = []
            
            for group_name in required_groups:
                if not Group.objects.filter(name=group_name).exists():
                    missing_groups.append(group_name)
            
            if missing_groups:
                logger.warning(f"Missing groups: {', '.join(missing_groups)}")
                self.errors_found.append({
                    "type": "permissions",
                    "message": f"Missing groups: {', '.join(missing_groups)}",
                    "missing_groups": missing_groups
                })
                return False
            else:
                logger.info("All required groups exist")
                return True
        
        except Exception as e:
            logger.error(f"Error checking permissions: {str(e)}")
            self.errors_found.append({
                "type": "permission_check_error",
                "message": str(e)
            })
            return False
    
    def create_missing_groups(self):
        """Create missing user groups."""
        logger.info("Creating missing groups...")
        
        try:
            from django.contrib.auth.models import Group
            
            # Create missing groups
            required_groups = ['Admin', 'Overseer', 'Attendant']
            created_groups = []
            
            for group_name in required_groups:
                if not Group.objects.filter(name=group_name).exists():
                    Group.objects.create(name=group_name)
                    created_groups.append(group_name)
            
            if created_groups:
                logger.info(f"Created groups: {', '.join(created_groups)}")
                self.errors_fixed.append({
                    "type": "permissions",
                    "message": f"Created groups: {', '.join(created_groups)}",
                    "created_groups": created_groups
                })
            else:
                logger.info("No groups needed to be created")
            
            return True
        
        except Exception as e:
            logger.error(f"Error creating groups: {str(e)}")
            return False
    
    def run_all_checks(self):
        """Run all checks to identify errors."""
        logger.info("Running all checks...")
        
        # Database checks
        self.check_database_connection()
        self.check_database_migrations()
        self.check_database_integrity()
        
        # Static files check
        self.check_static_files()
        
        # Template checks
        self.check_template_errors()
        
        # URL pattern checks
        self.check_url_patterns()
        
        # Permission checks
        self.check_permissions()
        
        logger.info(f"Found {len(self.errors_found)} errors")
        return len(self.errors_found) == 0
    
    def fix_all_errors(self):
        """Fix all identified errors."""
        logger.info("Fixing all errors...")
        
        # Apply migrations if needed
        if any(error['type'] == 'unapplied_migrations' for error in self.errors_found):
            self.apply_migrations()
        
        # Fix database integrity issues
        if any(error['type'] == 'database_integrity' for error in self.errors_found):
            self.fix_database_integrity()
        
        # Collect static files if needed
        if any(error['type'] == 'static_files' for error in self.errors_found):
            self.collect_static_files()
        
        # Create missing groups if needed
        if any(error['type'] == 'permissions' for error in self.errors_found):
            self.create_missing_groups()
        
        logger.info(f"Fixed {len(self.errors_fixed)} errors")
        return len(self.errors_fixed) > 0
    
    def save_results(self):
        """Save the results to files."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save errors found
        with open(f"{self.output_dir}/errors_found_{timestamp}.json", "w") as f:
            json.dump(self.errors_found, f, indent=2)
        
        # Save errors fixed
        with open(f"{self.output_dir}/errors_fixed_{timestamp}.json", "w") as f:
            json.dump(self.errors_fixed, f, indent=2)
        
        # Save summary
        summary = {
            "timestamp": timestamp,
            "settings_module": self.settings_module,
            "errors_found_count": len(self.errors_found),
            "errors_fixed_count": len(self.errors_fixed),
            "all_errors_fixed": len(self.errors_found) == len(self.errors_fixed)
        }
        
        with open(f"{self.output_dir}/summary_{timestamp}.json", "w") as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"Results saved to {self.output_dir}")
        logger.info(f"Errors found: {len(self.errors_found)}")
        logger.info(f"Errors fixed: {len(self.errors_fixed)}")

def main():
    """Main function to run the error fixer."""
    parser = argparse.ArgumentParser(description="Fix common errors in the staging environment")
    parser.add_argument("--settings", required=True, help="Django settings module")
    parser.add_argument("--output-dir", default="./results", help="Output directory for results")
    parser.add_argument("--check-only", action="store_true", help="Only check for errors, don't fix them")
    
    args = parser.parse_args()
    
    fixer = ErrorFixer(args.settings, args.output_dir)
    
    # Run all checks
    all_checks_passed = fixer.run_all_checks()
    
    # Fix errors if needed and not in check-only mode
    if not all_checks_passed and not args.check_only:
        fixer.fix_all_errors()
    
    # Save results
    fixer.save_results()
    
    # Return success status
    return 0 if all_checks_passed or len(fixer.errors_found) == len(fixer.errors_fixed) else 1

if __name__ == "__main__":
    sys.exit(main())
