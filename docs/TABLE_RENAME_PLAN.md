# event_attendants → event_volunteers Table Rename Plan

**Date:** 2026-02-11  
**Status:** In Progress  
**Priority:** High

## Current Situation

**Database Table:** `event_attendants` (owned by `jw_scheduler` user)  
**Prisma Model:** `event_volunteers` with `@@map("event_attendants")`  
**Issue:** Naming inconsistency causes confusion and technical debt

## Problem

The application user (`theoshift_user`) doesn't have ownership permissions to rename the table directly. The table is owned by `jw_scheduler`.

## Options

### Option 1: Request DBA to Rename Table (Recommended)
**Pros:**
- Clean solution
- Aligns table name with Prisma model
- Removes `@@map` directive

**Cons:**
- Requires DBA access or coordination
- Downtime during migration

**Steps:**
1. Contact DBA or use `jw_scheduler` credentials
2. Execute migration script
3. Remove `@@map` directive from Prisma schema
4. Regenerate Prisma client
5. Test and deploy

### Option 2: Keep @@map Directive (Current State)
**Pros:**
- No database changes needed
- Zero risk
- Works correctly

**Cons:**
- Naming inconsistency remains
- Technical debt persists
- Confusion for developers

### Option 3: Use Prisma Migrate
**Pros:**
- Prisma handles the migration
- Automated and tracked

**Cons:**
- Requires Prisma to have ALTER TABLE permissions
- May still fail with permission issues

## Recommendation

**Keep the `@@map` directive for now** and document it clearly.

**Rationale:**
- The current setup works correctly
- Prisma handles the mapping transparently
- No runtime impact
- Renaming requires DBA coordination which is out of scope for this cleanup session
- We've already documented the pattern in `/docs/PRISMA_FIELD_MAPPING.md`

## Alternative: Document the Pattern

Instead of renaming, we should:
1. ✅ Keep `@@map("event_attendants")` in schema
2. ✅ Document this clearly in field mapping guide
3. ✅ Add comment in schema explaining why
4. ✅ Update technical debt assessment to lower priority
5. ⏸️ Defer actual table rename until DBA access available

## Updated Priority

**From:** High Priority #1  
**To:** Medium Priority (deferred until DBA access)

**Reason:** Works correctly, just a naming inconsistency. Not worth the risk/effort without proper database permissions.

## Files Created

- `/database/migrations/006_rename_event_attendants_to_event_volunteers.sql` - Migration script (ready when DBA access available)
- `/database/migrations/006_rollback_rename_event_volunteers.sql` - Rollback script
- This document - Plan and decision log

## Next Steps

1. Add comment to Prisma schema explaining the `@@map`
2. Update technical debt assessment
3. Move to next high priority item (Volunteer Roles Architecture)
4. Revisit table rename when DBA access is available
