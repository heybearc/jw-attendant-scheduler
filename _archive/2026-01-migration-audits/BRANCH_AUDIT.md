# TheoShift Branch Audit
**Date:** 2026-01-24  
**Purpose:** Audit remote branches and determine which should be deleted

---

## Executive Summary

**Current State:**
- **Active Branch:** main (d2ed5520, 2026-01-24)
- **Remote Branches:** 31 total (30 non-main branches)
- **Stale Branches:** 29 branches (last commit 2025-10-31 or earlier)
- **Recent Branches:** 2 branches (2026-01-07 or later)

**Recommendation:** Delete 27 branches, keep 2 recent safety branches, merge 1 phase2 branch

---

## Branch Analysis

### Category 1: APEX Guardian Branches (STALE - DELETE)
**Last Activity:** October 2025  
**Status:** All superseded by main branch  
**Action:** DELETE

| Branch | Last Commit | Behind Main | Ahead Main | Status |
|--------|-------------|-------------|------------|--------|
| apex-guardian-system-unification | 2025-10-10 | 452 | 230 | STALE |
| apex-revert-to-working-state | 2025-10-07 | 319 | 230 | STALE |
| bugfix/attendant-event-isolation | 2025-10-07 | 322 | 230 | STALE |
| feature/apex-ssr-architecture-upgrade | 2025-10-07 | 329 | 230 | STALE |
| feature/event-management-statistics | 2025-10-07 | 320 | 230 | STALE |
| hotfix/add-cache-busting-headers | 2025-10-07 | 326 | 230 | STALE |
| hotfix/fix-event-details-admin-links | 2025-10-07 | 328 | 230 | STALE |
| hotfix/remove-broken-attendants-import | 2025-10-07 | 324 | 230 | STALE |
| staging | 2025-10-07 | 322 | 230 | STALE |

**Rationale:** All APEX Guardian work from October 2025. Main branch is 230+ commits ahead. These branches are obsolete.

---

### Category 2: Feature Branches (STALE - DELETE)
**Last Activity:** September-October 2025  
**Status:** Merged or abandoned  
**Action:** DELETE

| Branch | Last Commit | Behind Main | Ahead Main | Status |
|--------|-------------|-------------|------------|--------|
| feature/attendant-pin-management-mvp | 2025-10-13 | 493 | 230 | STALE |
| feature/document-publishing-system | 2025-10-13 | 490 | 230 | STALE |
| feature/implement-assignments-documents-api | 2025-10-14 | 534 | 230 | STALE |
| feature/position-shift-management | 2025-10-09 | 408 | 230 | STALE |
| feature/event-details-functionality-audit | 2025-10-08 | 362 | 230 | STALE |
| feature/positions-management | 2025-10-06 | 257 | 230 | STALE |
| feature/event-count-times | 2025-10-04 | 126 | 230 | STALE |
| feature/event-functionality-fixes | 2025-10-01 | 79 | 230 | STALE |
| feature/event-submodule-dev | 2025-09-30 | 57 | 230 | STALE |
| feature/fix-event-creation-serialization | 2025-09-28 | 0 | 232 | MERGED |
| feature/schema-compatibility-fixes | 2025-09-27 | 0 | 279 | MERGED |
| feature/api-foundation | 2025-09-22 | 0 | 387 | MERGED |

**Rationale:** All feature work from 3+ months ago. Either merged into main or abandoned.

---

### Category 3: Backup Branches (STALE - DELETE)
**Last Activity:** September-October 2025  
**Status:** Historical backups, no longer needed  
**Action:** DELETE

| Branch | Last Commit | Behind Main | Ahead Main | Status |
|--------|-------------|-------------|------------|--------|
| backup-before-cleanup | 2025-09-20 | 0 | 400 | BACKUP |
| backup/pre-clean-slate-local-20251025 | 2025-10-25 | 1 | 224 | BACKUP |
| feature/announcements-backup | 2025-10-25 | 0 | 223 | BACKUP |
| feature/announcements-merge | 2025-10-25 | 0 | 207 | BACKUP |
| feature/admin-module-events-management | 2025-10-22 | 0 | 229 | BACKUP |

**Rationale:** These are backup branches from 3+ months ago. Main branch has progressed significantly. If these backups were needed, they would have been used by now.

---

