# TheoShift Legacy Code Audit
**Date:** 2026-01-24  
**Purpose:** Comprehensive audit to identify and remove legacy code references

---

## Executive Summary

**Findings:**
- **jw_scheduler references:** 65 matches across 35 files
- **jw_attendant references:** 385 matches across 85 files
- **wmacs references:** 617 matches across 55 files
- **apex references:** 417 matches across 92 files
- **Backup files:** 10 files (.bak, .backup)
- **Empty documentation:** 4 empty .md files
- **Legacy directories:** .agent/, .sdd/, .wmacs/, nextjs-agents/, mcp-server-ops/

**Risk Assessment:** HIGH - Many references in active code, requires careful removal

---

## Phase 1: Discovery Results

### 1.1 Legacy Naming References

#### jw_scheduler (65 matches, 35 files)
**High Risk - Active Code:**
- `prisma/seed-users.ts` - Database seeding (4 matches)
- `scripts/seed-admin-user.js` - Admin user creation (3 matches)
- `pages/admin/email-config/index.tsx` - Email configuration (2 matches)
- `src/lib/auth-stub.ts` - Authentication stub (2 matches)

**Low Risk - Documentation/Config:**
- `.cloudy-work/` submodule files (majority)
- Migration reports
- Test files

#### jw_attendant (385 matches, 85 files)
**Critical - Infrastructure:**
- HAProxy configuration references
- MCP server deployment scripts
- SSH configuration files
- Database connection strings (`.env.postgresql`)

**High Risk - Active Code:**
- Multiple deployment and health check scripts
- MCP server implementations

#### wmacs (617 matches, 55 files)
**High Risk - Integration Code:**
- `.windsurf/customizations/commands.json` - 30 matches
- `.windsurf/customizations/snippets.json` - 29 matches
- `CLEANUP_ANALYSIS.md` - 24 matches
- `.windsurf/settings/wmacs-integration.json` - 9 matches
- `scripts/token_ledger.py` - 8 matches
- `mcp-server-ops/src/index.js` - 7 matches

**Legacy Directories:**
- `.wmacs/` - Empty directory
- `scripts/wmacs-*.py` - Multiple wmacs scripts

#### apex (417 matches, 92 files)
**High Risk - Active Code:**
- `features/attendant-management/components/EventAttendantManagementPageSimple.tsx` - 14 matches
- `pages/events/[id]/positions.tsx` - 13 matches
- `features/attendant-management/hooks/useEventAttendants.ts` - 9 matches
- Multiple event management pages

**Low Risk:**
- `.gitignore` - apex/logs/ reference (2 matches)
- Documentation files

### 1.2 Backup Files (Safe to Remove)

**Test Backups (2026-01-22):**
- `tests/event-management.spec.ts.bak.20260122-225843`
- `tests/position-management.spec.ts.bak.20260122-225843`
- `tests/refactoring-validation.spec.ts.bak.20260122-225843`
- `tests/smoke-test.spec.ts.bak.20260122-225843`
- `tests/test-helpers.ts.bak.20260122-225843`
- `tests/uat-automated.js.bak.20260122-225843`
- `tests/uat-functional.js.bak.20260122-225843`
- `tests/user-management.spec.ts.bak.20260122-225843`

**Component Backups:**
- `components/AdminLayout.tsx.backup`
- `pages/release-notes.tsx.backup`

### 1.3 Empty Documentation Files (Safe to Remove)

- `BACKWARD_COMPATIBLE_MIGRATION.md` (0 bytes)
- `BUMP_RELEASE_SYNC_STRATEGY.md` (0 bytes)
- `LIVE_STANDBY_WORKFLOW.md` (0 bytes)
- `MIGRATION_PLAN_DEPARTMENTS.md` (0 bytes)
- `THEOSHIFT_ROADMAP_UPDATED.md` (0 bytes)
- `test-deployment.sh` (0 bytes)

### 1.4 Legacy Directories

**Empty/Unused:**
- `.agent/` - Empty
- `.sdd/` - Empty
- `.wmacs/` - Empty
- `test-results/` - Empty

