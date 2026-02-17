# TheoShift Technical Debt Tracker

This document tracks technical debt that needs to be addressed in future releases.

---

## TD-001: Database Column Renaming - Attendant → Volunteer

**Created:** 2026-01-28  
**Priority:** Medium  
**Estimated Effort:** 4-6 hours  
**Status:** Pending

### Context
We renamed all "Attendant" terminology to "Volunteer" throughout the application to better reflect the purpose of the system. However, to maintain blue-green deployment compatibility, we used Prisma's `@map` directive to keep the database schema unchanged.

### Current State
- **Code:** Uses "volunteer" terminology everywhere
- **Database:** Still uses "attendant" table and column names
- **Prisma Schema:** Uses `@map` directives to bridge the gap

### Technical Debt
The Prisma schema contains numerous `@map` directives that map new names to old database columns:

```prisma
model volunteers {
  // ... fields ...
  @@map("attendants")  // Model uses old table name
}

model event_volunteers {
  volunteerId String @map("attendantId")  // Field uses old column name
  @@map("event_attendants")  // Model uses old table name
}
```

### Why This is Debt
1. **Confusion:** Database schema doesn't match code terminology
2. **Maintenance:** Every schema change requires remembering the mapping
3. **Performance:** Minor overhead from mapping layer (negligible but exists)
4. **Documentation:** Database documentation shows "attendants" but code shows "volunteers"

### Cleanup Steps

#### 1. Create Database Migration
```sql
-- Rename tables
ALTER TABLE attendants RENAME TO volunteers;
ALTER TABLE event_attendants RENAME TO event_volunteers;

-- Rename columns in events table
ALTER TABLE events RENAME COLUMN attendantsNeeded TO volunteersNeeded;
ALTER TABLE events RENAME COLUMN attendantoverseeremail TO volunteerOverseerEmail;
ALTER TABLE events RENAME COLUMN attendantoverseername TO volunteerOverseerName;
ALTER TABLE events RENAME COLUMN attendantoverseerphone TO volunteerOverseerPhone;
ALTER TABLE events RENAME COLUMN attendantoverseerassistants TO volunteerOverseerAssistants;

-- Rename columns in positions table
ALTER TABLE positions RENAME COLUMN maxAttendants TO maxVolunteers;
ALTER TABLE positions RENAME COLUMN minAttendants TO minVolunteers;

-- Rename columns in position_assignments table
ALTER TABLE position_assignments RENAME COLUMN attendantId TO volunteerId;

-- Rename columns in document_publications table
ALTER TABLE document_publications RENAME COLUMN attendantId TO volunteerId;

-- Rename columns in event_volunteers table (formerly event_attendants)
ALTER TABLE event_volunteers RENAME COLUMN attendantId TO volunteerId;

-- Update indexes and constraints as needed
-- (Prisma will handle most of this automatically)
```

#### 2. Update Prisma Schema
Remove all `@map` directives:

```prisma
model volunteers {
  id String @id
  // ... fields without @map directives ...
  // Remove: @@map("attendants")
}

model event_volunteers {
  volunteerId String  // Remove: @map("attendantId")
  // Remove: @@map("event_attendants")
}
```

#### 3. Generate New Prisma Client
```bash
npx prisma generate
```

#### 4. Test Migration
- Run migration on STANDBY database
- Test all functionality
- Verify no breaking changes

#### 5. Deploy
- Deploy to STANDBY
- Test thoroughly
- Switch traffic
- Apply migration to old LIVE database

### Prerequisites for Cleanup
- [ ] All current features stable and tested
- [ ] No active development on volunteer-related features
- [ ] Database backup created
- [ ] Migration tested on staging database
- [ ] Rollback plan documented

### Risks
- **Low Risk:** Prisma handles most schema changes automatically
- **Medium Risk:** Foreign key constraints may need manual updates
- **Low Risk:** Existing data is unaffected (only metadata changes)

### Estimated Timeline
- Migration creation: 1 hour
- Testing: 2-3 hours
- Deployment: 1 hour
- Verification: 1-2 hours

### Related Files
- `prisma/schema.prisma` - Contains all @map directives
- All files in `/features/volunteer-management/`
- All files in `/pages/volunteer/`
- All files in `/pages/api/volunteer/`

### Notes
- This cleanup is **optional** but recommended for long-term maintainability
- Can be done during any maintenance window
- No user-facing changes (purely internal)
- Should be done before any major database schema changes

---

## TD-002: 🚨 URGENT - Event Permission System Not Enforced in Position/Shift APIs

**Created:** 2026-02-17  
**Priority:** HIGH (URGENT)  
**Estimated Effort:** 2-3 hours  
**Status:** Documented - Not Fixed  
**Reported By:** Cory (via David Jersak production issue)

