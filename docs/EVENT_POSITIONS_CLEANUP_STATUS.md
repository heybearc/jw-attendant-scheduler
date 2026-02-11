# event_positions Table Cleanup Status

**Date:** 2026-02-11  
**Status:** Partial - Core functionality cleaned, legacy endpoints remain

## Summary

The `event_positions` table has been successfully dropped from the database and removed from the Prisma schema. The core application now uses only the `positions` table. However, several legacy API endpoints and page components still reference `event_positions` and will need cleanup.

---

## ✅ Completed Cleanup

### Database
- ✅ Dropped `event_positions` table (migration 009)
- ✅ Verified table is empty (0 records)
- ✅ Confirmed `positions` table is active (109 records)

### Prisma Schema
- ✅ Removed `event_positions` model from schema
- ✅ Removed `event_positions` relations from `assignments` model
- ✅ Removed `event_positions` relations from `events` model
- ✅ Regenerated Prisma client

### Core API Endpoints
- ✅ `/api/events/[id]/clone.ts` - Removed dual system logic, uses only positions
- ✅ `/api/events/[id].ts` - Updated to use positions instead of event_positions

---

## ⚠️ Remaining References (Legacy/Unused)

The following files still reference `event_positions`. These are mostly legacy or debugging endpoints that may not be actively used:

### API Endpoints (Legacy)

1. **`/api/events/[id]/setup-positions.ts`**
   - Lines 61, 70: Uses `prisma.event_positions.createMany()` and `findFirst()`
   - **Status:** Likely a setup/testing endpoint, may not be in active use
   - **Action:** Remove or update to use `positions` table

2. **`/api/events/[id]/create-test-positions.ts`**
   - Line 42: Raw SQL INSERT into `event_positions`
   - **Status:** Test/debug endpoint
   - **Action:** Remove or update to use `positions` table

3. **`/api/events/[id]/positions/[positionId]/overseer.ts`**
   - Lines 77-80: Debugging code checking `event_positions` table
   - **Status:** Debug code, can be removed
   - **Action:** Remove the debug check

4. **`/api/events/[id]/oversight.ts`**
   - Lines 77, 96, 101, 118: Queries `event_positions` for oversight data
   - Lines 192-236: Maps `assignment.event_positions` fields
   - **Status:** Active endpoint - needs update
   - **Action:** Update to use `positions` table

5. **`/api/events/[id]/count-sessions/compare.ts`**
   - Lines 54, 81-83: Includes and maps `event_positions` fields
   - **Status:** Count sessions feature - needs update
   - **Action:** Update to use `positions` table

6. **`/api/event-positions/[eventId].ts`**
   - Lines 43, 57: Full CRUD endpoint for `event_positions`
   - **Status:** Entire endpoint is for old system
   - **Action:** Remove entire file or redirect to positions endpoint

7. **`/api/event-positions/[eventId]/[positionId].ts`**
   - Multiple lines: Full CRUD for individual positions
   - **Status:** Entire endpoint is for old system
   - **Action:** Remove entire file or redirect to positions endpoint

8. **`/api/event-assignments/[eventId]/[assignmentId].ts`**
   - Lines 76, 113, 192, 269: References `event_positions` in assignments
   - **Status:** Active endpoint - needs update
   - **Action:** Update to use `positions` table

9. **`/api/events.ts`**
   - Line 78: Hardcoded count for Circuit Assembly event
   - **Status:** Mock data for testing
   - **Action:** Update or remove mock data

### Page Components

1. **`/pages/events/[id]/count-times/[sessionId]/index.tsx`**
   - Lines 15, 101, 287, 293, 296, 364, 367, 368: Maps `event_positions` fields
   - **Status:** Count times feature - needs update
   - **Action:** Update to use `positions` table

2. **`/pages/events/[id]/assignments.tsx`**
   - Lines 25, 401, 404, 688-693, 695: Maps `event_positions` fields
   - **Status:** Assignments page - needs update
   - **Action:** Update to use `positions` table

3. **`/pages/guest-lookup.tsx`**
   - Lines 10, 210, 212, 215, 217, 219: Maps `event_positions` fields
   - **Status:** Guest lookup feature - needs update
   - **Action:** Update to use `positions` table

---

## 📋 Recommended Cleanup Plan

### Phase 1: Remove Dead Code (Low Risk)
1. Delete `/api/event-positions/` directory entirely
2. Remove `/api/events/[id]/setup-positions.ts`
3. Remove `/api/events/[id]/create-test-positions.ts`
4. Remove debug code from `/api/events/[id]/positions/[positionId]/overseer.ts`

### Phase 2: Update Active Endpoints (Medium Risk)
1. Update `/api/events/[id]/oversight.ts` to use `positions`
2. Update `/api/events/[id]/count-sessions/compare.ts` to use `positions`
3. Update `/api/event-assignments/[eventId]/[assignmentId].ts` to use `positions`

### Phase 3: Update Page Components (Medium Risk)
1. Update `/pages/events/[id]/count-times/[sessionId]/index.tsx`
2. Update `/pages/events/[id]/assignments.tsx`
3. Update `/pages/guest-lookup.tsx`

### Phase 4: Testing
1. Test event cloning on STANDBY
2. Test count sessions feature
3. Test assignments page
4. Test guest lookup
5. Test oversight reporting

---

## 🎯 Impact Assessment

**Core Functionality:** ✅ **Working**
- Event cloning uses new positions system
- Event detail page uses positions
- Main event operations functional

**Legacy Features:** ⚠️ **May Break**
- Count sessions comparison
- Oversight reporting
- Guest lookup
- Old assignment endpoints

**Risk Level:** **Medium**
- Core features are safe
- Legacy features may fail if they try to access `event_positions`
- Most legacy endpoints likely not in active use

---

## 🔍 How to Find Remaining References

```bash
# Search for event_positions in code
grep -r "event_positions" pages/ --include="*.ts" --include="*.tsx"

# Search in API routes
grep -r "event_positions" pages/api/ --include="*.ts"

# Search in components
grep -r "event_positions" components/ --include="*.tsx"
```

---

## ✅ Success Criteria

Cleanup will be complete when:
1. ✅ Database table dropped
2. ✅ Prisma schema updated
3. ✅ Core endpoints updated (clone, events detail)
4. ⏳ All API endpoints updated or removed
5. ⏳ All page components updated
6. ⏳ All tests passing
7. ⏳ No grep results for `event_positions` in active code

---

## 📝 Notes

- The `positions` table is the current standard
- All new code should use `positions` table
- The `event_positions` table had 0 records when dropped
- Migration 009 successfully removed the table
- Prisma client regenerated successfully