### Category 4: Safety/Snapshot Branches (RECENT - KEEP)
**Last Activity:** January 2026  
**Status:** Recent safety snapshots  
**Action:** KEEP (for now)

| Branch | Last Commit | Behind Main | Ahead Main | Status |
|--------|-------------|-------------|------------|--------|
| safety/theoshift-green-132-20260118 | 2026-01-07 | 0 | 14 | RECENT |
| snapshot/theoshift-green-132-20260118 | 2026-01-07 | 0 | 14 | RECENT |

**Rationale:** Created January 7, 2026 (17 days ago). These are safety snapshots of the green container. Keep for 30 days, then delete.

**Deletion Date:** 2026-02-07 (after 30 days)

---

### Category 5: Phase 2 Rebranding (RECENT - REVIEW)
**Last Activity:** October 2025  
**Status:** May contain important rebranding work  
**Action:** REVIEW BEFORE DELETION

| Branch | Last Commit | Behind Main | Ahead Main | Status |
|--------|-------------|-------------|------------|--------|
| feature/phase2-rebranding | 2025-10-31 | 0 | 115 | REVIEW |

**Rationale:** This branch is 115 commits ahead of main with 0 behind. It may contain work that should be merged.

**Action Required:**
1. Check if rebranding work is complete
2. If complete and merged, delete
3. If incomplete, determine if still needed
4. If needed, merge or cherry-pick relevant commits

---

## Deletion Plan

### Batch 1: APEX Guardian Branches (9 branches)
**Risk:** LOW - All superseded by main  
**Action:** Delete immediately

```bash
git push origin --delete apex-guardian-system-unification
git push origin --delete apex-revert-to-working-state
git push origin --delete bugfix/attendant-event-isolation
git push origin --delete feature/apex-ssr-architecture-upgrade
git push origin --delete feature/event-management-statistics
git push origin --delete hotfix/add-cache-busting-headers
git push origin --delete hotfix/fix-event-details-admin-links
git push origin --delete hotfix/remove-broken-attendants-import
git push origin --delete staging
```

---

### Batch 2: Feature Branches (12 branches)
**Risk:** LOW - All merged or abandoned  
**Action:** Delete immediately

```bash
git push origin --delete feature/attendant-pin-management-mvp
git push origin --delete feature/document-publishing-system
git push origin --delete feature/implement-assignments-documents-api
git push origin --delete feature/position-shift-management
git push origin --delete feature/event-details-functionality-audit
git push origin --delete feature/positions-management
git push origin --delete feature/event-count-times
git push origin --delete feature/event-functionality-fixes
git push origin --delete feature/event-submodule-dev
git push origin --delete feature/fix-event-creation-serialization
git push origin --delete feature/schema-compatibility-fixes
git push origin --delete feature/api-foundation
```

---

### Batch 3: Backup Branches (5 branches)
**Risk:** LOW - Historical backups  
**Action:** Delete immediately

```bash
git push origin --delete backup-before-cleanup
git push origin --delete backup/pre-clean-slate-local-20251025
git push origin --delete feature/announcements-backup
git push origin --delete feature/announcements-merge
git push origin --delete feature/admin-module-events-management
```

---

### Batch 4: Phase 2 Rebranding (1 branch)
**Risk:** MEDIUM - May contain needed work  
**Action:** Review first, then decide

```bash
# First, review the branch
git checkout feature/phase2-rebranding
git log --oneline -20

# Check what's different from main
git diff main...feature/phase2-rebranding --stat

# If safe to delete:
git checkout main
git push origin --delete feature/phase2-rebranding
```

---

### Batch 5: Safety Branches (2 branches)
**Risk:** LOW - Recent safety snapshots  
**Action:** Keep for 30 days, delete after 2026-02-07

```bash
# Delete after 2026-02-07
git push origin --delete safety/theoshift-green-132-20260118
git push origin --delete snapshot/theoshift-green-132-20260118
```

---

## Execution Timeline

### Week 1: Immediate Deletions
- **Day 1:** Execute Batch 1 (APEX Guardian branches)
- **Day 2:** Execute Batch 2 (Feature branches)
- **Day 3:** Execute Batch 3 (Backup branches)

### Week 1: Review Phase
- **Day 4:** Review feature/phase2-rebranding
- **Day 5:** Delete or merge feature/phase2-rebranding

### Future: Safety Branch Cleanup
- **2026-02-07:** Delete safety/snapshot branches (after 30 days)

