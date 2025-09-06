# JW Attendant Scheduler - Comprehensive Test Plan

## 1. Test Plan Overview

### 1.1 Purpose
This test plan provides a structured approach to verify the quality, stability, and performance of the JW Attendant Scheduler application before deployment to production.

### 1.2 Scope
This plan covers all features of the JW Attendant Scheduler application, with special focus on:
- Event-centric architecture
- Role-based access control
- Count times feature
- Assignment management
- User management
- Integration points between features

### 1.3 Test Environment
- **Staging Environment**: LXC container on Proxmox using 10Gig network interface vmbr0923 with gateway 10.92.3.1
- **Database**: PostgreSQL 14
- **Web Server**: Gunicorn with 3 workers
- **Proxy**: Nginx

## 2. Test Categories

### 2.1 Unit Tests
| Category | Description | Tool |
|----------|-------------|------|
| Models | Test model validation, methods, and relationships | Django TestCase |
| Views | Test view logic, permissions, and responses | Django TestCase |
| Forms | Test form validation and processing | Django TestCase |
| Utilities | Test helper functions and utility modules | Pytest |

### 2.2 Integration Tests
| Category | Description | Tool |
|----------|-------------|------|
| API Endpoints | Test API functionality and responses | Django REST Framework TestCase |
| Database Interactions | Test complex queries and transactions | Django TestCase |
| Authentication | Test login, logout, and permission flows | Django TestCase |
| Email Notifications | Test email generation and delivery | Django TestCase with mock |

### 2.3 UI/UX Tests
| Category | Description | Tool |
|----------|-------------|------|
| Frontend Components | Test UI components rendering and behavior | Selenium |
| Responsive Design | Test layout on different screen sizes | Selenium with various viewports |
| Accessibility | Test WCAG compliance | axe-core with Selenium |
| Cross-browser | Test on Chrome, Firefox, Safari, Edge | BrowserStack |

### 2.4 Performance Tests
| Category | Description | Tool |
|----------|-------------|------|
| Load Testing | Test system under expected and peak load | Locust |
| Stress Testing | Test system beyond normal capacity | Locust |
| Database Performance | Test query execution time | Django Debug Toolbar, pg_stat_statements |
| Page Load Speed | Test frontend rendering performance | Lighthouse |

### 2.5 Security Tests
| Category | Description | Tool |
|----------|-------------|------|
| Authentication | Test login security, password policies | Manual + Automated |
| Authorization | Test permission enforcement | Manual + Automated |
| Input Validation | Test against injection attacks | OWASP ZAP |
| Session Management | Test session handling and timeout | Manual + Automated |

## 3. Feature-Specific Test Plans

### 3.1 Event-Centric Architecture
- **Test Objectives**:
  - Verify all management systems are properly scoped to selected event
  - Test event selection flow
  - Validate URL structure changes
  - Test session management for selected event

- **Test Cases**:
  1. Event selection after login
  2. Navigation context preservation
  3. Data isolation between events
  4. Permission enforcement per event
  5. Event status transitions (current, upcoming, past)

### 3.2 Role-Based Access Control
- **Test Objectives**:
  - Verify attendant users can only see their own data
  - Test admin access to global functions
  - Validate overseer access to event-scoped functions

- **Test Cases**:
  1. Attendant dashboard view restrictions
  2. Admin access to user management
  3. Overseer access to event management
  4. Permission denial for unauthorized access
  5. Navigation menu adaptation per role

### 3.3 Count Times Feature
- **Test Objectives**:
  - Verify count session creation and management
  - Test count entry functionality
  - Validate count reports and visualizations

- **Test Cases**:
  1. Count session CRUD operations
  2. Count entry form validation
  3. Auto-save functionality
  4. Report generation accuracy
  5. Chart visualization correctness

### 3.4 Assignment Management
- **Test Objectives**:
  - Verify assignment creation and editing
  - Test conflict detection
  - Validate bulk operations

- **Test Cases**:
  1. Assignment CRUD operations
  2. Conflict detection and resolution
  3. Bulk assignment creation
  4. Assignment filtering and sorting
  5. Export functionality

### 3.5 User Management
- **Test Objectives**:
  - Verify user creation and editing
  - Test role assignment
  - Validate user activation flow

- **Test Cases**:
  1. User CRUD operations
  2. Role assignment and changes
  3. User activation via email
  4. Password reset flow
  5. User profile management

## 4. Test Execution Strategy

