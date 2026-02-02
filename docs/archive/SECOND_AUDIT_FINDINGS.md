# Second Repository Audit - Findings & Recommendations
**Date:** 2026-01-24  
**Purpose:** Identify remaining cleanup opportunities after initial cleanup session

---

## Executive Summary

After completing Batches 1-7 cleanup, this audit identifies additional files and directories that may be obsolete, redundant, or candidates for archival.

**Categories:**
1. Root-level utility scripts (potentially obsolete)
2. Empty or near-empty files
3. Duplicate configuration files
4. Old deployment/migration scripts
5. Unused MCP configurations

---

## Category 1: Root-Level Utility Scripts

### Potentially Obsolete Scripts

#### 1. **CSS/Styling Fix Scripts** (5 files)
**Location:** Root directory  
**Files:**
- `fix-css-hash.sh` (1.1K)
- `fix-css-loading.sh` (1.6K)
- `rebuild-css.sh` (635B)
- `styling-diagnostic.sh` (3.2K)

**Analysis:** These appear to be one-time fixes for CSS issues. If the issues are resolved, these can be archived.

**Recommendation:** 
- **ARCHIVE** to `docs/archive/scripts/css-fixes/` if CSS issues are resolved
- **KEEP** if CSS issues are ongoing

---

#### 2. **Migration/Rollback Scripts** (4 files)
**Location:** Root directory  
**Files:**
- `preview-migration.sh` (2.6K)
- `rollback-event-details.sh` (1.2K)
- `sync-staging-to-production.sh` (3.5K)
- `create-safety-checkpoint.sh` (2.6K)

**Analysis:** These appear to be one-time migration utilities. The sync script references "staging" and "production" which conflicts with blue-green deployment model.

**Recommendation:**
- **ARCHIVE** `preview-migration.sh` and `rollback-event-details.sh` (likely completed migrations)
- **REVIEW** `sync-staging-to-production.sh` - conflicts with blue-green model
- **KEEP** `create-safety-checkpoint.sh` if still used

---

#### 3. **Database/Position Scripts** (2 files)
**Location:** Root directory  
**Files:**
- `cleanup-positions.js` (2.5K)
- `create-position-oversight-table.sql` (1.8K)

**Analysis:** One-time database migration scripts.

**Recommendation:**
- **ARCHIVE** both to `docs/archive/scripts/database-migrations/` if migrations are complete
- **KEEP** if these are maintenance utilities still in use

---

#### 4. **Deployment Scripts** (2 files)
**Location:** Root directory  
**Files:**
- `deploy.sh` (356B)
- `start.sh` (356B)

**Analysis:** Simple deployment scripts. May be superseded by PM2 and blue-green deployment workflows.

**Recommendation:**
- **REVIEW** - Check if these are still used or if PM2/MCP workflows have replaced them
- **ARCHIVE** if no longer used

---

## Category 2: Empty or Near-Empty Files

### Empty Markdown Files

**Files Found:**
- `docs/EVENT_MANAGEMENT_ARCHITECTURE.md` (0 bytes)
- `scripts/README_QOS.md` (0 bytes)

**Recommendation:**
- **DELETE** both files (empty, no content)

---

### Empty Python Migration Script

**File:** `scripts/migrate_to_postgresql.py` (0 bytes)

**Recommendation:**
- **DELETE** (empty file, migration likely complete or abandoned)

---

## Category 3: Configuration Files

### MCP Configuration Files (3 files)

**Location:** Root directory  
**Files:**
- `mcp-config-CORRECTED.json` (1.5K)
- `mcp-config-reference.json` (789B)
- `mcp.config.json.disabled` (769B)

**Analysis:** Multiple MCP config files suggest iterative fixes. The `.disabled` suffix indicates this file is not in use.

**Recommendation:**
- **ARCHIVE** `mcp.config.json.disabled` to `docs/archive/configs/`
- **REVIEW** if `mcp-config-reference.json` is still needed or if it can be archived
- **KEEP** `mcp-config-CORRECTED.json` if it's the active config

