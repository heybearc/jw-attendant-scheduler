# Event-Centric Attendant Management Module Specification

## Module Overview
**Status:** Production Ready - **EVENT SUBMODULE**  
**Parent Module:** Event Management  
**Architecture:** Event-Centric Design Pattern

## Core Principles

### Event-Centric Architecture
- **No Standalone Access**: Attendant management is only accessible through event context
- **Event-Scoped Operations**: All attendant operations are scoped to specific events
- **Contextual Management**: Attendant functionality is contextual to event requirements
- **Event-First Workflow**: All attendant interactions begin with event selection

## Module Components

### 1. Event-Scoped Attendant Assignment
**Location:** `/events/[id]/attendants`
**Purpose:** Manage attendant assignments for specific events

**Features:**
- Position-based attendant assignments
- Event-specific attendant availability
- Real-time assignment management
- Assignment history tracking

**Positions Supported:**
- Sound
- Platform  
- Microphones
- Literature
- Parking
- Security

### 2. Attendant Profile Management (Event Context)
**Location:** `/attendants/*` (restored for backend operations)
**Purpose:** Maintain attendant profiles for event assignment purposes

**Features:**
- Attendant profile creation and editing
- Availability status management
- Contact information management
- Assignment history per attendant

**Access Pattern:** Only accessible through event management workflows

### 3. Assignment Analytics
**Purpose:** Track and analyze attendant assignments within event context

**Features:**
- Event-specific assignment reports
- Attendant performance tracking
- Position coverage analytics
- Assignment pattern analysis

## Technical Implementation

### Web Interface Structure
```
/events/[id]/attendants/          # Event-specific attendant management
├── page.tsx                      # Main attendant management interface
├── assign/                       # Assignment workflows
└── analytics/                    # Event attendant analytics

/attendants/                      # Backend attendant profiles (no direct navigation)
├── [id]/                        # Individual attendant management
├── create/                      # Attendant profile creation
└── edit/                        # Attendant profile editing
```

### API Endpoints
```
/api/events/[id]/assignments      # Event-specific assignments
├── GET    - List event assignments
├── POST   - Create new assignment
└── DELETE - Remove assignment

/api/attendants/                  # Attendant profile management
├── GET    - List attendants (for assignment selection)
├── POST   - Create attendant profile
└── [id]/  - Individual attendant operations
```

### Database Schema
```sql
-- Event-centric assignment tracking
event_attendant_assignments {
  id: integer
  eventId: integer (FK to events)
  attendantId: integer (FK to attendants)
  position: string
  assignedAt: timestamp
  status: enum('assigned', 'confirmed', 'completed')
}

-- Attendant profiles (event-agnostic)
attendants {
  id: integer
  firstName: string
  lastName: string
  email: string
  phone: string
  availabilityStatus: enum('Available', 'Limited', 'Unavailable')
  createdAt: timestamp
  updatedAt: timestamp
}
```

## Navigation Architecture

### Primary Access Path
1. **Events List** → `/events`
2. **Event Details** → `/events/[id]`
3. **Manage Attendants** → `/events/[id]/attendants`

### Prohibited Access Patterns
- ❌ Direct attendant navigation from home page
- ❌ Standalone attendant management pages
- ❌ Attendant-first workflows
- ❌ Global attendant directory access

### Allowed Access Patterns
- ✅ Event → Attendant Management
- ✅ Event → Attendant Assignment
- ✅ Event → Assignment Analytics
- ✅ Admin → User Management (attendant profiles)

## User Experience Flow

### Event Manager Workflow
1. Navigate to Events
2. Select specific event
3. Click "Manage Attendants"
4. View current assignments
5. Assign/remove attendants as needed
6. Review assignment analytics

### Assignment Process
1. Select event requiring attendant assignment
2. Choose position needing coverage
3. Select available attendant from list
4. Confirm assignment
5. Track assignment status

## Development Guidelines

### Code Organization
- All attendant UI components must be event-scoped
- Attendant API endpoints should validate event context
- Database queries must include event filtering
- Navigation must enforce event-first access

### Testing Requirements
- Test event-scoped attendant operations
- Validate access control (no direct attendant access)
- Test assignment workflows within event context
- Verify navigation restrictions

### Future Enhancements
- Event-specific attendant preferences
- Automated assignment suggestions based on event type
- Attendant availability calendar integration
- Event-based attendant performance metrics

## Integration Points

### Event Management Module
- Event details page includes attendant management access
- Event creation workflow can pre-assign attendants
- Event analytics include attendant metrics

### Administration Module
- User management includes attendant profile creation
- Role-based access controls attendant assignment permissions
- System configuration affects attendant management features

### Reporting Module
- Event reports include attendant assignment data
- Attendant performance reports are event-scoped
- Assignment analytics feed into event success metrics

## Compliance Notes

### SDD Architecture Compliance
- Library: `scheduler.libs.attendant_scheduling` (event-scoped)
- CLI: `python manage.py attendant` (event-focused operations)
- Observability: All operations logged with event context
- Contracts: Event-scoped validation schemas

### Event-Centric Design Compliance
- ✅ No standalone attendant navigation
- ✅ Event-contextual access only
- ✅ Event-first workflow enforcement
- ✅ Maintains architectural consistency

This specification ensures that attendant management remains properly scoped within the event-centric architecture while providing comprehensive functionality for event-based attendant assignment and management.