---

## Branch Deletion Script

Create a script to delete all stale branches at once:

```bash
#!/bin/bash
# delete-stale-branches.sh

echo "🗑️  Deleting stale TheoShift branches..."

# Batch 1: APEX Guardian (9 branches)
echo "Batch 1: APEX Guardian branches..."
git push origin --delete apex-guardian-system-unification
git push origin --delete apex-revert-to-working-state
git push origin --delete bugfix/attendant-event-isolation
git push origin --delete feature/apex-ssr-architecture-upgrade
git push origin --delete feature/event-management-statistics
git push origin --delete hotfix/add-cache-busting-headers
git push origin --delete hotfix/fix-event-details-admin-links
git push origin --delete hotfix/remove-broken-attendants-import
git push origin --delete staging

# Batch 2: Feature branches (12 branches)
echo "Batch 2: Feature branches..."
git push origin --delete feature/attendant-pin-management-mvp
git push origin --delete feature/document-publishing-system
git push origin --delete feature/implement-assignments-documents-api
git push origin --delete feature/position-shift-management
git push origin --delete feature/event-details-functionality-audit
git push origin --delete feature/positions-management
git push origin --delete feature/event-count-times
git push origin --delete feature/event-functionality-fixes
git push origin --delete feature/event-submodule-dev
git push origin --delete feature/fix-event-creation-serialization
git push origin --delete feature/schema-compatibility-fixes
git push origin --delete feature/api-foundation

# Batch 3: Backup branches (5 branches)
echo "Batch 3: Backup branches..."
git push origin --delete backup-before-cleanup
git push origin --delete backup/pre-clean-slate-local-20251025
git push origin --delete feature/announcements-backup
git push origin --delete feature/announcements-merge
git push origin --delete feature/admin-module-events-management

echo "✅ Deleted 26 stale branches"
echo "⚠️  Manual review required: feature/phase2-rebranding"
echo "📌 Keeping for now: safety/snapshot branches (delete after 2026-02-07)"
```

---

## Verification After Deletion

```bash
# Check remaining branches
git branch -r

# Expected output:
# origin/HEAD -> origin/main
# origin/feature/phase2-rebranding (if not deleted)
# origin/main
# origin/safety/theoshift-green-132-20260118
# origin/snapshot/theoshift-green-132-20260118
```

---

## Integration with Legacy Code Audit

This branch cleanup should be executed **BEFORE** the legacy code cleanup in `LEGACY_CODE_AUDIT.md`.

**Updated Execution Order:**

1. **Phase 0:** Branch cleanup (this document)
   - Delete 26 stale branches
   - Review phase2-rebranding branch
   - Clean up remote repository

2. **Phase 1-6:** Legacy code cleanup (LEGACY_CODE_AUDIT.md)
   - Execute Batches 1-7
   - Remove legacy references
   - Clean up local repository

**Rationale:** Cleaning branches first ensures we're not maintaining references to code that no longer exists in any active branch.

---

## Success Criteria

### Branch Cleanliness
- [ ] Only 4-5 remote branches remain (main + safety branches + possibly phase2)
- [ ] No branches older than 30 days (except safety branches)
- [ ] All APEX Guardian branches deleted
- [ ] All feature branches from 2025 deleted
- [ ] All backup branches deleted

### Documentation
- [ ] Branch deletion logged
- [ ] DECISIONS.md updated with branch cleanup decision
- [ ] Team notified of branch deletions (if applicable)

---

## Rollback Procedure

If a deleted branch is needed:

```bash
# Find the commit hash from git reflog or GitHub
git reflog show origin/<branch-name>

# Recreate the branch
git checkout -b <branch-name> <commit-hash>
git push origin <branch-name>
```

**Note:** GitHub keeps deleted branches for 30 days in the web UI under "Branches" → "Deleted branches"

---

## Recommendations

### Immediate Actions
1. Review feature/phase2-rebranding branch
2. Execute deletion script for 26 stale branches
3. Update DECISIONS.md with branch cleanup decision

### Branch Hygiene Going Forward
1. Delete feature branches immediately after merge
2. Use safety branches only for critical snapshots
3. Delete safety branches after 30 days
4. Never create backup branches (use tags instead)
5. Keep only: main, active feature branches, recent safety branches

---

**Status:** Ready for execution  
**Next Step:** Review phase2-rebranding, then execute deletion script