---

### Environment Files (6 files)

**Location:** Root directory  
**Files:**
- `.env.example` (460B)
- `.env.test.example` (408B)
- `.env.postgresql` (597B)
- `.env.production` (486B)
- `.env.staging` (742B)
- `.env.test` (102B)

**Analysis:** 
- `.env.staging` and `.env.production` conflict with blue-green deployment model (should be blue/green, not staging/production)
- `.env.postgresql` is a Django config file (TheoShift uses Next.js/Prisma)

**Recommendation:**
- **REVIEW** `.env.staging` and `.env.production` - may be obsolete with blue-green model
- **REVIEW** `.env.postgresql` - appears to be from old Django version, may be obsolete
- **KEEP** `.env.example` and `.env.test.example` (templates)
- **KEEP** `.env.test` (active test config)

---

### Tailwind Configuration Duplication

**Files:**
- `tailwind.config.js` (454B)
- `tailwind.config.ts` (507B)

**Analysis:** Two Tailwind config files (JS and TS versions).

**Recommendation:**
- **REVIEW** which one is actually used by the build process
- **DELETE** the unused one

---

## Category 4: Scripts Directory Deep Dive

### Deployment Scripts (Multiple)

**Files in scripts/:**
- `deploy.sh` (5.3K)
- `deploy-with-health-check.sh` (2.4K)
- `deploy-corrected-mcp.js` (9.4K)
- `mcp-deploy.py` (9.6K)
- `mcp-rollback.py` (8.4K)

**Analysis:** Multiple deployment scripts suggest evolution of deployment strategy. Some may be obsolete with current blue-green MCP workflow.

**Recommendation:**
- **REVIEW** which deployment scripts are actively used
- **ARCHIVE** obsolete deployment scripts to `docs/archive/scripts/deployment/`

---

### Health Check Scripts (Multiple)

**Files in scripts/:**
- `health-check.sh` (4.5K)
- `post-deploy-health-check.sh` (8.0K)
- `post-build-check.sh` (3.0K)
- `corrected-mcp-health.js` (11K) - **RECENTLY UPDATED**

**Analysis:** Multiple health check scripts. The `corrected-mcp-health.js` was just updated in Batch 7, suggesting it's the current version.

**Recommendation:**
- **KEEP** `corrected-mcp-health.js` (actively maintained)
- **REVIEW** if older shell-based health checks are still needed
- **ARCHIVE** obsolete health check scripts

---

### Analysis/Debug Scripts (Multiple)

**Files in scripts/:**
- `analyze-assignments.js` (8.0K)
- `analyze-attendant-migration.js` (7.8K)
- `debug-api-calls.js` (5.2K)
- `debug-bulk-create.js` (3.3K)
- `diagnose-event-issue.js` (4.2K)
- `complete-system-audit.js` (9.1K)

**Analysis:** These appear to be diagnostic/debugging utilities. May be useful for troubleshooting but not part of regular operations.

**Recommendation:**
- **KEEP** all - useful for debugging and troubleshooting
- **ORGANIZE** into `scripts/debug/` subdirectory for better organization

---

### Migration Scripts (Multiple)

**Files in scripts/:**
- `migrate-assignments-to-shifts.js` (4.6K)
- `execute-attendant-consolidation.sh` (5.7K)
- `migrate_to_postgresql.py` (0 bytes - EMPTY)

**Analysis:** One-time migration scripts. If migrations are complete, these can be archived.

**Recommendation:**
- **DELETE** `migrate_to_postgresql.py` (empty file)
- **ARCHIVE** other migration scripts if migrations are complete
- **KEEP** if migrations are ongoing or may need to be re-run

---

### Test/Utility Scripts

**Files in scripts/:**
- `create-test-event.js` (1.3K)
- `create-admin-user.js` (1.6K) - **RECENTLY UPDATED**
- `clear-assignments.js` (1.8K)
- `fix-existing-forms-of-service.js` (2.3K)
- `fix-authentication.js` (3.6K) - **RECENTLY UPDATED**

