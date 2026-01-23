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

---

## Shared Decisions

For architectural decisions that apply across all apps, see:
`.cloudy-work/_cloudy-ops/context/DECISIONS.md`
