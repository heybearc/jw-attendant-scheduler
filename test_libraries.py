#!/usr/bin/env python3
"""
Test script for SDD Library-First Architecture

This script tests the library interfaces without requiring Django setup.
It validates the library structure, imports, and basic functionality.
"""

import sys
import os
import importlib.util
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def test_library_structure():
    """Test that all library directories and files exist."""
    print("Testing library structure...")
    
    required_paths = [
        "scheduler/libs/__init__.py",
        "scheduler/libs/shared/__init__.py",
        "scheduler/libs/shared/observability.py",
        "scheduler/libs/shared/contracts.py",
        "scheduler/libs/shared/cli_base.py",
        "scheduler/libs/event_management/__init__.py",
        "scheduler/libs/event_management/models.py",
        "scheduler/libs/event_management/services.py",
        "scheduler/libs/event_management/cli.py",
        "scheduler/libs/attendant_scheduling/__init__.py",
        "scheduler/libs/attendant_scheduling/models.py",
        "scheduler/libs/attendant_scheduling/services.py",
        "scheduler/libs/attendant_scheduling/cli.py",
        "scheduler/libs/count_tracking/__init__.py",
        "scheduler/libs/count_tracking/models.py",
        "scheduler/libs/count_tracking/services.py",
        "scheduler/libs/count_tracking/cli.py",
        "scheduler/management/commands/event.py",
        "scheduler/management/commands/attendant.py",
        "scheduler/management/commands/count.py"
    ]
    
    missing_files = []
    for path in required_paths:
        full_path = project_root / path
        if not full_path.exists():
            missing_files.append(path)
    
    if missing_files:
        print(f"❌ Missing files: {missing_files}")
        return False
    else:
        print("✅ All required library files exist")
        return True

def test_imports():
    """Test that library modules can be imported."""
    print("\nTesting library imports...")
    
    # Mock Django components that libraries depend on
    class MockDjango:
        class db:
            class models:
                class Model:
                    objects = None
                    def save(self, **kwargs):
                        pass
                    def delete(self):
                        pass
        
        class core:
            class management:
                class base:
                    class BaseCommand:
                        def add_arguments(self, parser):
                            pass
                        def handle(self, *args, **options):
                            pass
    
    # Mock scheduler.models
    sys.modules['django'] = MockDjango()
    sys.modules['django.db'] = MockDjango.db
    sys.modules['django.db.models'] = MockDjango.db.models
    sys.modules['django.core'] = MockDjango.core
    sys.modules['django.core.management'] = MockDjango.core.management
    sys.modules['django.core.management.base'] = MockDjango.core.management.base
    
    # Mock scheduler models
    class MockSchedulerModels:
        class Event:
            objects = None
            def __init__(self, **kwargs):
                for k, v in kwargs.items():
                    setattr(self, k, v)
        
        class Attendant:
            objects = None
            def __init__(self, **kwargs):
                for k, v in kwargs.items():
                    setattr(self, k, v)
        
        class Position:
            objects = None
            def __init__(self, **kwargs):
                for k, v in kwargs.items():
                    setattr(self, k, v)
        
        class Assignment:
            objects = None
            def __init__(self, **kwargs):
                for k, v in kwargs.items():
                    setattr(self, k, v)
        
        class CountSession:
            objects = None
            def __init__(self, **kwargs):
                for k, v in kwargs.items():
                    setattr(self, k, v)
        
        class CountRecord:
            objects = None
            def __init__(self, **kwargs):
                for k, v in kwargs.items():
                    setattr(self, k, v)
    
    sys.modules['scheduler'] = type('Module', (), {})()
    sys.modules['scheduler.models'] = MockSchedulerModels()
    
    test_modules = [
        "scheduler.libs.shared.observability",
        "scheduler.libs.shared.contracts", 
        "scheduler.libs.shared.cli_base",
        "scheduler.libs.event_management",
        "scheduler.libs.attendant_scheduling",
        "scheduler.libs.count_tracking",
        "scheduler.libs"
    ]
    
    failed_imports = []
    for module_name in test_modules:
        try:
            spec = importlib.util.spec_from_file_location(
                module_name, 
                project_root / module_name.replace('.', '/') / "__init__.py"
            )
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                sys.modules[module_name] = module
                spec.loader.exec_module(module)
                print(f"✅ Successfully imported {module_name}")
            else:
                failed_imports.append(module_name)
        except Exception as e:
            print(f"❌ Failed to import {module_name}: {e}")
            failed_imports.append(module_name)
    
    return len(failed_imports) == 0

def test_library_interfaces():
    """Test basic library interface functionality."""
    print("\nTesting library interfaces...")
    
    try:
        # Test that we can access the main library interface
        from scheduler.libs import JWSchedulerLibs, scheduler_libs
        
        # Test library info
        info = scheduler_libs.get_library_info()
        print(f"✅ Library info retrieved: {len(info['libraries'])} libraries available")
        
        # Test that libraries have expected methods
        expected_methods = {
            'events': ['create_event', 'get_event', 'list_events', 'update_event', 'delete_event'],
            'attendants': ['create_attendant', 'get_attendant', 'list_attendants', 'update_attendant', 'delete_attendant'],
            'counts': ['create_count_session', 'get_count_session', 'list_count_sessions', 'record_count']
        }
        
        for lib_name, methods in expected_methods.items():
            lib = getattr(scheduler_libs, lib_name)
            for method in methods:
                if hasattr(lib, method):
                    print(f"✅ {lib_name}.{method} method exists")
                else:
                    print(f"❌ {lib_name}.{method} method missing")
                    return False
        
        return True
        
    except Exception as e:
        print(f"❌ Library interface test failed: {e}")
        return False

def test_cli_structure():
    """Test CLI command structure."""
    print("\nTesting CLI structure...")
    
    cli_commands = [
        "scheduler/management/commands/event.py",
        "scheduler/management/commands/attendant.py", 
        "scheduler/management/commands/count.py"
    ]
    
    for cmd_path in cli_commands:
        full_path = project_root / cmd_path
        if full_path.exists():
            print(f"✅ CLI command exists: {cmd_path}")
        else:
            print(f"❌ CLI command missing: {cmd_path}")
            return False
    
    return True

def test_contract_schemas():
    """Test contract schema definitions."""
    print("\nTesting contract schemas...")
    
    try:
        from scheduler.libs.shared.contracts import CommonContracts
        
        required_schemas = [
            'event_create', 'event_update',
            'attendant_create', 'attendant_update', 
            'assignment_create',
            'count_session_create', 'count_record'
        ]
        
        for schema_name in required_schemas:
            if schema_name in CommonContracts.COMMON_SCHEMAS:
                print(f"✅ Contract schema exists: {schema_name}")
            else:
                print(f"❌ Contract schema missing: {schema_name}")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Contract schema test failed: {e}")
        return False

def generate_test_report():
    """Generate comprehensive test report."""
    print("\n" + "="*60)
    print("SDD LIBRARY-FIRST ARCHITECTURE TEST REPORT")
    print("="*60)
    
    tests = [
        ("Library Structure", test_library_structure),
        ("Module Imports", test_imports),
        ("Library Interfaces", test_library_interfaces),
        ("CLI Structure", test_cli_structure),
        ("Contract Schemas", test_contract_schemas)
    ]
    
    results = {}
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        results[test_name] = test_func()
    
    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<25} {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - SDD Library-First Architecture is ready!")
        return True
    else:
        print("⚠️  Some tests failed - review and fix issues before proceeding")
        return False

if __name__ == "__main__":
    success = generate_test_report()
    sys.exit(0 if success else 1)
