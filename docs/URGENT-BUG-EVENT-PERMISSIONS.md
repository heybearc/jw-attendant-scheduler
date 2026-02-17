# 🚨 URGENT BUG: Event-Level Permissions Not Respected in Position/Shift APIs

**Priority:** HIGH  
**Reported:** 2026-02-17  
**Reporter:** Cory (via David Jersak user issue)  
**Status:** DOCUMENTED - NOT DEPLOYED

## Problem Summary

API endpoints for position and shift management are checking **system-level user roles** instead of **event-level permissions**. This prevents users with event-level ADMIN permissions from performing actions they should be authorized to do.

### Real-World Impact

**User:** David Jersak (Davidmj3412@gmail.com)  
**System Role:** ASSISTANT_OVERSEER  
**Event Role:** ADMIN (for Circuit Assembly event)  
**Issue:** Cannot create shifts for positions despite being event admin

**Temporary Workaround Applied:** Changed David's system role from ASSISTANT_OVERSEER to OVERSEER (not ideal - bypasses event permission system)

## Root Cause

Multiple API endpoints check `user.role` (system-level) instead of using the event permission system (`event_permissions` table and `eventAccess.ts` helpers).

### Affected Files

1. **`/pages/api/events/[id]/positions/[positionId]/shifts.ts:35`**
   ```typescript
   if (!user || !['ADMIN', 'OVERSEER', 'admin', 'overseer'].includes(user.role)) {
     return res.status(403).json({ error: 'Insufficient permissions' })
   }
   ```

2. **`/pages/api/events/[id]/positions/bulk-oversight.ts:34`**
   ```typescript
   if (!user || !['ADMIN', 'OVERSEER', 'admin', 'overseer'].includes(user.role)) {
     return res.status(403).json({ success: false, error: 'Insufficient permissions' })
   }
   ```

3. **`/pages/api/events/[id]/positions/[positionId]/overseer.ts:38`**
   ```typescript
   if (!user || !['ADMIN', 'OVERSEER', 'admin', 'overseer'].includes(user.role)) {
     return res.status(403).json({ error: 'Insufficient permissions' })
   }
   ```

## Expected Behavior

Users with **event-level ADMIN or COORDINATOR** permissions should be able to:
- Create/delete shifts for positions
- Assign oversight (overseers/keymen) to positions
- Manage all position-related operations within their event

This should work **regardless of their system-level role** (ADMIN, OVERSEER, ASSISTANT_OVERSEER, or even VOLUNTEER).

## Correct Implementation Pattern

The codebase already has the correct pattern in `/src/lib/eventAccess.ts`:

```typescript
import { checkEventAccess, canManagePosition } from '../../../../../src/lib/eventAccess'

// Instead of checking user.role:
const user = await prisma.users.findUnique({
  where: { email: session.user?.email || '' }
})
if (!user || !['ADMIN', 'OVERSEER'].includes(user.role)) {
  return res.status(403).json({ error: 'Insufficient permissions' })
}

// Should use event permission check:
const hasAccess = await checkEventAccess(user.id, eventId, 'COORDINATOR')
if (!hasAccess) {
  return res.status(403).json({ error: 'Insufficient permissions' })
}

// Or for position-specific:
const canManage = await canManagePosition(user.id, eventId, positionId)
if (!canManage) {
  return res.status(403).json({ error: 'Insufficient permissions' })
}
```

## Required Fix

### Step 1: Update Shift Management API
**File:** `/pages/api/events/[id]/positions/[positionId]/shifts.ts`

Replace lines 30-37:
```typescript
// OLD - System role check
const user = await prisma.users.findUnique({
  where: { email: session.user?.email || '' }
})

if (!user || !['ADMIN', 'OVERSEER', 'admin', 'overseer'].includes(user.role)) {
  return res.status(403).json({ error: 'Insufficient permissions' })
}
```

With:
```typescript
// NEW - Event permission check
const user = await prisma.users.findUnique({
  where: { email: session.user?.email || '' }
})

if (!user) {
  return res.status(401).json({ error: 'User not found' })
}

// Check event-level permissions (COORDINATOR or ADMIN can manage shifts)
const hasAccess = await checkEventAccess(user.id, eventId as string, 'COORDINATOR')
if (!hasAccess) {
  return res.status(403).json({ error: 'Insufficient permissions to manage shifts for this event' })
}
```

### Step 2: Update Bulk Oversight API
**File:** `/pages/api/events/[id]/positions/bulk-oversight.ts`

Apply same pattern as Step 1.

### Step 3: Update Position Overseer API
**File:** `/pages/api/events/[id]/positions/[positionId]/overseer.ts`

Apply same pattern as Step 1.

### Step 4: Audit All Position APIs
Search for other endpoints in `/pages/api/events/[id]/positions/` that may have the same issue:
```bash
grep -r "user.role.*ADMIN.*OVERSEER" pages/api/events/[id]/positions/
```

## Testing Requirements

1. **Create test user with ASSISTANT_OVERSEER system role**
2. **Grant them event-level ADMIN permission** for a test event
3. **Verify they can:**
   - Create shifts for positions
   - Delete shifts
   - Assign overseers/keymen to positions
   - Perform bulk oversight operations
4. **Verify they cannot** access events where they don't have permissions

## Additional Context

The event permission system (`event_permissions` table) was designed to allow fine-grained access control:
- **ADMIN:** Full event management (edit event, manage permissions, manage content)
- **COORDINATOR:** Manage volunteers, positions, assignments (but not event settings)
- **VIEWER:** Read-only access

System roles (ADMIN, OVERSEER, ASSISTANT_OVERSEER, VOLUNTEER) should only be used for:
- Global system administration
- Default permissions for new events
- Features outside event context

## Related Files

- `/src/lib/eventAccess.ts` - Event permission helper functions
- `/pages/api/events/[id]/positions/[positionId]/shifts.ts` - Shift creation/deletion
- `/pages/api/events/[id]/positions/bulk-oversight.ts` - Bulk oversight assignment
- `/pages/api/events/[id]/positions/[positionId]/overseer.ts` - Individual oversight assignment

## Notes

This is a **fundamental architectural issue** where the event permission system is not being consistently applied across all APIs. The fix should be prioritized as it affects the core multi-tenancy and permission model of the application.
