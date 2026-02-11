# Technical Debt Assessment

**Last Updated:** February 11, 2026  
**Status:** Active Assessment

## Overview

This document tracks technical debt accumulated from database migrations, refactoring, and architectural changes in TheoShift.

---

## 🔴 High Priority Technical Debt

### 1. Inconsistent Table/Field Naming (attendants → volunteers)

**Issue:** The codebase has been migrated from "attendants" to "volunteers" terminology, but remnants remain.

**Evidence:**
- Database table: `event_volunteers` mapped to old name via `@@map("event_attendants")`
- TypeScript errors referencing `ivsImportBatchId` field that doesn't exist in schema
- Comments and variable names still use "attendant" terminology
- Some API endpoints and functions still reference "attendants"

**Impact:**
- Confusion for developers
- TypeScript errors that are ignored
- Inconsistent user experience
- Makes codebase harder to maintain

**Files Affected:**
- `/pages/api/events/[id]/volunteers/index.ts` - TypeScript errors on lines 60, 88, 89
- `/pages/api/events/[id]/ivs/import.ts` - References to `ivs_import_batches` table
- `/prisma/schema.prisma` - `@@map("event_attendants")` on event_volunteers model
- Various comments and variable names throughout codebase

**Recommended Fix:**
1. ~~Update Prisma schema to remove `@@map("event_attendants")`~~ **DEFERRED**
2. ~~Run database migration to rename table~~ **DEFERRED - requires DBA access**
3. Search and replace remaining "attendant" references (UI/comments only)
4. ~~Update all TypeScript types to match current schema~~ **COMPLETE**
5. ~~Regenerate Prisma client~~ **COMPLETE**

**Effort:** Medium (2-3 hours) - requires DBA access  
**Risk:** Medium (requires database migration with proper permissions)

**Status Update (2026-02-11):**
- Migration scripts created and ready (`/database/migrations/006_*.sql`)
- Table is owned by `jw_scheduler` user, not `theoshift_user`
- Application user lacks ALTER TABLE permissions
- **Decision:** Keep `@@map` directive, document clearly
- Added schema comment explaining the mapping
- See `/docs/TABLE_RENAME_PLAN.md` for full details
- **Priority downgraded to Medium** (was High)

---

### 2. Volunteer Roles: Global vs Event-Specific

**Issue:** Volunteer roles (overseer, keyman, elder) are stored globally but should be event-specific.

**Evidence:**
- `volunteers` table has `isOverseer`, `isKeyman`, `isElder` flags
- These affect ALL events when changed
- Unchecking keyman in Event A removes it from Event B
- Doesn't match real-world usage patterns

**Impact:**
- Data integrity issues
- User confusion
- Incorrect role assignments across events
- Cloning events copies global state incorrectly

**Documentation:** See `/docs/VOLUNTEER_ROLES_ARCHITECTURE.md`

**Recommended Fix:**
- Option 1 (Recommended): Move roles to `event_volunteers` table
- Requires migration plan and stakeholder decision

**Effort:** Large (8-12 hours including migration)  
**Risk:** High (data migration required)

---

### 3. Missing Prisma Schema Fields

**Issue:** Code references fields that don't exist in current Prisma schema.

**Evidence:**
- ~~`ivsImportBatchId` referenced but not in schema~~ **FIXED - field exists**
- ~~`ivsApprovalStatus` referenced but not in schema~~ **FIXED - field exists**
- ~~`ivs_import_batches` table referenced but not in Prisma client~~ **FIXED - table exists**
- ~~`departmentId` was being set to empty string~~ **FIXED**

**Impact:**
- ~~TypeScript errors throughout codebase~~ **RESOLVED**
- ~~Runtime errors when fields are accessed~~ **RESOLVED**
- ~~Developers using `(prisma as any)` to bypass type checking~~ **RESOLVED**
- ~~Unclear which fields actually exist~~ **DOCUMENTED**

**Files Affected:**
- ~~`/pages/api/events/[id]/ivs/import.ts`~~ **FIXED**
- ~~`/pages/api/events/[id]/volunteers/index.ts`~~ **FIXED**
- ~~Potentially other IVS-related files~~ **CHECKED**

**Completed Fixes (2026-02-11):**
1. ✅ Audited Prisma schema against actual database
2. ✅ Fields were already in schema, just needed client regeneration
3. ✅ Updated TypeScript types
4. ✅ Fixed volunteer login relation name (`event_volunteers_primary`)
5. ✅ Regenerated Prisma client
6. ✅ Fixed Json type issues with `?? undefined`
7. ✅ Removed invalid `event_volunteers` relation from department API

