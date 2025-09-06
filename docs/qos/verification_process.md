# QoS Verification Process

## Overview

This document outlines the Quality of Service (QoS) verification process for the JW Attendant Scheduler application. This process ensures that all features meet quality standards before deployment to production.

## Pre-Deployment Verification

### 1. Automated Checks

The following automated checks are performed as part of the CI/CD pipeline before deploying to production:

#### 1.1 Error Detection and Fixing

The `error_fixer.py` script identifies and fixes common errors in the staging environment:

```bash
python tests/qos/error_fixer.py --settings=jw_scheduler.settings
```

This script checks for:
- Database connection issues
- Unapplied migrations
- Database integrity problems
- Missing static files
- Template errors
- URL pattern conflicts
- Permission issues

#### 1.2 Link and Button Testing

The `link_checker.py` script systematically tests all links and buttons in the application:

```bash
python tests/qos/link_checker.py --base-url=http://localhost:8001 --username=admin --password=admin123
```

This script:
- Crawls the entire application
- Tests all links for broken URLs
- Clicks all buttons to verify functionality
- Tests forms with sample data
- Captures JavaScript console errors

#### 1.3 Stability Testing

Stability tests verify the application's behavior under various conditions:

```bash
python -m pytest tests/stability/test_stability.py -v
```

These tests include:
- Concurrent request handling
- Database connection pooling
- Transaction isolation
- Memory leak detection
- Error handling

#### 1.4 Performance Metrics

Performance metrics are collected from Prometheus and checked against thresholds:

- **Response Time**: Average response time must be below 300ms
- **Error Rate**: Error rate must be below 1%
- **CPU Usage**: CPU usage must be below 80%
- **Memory Usage**: Memory usage must be below 80%

### 2. Manual Verification

In addition to automated checks, the following manual verification steps should be performed:

#### 2.1 Event-Centric Workflow

Verify that the event-centric architecture is functioning correctly:

- Users can select/create events after login
- All management systems are properly scoped to the selected event
- Event status (current, upcoming, past) is correctly displayed
- URL structure follows the `/event/{id}/...` pattern

#### 2.2 Role-Based Access Control

Verify that role-based access control is enforced:

- **Admin Users**: Can access all features
- **Overseer Users**: Can access event-scoped features
- **Attendant Users**: Can only see their own data
  - Personal assignments only
  - Events they are assigned to
  - Their oversight contact information
  - Limited dashboard view

#### 2.3 Count Times Feature

Verify that the count times feature is working correctly:

- Count sessions can be created and managed
- Counts can be entered for each position
- Count reports display accurate data
- Visualizations render correctly

## Deployment Process

### 1. Staging Deployment

1. Code is deployed to the staging environment
2. QoS verification process is run
3. Issues are fixed in the staging environment
4. QoS verification process is run again to confirm fixes

### 2. Production Deployment

1. QoS checks are run as part of the CI/CD pipeline
2. If all checks pass, code is deployed to production
3. If any checks fail, deployment is halted
4. Emergency deployments can skip QoS checks with explicit approval

## Monitoring and Alerting

### 1. Prometheus Metrics

The following metrics are monitored in real-time:

- **Response Time**: Average response time by endpoint
- **Error Rate**: Percentage of 5xx responses
- **Database Performance**: Query execution time
- **System Resources**: CPU, memory, disk usage

### 2. Alert Thresholds

Alerts are triggered when metrics exceed the following thresholds:

| Metric | Warning | Critical |
|--------|---------|----------|
| Response Time | > 500ms | > 1000ms |
| Error Rate | > 1% | > 5% |
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 70% | > 90% |
| Disk Usage | > 80% | > 90% |

## Rollback Procedure

If issues are detected after deployment to production:

1. Initiate rollback from the CI/CD pipeline
2. Restore from the latest backup
3. Restart the production service
4. Verify application functionality

## Network Configuration

All JW Attendant Scheduler LXC containers use the 10Gig network interface `vmbr0923` with gateway `10.92.3.1` instead of the default `vmbr0` with gateway `10.92.0.1`. This ensures containers are on the correct high-speed network segment.

## Reporting

QoS verification results are stored in the following locations:

- **Error Reports**: `tests/qos/results/errors_found_*.json`
- **Fix Reports**: `tests/qos/results/errors_fixed_*.json`
- **Link Check Reports**: `tests/qos/results/broken_links_*.csv`
- **Console Error Reports**: `tests/qos/results/console_errors_*.csv`
- **Form Error Reports**: `tests/qos/results/form_errors_*.csv`

## Continuous Improvement

The QoS verification process is continuously improved by:

1. Adding new tests for new features
2. Updating thresholds based on performance data
3. Refining error detection and fixing scripts
4. Incorporating feedback from production issues
