# SDD Library-First Refactor Plan

## Overview
Transform the JW Attendant Scheduler from a monolithic Django app to a library-first architecture following SDD Article I principles.

## Current State Analysis
- **Monolithic Structure**: Single Django app with all functionality in `scheduler/`
- **Missing CLI Interfaces**: No command-line access to core features
- **Incomplete Contracts**: Minimal OpenAPI specification
- **Limited Observability**: No structured `log_event()` implementation

## Target Architecture

### Library Structure
```
scheduler/
├── libs/
│   ├── event_management/
│   │   ├── __init__.py
│   │   ├── cli.py
│   │   ├── models.py
│   │   ├── services.py
│   │   └── contracts/
│   ├── attendant_scheduling/
│   │   ├── __init__.py
│   │   ├── cli.py
│   │   ├── models.py
│   │   ├── services.py
│   │   └── contracts/
│   ├── count_tracking/
│   │   ├── __init__.py
│   │   ├── cli.py
│   │   ├── models.py
│   │   ├── services.py
│   │   └── contracts/
│   ├── oversight_management/
│   │   ├── __init__.py
│   │   ├── cli.py
│   │   ├── models.py
│   │   ├── services.py
│   │   └── contracts/
│   └── shared/
│       ├── __init__.py
│       ├── observability.py
│       ├── contracts.py
│       └── cli_base.py
├── web/
│   ├── views/
│   ├── templates/
│   ├── forms/
│   └── urls.py
└── management/
    └── commands/
```

## Refactor Phases

### Phase 1: Foundation Setup
1. **Create Library Structure**
   - Set up `libs/` directory with core libraries
   - Create shared utilities and base classes
   - Implement observability framework

2. **Implement CLI Framework**
   - Create base CLI classes with JSON I/O
   - Add management commands for each library
   - Ensure text-in/text-out interfaces

3. **Contract-First Development**
   - Expand OpenAPI specifications for each library
   - Create contract tests under `/tests/contract/`
   - Define data contracts and API schemas

### Phase 2: Library Migration
1. **Event Management Library**
   - Extract event CRUD operations
   - Implement CLI interface for event management
   - Add comprehensive contracts and tests

2. **Attendant Scheduling Library**
   - Extract attendant and assignment logic
   - Implement auto-assign algorithm as library
   - Add CLI for scheduling operations

3. **Count Tracking Library**
   - Extract count times functionality
   - Implement position and session management
   - Add CLI for count operations

4. **Oversight Management Library**
   - Extract oversight and reporting features
   - Implement dashboard and analytics
   - Add CLI for oversight operations

### Phase 3: Integration & Testing
1. **Web Layer Refactor**
   - Refactor views to use library interfaces
   - Maintain existing URL structure
   - Ensure backward compatibility

2. **Comprehensive Testing**
   - Contract tests for all libraries
   - Integration tests with real dependencies
   - End-to-end testing of CLI interfaces

3. **Observability Implementation**
   - Add `log_event(event, attrs)` throughout
   - Implement structured logging
   - Add monitoring and metrics

## Implementation Strategy

### Library-First Principles
- Each feature starts as a standalone library
- Libraries expose both Python API and CLI
- JSON input/output for all CLI commands
- Text-based interfaces for automation

### CLI Interface Design
```bash
# Event Management
python manage.py event create --name "Assembly 2025" --date "2025-06-01"
python manage.py event list --format json
python manage.py event assign-positions --event-id 1 --positions-file positions.json

# Attendant Scheduling  
python manage.py attendant create --data attendant.json
python manage.py attendant auto-assign --event-id 1 --algorithm balanced
python manage.py attendant export --event-id 1 --format csv

# Count Tracking
python manage.py count create-session --event-id 1 --name "Morning Count"
python manage.py count enter --session-id 1 --counts counts.json
python manage.py count report --event-id 1 --format json
```

### Contract-First Development
- OpenAPI specs drive implementation
- Contract tests validate library interfaces
- Data contracts ensure consistency
- API versioning for backward compatibility

### Observability Framework
```python
from scheduler.libs.shared.observability import log_event

# Key business events
log_event("attendant.assigned", {
    "event_id": event.id,
    "attendant_id": attendant.id,
    "position_id": position.id,
    "algorithm": "auto_assign"
})

log_event("count.session_created", {
    "event_id": event.id,
    "session_id": session.id,
    "created_by": user.id
})
```

## Migration Steps

### Step 1: Create Foundation
- [ ] Set up library directory structure
- [ ] Implement shared utilities and base classes
- [ ] Create CLI framework with JSON I/O
- [ ] Add observability infrastructure

### Step 2: Extract Libraries
- [ ] Event Management Library + CLI
- [ ] Attendant Scheduling Library + CLI  
- [ ] Count Tracking Library + CLI
- [ ] Oversight Management Library + CLI

### Step 3: Refactor Web Layer
- [ ] Update views to use library interfaces
- [ ] Maintain existing templates and URLs
- [ ] Ensure feature parity

### Step 4: Testing & Contracts
- [ ] Implement contract tests for all libraries
- [ ] Add integration tests with real dependencies
- [ ] Expand OpenAPI specifications
- [ ] Add CLI integration tests

### Step 5: Production Readiness
- [ ] Performance testing of library interfaces
- [ ] Security review of CLI commands
- [ ] Documentation for library usage
- [ ] Migration guide for existing deployments

## Benefits of Library-First Architecture

1. **Modularity**: Clear separation of concerns
2. **Reusability**: Libraries can be used independently
3. **Testability**: Easier to test individual components
4. **CLI Access**: Automation and scripting capabilities
5. **Contract-Driven**: Clear interfaces and expectations
6. **Observability**: Structured logging and monitoring

## Backward Compatibility

- Existing web interface remains unchanged
- Current API endpoints maintained
- Database schema preserved
- Deployment process unaffected
- Gradual migration path available

This refactor will transform the application into a true SDD-compliant system while maintaining all existing functionality and providing new CLI capabilities for automation and integration.