### Context
Multiple API endpoints for position and shift management are checking **system-level user roles** instead of **event-level permissions** from the `event_permissions` table. This breaks the multi-tenancy permission model and prevents event admins from performing actions they should be authorized to do.

### Real-World Impact
**User:** David Jersak (Davidmj3412@gmail.com)  
**System Role:** ASSISTANT_OVERSEER  
**Event Role:** ADMIN (Circuit Assembly event)  
**Issue:** Could not create shifts despite being event admin

**Temporary Workaround:** Changed system role to OVERSEER (bypasses event permission system - NOT IDEAL)

### Technical Debt
Three API endpoints check `user.role` (system-level) instead of using `checkEventAccess()` from `/src/lib/eventAccess.ts`:

1. `/pages/api/events/[id]/positions/[positionId]/shifts.ts:35`
2. `/pages/api/events/[id]/positions/bulk-oversight.ts:34`
3. `/pages/api/events/[id]/positions/[positionId]/overseer.ts:38`

All use this incorrect pattern:
```typescript
if (!user || !['ADMIN', 'OVERSEER', 'admin', 'overseer'].includes(user.role)) {
  return res.status(403).json({ error: 'Insufficient permissions' })
}
```

### Why This is Critical
1. **Breaks Permission Model:** Event admins can't manage their events
2. **Security Issue:** System role bypass required (workaround is a security risk)
3. **User Experience:** Users with proper event permissions get "Insufficient permissions" errors
4. **Architectural Inconsistency:** Other APIs use event permissions correctly

### Cleanup Steps

#### 1. Import Event Permission Helper
Add to each affected file:
```typescript
import { checkEventAccess } from '../../../../../src/lib/eventAccess'
```

#### 2. Replace System Role Check with Event Permission Check
Replace:
```typescript
const user = await prisma.users.findUnique({
  where: { email: session.user?.email || '' }
})

if (!user || !['ADMIN', 'OVERSEER', 'admin', 'overseer'].includes(user.role)) {
  return res.status(403).json({ error: 'Insufficient permissions' })
}
```

With:
```typescript
const user = await prisma.users.findUnique({
  where: { email: session.user?.email || '' }
})

if (!user) {
  return res.status(401).json({ error: 'User not found' })
}

// Check event-level permissions (COORDINATOR or ADMIN can manage)
const hasAccess = await checkEventAccess(user.id, eventId as string, 'COORDINATOR')
if (!hasAccess) {
  return res.status(403).json({ error: 'Insufficient permissions to manage this event' })
}
```

#### 3. Audit All Position APIs
Search for other endpoints with same issue:
```bash
grep -r "user.role.*ADMIN.*OVERSEER" pages/api/events/[id]/positions/
```

#### 4. Testing Requirements
- Create test user with ASSISTANT_OVERSEER system role
- Grant event-level ADMIN permission
- Verify can create/delete shifts
- Verify can assign oversight
- Verify cannot access other events

### Prerequisites for Cleanup
- [x] Bug documented with full details
- [ ] Fix implemented in all affected files
- [ ] Tests created for event permission enforcement
- [ ] Tested on STANDBY before deployment
- [ ] Verified David Jersak can use system after fix

### Risks
- **Low Risk:** Well-established pattern exists in codebase
- **Low Risk:** Event permission system is stable and tested
- **Medium Risk:** May reveal other users with incorrect permissions

### Related Files
- `/src/lib/eventAccess.ts` - Event permission helper functions (CORRECT PATTERN)
- `/pages/api/events/[id]/positions/[positionId]/shifts.ts` - NEEDS FIX
- `/pages/api/events/[id]/positions/bulk-oversight.ts` - NEEDS FIX
- `/pages/api/events/[id]/positions/[positionId]/overseer.ts` - NEEDS FIX
- `/docs/URGENT-BUG-EVENT-PERMISSIONS.md` - Full bug report with implementation details

### Notes
- This is a **fundamental architectural issue** affecting core permission model
- Should be fixed BEFORE next production deployment
- After fix, revert David Jersak's system role back to ASSISTANT_OVERSEER
- Event permission system was designed for exactly this use case

---

## How to Add New Tech Debt Items

When creating technical debt:

1. **Assign a TD number** (TD-002, TD-003, etc.)
2. **Document the context** (why was this done?)
3. **Explain the debt** (what's the problem?)
4. **Provide cleanup steps** (how to fix it?)
5. **Set priority** (High/Medium/Low)
6. **Estimate effort** (hours/days)

---

## Tech Debt Review Schedule

- **Monthly:** Review all tech debt items
- **Quarterly:** Plan cleanup sprints for high-priority items
- **Before major releases:** Address critical tech debt

---

*Last Updated: 2026-01-28*