**Potentially Legacy:**
- `agents/` - 1 item (needs inspection)
- `nextjs-agents/` - 3 items (needs inspection)
- `mcp-server-ops/` - 10 items (needs inspection)
- `mcp-blue-green/` - 6 items (may be active)
- `backups/` - 1 item (needs inspection)

### 1.5 Old Documentation (Candidates for Archival)

**Phase Documentation (Historical):**
- `PHASE_3B_DEPLOYMENT_SUMMARY.md`
- `PHASE_3B_IMPLEMENTATION_PLAN.md`
- `PHASE_3B_TESTING_GUIDE.md`
- `PHASE_3B_TEST_CHECKLIST.md`
- `PHASE_4C_IMPLEMENTATION_PLAN.md`
- `PHASE_4C_WEEK1_COMPLETE.md`
- `PHASE_4C_WEEK1_TESTING.md`
- `PHASE_6_VERIFICATION_COMPLETE.md`

**Refactoring Documentation (Historical):**
- `REFACTORING-TEST-RESULTS.md`
- `REFACTORING_COMPLETE.md`
- `REFACTORING_LOG.md`
- `REFACTORING_SUMMARY.md`

**Migration Documentation (Historical):**
- `MIGRATION_STATUS_REPORT.md`
- `VOLUNTEER_DEPARTMENTS_PHASE_2_STATUS.md`
- `DEPLOYMENT_v3.0.3_STANDBY.md`
- `RELEASE_NOTES_v3.0.3.md`

**Old Roadmaps:**
- `THEOSHIFT_ROADMAP_OLD.md`

---

## Phase 2: Risk Categorization

### Critical Risk (DO NOT REMOVE WITHOUT TESTING)
1. **HAProxy backend names** - `jw_attendant` in production config
2. **Database connection strings** - `.env.postgresql` references
3. **PM2 process names** - May reference old naming
4. **Active component code** - apex references in React components

### High Risk (Requires Code Changes)
1. **Authentication/seeding** - jw_scheduler in user creation
2. **MCP server code** - jw_attendant references
3. **Event management** - apex references in features/
4. **Windsurf customizations** - wmacs integration

### Medium Risk (Requires Testing)
1. **Scripts** - Various deployment and utility scripts
2. **Configuration files** - Windsurf settings
3. **Documentation** - May contain important context

### Low Risk (Safe Removal)
1. **Backup files** - .bak, .backup files
2. **Empty files** - 0 byte markdown files
3. **Empty directories** - .agent/, .sdd/, .wmacs/
4. **Historical documentation** - Completed phase docs

---

## Phase 3: Removal Roadmap

### Batch 1: Safe Removals (No Testing Required)
**Risk:** LOW  
**Testing:** None required

**Files to Remove:**
```bash
# Backup files
tests/*.bak.20260122-225843
components/AdminLayout.tsx.backup
pages/release-notes.tsx.backup

# Empty files
BACKWARD_COMPATIBLE_MIGRATION.md
BUMP_RELEASE_SYNC_STRATEGY.md
LIVE_STANDBY_WORKFLOW.md
MIGRATION_PLAN_DEPARTMENTS.md
THEOSHIFT_ROADMAP_UPDATED.md
test-deployment.sh

# Empty directories
.agent/
.sdd/
.wmacs/
test-results/
```

**Estimated Impact:** None  
**Rollback:** Git revert if needed

---

### Batch 2: Historical Documentation (Archive First)
**Risk:** LOW  
**Testing:** None required  
**Action:** Move to `docs/archive/` before removal

**Files to Archive:**
```bash
# Phase documentation
PHASE_3B_*.md
PHASE_4C_*.md
PHASE_6_*.md

# Refactoring documentation
REFACTORING*.md

# Migration documentation
MIGRATION_STATUS_REPORT.md
VOLUNTEER_DEPARTMENTS_PHASE_2_STATUS.md
DEPLOYMENT_v3.0.3_STANDBY.md
RELEASE_NOTES_v3.0.3.md

# Old roadmaps
THEOSHIFT_ROADMAP_OLD.md
```

