# Event-Centric Architecture Implementation

## Overview
The JW Attendant Scheduler has been successfully redesigned with an event-centric architecture where all management systems are scoped to specific events. This fundamental change improves organization, data isolation, and user experience.

## Architecture Changes

### 1. Event Selection Flow
- **Landing Page**: Users are redirected to event selection after login
- **Session Management**: Selected event stored in user session
- **Event Creation**: Streamlined event creation with comprehensive forms
- **Event Management**: Edit, copy, delete, and status management capabilities

### 2. Event-Scoped Systems

#### Completed Systems:
- **Event Selection & Management**: Full CRUD operations for events
- **Attendant Management**: Event-aware filtering and assignment tracking
- **Navigation**: Redesigned with event-centric approach
- **Dashboard**: Event-scoped statistics and recent activity

#### Pending Systems:
- **Assignment Management**: Event-scoped assignment creation and management
- **Reports System**: Event-specific reporting and analytics
- **Oversight System**: Event-scoped oversight and management
- **Lanyard Management**: Event-specific lanyard tracking

### 3. Database Schema
- **Event Model**: Enhanced with status management (current, upcoming, past)
- **Session Storage**: Selected event ID stored in user session
- **Relationships**: All management systems linked to specific events

## Implementation Details

### Event Views (`scheduler/views/event_views.py`)
```python
- event_selection(): Landing page with event cards
- select_event(): Set selected event in session
- create_event(): Event creation with form validation
- edit_event(): Event editing with delete capability
- set_current_event(): AJAX endpoint for status management
- copy_event(): Duplicate events with configurations
- event_dashboard(): Event-specific dashboard
```

### Navigation Updates
- **Event Selection**: Primary navigation item
- **Event Management**: Dropdown menu with scoped features
- **Dashboard**: Event-aware with selected event context

### URL Structure
```
/events/select/                    # Event selection page
/events/<id>/select/              # Select specific event
/events/<id>/dashboard/           # Event-specific dashboard
/events/<id>/set-current/         # Set current event (AJAX)
/events/<id>/copy/                # Copy event
/events/add/                      # Create new event
/events/<id>/edit/                # Edit event
```

## PostgreSQL Migration

### Database Setup
- **Container**: postgres-01 (10.92.3.21)
- **Database**: jw_scheduler
- **User**: jwscheduler
- **Network**: 10Gig interface (vmbr0923)

### Migration Scripts
1. **setup-postgresql.sh**: PostgreSQL container setup
2. **migrate-to-postgresql.sh**: Data migration from SQLite
3. **Updated settings.py**: Environment-based database configuration

### Configuration
```bash
DB_ENGINE=django.db.backends.postgresql
DB_NAME=jw_scheduler
DB_USER=jwscheduler
DB_PASSWORD=Cloudy_92!
DB_HOST=10.92.3.21
DB_PORT=5432
```

## Templates Created

### Event Management Templates
- `event_selection.html`: Event selection landing page
- `event_create.html`: Event creation form
- `event_edit.html`: Event editing with actions
- `event_dashboard.html`: Event-specific dashboard (pending)

### Features
- **Responsive Design**: Mobile-friendly event cards
- **Status Indicators**: Visual status badges (current, upcoming, past)
- **Quick Actions**: Edit, copy, delete, set current
- **Statistics**: Event-specific metrics and counts

## Forms Implementation

### EventForm (`scheduler/forms.py`)
```python
- Event creation and editing
- Date validation
- Status management
- Station and attendant planning
```

## Session Management
- **Selected Event**: Stored in `request.session['selected_event_id']`
- **Persistence**: Maintained across requests
- **Validation**: Automatic cleanup of invalid event IDs
- **Redirection**: Automatic redirect to event selection when needed

## Security Considerations
- **Event Isolation**: Users can only access selected event data
- **Permission Checks**: Role-based access control maintained
- **Data Validation**: Comprehensive form validation
- **CSRF Protection**: All forms protected

## Performance Optimizations
- **Efficient Queries**: Event-scoped database queries
- **Pagination**: Maintained for large datasets
- **Caching**: Session-based event caching
- **Database Indexes**: Optimized for event-based queries

## Next Steps

### High Priority
1. **Assignment Management**: Implement event-scoped assignments
2. **Reports System**: Event-specific reporting
3. **Oversight System**: Event-scoped oversight management
4. **Lanyard Management**: Event-specific lanyard tracking

### Medium Priority
1. **Mobile UI**: Responsive design improvements
2. **Event Status**: Automated status management
3. **User Management**: Admin-only user management
4. **Attendant Dashboard**: Event-aware personal dashboard

## Deployment Status

### Completed Infrastructure
- ✅ PostgreSQL container (postgres-01, 10.92.3.21)
- ✅ Application container (jw-attendant, 10.92.3.22)
- ✅ Django application deployed
- ✅ Environment configuration
- ✅ Gmail authentication
- ✅ Static file serving

### Pending Infrastructure
- 🔄 PostgreSQL migration execution
- ⏳ NPM proxy configuration
- ⏳ Production monitoring
- ⏳ SSL/TLS setup

## Testing Checklist

### Event Management
- [ ] Create new event
- [ ] Edit existing event
- [ ] Delete event with confirmation
- [ ] Copy event with data
- [ ] Set current event
- [ ] Event status transitions

### Event-Scoped Features
- [ ] Attendant list filtering by event
- [ ] Event-specific dashboard
- [ ] Session persistence
- [ ] Navigation updates

### Database Migration
- [ ] SQLite backup creation
- [ ] Data export/import
- [ ] PostgreSQL connectivity
- [ ] Data integrity verification
- [ ] Application functionality

## Troubleshooting

### Common Issues
1. **Event Selection Loop**: Clear session if invalid event ID
2. **Database Connection**: Verify PostgreSQL configuration
3. **Permission Errors**: Check user roles and permissions
4. **Static Files**: Ensure WhiteNoise middleware active

### Debug Commands
```bash
# Check selected event in session
python manage.py shell -c "from django.contrib.sessions.models import Session; print(Session.objects.all())"

# Verify event data
python manage.py shell -c "from scheduler.models import Event; print(Event.objects.all())"

# Test database connection
python manage.py dbshell
```

## Documentation Updates
- Event-centric user guide needed
- Admin documentation for event management
- API documentation for event endpoints
- Deployment guide updates

---

**Implementation Status**: Foundation Complete ✅  
**Next Phase**: Event-Scoped Feature Implementation  
**Target Completion**: Full event-centric system operational
