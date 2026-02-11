# Volunteer Roles Architecture Issue

## Problem Statement

**Current Issue:** Volunteer roles (overseer, keyman, elder) are stored globally in the `volunteers` table, but these roles should be event-specific.

**Impact:**
- If a volunteer is marked as a keyman in Event A, they appear as a keyman in Event B
- Unchecking "keyman" for a volunteer in Event B also removes it from Event A
- Roles don't reflect the reality that someone might be a keyman at one event but not another

## Current Architecture

### Global Volunteer Table
```prisma
model volunteers {
  id                String    @id
  firstName         String
  lastName          String
  email             String
  // ... other fields ...
  isOverseer        Boolean?  // ❌ Global - affects all events
  isKeyman          Boolean?  // ❌ Global - affects all events
  isElder           Boolean?  // ❌ Global - affects all events
}
```

### Event-Specific Assignment Table
```prisma
model event_volunteers {
  id           String   @id
  eventId      String
  volunteerId  String
  role         UserRole // VOLUNTEER, OVERSEER, ASSISTANT_OVERSEER, etc.
  keymanId     String?  // ✅ Event-specific keyman assignment
  overseerId   String?  // ✅ Event-specific overseer assignment
  // ... other fields ...
}
```

## The Confusion

We have **two different systems** for tracking volunteer roles:

1. **Global flags** in `volunteers` table (isOverseer, isKeyman, isElder)
2. **Event-specific assignments** in `event_volunteers` table (keymanId, overseerId)

These serve different purposes but create confusion.

## Proposed Solution

### Option 1: Use Event-Specific Roles Only (Recommended)

**Remove global role flags** and use only the event-specific system:

```prisma
model event_volunteers {
  id                String   @id
  eventId           String
  volunteerId       String
  role              UserRole // VOLUNTEER, OVERSEER, ASSISTANT_OVERSEER
  
  // Event-specific role assignments
  isKeyman          Boolean  @default(false)  // Is this volunteer a keyman for THIS event?
  isOverseer        Boolean  @default(false)  // Is this volunteer an overseer for THIS event?
  isElder           Boolean  @default(false)  // Is this volunteer an elder for THIS event?
  
  // Oversight relationships (who oversees this volunteer)
  keymanId          String?  // Who is their keyman (if any)
  overseerId        String?  // Who is their overseer (if any)
}
```

**Benefits:**
- ✅ Roles are event-specific
- ✅ Same volunteer can have different roles in different events
- ✅ Cloning preserves roles correctly
- ✅ No confusion between global and event-specific data

**Migration Required:**
- Add `isKeyman`, `isOverseer`, `isElder` to `event_volunteers`
- Migrate existing global flags to event-specific flags
- Remove global flags from `volunteers` table

### Option 2: Keep Global Flags as "Qualifications"

**Keep global flags** but rename them to clarify they're qualifications, not assignments:

```prisma
model volunteers {
  id                      String    @id
  firstName               String
  lastName                String
  
  // Global qualifications (what they CAN be)
  qualifiedAsOverseer     Boolean?  @default(false)
  qualifiedAsKeyman       Boolean?  @default(false)
  qualifiedAsElder        Boolean?  @default(false)
}

model event_volunteers {
  id                String   @id
  eventId           String
  volunteerId       String
  
  // Event-specific assignments (what they ARE for this event)
  isKeyman          Boolean  @default(false)
  isOverseer        Boolean  @default(false)
  isElder           Boolean  @default(false)
  
  // Oversight relationships
  keymanId          String?
  overseerId        String?
}
```

**Benefits:**
- ✅ Clear distinction between qualification and assignment
- ✅ Can filter volunteers by qualification when assigning
- ✅ Event-specific assignments work correctly

**Use Case:**
- Global: "John is qualified to serve as a keyman"
- Event-specific: "John is serving as a keyman for this event"

### Option 3: Hybrid Approach (Current + Enhancement)

**Keep both systems** but add event-specific overrides:

```prisma
model volunteers {
  id                String    @id
  // Global defaults
  defaultIsOverseer Boolean?  @default(false)
  defaultIsKeyman   Boolean?  @default(false)
  defaultIsElder    Boolean?  @default(false)
}

model event_volunteers {
  id                String   @id
  eventId           String
  volunteerId       String
  
  // Event-specific overrides (null = use default from volunteers table)
  isKeyman          Boolean?
  isOverseer        Boolean?
  isElder           Boolean?
}
```

**Benefits:**
- ✅ Backward compatible
- ✅ Allows event-specific overrides
- ✅ Defaults make sense for most cases

**Drawbacks:**
- ❌ More complex logic
- ❌ Still confusing which value to use

## Recommendation

**Go with Option 1: Event-Specific Roles Only**

This is the cleanest solution that matches the actual use case:
- Volunteer roles are contextual to each event
- No global state that affects multiple events
- Clear, simple data model

## Implementation Plan

### Phase 1: Add Event-Specific Role Fields
```sql
ALTER TABLE event_volunteers 
ADD COLUMN is_keyman BOOLEAN DEFAULT false,
ADD COLUMN is_overseer BOOLEAN DEFAULT false,
ADD COLUMN is_elder BOOLEAN DEFAULT false;
```

### Phase 2: Migrate Existing Data
```sql
-- Migrate global flags to event-specific for all existing event assignments
UPDATE event_volunteers ev
SET 
  is_keyman = v.is_keyman,
  is_overseer = v.is_overseer,
  is_elder = v.is_elder
FROM volunteers v
WHERE ev.volunteer_id = v.id;
```

### Phase 3: Update Application Code
- Update volunteer management UI to set event-specific flags
- Update volunteer display to show event-specific flags
- Update clone logic to copy event-specific flags

### Phase 4: Remove Global Flags (Optional)
```sql
-- After verifying everything works
ALTER TABLE volunteers 
DROP COLUMN is_keyman,
DROP COLUMN is_overseer,
DROP COLUMN is_elder;
```

## Current Workaround

Until this is implemented, be aware:
- Checking/unchecking keyman/overseer/elder affects ALL events
- When cloning, these flags are copied from the global volunteer record
- Consider using position-specific oversight assignments instead

## Related Tables

### Position Oversight Assignments
```prisma
model position_oversight_assignments {
  id         String      @id
  positionId String
  eventId    String
  overseerId String?  // ✅ Already event-specific
  keymanId   String?  // ✅ Already event-specific
}
```

**Note:** Position oversight is already event-specific and works correctly!

## Questions to Consider

1. **Do we need global qualifications?**
   - Useful for filtering: "Show me all qualified keymen"
   - Could be replaced by checking if they've ever served in that role

2. **Should roles be inherited from previous events?**
   - When cloning, should we copy the roles?
   - Or start fresh for each event?

3. **How do we handle volunteer profiles?**
   - Should volunteers see their roles across all events?
   - Or only for specific events?

## Next Steps

1. **Discuss with stakeholders** - Which option makes most sense?
2. **Create migration plan** - How to transition existing data?
3. **Update UI/UX** - Make it clear roles are event-specific
4. **Test thoroughly** - Ensure no data loss during migration

## Related Documentation

- `/docs/PRISMA_FIELD_MAPPING.md` - Field naming conventions
- `/prisma/schema.prisma` - Current database schema
- Position oversight already uses event-specific assignments correctly
