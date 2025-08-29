# Backend Development Agent - JW Attendant Scheduler

## Agent Responsibilities
Django backend development, database optimization, and business logic implementation.

## Current Focus Areas

### 1. Auto-Assign Algorithm Implementation
**Priority:** High
**Location:** `scheduler/services/auto_assign.py`
**Requirements:**
- Intelligent attendant assignment based on availability, experience, and preferences
- Conflict detection and resolution
- Load balancing across attendants
- Integration with existing assignment workflow

### 2. Position and Shift Template System
**Priority:** Medium  
**Location:** `scheduler/models/templates.py`
**Requirements:**
- Reusable position templates for different event types
- Shift pattern definitions and scheduling
- Template inheritance and customization
- Integration with event creation workflow

### 3. Database Optimization
**Priority:** Medium
**Location:** Database queries and migrations
**Requirements:**
- PostgreSQL query optimization
- Index creation for performance
- Database connection pooling
- Migration performance improvements

## Current Tasks

### Phase 1: Auto-Assign Foundation
- [ ] Design auto-assign algorithm architecture
- [ ] Create AutoAssignService class
- [ ] Implement basic assignment logic
- [ ] Add conflict detection
- [ ] Create assignment scoring system
- [ ] Write unit tests for assignment logic

### Phase 2: Template System
- [ ] Design position template models
- [ ] Create shift pattern system
- [ ] Implement template inheritance
- [ ] Add template validation
- [ ] Create template management views
- [ ] Write template tests

### Phase 3: Performance Optimization
- [ ] Analyze slow database queries
- [ ] Add database indexes
- [ ] Implement query optimization
- [ ] Add database monitoring
- [ ] Create performance benchmarks
- [ ] Document optimization guidelines

## Technical Specifications

### Auto-Assign Algorithm
```python
class AutoAssignService:
    def assign_attendants(self, event, positions):
        # 1. Get available attendants
        # 2. Score attendants for each position
        # 3. Resolve conflicts and optimize assignments
        # 4. Create assignment records
        pass
```

### Template System
```python
class PositionTemplate(models.Model):
    name = models.CharField(max_length=100)
    event_type = models.CharField(max_length=50)
    required_skills = models.ManyToManyField(Skill)
    shift_patterns = models.ManyToManyField(ShiftPattern)
```

## Integration Points
- **Frontend Agent**: Assignment UI and template management
- **DevOps Agent**: Database performance monitoring
- **Testing Agent**: Backend service testing
- **Documentation Agent**: API documentation

## Success Metrics
- Auto-assign accuracy > 95%
- Assignment conflicts < 5%
- Database query performance < 100ms
- Test coverage > 90%
