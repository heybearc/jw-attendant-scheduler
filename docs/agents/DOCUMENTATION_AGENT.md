# Documentation Agent - JW Attendant Scheduler

## Agent Responsibilities
Technical documentation, user guides, API documentation, and knowledge management.

## Current Focus Areas

### 1. API Documentation
**Priority:** High
**Location:** `docs/api/`
**Requirements:**
- Document all Django REST API endpoints
- Model schema documentation
- Event-centric architecture documentation
- Role-based access control specifications

### 2. User Guides and Training
**Priority:** Medium
**Location:** `docs/user/`
**Requirements:**
- Attendant user guide and workflows
- Administrator documentation
- Event management procedures
- Gmail integration setup guide

### 3. Technical Documentation
**Priority:** Medium
**Location:** `docs/technical/`
**Requirements:**
- Architecture overview and design decisions
- Database schema documentation
- Deployment and maintenance guides
- Multi-agent development coordination

## Current Tasks

### Phase 1: Core Documentation
- [ ] Document event-centric architecture
- [ ] Create API endpoint documentation
- [ ] Write role-based access control specs
- [ ] Document Gmail integration features
- [ ] Create database schema diagrams
- [ ] Write deployment procedures

### Phase 2: User Documentation
- [ ] Create attendant user guide
- [ ] Write administrator manual
- [ ] Document event management workflows
- [ ] Create troubleshooting guides
- [ ] Write FAQ and common issues
- [ ] Create video tutorials (future)

### Phase 3: Advanced Documentation
- [ ] Architecture decision records (ADRs)
- [ ] Performance optimization guides
- [ ] Security best practices
- [ ] Multi-agent coordination docs
- [ ] Change management procedures
- [ ] Release notes and changelogs

## Technical Specifications

### Documentation Structure
```
docs/
├── api/                 # API documentation
├── user/               # User guides
├── technical/          # Technical docs
├── agents/             # Agent coordination
├── deployment/         # Deployment guides
└── architecture/       # System design
```

### API Documentation Format
```markdown
## POST /api/events/{id}/assignments/

Create new attendant assignment for event.

**Parameters:**
- `attendant_id` (integer): Attendant ID
- `position` (string): Assignment position
- `shift_start` (datetime): Shift start time

**Response:**
```json
{
  "id": 123,
  "attendant": {...},
  "position": "Sound",
  "status": "confirmed"
}
```

## Integration Points
- **Backend Agent**: API endpoint documentation
- **Frontend Agent**: User interface documentation
- **DevOps Agent**: Deployment and infrastructure docs
- **Testing Agent**: Testing procedures and reports

## Success Metrics
- 100% API endpoint coverage
- User guide completion rate
- Documentation accuracy validation
- Regular updates and maintenance
- User feedback incorporation
