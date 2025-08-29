# Auto-Assign Function Specification

## Overview
Intelligent automatic assignment system for JW Attendant Scheduler that optimally assigns attendants to positions and shifts while respecting constraints and minimizing conflicts.

## Prerequisites

### 1. Position and Shift Templates
- **Event Templates**: Pre-defined position/shift combinations for different event types
- **Position Library**: Standard positions (Attendant, Sound, Stage, etc.)
- **Shift Patterns**: Time blocks and duration templates
- **Template Application**: Apply template to event before auto-assign

### 2. Oversight Assignment Requirements
- **Oversight Positions**: Must be assigned first (Overseer, Assistant Overseer, Keyman)
- **Position Coverage**: Each position must have designated oversight
- **Attendant Oversight**: Each attendant must have assigned oversight contact
- **Validation**: System validates oversight completeness before auto-assign

## Auto-Assign Algorithm

### Phase 1: Validation
```
1. Verify all positions/shifts are defined for event
2. Confirm all oversight assignments are complete
3. Check attendant availability and qualifications
4. Validate no pre-existing conflicts
```

### Phase 2: Constraint Analysis
```
1. Hard Constraints (must not violate):
   - No time overlaps for same attendant
   - Attendant qualifications match position requirements
   - Respect attendant availability restrictions
   - Honor "do not assign together" preferences

2. Soft Constraints (optimize when possible):
   - Minimize attendant workload imbalance
   - Prefer attendants with relevant experience
   - Respect preferred partnerships
   - Balance congregation representation
```

### Phase 3: Assignment Optimization
```
1. Priority Assignment:
   - Critical positions first (Sound, Stage management)
   - Specialized roles requiring specific qualifications
   - High-visibility positions

2. Load Balancing:
   - Track assignments per attendant
   - Only assign multiple shifts when necessary
   - Ensure fair distribution of workload

3. Conflict Resolution:
   - Real-time conflict detection during assignment
   - Automatic backtracking when conflicts arise
   - Alternative assignment suggestions
```

## Technical Implementation

### Database Schema Extensions
```sql
-- Position Templates
CREATE TABLE position_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    event_type VARCHAR(50),
    positions JSONB,
    created_at TIMESTAMP
);

-- Assignment Rules
CREATE TABLE assignment_rules (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id),
    rule_type VARCHAR(50), -- 'qualification', 'availability', 'preference'
    rule_data JSONB,
    priority INTEGER
);

-- Auto-assign History
CREATE TABLE auto_assign_logs (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id),
    run_at TIMESTAMP,
    assignments_created INTEGER,
    conflicts_resolved INTEGER,
    status VARCHAR(20),
    log_data JSONB
);
```

### Core Functions

#### 1. Template Management
```python
def create_position_template(name, event_type, positions):
    """Create reusable position/shift template"""
    
def apply_template_to_event(event_id, template_id):
    """Apply template positions to specific event"""
    
def get_available_templates(event_type):
    """Get templates compatible with event type"""
```

#### 2. Prerequisite Validation
```python
def validate_oversight_assignments(event_id):
    """Ensure all oversight positions are filled"""
    
def validate_position_coverage(event_id):
    """Verify all positions have oversight assigned"""
    
def check_auto_assign_readiness(event_id):
    """Complete prerequisite validation"""
```

#### 3. Auto-Assignment Engine
```python
def auto_assign_attendants(event_id, options={}):
    """
    Main auto-assignment function
    
    Args:
        event_id: Target event
        options: {
            'dry_run': bool,
            'preserve_existing': bool,
            'max_assignments_per_attendant': int,
            'priority_positions': list
        }
    
    Returns:
        {
            'success': bool,
            'assignments_created': int,
            'conflicts_found': int,
            'recommendations': list,
            'log': dict
        }
    """
```

#### 4. Conflict Detection
```python
def detect_assignment_conflicts(assignments):
    """Real-time conflict detection"""
    
def resolve_conflicts(conflicts, attendants_pool):
    """Automatic conflict resolution"""
    
def suggest_alternatives(failed_assignment, available_attendants):
    """Suggest alternative assignments"""
```

## User Interface

### Auto-Assign Dashboard
- **Readiness Checklist**: Visual validation of prerequisites
- **Template Selection**: Choose and apply position templates
- **Assignment Options**: Configure auto-assign parameters
- **Progress Monitor**: Real-time assignment progress
- **Results Review**: Summary of assignments created and conflicts resolved

### Assignment Review
- **Assignment Preview**: Show proposed assignments before confirmation
- **Conflict Warnings**: Highlight any remaining issues
- **Manual Override**: Allow manual adjustments to auto-assignments
- **Bulk Approval**: Confirm all auto-assignments at once

## Configuration Options

### Event-Level Settings
```json
{
    "auto_assign_enabled": true,
    "max_assignments_per_attendant": 3,
    "require_oversight_first": true,
    "allow_cross_congregation": true,
    "priority_positions": ["Sound", "Stage", "Chairman"],
    "conflict_resolution": "automatic" // or "manual"
}
```

### Attendant Preferences
```json
{
    "preferred_positions": ["Attendant", "Microphone"],
    "avoid_positions": ["Sound"],
    "max_assignments": 2,
    "availability_restrictions": ["no_early_morning"],
    "preferred_partners": [attendant_ids],
    "avoid_partners": [attendant_ids]
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Position template system
- [ ] Basic oversight validation
- [ ] Database schema updates

### Phase 2: Core Algorithm (Week 2)
- [ ] Auto-assignment engine
- [ ] Conflict detection system
- [ ] Load balancing logic

### Phase 3: UI Integration (Week 3)
- [ ] Auto-assign dashboard
- [ ] Template management interface
- [ ] Results review system

### Phase 4: Optimization (Week 4)
- [ ] Performance tuning
- [ ] Advanced conflict resolution
- [ ] Reporting and analytics

## Success Metrics
- **Assignment Accuracy**: >95% conflict-free assignments
- **Time Savings**: Reduce manual assignment time by 80%
- **Load Balance**: Standard deviation of assignments per attendant <1.5
- **User Satisfaction**: Positive feedback on assignment quality

## Future Enhancements
- Machine learning for assignment optimization
- Historical performance analysis
- Predictive conflict detection
- Integration with external calendar systems
