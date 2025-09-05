# Lead Architect Agent - JW Attendant Scheduler

## Agent Responsibilities
Project coordination, architecture oversight, integration management, and technical leadership.

## Current Focus Areas

### 1. Event-Centric Architecture Oversight
**Priority:** High
**Location:** System-wide architecture
**Requirements:**
- Ensure event-scoped data isolation
- Coordinate session management for selected events
- Oversee URL structure changes (/event/{id}/...)
- Validate role-based access control implementation

### 2. Multi-Agent Coordination
**Priority:** High
**Location:** Cross-agent integration
**Requirements:**
- Coordinate feature development across agents
- Resolve integration conflicts and dependencies
- Maintain architectural consistency
- Oversee code review and merge processes

### 3. Technical Debt Management
**Priority:** Medium
**Location:** System-wide code quality
**Requirements:**
- Monitor code quality and technical debt
- Coordinate refactoring initiatives
- Ensure performance and scalability
- Maintain security best practices

## Current Tasks

### Phase 1: Architecture Validation
- [ ] Review event-centric architecture implementation
- [ ] Validate role-based access control design
- [ ] Coordinate Gmail integration with user management
- [ ] Oversee PostgreSQL migration completion
- [ ] Review auto-assign algorithm architecture
- [ ] Coordinate staging environment validation

### Phase 2: Integration Oversight
- [ ] Coordinate backend and frontend integration
- [ ] Oversee testing strategy implementation
- [ ] Review deployment pipeline architecture
- [ ] Coordinate documentation standards
- [ ] Manage cross-agent dependencies
- [ ] Oversee performance optimization

### Phase 3: Production Readiness
- [ ] Coordinate security hardening initiatives
- [ ] Oversee scalability planning
- [ ] Review monitoring and alerting strategy
- [ ] Coordinate release planning
- [ ] Manage technical risk assessment
- [ ] Oversee production deployment strategy

## Technical Specifications

### Architecture Principles
```python
# Event-Centric Design
- All data scoped to selected event
- Session-based event selection
- URL structure: /event/{id}/resource/
- Role-based data isolation

# Integration Standards
- RESTful API design
- Consistent error handling
- Standardized logging
- Performance monitoring
```

### Key Architectural Decisions
1. **Event-Centric Architecture**: All management systems scoped to selected event
2. **Role-Based Access Control**: Attendant users see only their own data
3. **PostgreSQL Backend**: Shared database server for production and staging
4. **Multi-Agent Development**: Specialized agents with clear responsibilities
5. **Gmail Integration**: Professional email communication system

## Integration Points
- **All Agents**: Architecture compliance and integration coordination
- **Backend Agent**: Data model and API architecture
- **Frontend Agent**: User experience and navigation architecture
- **DevOps Agent**: Infrastructure and deployment architecture
- **Testing Agent**: Testing strategy and quality assurance
- **Documentation Agent**: Architecture documentation and standards

## Success Metrics
- Zero architectural violations
- Successful cross-agent integration
- Performance targets met
- Security compliance achieved
- Production deployment success
