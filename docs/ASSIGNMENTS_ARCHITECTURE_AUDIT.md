# Assignments & Oversight Architecture Audit

**Date:** 2026-02-11  
**Purpose:** Complete architecture audit to properly refactor remaining event_positions references

---

## 🔍 Critical Discovery

### Database State

```
Table                   | Records | Status
------------------------|---------|------------------
assignments             | 0       | ❌ EMPTY - OLD SYSTEM
position_assignments    | 182     | ✅ ACTIVE - NEW SYSTEM
positions               | 109     | ✅ ACTIVE - NEW SYSTEM
event_positions         | N/A     | ❌ DROPPED
```

**Key Finding:** The `assignments` table is **COMPLETELY EMPTY** and not being used!

---

## 📊 Two Assignment Systems

### OLD SYSTEM (Unused - 0 records)

**Table:** `assignments`
- References: `users` (userId), `events` (eventId)
- **Does NOT reference positions table** - uses positionId as string
- Status: Empty, legacy code only
- Used by: `/api/event-assignments/` endpoints (legacy)

**Schema:**
```prisma
model assignments {
  id                 String
  eventId            String
  userId             String        // References users table
  positionId         String        // Just a string, no FK
  shiftId            String?
  shiftStart         DateTime
  shiftEnd           DateTime
  status             AssignmentStatus
  // ... confirmation fields
  events             events        @relation(...)
  users              users         @relation(...)
}
```

### NEW SYSTEM (Active - 182 records)

**Table:** `position_assignments`
- References: `volunteers` (volunteerId), `positions` (positionId), `position_shifts` (shiftId)
- Includes oversight: overseerId, keymanId
- Status: Active, current system
- Used by: Most modern endpoints

**Schema:**
```prisma
model position_assignments {
  id          String
  positionId  String
  shiftId     String?
  volunteerId String
  role        PositionRole
  overseerId  String?
  keymanId    String?
  assignedAt  DateTime
  assignedBy  String?
  volunteer   volunteers       @relation(...)
  keyman      volunteers?      @relation(...)
  overseer    volunteers?      @relation(...)
  positions   positions        @relation(...)
  shift       position_shifts? @relation(...)
}
```

---

## 🗺️ System Architecture

### Positions System (NEW - Active)

```
positions (109 records)
  ├── position_assignments (182 records)
  │   ├── volunteer (volunteerId)
  │   ├── overseer (overseerId)
  │   └── keyman (keymanId)
  ├── position_shifts
  ├── position_counts
  └── position_oversight_assignments
```

### Event Positions System (OLD - Removed)

```
event_positions (DROPPED)
  └── assignments (0 records - EMPTY)
      ├── users (userId)
      └── events (eventId)
```

---

## 📁 Files Using OLD System (assignments table)

### API Endpoints - Legacy (Need Removal/Update)

1. **`/api/event-assignments/[eventId].ts`**
   - Uses: `prisma.assignments.findMany()`, `prisma.assignments.create()`
   - Status: Legacy endpoint, 0 records
   - Action: **DELETE** - No data, not used

2. **`/api/event-assignments/[eventId]/[assignmentId].ts`**
   - Uses: `prisma.assignments.findUnique()`, `prisma.assignments.update()`, `prisma.assignments.delete()`
   - Status: Legacy CRUD endpoint, 0 records
   - Action: **DELETE** - No data, not used

3. **`/api/events/[id]/oversight.ts`**
   - Uses: `prisma.assignments.findMany()` with users relation
   - Status: Trying to query empty table
   - Action: **UPDATE** to use position_assignments or position_oversight_assignments

4. **`/api/events/[id]/volunteers/bulk.ts`**
   - Uses: `prisma.assignments.count()` to check for assignments
   - Status: Always returns 0
   - Action: **UPDATE** to use position_assignments

### Page Components Using event_positions

1. **`/pages/events/[id]/assignments.tsx`**
   - Maps: `assignment.event_positions` fields
   - Status: Trying to access non-existent relation
   - Action: **UPDATE** to use positions relation

2. **`/pages/events/[id]/count-times/[sessionId]/index.tsx`**
   - Maps: `pc.event_positions` fields from position_counts
   - Status: Relation doesn't exist
   - Action: **UPDATE** to use position relation (already exists)

3. **`/pages/guest-lookup.tsx`**
   - Maps: `assignment.event_positions` fields
   - Status: Trying to access non-existent relation
   - Action: **UPDATE** to use positions relation

4. **`/pages/api/events/[id]/positions/[positionId]/overseer.ts`**
   - Has debug code: `prisma.event_positions.findUnique()`
   - Status: Debug/fallback code
   - Action: **REMOVE** debug code

---

## 📁 Files Using NEW System (Correct)

These files are already using the correct system:

- ✅ `/api/events/[id]/assignments.ts` - Uses position_assignments
- ✅ `/api/events/[id]/assignments/clear-all.ts` - Uses position_assignments
- ✅ `/api/events/[id]/assignments/send-notifications.ts` - Uses position_assignments
- ✅ `/api/events/[id]/clone.ts` - Uses position_assignments
- ✅ `/api/events/[id]/positions/[positionId]/shifts.ts` - Uses position_assignments
- ✅ `/api/events/[id]/positions/bulk-oversight.ts` - Uses position_oversight_assignments
- ✅ `/api/events/[id]/positions/[positionId]/overseer.ts` - Uses position_oversight_assignments
- ✅ `/api/volunteer/dashboard.ts` - Uses position_assignments

---

## 🎯 Refactoring Strategy

### Phase 1: Delete Dead Endpoints (Low Risk)
1. Delete `/api/event-assignments/` directory entirely
   - These endpoints query empty `assignments` table
   - No data loss risk (0 records)

### Phase 2: Update Active Endpoints (Medium Risk)
1. Update `/api/events/[id]/oversight.ts`
   - Change from `assignments` to `position_oversight_assignments`
   - Query volunteers with oversight roles
   
2. Update `/api/events/[id]/volunteers/bulk.ts`
   - Change assignments.count() to position_assignments.count()

3. Remove debug code from `/api/events/[id]/positions/[positionId]/overseer.ts`

### Phase 3: Update Page Components (Medium Risk)
1. Update `/pages/events/[id]/assignments.tsx`
   - Change event_positions to positions relation
   
2. Update `/pages/events/[id]/count-times/[sessionId]/index.tsx`
   - Change event_positions to position relation
   
3. Update `/pages/guest-lookup.tsx`
   - Change event_positions to positions relation

---

## ✅ Verification Checklist

After refactoring:
- [ ] No references to `assignments` table (except in schema)
- [ ] No references to `event_positions` table/model
- [ ] All queries use `position_assignments` or `position_oversight_assignments`
- [ ] All page components use `positions` relation
- [ ] Tests pass
- [ ] Oversight dashboard works
- [ ] Assignment creation works
- [ ] Guest lookup works

---

## 🔧 Migration Notes

**No data migration needed** because:
- `assignments` table is empty (0 records)
- `event_positions` table already dropped
- All active data is in `position_assignments` (182 records)

**Safe to delete:**
- `/api/event-assignments/` directory
- Any code querying `assignments` table
- Any code referencing `event_positions`

---

## 📝 Summary

The codebase has **two parallel assignment systems**:
1. **OLD:** `event_positions` → `assignments` (EMPTY, UNUSED)
2. **NEW:** `positions` → `position_assignments` (ACTIVE, 182 records)

All remaining cleanup is **safe** because:
- Old system has 0 records
- New system is fully functional
- No data migration required
- Just code cleanup