**Effort:** Medium (3-4 hours) **COMPLETE**  
**Risk:** Low (mostly cleanup) **COMPLETE**  
**Status:** ✅ **RESOLVED**

---

## 🟡 Medium Priority Technical Debt

### 4. Dual Position Systems (event_positions + positions)

**Issue:** Two position systems coexist in the database.

**Evidence:**
- `event_positions` table (old system)
- `positions` table (new system)
- Clone endpoint checks both: `useOldSystem` and `useNewSystem`
- Code has to handle both systems everywhere

**Impact:**
- Increased complexity
- Duplicate code paths
- Harder to maintain
- Confusion about which to use

**Files Affected:**
- `/pages/api/events/[id]/clone.ts`
- Position-related API endpoints
- Frontend position components

**Recommended Fix:**
1. Migrate all events to new `positions` system
2. Archive `event_positions` table
3. Remove dual-system code paths
4. Simplify position management

**Effort:** Large (10-15 hours)  
**Risk:** High (requires careful migration)

---

### 5. Inconsistent Field Name Mapping

**Issue:** Mix of camelCase, snake_case, and lowercase field names.

**Evidence:**
- Most models use `@map` directives for snake_case → camelCase
- Events model oversight fields use all lowercase (no @map)
- Some old code still uses snake_case directly
- Confusion about which naming to use

**Impact:**
- Developer confusion
- 500 errors from field name mismatches
- Inconsistent patterns across codebase
- Time wasted debugging naming issues

**Documentation:** See `/docs/PRISMA_FIELD_MAPPING.md`

**Recommended Fix:**
1. Standardize on camelCase in Prisma schema
2. Add `@map` directives consistently
3. Update events model oversight fields to use @map
4. Document exceptions clearly

**Effort:** Medium (4-6 hours)  
**Risk:** Medium (requires schema changes)

---

### 6. Old Migration Files and Baseline Schemas

**Issue:** Multiple schema files and migration history.

**Evidence:**
- `/prisma/schema.prisma` (current)
- `/prisma/schema-consolidated.prisma`
- `/prisma/schema_baseline.prisma`
- `/prisma/migrations/` with many old migrations
- `/database/migrations/` with SQL files

**Impact:**
- Confusion about which schema is authoritative
- Duplicate migration systems
- Hard to understand migration history
- Risk of using wrong schema file

**Recommended Fix:**
1. Consolidate to single schema file
2. Archive old schema files with clear naming
3. Clean up old migrations (keep for reference)
4. Document migration strategy going forward

**Effort:** Small (1-2 hours)  
**Risk:** Low (mostly organizational)

---

## 🟢 Low Priority Technical Debt

### 7. Console Violations (Non-Passive Event Listeners)

**Issue:** Browser console shows violations about non-passive event listeners.

**Evidence:**
```
[Violation] Added non-passive event listener to a scroll-blocking event
[Violation] 'click' handler took 1635ms
```

**Impact:**
- Performance warnings
- Potential scroll jank
- Poor user experience on mobile
- Browser console noise

**Recommended Fix:**
1. Add `{ passive: true }` to scroll event listeners
2. Optimize slow click handlers
3. Use React best practices for event handling

**Effort:** Small (2-3 hours)  
**Risk:** Low (UI optimization)

---

### 8. Commented-Out Code and Debug Logging

**Issue:** Codebase contains commented-out code and debug statements.

**Evidence:**
- Debug logging in production code
- Commented-out alternative implementations
- Old code paths left for reference
- `console.log` statements throughout

**Impact:**
- Code bloat
- Confusion about what's active
- Performance impact from logging
- Harder to read code

**Recommended Fix:**
1. Remove commented-out code
2. Use environment-based logging
3. Clean up debug statements
4. Use proper logging library

**Effort:** Small (2-3 hours)  
**Risk:** Very Low (cleanup only)

---

### 9. Inconsistent Error Handling

**Issue:** Mix of error handling patterns across API endpoints.

**Evidence:**
- Some endpoints return detailed errors
- Others return generic "Internal server error"
- Inconsistent error logging
- Mix of HTTP status codes for same errors

**Impact:**
- Hard to debug production issues
- Inconsistent user experience
- Missing error context
- Difficult troubleshooting

**Recommended Fix:**
1. Standardize error response format
2. Use consistent HTTP status codes
3. Implement centralized error logging
4. Add error tracking service

**Effort:** Medium (4-6 hours)  
**Risk:** Low (improvement only)

---

