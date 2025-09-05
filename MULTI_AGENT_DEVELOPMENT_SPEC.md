# Multi-Agent Development Spec: JW Attendant Scheduler

## Project Overview
Event-scoped attendant management system for Jehovah's Witness events with PostgreSQL backend, staging/production environments, and comprehensive role-based access control.

## Agent Architecture

### 1. **Lead Architect Agent** (Orchestrator)
**Role:** Project coordination, architecture decisions, and integration oversight
**Responsibilities:**
- Overall project roadmap and milestone tracking
- Cross-agent coordination and dependency management
- Architecture decisions and technical debt management
- Code review and merge coordination
- Production deployment oversight

**Focus Areas:**
- System architecture and design patterns
- Database schema evolution
- API design and integration points
- Performance and scalability planning

---

### 2. **Backend Development Agent**
**Role:** Django backend, database, and API development
**Responsibilities:**
- Django models, views, and business logic
- PostgreSQL database optimization
- API endpoints and serialization
- Background tasks and job processing
- Data migration and schema updates

**Focus Areas:**
- `scheduler/models/` - Data models and relationships
- `scheduler/views/` - Business logic and API endpoints
- `scheduler/services/` - Service layer and utilities
- Database migrations and performance tuning
- Auto-assign algorithm implementation

---

### 3. **Frontend/UI Agent**
**Role:** Templates, forms, and user experience
**Responsibilities:**
- Django templates and responsive design
- Form handling and validation
- JavaScript interactions and AJAX
- Mobile-first UI/UX improvements
- Accessibility and usability testing

**Focus Areas:**
- `scheduler/templates/` - HTML templates and layouts
- `scheduler/forms/` - Form definitions and validation
- `static/` - CSS, JavaScript, and assets
- Bootstrap integration and custom styling
- User workflow optimization

---

### 4. **DevOps/Infrastructure Agent**
**Role:** Deployment, monitoring, and infrastructure management
**Responsibilities:**
- Staging and production environment management
- CI/CD pipeline development
- Container orchestration and scaling
- Monitoring and logging setup
- Security hardening and compliance

**Focus Areas:**
- `deployment/` - Deployment scripts and configurations
- Docker containerization
- Proxmox LXC container management
- PostgreSQL database administration
- SSL/TLS and security configurations

---

### 5. **Testing/QA Agent**
**Role:** Testing strategy, automation, and quality assurance
**Responsibilities:**
- Unit and integration test development
- End-to-end testing automation
- Performance testing and optimization
- Security testing and vulnerability assessment
- User acceptance testing coordination

**Focus Areas:**
- `tests/` - Test suites and fixtures
- Test automation and CI integration
- Load testing and performance benchmarks
- Security scanning and compliance checks
- Bug tracking and regression testing

---

### 6. **Documentation Agent**
**Role:** Technical documentation and user guides
**Responsibilities:**
- API documentation and code comments
- User manuals and training materials
- Deployment guides and troubleshooting
- Architecture documentation and diagrams
- Change logs and release notes

**Focus Areas:**
- `docs/` - Technical and user documentation
- README files and inline documentation
- API documentation with examples
- Deployment and maintenance guides
- Training materials for end users

---

## Communication Protocols

### Branch Strategy
- **main** - Production-ready releases
- **develop** - Integration branch for all agents
- **feature/[agent]-[feature]** - Agent-specific feature branches
- **fix/[agent]-[issue]** - Bug fixes and hotfixes

### Coordination Workflow
1. **Daily Standup** - Progress updates and dependency coordination
2. **Feature Planning** - Cross-agent feature design and planning
3. **Integration Testing** - Regular integration and compatibility testing
4. **Code Review** - Peer review across agent specializations
5. **Release Coordination** - Synchronized releases and deployments

### Communication Channels
- **GitHub Issues** - Task tracking and bug reports
- **Pull Requests** - Code review and integration
- **Project Board** - Sprint planning and progress tracking
- **Documentation Wiki** - Shared knowledge and decisions

## Current Development Priorities

### Phase 1: Foundation Stabilization
- **Backend Agent**: Auto-assign algorithm implementation
- **Frontend Agent**: UI/UX improvements and mobile optimization
- **DevOps Agent**: Staging environment testing and monitoring
- **Testing Agent**: Comprehensive test suite development
- **Documentation Agent**: API documentation and user guides

### Phase 2: Advanced Features
- **Backend Agent**: Position and shift template system
- **Frontend Agent**: Advanced reporting and dashboard features
- **DevOps Agent**: Production scaling and performance optimization
- **Testing Agent**: Load testing and security assessment
- **Documentation Agent**: Advanced user training materials

### Phase 3: Production Readiness
- **All Agents**: Security hardening and compliance
- **DevOps Agent**: Monitoring and alerting systems
- **Testing Agent**: User acceptance testing coordination
- **Documentation Agent**: Complete user and admin documentation

## Success Metrics
- **Code Quality**: Test coverage > 90%, zero critical security issues
- **Performance**: Page load times < 2s, database queries optimized
- **User Experience**: Mobile-responsive, accessibility compliant
- **Deployment**: Zero-downtime deployments, automated rollbacks
- **Documentation**: Complete API docs, user guides, and training materials

## Technology Stack
- **Backend**: Django 4.2.5, PostgreSQL, Redis (future)
- **Frontend**: Bootstrap 5, JavaScript ES6+, HTMX (future)
- **Infrastructure**: Proxmox LXC, Nginx, Gunicorn
- **Testing**: pytest, Selenium, Lighthouse
- **Monitoring**: Prometheus, Grafana (future)
- **Documentation**: Sphinx, MkDocs

## Repository Structure
```
jw-attendant-scheduler/
├── scheduler/           # Django app (Backend Agent)
├── templates/          # UI templates (Frontend Agent)
├── static/            # Assets (Frontend Agent)
├── deployment/        # Deploy scripts (DevOps Agent)
├── tests/            # Test suites (Testing Agent)
├── docs/             # Documentation (Documentation Agent)
├── scripts/          # Utility scripts (All Agents)
└── requirements.txt  # Dependencies (Backend Agent)
```

This multi-agent approach ensures specialized expertise while maintaining coordination and integration across all aspects of the project.
