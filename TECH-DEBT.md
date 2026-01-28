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