## 📊 Technical Debt by Category

### Database Schema Issues
- ✅ **Fixed:** `departmentId` empty string issue
- 🔴 Attendants → Volunteers naming inconsistency
- 🔴 Missing Prisma schema fields
- 🟡 Dual position systems
- 🟡 Inconsistent field name mapping
- 🟡 Multiple schema files

### Architectural Issues
- 🔴 Global vs event-specific volunteer roles
- 🟡 Dual position systems
- 🟢 Inconsistent error handling

### Code Quality Issues
- 🔴 TypeScript errors being ignored
- 🟡 `(prisma as any)` type casts
- 🟢 Commented-out code
- 🟢 Debug logging in production
- 🟢 Non-passive event listeners

### Documentation Gaps
- ✅ **Fixed:** Added Prisma field mapping docs
- ✅ **Fixed:** Added volunteer roles architecture docs
- 🟡 Migration strategy not documented
- 🟢 Error handling patterns not documented

---

## 🎯 Recommended Cleanup Order

### Phase 1: Quick Wins (1-2 days)
1. ✅ Fix `departmentId` empty string issue
2. ✅ Update UI terminology (Attendant → Volunteer)
3. Remove commented-out code
4. Clean up debug logging
5. Consolidate schema files
6. Fix non-passive event listeners

### Phase 2: Schema Cleanup (3-5 days)
1. Audit Prisma schema vs actual database
2. Add missing fields or remove dead references
3. Standardize field name mapping
4. Update events model to use @map directives
5. Remove all `(prisma as any)` casts
6. Regenerate Prisma client

### Phase 3: Architectural Fixes (1-2 weeks)
1. Decide on volunteer roles architecture
2. Implement event-specific roles migration
3. Migrate to single position system
4. Standardize error handling
5. Add proper logging infrastructure

### Phase 4: Database Migration (1 week)
1. Rename `event_attendants` → `event_volunteers` in database
2. Remove `@@map` directive from Prisma schema
3. Update all references in codebase
4. Test thoroughly on STANDBY
5. Deploy to production

---

## 📝 Migration Checklist

When performing database migrations:

- [ ] Create backup of production database
- [ ] Test migration on local development
- [ ] Test migration on STANDBY environment
- [ ] Document rollback procedure
- [ ] Update Prisma schema
- [ ] Regenerate Prisma client
- [ ] Update all code references
- [ ] Run TypeScript compiler
- [ ] Run all tests
- [ ] Deploy to STANDBY
- [ ] Verify on STANDBY
- [ ] Deploy to production
- [ ] Monitor for errors

---

## 🔍 How to Identify Technical Debt

### TypeScript Errors
```bash
npx tsc --noEmit
```
Look for errors related to:
- Unknown properties
- Type mismatches
- Missing fields

### Prisma Schema Validation
```bash
npx prisma validate
npx prisma format
```

### Database vs Schema Comparison
```bash
npx prisma db pull --print
# Compare with current schema.prisma
```

### Grep for Common Issues
```bash
# Find (prisma as any) casts
grep -r "prisma as any" pages/

# Find attendant references
grep -ri "attendant" pages/ | grep -v node_modules

# Find console.log statements
grep -r "console.log" pages/api/

# Find TODO/FIXME comments
grep -r "TODO\|FIXME" pages/
```

---

## 📚 Related Documentation

- `/docs/PRISMA_FIELD_MAPPING.md` - Field naming conventions
- `/docs/VOLUNTEER_ROLES_ARCHITECTURE.md` - Volunteer roles issue
- `/.windsurf/rules/prisma-field-naming.md` - Quick reference
- `/prisma/schema.prisma` - Current database schema

---

## 🚀 Next Steps

1. **Immediate:** Review this assessment with team
2. **This Week:** Complete Phase 1 quick wins
3. **This Month:** Complete Phase 2 schema cleanup
4. **This Quarter:** Complete Phase 3 architectural fixes
5. **Future:** Plan Phase 4 database migration

---

## 📊 Metrics

**Total Technical Debt Items:** 9  
**High Priority:** 3  
**Medium Priority:** 3  
**Low Priority:** 3  
**Recently Fixed:** 2

**Estimated Total Effort:** 40-60 hours  
**Estimated Risk Level:** Medium-High

---

## Notes

This assessment was created based on:
- Recent bug fixes and 500 errors encountered
- TypeScript compiler errors
- Prisma schema analysis
- Code review of API endpoints
- User-reported issues

The technical debt is manageable but should be addressed systematically to prevent accumulation and maintain code quality.
