# Count Times Implementation Plan

## Phase 1: Database Models and Migrations

1. Create the following models in `scheduler/models.py`:
   - `CountTime`: Configuration for when counts should be taken
   - `CountSession`: Instance of a count being taken
   - `PositionCount`: Individual position count entry

2. Create migrations for the new models:
   ```bash
   python manage.py makemigrations
   ```

3. Apply migrations to staging environment:
   ```bash
   ssh -F /Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant jw-staging "cd /opt/jw-attendant-staging && python manage.py migrate"
   ```

## Phase 2: Backend Implementation

1. Update `scheduler/views.py` with new views:
   - `CountTimeCreateView`
   - `CountTimeUpdateView`
   - `CountSessionCreateView`
   - `CountSessionDetailView`
   - `PositionCountEntryView`

2. Create API endpoints in `scheduler/api_views.py`:
   - GET/POST `/api/events/{id}/count-times/`
   - GET/POST `/api/events/{id}/count-sessions/`
   - GET/POST `/api/count-sessions/{id}/position-counts/`

3. Update `scheduler/urls.py` with new URL patterns for count-related views

4. Implement permissions in `scheduler/views.py`:
   - Only oversight and admin users can enter and modify count data

## Phase 3: Frontend Implementation

1. Create templates:
   - `templates/scheduler/count_times_config.html` - Configuration interface
   - `templates/scheduler/count_entry.html` - Count entry form
   - `templates/scheduler/count_session_detail.html` - Session details
   - `templates/scheduler/count_reports.html` - Reporting interface

2. Update event detail template to include count times tab:
   - Add tab to navigation in `templates/scheduler/event_detail.html`
   - Create tab content section for count times configuration

3. Implement JavaScript for count entry form:
   - Quick data entry with keyboard navigation
   - Auto-save functionality
   - Form validation

4. Create CSS styles for count interfaces:
   - Responsive grid layout for position counts
   - Visual indicators for count status

## Phase 4: Testing

1. Create unit tests in `tests/test_count_times.py`:
   - Test model relationships and constraints
   - Test view permissions and access control
   - Test count data validation

2. Create integration tests:
   - Test count entry workflow
   - Test multi-day event scenarios
   - Test reporting functionality

3. Manual testing on staging environment:
   - Test with realistic event data
   - Test with multiple users and roles
   - Test edge cases (zero counts, partial submissions)

## Phase 5: Deployment

1. Deploy to staging environment:
   ```bash
   ssh -F /Users/cory/Documents/Cloudy-Work/ssh_config_jw_attendant jw-staging "cd /opt/jw-attendant-staging && git pull && python manage.py migrate && python manage.py collectstatic --noinput && systemctl restart jw-attendant-staging"
   ```

2. Validate functionality on staging:
   - Create test event with count times
   - Enter test count data
   - Generate and review reports

3. Deploy to production using staging-first workflow:
   ```bash
   /Users/cory/Documents/Cloudy-Work/scripts/deploy-staging-to-production.sh
   ```

## Timeline

- Phase 1: 1 day
- Phase 2: 2 days
- Phase 3: 2 days
- Phase 4: 1 day
- Phase 5: 1 day

Total estimated time: 7 days
