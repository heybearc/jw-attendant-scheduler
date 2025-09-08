# Count Tracking Contracts

This directory contains JSON Schema contracts for the Count Tracking feature, implementing SDD Article IV (Contract Validation).

## Schema Files

### count_session.json
Validates Count Session creation and management operations.

**Usage**:
```bash
# Validate session creation
python manage.py count create-session --validate-schema
python manage.py validate-contract count_tracking.count_session input.json
```

**Key Properties**:
- `event_id`: Event scope validation
- `name`: Session naming constraints
- `scheduled_time`: ISO 8601 datetime format
- `status`: Lifecycle state validation

### count_record.json
Validates individual count entries and data integrity.

**Usage**:
```bash
# Validate count recording
python manage.py count record --validate-schema
python manage.py validate-contract count_tracking.count_record record.json
```

**Key Properties**:
- `count`: Attendance number with bounds checking
- `position_id`: Position scope validation
- `validation_status`: Data quality tracking
- `metadata`: Contextual information validation

### analytics.json
Validates analytics output and reporting data structures.

**Usage**:
```bash
# Validate analytics output
python manage.py count analytics --validate-output
python manage.py validate-contract count_tracking.analytics report.json
```

**Key Properties**:
- `summary`: Aggregate statistics validation
- `sessions`: Session-level analytics
- `trends`: Trend analysis validation
- `data_quality`: Quality metrics validation

## Contract Validation Integration

All Count Tracking library methods use these contracts:

```python
from scheduler.libs.shared.contracts import validate_contract

@validate_contract("count_tracking.count_session")
def create_count_session(self, data: dict) -> dict:
    # Implementation with automatic validation
    pass
```

## CLI Contract Testing

```bash
# Test all contracts
python manage.py test-contracts count_tracking

# Validate specific contract
python manage.py validate-contract count_tracking.count_session test_data.json

# Generate test data from schema
python manage.py generate-test-data count_tracking.count_record
```

## Schema Evolution

When updating schemas:

1. Maintain backward compatibility
2. Update version numbers
3. Add migration documentation
4. Test with existing data

## Quality Gates

All Count Tracking operations must pass contract validation:
- Input validation on all public methods
- Output validation for critical operations
- Schema compliance in CI/CD pipeline
- Zero validation failures in production