**Estimated Impact:** None  
**Rollback:** Move back from archive

---

### Batch 3: Legacy Directories Inspection
**Risk:** MEDIUM  
**Testing:** Verify not in use  
**Action:** Inspect contents, then remove if unused

**Directories to Inspect:**
1. `agents/` - Check if used by any active code
2. `nextjs-agents/` - Check if used by any active code
3. `mcp-server-ops/` - Verify if superseded by mcp-blue-green/
4. `backups/` - Check if needed, consider archiving

**Process:**
1. List contents of each directory
2. Search for imports/references in active code
3. If no references, remove
4. If references exist, update code first

---

### Batch 4: Windsurf/WMACS Integration Removal
**Risk:** HIGH  
**Testing:** Full Windsurf workflow validation  
**Action:** Remove wmacs integration, update customizations

**Files to Modify/Remove:**
```bash
# Remove
.windsurf/settings/wmacs-integration.json
scripts/wmacs-*.py
scripts/token_ledger.py

# Modify (remove wmacs references)
.windsurf/customizations/commands.json
.windsurf/customizations/snippets.json
```

**Testing Required:**
- Verify Windsurf workflows still function
- Test /bump, /test-release, /release, /sync
- Verify no broken customizations

**Rollback Plan:** Git revert + restart Windsurf

---

### Batch 5: Code References - jw_scheduler
**Risk:** HIGH  
**Testing:** Full authentication and seeding tests  
**Action:** Rename references to theoshift

**Files to Modify:**
```bash
prisma/seed-users.ts
scripts/seed-admin-user.js
pages/admin/email-config/index.tsx
src/lib/auth-stub.ts
```

**Changes:**
- Replace `jw_scheduler` → `theoshift`
- Replace `jw-scheduler` → `theoshift`
- Update any related comments

**Testing Required:**
- Run database seeding
- Test admin user creation
- Test authentication flow
- Verify email configuration

**Rollback Plan:** Git revert + re-seed database if needed

---

### Batch 6: Code References - apex
**Risk:** CRITICAL  
**Testing:** Full E2E testing required  
**Action:** Remove apex references from components

**Files to Modify:**
```bash
features/attendant-management/components/EventAttendantManagementPageSimple.tsx
pages/events/[id]/positions.tsx
features/attendant-management/hooks/useEventAttendants.ts
pages/events/[id]/edit.tsx
pages/events/[id]/index.tsx
```

**Process:**
1. Analyze each apex reference
2. Determine if it's:
   - Dead code (remove)
   - Legacy naming (rename)
   - Active feature (careful refactor)
3. Update one file at a time
4. Test after each change

**Testing Required:**
- Full Playwright E2E test suite
- Manual testing of event management
- Attendant management workflows
- Position management

**Rollback Plan:** Git revert per file

---

### Batch 7: Infrastructure References - jw_attendant
**Risk:** CRITICAL  
**Testing:** Full deployment testing on STANDBY  
**Action:** Update infrastructure references

**Files to Inspect (DO NOT MODIFY YET):**
```bash
.env.postgresql
mcp-blue-green/server.js
.cloudy-work/shared/mcp-servers/homelab-blue-green-mcp/server.js
```

**⚠️ WARNING:** These may be production infrastructure references that cannot be changed without infrastructure updates.

**Process:**
1. Document all jw_attendant references
2. Determine if they're:
   - HAProxy backend names (requires infrastructure change)
   - Database names (requires migration)
   - Container names (requires container rebuild)
3. Create separate infrastructure migration plan
4. DO NOT CHANGE without infrastructure team approval

---

## Phase 4: Execution Plan

### Week 1: Safe Removals
- **Day 1:** Execute Batch 1 (safe removals)
- **Day 2:** Execute Batch 2 (archive documentation)
- **Day 3:** Execute Batch 3 (inspect and remove legacy directories)
- **Testing:** None required

### Week 2: Windsurf/WMACS Cleanup
- **Day 1:** Execute Batch 4 (remove wmacs integration)
- **Day 2-3:** Test all Windsurf workflows
- **Testing:** Full workflow validation

