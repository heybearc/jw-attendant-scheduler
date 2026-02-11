# Migration Blocker - Postgres Superuser Access Required

**Date:** 2026-02-11  
**Status:** BLOCKED - Awaiting postgres credentials or DBA assistance

## Current Situation

We need to execute 3 database migrations but are blocked by permissions:

1. **Migration 007** - Transfer ownership to theoshift_user (requires postgres superuser)
2. **Migration 006** - Rename event_attendants → event_volunteers (requires table ownership)
3. **Migration 008** - Add event-specific role fields (requires table ownership)

## What We've Tried

1. ✅ Created all migration scripts
2. ❌ Attempted to execute with theoshift_user (insufficient permissions)
3. ❌ Attempted postgres connection with password "Cloudy_92!" (authentication failed)
4. ❌ Attempted SSH to database server 10.92.3.21 (permission denied)
5. ❌ Looked for local postgres instance (database is remote)

## Current Permissions

**theoshift_user has:**
- INSERT, SELECT, UPDATE, DELETE on tables
- Cannot ALTER TABLE (requires ownership)
- Cannot transfer ownership (requires superuser)

**Table ownership:**
- 27 tables owned by `jw_scheduler`
- 3 tables owned by `jw_scheduler_staging`
- 8 tables owned by `postgres`
- 1 table owned by `theoshift_user`

## Required Access

**To proceed, we need ONE of:**

1. **Postgres superuser password** for database at 10.92.3.21
2. **SSH access** to database server (10.92.3.21) as root or user with sudo
3. **DBA assistance** to execute the 3 migration scripts

## Migration Scripts Ready

All scripts are created, tested, and ready to execute:

- `/database/migrations/007_transfer_ownership_to_theoshift_user.sql`
- `/database/migrations/006_rename_event_attendants_to_event_volunteers.sql`
- `/database/migrations/008_add_event_specific_volunteer_roles.sql`

## Impact

**What's blocked:**
- Cannot implement event-specific volunteer roles (high priority business requirement)
- Cannot rename event_attendants table (technical debt cleanup)
- Cannot make any schema changes to existing tables

**What still works:**
- All current application functionality
- Can create new tables (if owned by theoshift_user)
- Can modify data in existing tables

## Recommended Actions

### Option 1: Contact Database Administrator
Whoever set up the database originally should have postgres credentials. Contact them to:
1. Execute migration 007 (ownership transfer)
2. Then we can execute 006 and 008 ourselves

### Option 2: Reset Postgres Password
If you have access to the database server (10.92.3.21):
```bash
# On database server as root
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'new_password';
```

### Option 3: Grant ALTER Permissions
As a workaround, postgres superuser could grant ALTER permissions:
```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO theoshift_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO theoshift_user;
```

## Next Steps

1. Determine who has postgres superuser access
2. Execute migration 007 (ownership transfer)
3. Execute migration 006 (table rename)
4. Execute migration 008 (event-specific roles)
5. Update Prisma schema
6. Update application code
7. Test and deploy

## Timeline

Once we have postgres access:
- Migration execution: 5 minutes
- Schema updates: 10 minutes
- Code updates: 2-3 hours
- Testing: 1 hour
- **Total: ~4 hours to complete**

Without postgres access: **INDEFINITELY BLOCKED**