### 4.1 Test Prioritization
| Priority | Description | Examples |
|----------|-------------|----------|
| P0 | Critical path functionality | Authentication, data saving |
| P1 | Core features | Event management, assignments |
| P2 | Important features | Reporting, exports |
| P3 | Nice-to-have features | UI enhancements |

### 4.2 Test Execution Flow
1. **Smoke Tests**: Quick verification of basic functionality
2. **Regression Tests**: Ensure existing features still work
3. **Feature Tests**: Test new or modified features
4. **Integration Tests**: Test feature interactions
5. **Performance Tests**: Verify system performance
6. **Security Tests**: Verify system security

### 4.3 Automated Test Schedule
| Test Type | Frequency | Trigger |
|-----------|-----------|---------|
| Unit Tests | Every commit | Push to any branch |
| Integration Tests | Every PR | Push to feature branch |
| UI Tests | Daily | Scheduled |
| Performance Tests | Weekly | Scheduled |
| Security Tests | Bi-weekly | Scheduled |

## 5. Defect Management

### 5.1 Defect Severity
| Severity | Description | Example |
|----------|-------------|---------|
| Critical | Blocks system usage | Cannot login, data loss |
| High | Major feature broken | Cannot create assignments |
| Medium | Feature partially broken | Sorting doesn't work |
| Low | Minor issues | UI alignment issues |

### 5.2 Defect Workflow
1. **Identification**: Test failure or manual discovery
2. **Documentation**: Create issue with steps to reproduce
3. **Prioritization**: Assign severity and priority
4. **Assignment**: Assign to appropriate developer
5. **Resolution**: Fix and verify
6. **Regression Testing**: Ensure fix doesn't break other features

## 6. Test Deliverables

### 6.1 Test Documentation
- Test plan (this document)
- Test cases in TestRail or similar tool
- Automated test code in repository

### 6.2 Test Reports
- Test execution summary
- Defect summary
- Performance metrics
- Coverage report

### 6.3 Quality Gates
- 95% unit test coverage
- 0 critical or high severity defects
- Performance within defined thresholds
- Security scan with no high vulnerabilities

## 7. CI/CD Integration

### 7.1 Pipeline Stages
1. **Build**: Compile and package application
2. **Unit Test**: Run unit tests
3. **Integration Test**: Run integration tests
4. **Deploy to Staging**: Deploy to staging environment
5. **Smoke Test**: Run smoke tests on staging
6. **Performance Test**: Run performance tests on staging
7. **Security Scan**: Run security scans on staging
8. **Approval**: Manual approval for production deployment
9. **Deploy to Production**: Deploy to production environment
10. **Post-deployment Verification**: Verify production deployment

### 7.2 Quality Gates
| Stage | Quality Gate |
|-------|-------------|
| Unit Test | 95% code coverage, all tests pass |
| Integration Test | All tests pass |
| Smoke Test | All critical paths functional |
| Performance Test | Response time < 300ms for 95% of requests |
| Security Scan | No high or critical vulnerabilities |

## 8. Monitoring and Alerting

### 8.1 Metrics to Monitor
- Response time by endpoint
- Error rate by endpoint
- Database query performance
- Memory usage
- CPU usage
- Disk I/O
- Network I/O

### 8.2 Alert Thresholds
| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Response Time | > 500ms | > 1000ms |
| Error Rate | > 1% | > 5% |
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 70% | > 90% |
| Disk Usage | > 80% | > 90% |

## 9. Rollback Plan

### 9.1 Rollback Triggers
- Critical defect discovered in production
- Performance degradation beyond thresholds
- Security vulnerability discovered

### 9.2 Rollback Process
1. Identify need for rollback
2. Execute rollback script to previous stable version
3. Verify system functionality after rollback
4. Notify stakeholders
5. Document incident and resolution

## 10. Appendices

### 10.1 Test Environment Setup
```bash
# Clone repository
git clone https://github.com/heybearc/jw-attendant-scheduler.git

# Set up virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Load test data
python manage.py loaddata test_data.json

# Run tests
python manage.py test
```

### 10.2 Test Data Management
- Test data fixtures maintained in repository
- Sensitive data anonymized
- Database reset between test runs
- Specific test scenarios documented with corresponding data

### 10.3 References
- Django Testing Documentation: https://docs.djangoproject.com/en/stable/topics/testing/
- Pytest Documentation: https://docs.pytest.org/
- Selenium Documentation: https://www.selenium.dev/documentation/
- Locust Documentation: https://docs.locust.io/
