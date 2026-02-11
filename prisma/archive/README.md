# Archived Prisma Schema Files

**Date Archived:** 2026-02-11

## Files in This Archive

### schema-consolidated.prisma
- **Purpose:** Consolidated schema from earlier migration work
- **Last Modified:** 2026-01-23
- **Status:** Superseded by `/prisma/schema.prisma`
- **Reason for Archive:** No longer used, keeping for historical reference

### schema_baseline.prisma
- **Purpose:** Baseline schema snapshot
- **Last Modified:** 2026-01-23
- **Status:** Superseded by `/prisma/schema.prisma`
- **Reason for Archive:** No longer used, keeping for historical reference

## Current Active Schema

**File:** `/prisma/schema.prisma`

This is the ONLY schema file that should be used for:
- Prisma Client generation (`npx prisma generate`)
- Database migrations (`npx prisma migrate`)
- Schema introspection (`npx prisma db pull`)

## Migration Strategy Going Forward

### Database Migrations

We use TWO migration systems:

1. **Prisma Migrations** (`/prisma/migrations/`)
   - Managed by Prisma CLI
   - Used for schema changes that Prisma can auto-generate
   - Run with: `npx prisma migrate dev`

2. **Manual SQL Migrations** (`/database/migrations/`)
   - Used for complex migrations requiring manual SQL
   - Used for ownership changes, table renames, data migrations
   - Executed manually via psql or database admin tools
   - Examples:
     - `007_transfer_ownership_to_theoshift_user.sql`
     - `008_add_event_specific_volunteer_roles.sql`

### When to Use Each System

**Use Prisma Migrations when:**
- Adding/removing fields
- Changing field types
- Adding indexes
- Simple schema changes

**Use Manual SQL Migrations when:**
- Transferring ownership
- Renaming tables
- Complex data migrations
- Require superuser permissions
- Need precise control over SQL

### Best Practices

1. **Always update `/prisma/schema.prisma` first**
2. **Run `npx prisma generate` after schema changes**
3. **Test migrations on STANDBY (GREEN) before LIVE (BLUE)**
4. **Document complex migrations in `/docs/`**
5. **Keep rollback scripts for risky migrations**

## Historical Context

These archived schemas were created during the transition from "attendants" to "volunteers" terminology and the consolidation of multiple schema files. They are preserved for reference but should not be used for any active development.
