# TypeScript Errors Audit - Post Prisma Regeneration

**Date:** 2026-02-11  
**Status:** Active - Needs Fixes

## Summary

After regenerating Prisma client, TypeScript compilation reveals several categories of errors:

**Total Errors:** ~15-20  
**Categories:** Missing relations, type mismatches, deprecated fields

---

## Category 1: Missing Relations in Schema

### event_departments.event_volunteers (4 errors)

**Files Affected:**
- `/pages/api/events/[id]/departments/[deptId].ts` (lines 84, 181, 198, 205)

**Issue:** Code tries to include/access `event_volunteers` relation on `event_departments` model, but this relation doesn't exist in the Prisma schema.

**Current Schema:**
```prisma
model event_departments {
  id             String                @id
  eventId        String
  // ... other fields ...
  event          events                @relation(...)
  template       department_templates? @relation(...)
  parent         event_departments?    @relation(...)
  children       event_departments[]   @relation(...)
  // ❌ NO event_volunteers relation
}
```

**Code Attempting:**
```typescript
// Line 84
event_volunteers: {
  include: {
    volunteer: { ... }
  }
}

// Line 198
if (department.event_volunteers.length > 0) { ... }
```

**Root Cause:** The `event_volunteers` table doesn't have a `departmentId` foreign key, so there's no way to relate departments to volunteers directly.

**Options:**
1. **Remove the code** - If departments don't actually need to list volunteers
2. **Add departmentId to event_volunteers** - If departments should own volunteers
3. **Query through events** - Get volunteers via `department.event.event_volunteers`

**Recommended Fix:** Option 3 - Query through the event relation since volunteers belong to events, not departments.

---

### volunteers.event_volunteers (2 errors)

**Files Affected:**
- `/pages/api/volunteer/login.ts` (lines 50, 111)

**Issue:** Code tries to include `event_volunteers` on `volunteers` model, but the relation name is different.

**Current Schema:**
```prisma
model volunteers {
  // Relations use specific names, not generic "event_volunteers"
  event_volunteers_primary      event_volunteers[] @relation("event_volunteers_volunteerIdTovolunteers")
  event_volunteers_keyman       event_volunteers[] @relation("event_volunteers_keymanIdTovolunteers")
  event_volunteers_overseer     event_volunteers[] @relation("event_volunteers_overseerIdTovolunteers")
}
```

**Code Attempting:**
```typescript
// Line 50
event_volunteers: {
  include: { ... }
}

// Line 111
const events = volunteer.event_volunteers.map(...)
```

**Root Cause:** Prisma generates specific relation names when there are multiple relations between the same tables. The generic `event_volunteers` doesn't exist.

**Recommended Fix:** Use `event_volunteers_primary` instead of `event_volunteers`.

---

## Category 2: Type Mismatches

### Json Type Issues (2 errors)

**Files Affected:**
- `/pages/api/events/[id]/clone.ts` (lines 127, 128)

**Issue:** `JsonValue` type (which includes `null`) is not assignable to `InputJsonValue` (which doesn't accept `null` directly).

**Code:**
```typescript
assignedDepartments: ev.assignedDepartments,  // JsonValue
assignedStationRanges: ev.assignedStationRanges,  // JsonValue
```

**Prisma Expects:**
```typescript
assignedDepartments?: NullableJsonNullValueInput | InputJsonValue
```

**Recommended Fix:**
```typescript
assignedDepartments: ev.assignedDepartments ?? undefined,
assignedStationRanges: ev.assignedStationRanges ?? undefined,
```

---

### Missing Property: maxAttendants (1 error)

**Files Affected:**
- `/pages/api/events/[id]/clone.ts` (line 157)

**Issue:** Code references `position.maxAttendants` but this field doesn't exist on the positions model.

**Recommended Fix:** Remove reference or check if field should be added to schema.

---

## Category 3: Already Fixed (False Positives)

### ivsImportBatchId, ivsApprovalStatus, ivs_import_batches

**Status:** ✅ These fields EXIST in the schema and Prisma client was regenerated.

**Reason for Previous Errors:** Stale Prisma client. Now resolved.

---

## Recommended Fix Order

### Phase 1: Quick Fixes (30 minutes)
1. Fix `volunteers.event_volunteers` → `volunteers.event_volunteers_primary` (2 files)
2. Fix Json type issues with `?? undefined` (1 file)
3. Remove or comment out `maxAttendants` reference (1 file)

### Phase 2: Department Relations (1-2 hours)
4. Refactor department API to query volunteers through event relation
5. Remove direct `event_volunteers` includes on departments
6. Test department endpoints

### Phase 3: Verification
7. Run `npx tsc --noEmit` to verify all errors resolved
8. Test affected endpoints on STANDBY
9. Deploy to production

---

## Files Requiring Changes

1. `/pages/api/events/[id]/departments/[deptId].ts` - Refactor volunteer queries
2. `/pages/api/volunteer/login.ts` - Fix relation name
3. `/pages/api/events/[id]/clone.ts` - Fix Json types and remove maxAttendants

---

## Testing Checklist

After fixes:
- [ ] `npx tsc --noEmit` passes without errors
- [ ] Department API returns volunteers correctly
- [ ] Volunteer login works
- [ ] Event cloning works
- [ ] All E2E tests pass

---

## Notes

- The Prisma schema is actually well-defined with IVS fields
- Most errors are from code not keeping up with schema changes
- Relations need to use the specific generated names when multiple relations exist
- This is typical technical debt from rapid development
