# TheoShift Decisions

**Repository:** TheoShift  
**Purpose:** Track architectural and operational decisions specific to TheoShift

---

## Decision Log

### D-TS-001: Adopt Cloudy-Work Context Management
**Date:** 2026-01-23  
**Context:** Need persistent context for AI-assisted development  
**Decision:** Deploy Phase 8.0 context management templates from Cloudy-Work control plane  
**Consequences:**
- Cloudy-Work added as git submodule (.cloudy-work/)
- Repo-local context files (TASK-STATE.md, DECISIONS.md, .windsurf/BOOT.md)
- Shared context available via submodule
- Context hygiene standards apply

### D-TS-002: Use Submodule Strategy
**Date:** 2026-01-23  
**Context:** Need to consume Cloudy-Work shared context  
**Decision:** Use git submodule approach rather than direct file copying  
**Consequences:**
- Easier to update shared context (git submodule update)
- Version pinning available
- Clear separation between shared and local context
- Requires submodule management in workflow

### D-TS-003: Comprehensive Repository Cleanup
**Date:** 2026-01-24  
**Context:** Repository had 30+ stale branches, legacy tool directories, and outdated documentation cluttering the codebase  
**Decision:** Execute systematic cleanup in batches: branches first, then files/directories, then code references  
**Consequences:**
- Deleted 27 remote branches (keeping only main + 2 safety branches)
- Removed 47 files/directories (backups, empty files, legacy tools)
- Archived 20 historical documents to docs/archive/
- Established branch hygiene policy (delete after merge, 30-day safety branch retention)
- Created BRANCH_AUDIT.md and LEGACY_CODE_AUDIT.md for tracking

### D-TS-004: Archive Over Delete for Historical Documentation
**Date:** 2026-01-24  
**Context:** Need to clean up root directory but preserve historical context  
**Decision:** Archive completed phase/refactoring docs to docs/archive/ instead of deletion  
**Consequences:**
- Historical context preserved for reference
- Root directory decluttered
- Clear separation between active and historical documentation
- Archive includes README for context

---

## Shared Decisions

For architectural decisions that apply across all apps, see:
`.cloudy-work/_cloudy-ops/context/DECISIONS.md`
