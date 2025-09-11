# JW Attendant Scheduler

A comprehensive event-centric attendant management system for Jehovah's Witness events implementing Spec-Driven Development (SDD) architecture with library-first design, CLI interfaces, and multi-platform support.

## Overview

This system provides event-scoped volunteer management, assignment tracking, and analytics capabilities with both Django backend and Next.js frontend implementations, following strict SDD compliance for scalable multi-agent development.

## Key Features

### Event-Centric Management
- **Event Lifecycle Management**: Complete event creation, configuration, and oversight
- **Event-Scoped Attendant Management**: All attendant operations strictly within event context
- **Assignment Tracking**: Real-time assignment management with role-based availability
- **CSV Import/Export**: Bulk attendant management with validation and progress tracking

### SDD Architecture Benefits
- **Library-First Design**: All business logic in reusable libraries with CLI interfaces
- **Multi-Platform Support**: Django backend + Next.js frontend with shared business logic
- **Contract Validation**: JSON Schema validation for all operations
- **Observability**: Comprehensive logging and performance monitoring

### Role-Based Access Control
- **Personal Dashboards**: Customized views based on user roles (Attendant/Overseer/Admin)
- **Permission-Aware UI**: Dynamic interface based on user permissions
- **Secure Operations**: Role validation for all sensitive operations

## Architecture Overview

### Core Libraries (SDD Compliant)
```
scheduler/libs/
├── event_management/       # Event lifecycle and configuration
├── attendant_scheduling/   # Event-scoped attendant operations  
├── count_tracking/         # Analytics and reporting
├── dashboard/             # Role-based dashboard operations
└── administration/        # User and system management
```

### CLI Interfaces
```bash
# Event Management
python manage.py event create --name "Circuit Assembly" --date "2024-06-15"
python manage.py event list --status active --json-output

# Attendant Management (Event-Scoped)
python manage.py attendant create --event-id 123 --data attendant.json
python manage.py attendant import-csv --event-id 123 --file attendants.csv

# Analytics and Reporting
python manage.py count attendance --event-id 123 --period month
python manage.py count export --report-id 456 --format pdf
```

### Dual Implementation Support
- **Django Backend**: `/scheduler/` - Library-first Django implementation
- **Next.js Frontend**: `/nextjs-app/` - Modern React frontend with API integration
- **Shared Contracts**: JSON Schema validation ensures consistency across platforms

## Project Structure

```
jw-attendant-scheduler/
├── scheduler/                    # Django backend implementation
│   ├── libs/                    # SDD-compliant core libraries
│   ├── management/commands/     # CLI interfaces for all libraries
│   ├── models.py               # Database models
│   └── views.py                # Web interface views
├── nextjs-app/                  # Next.js frontend implementation
│   ├── src/app/                # App router pages and API routes
│   ├── src/components/         # Reusable UI components
│   └── prisma/                 # Database schema and client
├── specs/                       # SDD module specifications
│   ├── event-management/       # Event module spec
│   ├── administration/         # Admin module spec
│   ├── dashboard/              # Dashboard module spec
│   └── reporting/              # Reporting module spec
├── scripts/                     # Deployment and utility scripts
├── deployment/                  # Infrastructure and deployment configs
└── docs/                       # Documentation and guides
```

## Quick Start

### Django Backend Setup
```bash
# 1. Setup environment
python -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure database (PostgreSQL recommended)
python manage.py migrate

# 4. Create admin user
python manage.py createsuperuser

# 5. Run development server
python manage.py runserver
```

### Next.js Frontend Setup
```bash
# 1. Navigate to frontend directory
cd nextjs-app

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your database connection

# 4. Setup database schema
npx prisma generate
npx prisma db push

# 5. Run development server
npm run dev
```

## Development Workflow

### SDD Feature Branch Workflow
All development follows strict SDD principles with module-specific feature branches:

```bash
# Create feature branch from dev
git checkout dev
git checkout -b feature/[module-name]-module

# Each feature branch contains:
# - Complete SDD specification in /specs/[module]/
# - Library-first implementation
# - CLI interface with JSON I/O
# - Contract validation schemas
# - Comprehensive tests
```

### Active Feature Branches
- `feature/event-management-module` - Event lifecycle management
- `feature/event-centric-attendant-management` - Attendant operations (Production Ready)
- `feature/administration-module` - User and system administration
- `feature/dashboard-module` - Role-based personal dashboards
- `feature/reporting-module` - Analytics and reporting system

## Production Deployment

### Infrastructure
- **Staging Environment**: `http://10.92.3.24:3001` (Next.js)
- **Production Environment**: `http://10.92.3.22:8000` (Django)
- **Database**: PostgreSQL on `10.92.3.21:5432`

### Deployment Process
```bash
# Deploy to staging
./deploy-jw-attendant.sh staging

# Deploy to production
./deploy-jw-attendant.sh production
```

## SDD Compliance Status

### ✅ Fully Implemented
- **Library-First Architecture**: All business logic in reusable libraries
- **CLI Interfaces**: Complete JSON I/O for all operations
- **Contract Validation**: JSON Schema validation throughout
- **Observability**: Structured logging and performance monitoring
- **Multi-Agent Development**: Context-free development from specifications

### 🔄 In Development
- **Event Management Module**: Core event operations
- **Administration Module**: User lifecycle and system configuration
- **Dashboard Module**: Role-based personal interfaces
- **Reporting Module**: Analytics and export functionality

## Key Achievements

### Event-Centric Architecture Success
- **Strict Context Enforcement**: All attendant operations scoped to events only
- **Modal-Based UI**: Clean separation of concerns with focused interactions
- **Real-Time Updates**: Automatic availability status based on serving roles
- **Bulk Operations**: CSV import with progress tracking and validation

### Production-Ready Features
- **Event-Centric Attendant Management**: Full CRUD with CSV import (✅ Complete)
- **Role-Based Access Control**: Permission-aware UI and operations
- **Real-Time Status Updates**: "Other Department" role automatically sets unavailable
- **Comprehensive Validation**: Client and server-side validation with error handling

## Documentation

- **[SDD Multi-Agent Development Spec](SDD_MULTI_AGENT_DEVELOPMENT_SPEC.md)** - Complete development specification
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Infrastructure and deployment procedures
- **[Lessons Learned](LESSONS_LEARNED.md)** - Development insights and best practices
- **[Branch Cleanup Recommendations](BRANCH_CLEANUP_RECOMMENDATIONS.md)** - Git workflow guidelines

## License

This project is designed for volunteer scheduling and event management within Jehovah's Witness organizational structure.
