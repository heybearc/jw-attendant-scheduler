# Event Permissions Refactor Status

**Date:** February 2, 2026  
**Status:** Code changes complete, awaiting deployment

---

## ✅ Completed Changes

### 1. Prisma Schema Updated
- **File:** `prisma/schema.prisma`
- **Change:** EventPermissionRole enum simplified from 5 roles to 3
  ```prisma
  enum EventPermissionRole {
    ADMIN       // was OWNER
    COORDINATOR // was MANAGER/OVERSEER/KEYMAN
    VIEWER      // unchanged
  }
  ```

### 2. Permission Logic Updated
- **File:** `src/lib/eventAccess.ts`
- **Changes:**
  - Updated type definition: `EventPermissionRole = 'ADMIN' | 'COORDINATOR' | 'VIEWER'`
  - Updated role hierarchy (ADMIN: 3, COORDINATOR: 2, VIEWER: 1)
  - Simplified all permission check functions
  - Removed scope-based logic (OVERSEER scopes, KEYMAN restrictions)
  - Updated system ADMIN auto-permission to use 'ADMIN' role

### 3. API Endpoints Updated
- **Files:**
  - `pages/api/events/[id]/permissions.ts`
  - `pages/api/events/[id]/permissions/[userId].ts`
- **Changes:**
  - Updated role validation to accept only: VIEWER, COORDINATOR, ADMIN
  - Changed OWNER references to ADMIN
  - Updated "last owner" protection to "last admin" protection
  - Updated error messages

### 4. UI Updated
- **File:** `pages/events/[id]/permissions.tsx`
- **Changes:**
  - Updated role dropdown options (3 roles instead of 5)
  - Updated role badge colors
  - Updated permission descriptions:
    - **ADMIN:** Full control - can edit event details, delete event, and manage permissions
    - **COORDINATOR:** Can manage volunteers, positions, assignments, and documents
    - **VIEWER:** Read-only access (for training/observation)
  - Updated error messages

### 5. Migration Script Created
- **File:** `scripts/migrate-event-permissions.sql`
- **Purpose:** Update existing database records from old roles to new roles
- **Mapping:**
  - OWNER → ADMIN
  - MANAGER → COORDINATOR
  - OVERSEER → COORDINATOR
  - KEYMAN → COORDINATOR
  - VIEWER → VIEWER (no change)

---

## 🔄 Remaining Steps

### Step 1: Run Database Migration on STANDBY
```bash
ssh root@10.92.3.24
cd /opt/theoshift
PGPASSWORD='theoshift_password' psql -U theoshift_user -d theoshift_scheduler < scripts/migrate-event-permissions.sql
```

### Step 2: Deploy Code to STANDBY
```bash
# On STANDBY server (10.92.3.24)
cd /opt/theoshift
git pull origin main
rm -rf .next
npx prisma generate  # Regenerate Prisma client with new enum
npm run build
pm2 restart theoshift-blue
```

### Step 3: Verify on STANDBY
- Test event permissions page: http://blue.theoshift.com/events/[event-id]/permissions
- Verify role dropdowns show only 3 options
- Test granting/editing/removing permissions
- Verify permission checks work correctly

### Step 4: Run Migration on LIVE (after STANDBY testing)
```bash
ssh root@10.92.3.22
cd /opt/theoshift
PGPASSWORD='theoshift_password' psql -U theoshift_user -d theoshift_scheduler < scripts/migrate-event-permissions.sql
```

### Step 5: Switch Traffic to STANDBY
Use MCP tool or manual HAProxy update

### Step 6: Sync New STANDBY with Code
Pull, build, restart on the server that's now STANDBY

---

## 📊 Role Mapping Summary

| Old Role | New Role | Capabilities Change |
|----------|----------|---------------------|
| OWNER | ADMIN | Same (full control) |
| MANAGER | COORDINATOR | Lost: event settings, delete, permissions |
| OVERSEER | COORDINATOR | **Upgraded**: No longer scope-restricted |
| KEYMAN | COORDINATOR | **Upgraded**: Can now manage all assignments |
| VIEWER | VIEWER | No change |

---

## ⚠️ Breaking Changes

1. **MANAGER users lose ability to:**
   - Edit event details (name, dates, location)
   - Delete events
   - Manage permissions

2. **Scope-based permissions removed:**
   - OVERSEER can no longer be restricted to specific departments/positions
   - All COORDINATOR roles have full event management access

3. **Database migration required:**
   - Must run SQL script before deploying new code
   - Prisma client must be regenerated after migration

---

## 🎯 Benefits

1. **Clearer role separation:**
   - ADMIN = event ownership
   - COORDINATOR = day-to-day management
   - VIEWER = observation only

2. **Matches actual usage:**
   - Users were being assigned MANAGER because lower roles were too restrictive
   - Scope feature was rarely used in practice

3. **Easier to explain:**
   - 3 clear roles vs 5 confusing roles
   - No complex scope rules to understand

4. **Simpler codebase:**
   - Removed ~100 lines of scope-checking logic
   - Fewer edge cases to handle
   - Easier to maintain

---

## 🐛 Known Issues

- TypeScript lint errors are expected until Prisma client is regenerated
- These will resolve automatically after running `npx prisma generate` with the new schema

---

## 📝 Next Actions

**Immediate:** Run database migration on STANDBY, then deploy code
**After testing:** Promote to production via traffic switch
**Documentation:** Update help pages to reflect new permission structure