### Week 3: Code References - Low Risk
- **Day 1:** Execute Batch 5 (jw_scheduler references)
- **Day 2-3:** Test authentication and seeding
- **Testing:** Auth flow, database seeding

### Week 4: Code References - High Risk
- **Day 1-3:** Execute Batch 6 (apex references) - ONE FILE AT A TIME
- **Day 4-5:** Full E2E testing
- **Testing:** Complete Playwright suite

### Week 5: Infrastructure Review
- **Day 1-5:** Analyze Batch 7 (jw_attendant infrastructure)
- **Deliverable:** Infrastructure migration plan
- **Testing:** None (planning phase)

---

## Phase 5: Testing Checkpoints

### Checkpoint 1: After Batch 1-3
- [ ] Git status clean
- [ ] No broken imports
- [ ] Application builds successfully
- [ ] Smoke tests pass

### Checkpoint 2: After Batch 4
- [ ] Windsurf workflows functional
- [ ] /bump works
- [ ] /test-release works
- [ ] /release works
- [ ] /sync works

### Checkpoint 3: After Batch 5
- [ ] Database seeding works
- [ ] Admin user creation works
- [ ] Authentication flow works
- [ ] Email configuration accessible

### Checkpoint 4: After Batch 6
- [ ] All Playwright tests pass
- [ ] Event management functional
- [ ] Attendant management functional
- [ ] Position management functional
- [ ] No console errors

### Checkpoint 5: After Each Change
- [ ] Run on STANDBY first
- [ ] Test thoroughly
- [ ] Deploy to LIVE only after validation

---

## Phase 6: Rollback Procedures

### Immediate Rollback (If Critical Issue)
```bash
# Switch traffic back to previous LIVE
/release

# Revert last commit
git revert HEAD
git push origin main

# Sync both environments
/sync
```

### Partial Rollback (If Specific File Issue)
```bash
# Revert specific file
git checkout HEAD~1 -- path/to/file
git commit -m "rollback: revert changes to specific file"
git push origin main

# Deploy to STANDBY and test
/bump
/test-release
```

### Full Rollback (If Multiple Issues)
```bash
# Revert to last known good commit
git revert <commit-hash>
git push origin main

# Deploy to both environments
/bump
/test-release
/release
/sync
```

---

## Success Criteria

### Code Cleanliness
- [ ] No references to jw_scheduler in active code
- [ ] No references to jw_attendant in active code (except infrastructure)
- [ ] No references to wmacs in active code
- [ ] No references to apex in active code
- [ ] No backup files (.bak, .backup)
- [ ] No empty documentation files
- [ ] No empty directories

### Functionality
- [ ] All Playwright tests pass
- [ ] All workflows functional
- [ ] Authentication works
- [ ] Event management works
- [ ] Attendant management works
- [ ] Position management works

### Documentation
- [ ] Historical docs archived
- [ ] Active docs updated
- [ ] No stale references in README
- [ ] DECISIONS.md updated with cleanup decisions

---

## Recommendations

### Immediate Actions (This Week)
1. Execute Batch 1 (safe removals) - 30 minutes
2. Execute Batch 2 (archive docs) - 1 hour
3. Execute Batch 3 (inspect directories) - 2 hours

### Short Term (Next 2 Weeks)
1. Execute Batch 4 (wmacs cleanup) - 1 day
2. Execute Batch 5 (jw_scheduler) - 2 days

### Medium Term (Next Month)
1. Execute Batch 6 (apex references) - 1 week
2. Plan Batch 7 (infrastructure) - 1 week

### Long Term (Future)
1. Infrastructure migration for jw_attendant references
2. Continuous cleanup as part of development workflow

---

## Notes

- **Container-First:** All changes must be tested on STANDBY before LIVE
- **One at a Time:** Execute batches sequentially, not in parallel
- **Test Everything:** Even "safe" removals should be verified
- **Document Changes:** Update DECISIONS.md with significant changes
- **Backup First:** Ensure git commits before each batch

---

**Status:** Ready for execution  
**Next Step:** Review and approve roadmap, then execute Batch 1