**Analysis:** Mix of test utilities and one-time fixes.

**Recommendation:**
- **KEEP** recently updated scripts (create-admin-user.js, fix-authentication.js)
- **KEEP** `create-test-event.js` (useful for testing)
- **REVIEW** `clear-assignments.js` and `fix-existing-forms-of-service.js` - may be one-time fixes

---

### MCP Validation Scripts

**Files in scripts/:**
- `mcp-validation.js` (10.7K)
- `mcp-comparison-report.js` (4.5K)

**Analysis:** MCP-related validation and reporting utilities.

**Recommendation:**
- **KEEP** both - useful for MCP system validation

---

## Category 5: Ecosystem Configuration

### PM2 Ecosystem Files

**Files:**
- `ecosystem.config.js` (234B)
- `ecosystem.config.template.js` (948B)

**Analysis:** Two ecosystem files - one active, one template.

**Recommendation:**
- **KEEP** both - template is useful for reference

---

## Category 6: Build Artifacts

### TypeScript Build Info

**File:** `tsconfig.tsbuildinfo` (365KB)

**Analysis:** TypeScript incremental build cache file.

**Recommendation:**
- **ADD TO .gitignore** if not already there (should not be committed)
- This file should be generated locally, not tracked in git

---

## Summary of Recommendations

### Immediate Actions (High Confidence)

**DELETE (3 files):**
1. `docs/EVENT_MANAGEMENT_ARCHITECTURE.md` (0 bytes)
2. `scripts/README_QOS.md` (0 bytes)
3. `scripts/migrate_to_postgresql.py` (0 bytes)

**ADD TO .gitignore:**
1. `tsconfig.tsbuildinfo` (build artifact)

---

### Review Required (Medium Confidence)

**Review for Archival (12 files):**
1. `fix-css-hash.sh`
2. `fix-css-loading.sh`
3. `rebuild-css.sh`
4. `styling-diagnostic.sh`
5. `preview-migration.sh`
6. `rollback-event-details.sh`
7. `cleanup-positions.js`
8. `create-position-oversight-table.sql`
9. `mcp.config.json.disabled`
10. `.env.postgresql` (Django config, may be obsolete)
11. `.env.staging` (conflicts with blue-green model)
12. `.env.production` (conflicts with blue-green model)

**Review for Deletion (1 file):**
1. Either `tailwind.config.js` OR `tailwind.config.ts` (whichever is unused)

**Review Deployment Scripts:**
- Determine which deployment scripts are actively used
- Archive obsolete ones

---

### Organization Improvements (Low Priority)

**Suggested Directory Structure:**
```
scripts/
├── debug/          # Move all analyze-*, debug-*, diagnose-* scripts here
├── deployment/     # Move all deploy-* scripts here
├── health/         # Move all health-check scripts here
├── migration/      # Move all migrate-* scripts here
├── mcp/            # Move all mcp-* scripts here
└── utils/          # Move remaining utility scripts here
```

---

## Estimated Impact

**Files to Delete:** 3 (0 bytes total)  
**Files to Archive:** 12-15 (estimated 20-30KB)  
**Files to Review:** 10-15 (deployment and health check scripts)  
**Organization:** 37 scripts could be organized into subdirectories

**Total Cleanup Potential:** 15-20 files removed/archived, better organization of 30+ scripts

---

## Next Steps

1. **User Decision Required:**
   - Are CSS fix scripts still needed?
   - Are migration scripts complete?
   - Which deployment scripts are actively used?
   - Is `.env.postgresql` still needed?

2. **Execute Immediate Actions:**
   - Delete 3 empty files
   - Add `tsconfig.tsbuildinfo` to `.gitignore`

3. **Execute Archival (after user confirmation):**
   - Archive obsolete scripts to `docs/archive/scripts/`
   - Archive obsolete configs to `docs/archive/configs/`

4. **Organize Scripts (optional):**
   - Create subdirectories in `scripts/`
   - Move scripts to appropriate subdirectories

---

**Status:** Awaiting user input on which files are still actively used vs. obsolete
