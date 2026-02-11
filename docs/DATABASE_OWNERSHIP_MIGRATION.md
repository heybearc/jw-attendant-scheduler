# Database Ownership Migration Plan

**Date:** 2026-02-11  
**Status:** Ready for Execution  
**Priority:** High

## Current Situation

The TheoShift database has tables owned by multiple users:
- **jw_scheduler** - 27 tables (legacy owner)
- **jw_scheduler_staging** - 3 tables
- **postgres** - 8 tables
- **theoshift_user** - 1 table (current application user)

## Problem

The application runs as `theoshift_user` but most tables are owned by other users. This prevents:
- Schema migrations (ALTER TABLE requires ownership)
- Table renames
- Index management
- Constraint modifications

## Solution

Transfer all database object ownership to `theoshift_user`.

## Migration Script

**File:** `/database/migrations/007_transfer_ownership_to_theoshift_user.sql`

**What it does:**
1. Transfers ownership of all 39 tables to `theoshift_user`
2. Transfers ownership of all sequences
3. Transfers schema ownership
4. Grants all privileges to ensure completeness

## Execution Requirements

**This migration requires superuser access (postgres user).**

### Option A: Execute via postgres superuser
```bash
# On database server (10.92.3.21)
psql -U postgres -d theoshift_scheduler -f 007_transfer_ownership_to_theoshift_user.sql
```

### Option B: Execute via container with postgres credentials
```bash
# If postgres password is available
ssh prox "pct exec 132 -- bash -c 'PGPASSWORD=<postgres_password> psql -h 10.92.3.21 -U postgres -d theoshift_scheduler -f /tmp/migration_007.sql'"
```

### Option C: Coordinate with DBA/Infrastructure
If postgres credentials are not available, this needs to be coordinated with whoever manages the database infrastructure.

## Post-Migration Steps

After ownership transfer:

1. **Verify ownership:**
   ```sql
   SELECT tablename, tableowner 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   ORDER BY tableowner, tablename;
   ```
   All tables should show `theoshift_user` as owner.

2. **Execute table rename (migration 006):**
   ```bash
   # Now this will work since theoshift_user owns the table
   psql -U theoshift_user -d theoshift_scheduler -f 006_rename_event_attendants_to_event_volunteers.sql
   ```

3. **Update Prisma schema:**
   - Remove `@@map("event_attendants")` from event_volunteers model
   - Regenerate Prisma client
   - Test on STANDBY

4. **Implement volunteer roles (Option 1):**
   - Add event-specific role fields to event_volunteers
   - Migrate existing data
   - Update application code

## Rollback Plan

If issues arise, ownership can be transferred back:

```sql
-- Transfer back to original owners (example)
ALTER TABLE event_attendants OWNER TO jw_scheduler;
-- etc.
```

However, this is unlikely to be needed as ownership transfer is a safe operation.

## Risk Assessment

**Risk Level:** Low

**Why low risk:**
- Ownership transfer doesn't modify data
- Doesn't change table structure
- Doesn't affect application functionality
- Can be rolled back if needed

**Potential issues:**
- If other applications use these tables with jw_scheduler credentials, they may lose write access
- Need to verify no other services depend on jw_scheduler ownership

## Next Steps

1. **Determine postgres credentials availability**
   - Check if postgres password is accessible
   - Or coordinate with infrastructure team

2. **Execute migration 007** (ownership transfer)

3. **Execute migration 006** (table rename)

4. **Implement volunteer roles** (Option 1)

## Questions to Answer

1. Do we have postgres superuser credentials?
2. Are there other applications/services using this database?
3. Is there a maintenance window needed, or can this run live?

## Files Created

- `/database/migrations/007_transfer_ownership_to_theoshift_user.sql` - Main migration
- `/database/migrations/006_rename_event_attendants_to_event_volunteers.sql` - Table rename (ready after 007)
- `/database/migrations/006_rollback_rename_event_volunteers.sql` - Rollback for 006
- This document - Migration plan and coordination guide
