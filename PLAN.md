# TheoShift Plan

**Last updated:** 2026-04-19  
**Current phase:** Feature Development + Platform Infrastructure  
**Status:** Production stable after 2-day monitoring period. Ready for next development cycle.

---

## Current Phase

### Active Work
- Monitoring production after 4 bug fixes (2026-04-16) — **COMPLETE**
- All fixes confirmed stable in production
- Ready to pick next priority feature from backlog

### Completed This Phase
- ✅ Early Check-In tab visibility fix (v4.15.8)
- ✅ Early Check-In mobile page access fix
- ✅ Availability request scoping bug fix (173 volunteers → correct subset)
- ✅ Select All checkbox filtering bug fix
- ✅ Promoted frontend filtering patterns to control plane (D-035)
- ✅ 2-day production monitoring — no issues reported

---

## Prioritized Backlog

### High Priority
- **Matrix/Dendrite Chat Platform** — Shared infrastructure for TheoShift, LDC Tools, QuantShift
  - Status: Planned, awaiting LXC IP assignment
  - Effort: XL (2-3 weeks across all phases)
  - Phases: Infrastructure → TheoShift integration → LDC Tools → QuantShift → Push notifications
  
- **Mobile/PWA Optimization** — Continue mobile-first improvements
  - Admin pages mobile optimization (overflow fixes, responsive tables)
  - Offline capability for critical features
  
- **User Feedback Items** — Review production feedback system for new items
  - Check `/admin/feedback` for NEW status items
  - Promote actionable items to this backlog

### Medium Priority
- **Edit Assignment Time Feature** — Allow editing shift times after assignment
  - Deferred from previous sprint
  - User requested feature
  
- **Enhanced Reporting** — Additional export formats and report types
  - Volunteer attendance reports
  - Position coverage analytics
  
- **Email Template Improvements** — More customization options
  - Custom branding per event
  - Template library

### Low Priority
- **UI Terminology Cleanup** — Replace remaining "attendant" references
  - ~50+ places in help pages, labels, buttons
  - Database tables/columns already use "attendant" (backward compatible via @map)
  - Documented as TD-001 in TECH-DEBT.md
  
- **Advanced Search Filters** — More granular filtering options
  - Multi-select filters
  - Saved filter presets

---

## Known Issues

### Current
- **Volunteer Login Redirect Loop** — Volunteers redirected to main login page after successful authentication
  - Possible causes: Stale session tokens, NextAuth callback URL issues, session persistence
  - Impact: Frustrating user experience, volunteers cannot access dashboard
  - Status: Investigating on STANDBY
  
- **Volunteer Dashboard Empty Data** — Dashboard shows no data until page refresh
  - Symptoms: Blank dashboard after login, data appears after manual refresh
  - Possible causes: Race condition in data loading, session not ready, API timing issue
  - Impact: Poor UX, requires manual refresh to see assignments
  - Status: Investigating on STANDBY

### Technical Debt
- **UI Terminology (TD-001):** ~50+ "attendant" references in UI (help pages, labels, buttons)
  - Database already migrated to "volunteer" terminology
  - UI cleanup is cosmetic, not functional
  - Low priority

### Pre-existing Non-blocking
- Lint warning in `positions.tsx` line 677: `Argument of type 'string' is not assignable to parameter of type 'never'`
  - Does not affect functionality
  - Can be addressed during next positions page refactor

---

## Roadmap

### Phase: Security & Stability (COMPLETE - Feb 2026)
**Objective:** Harden platform security and eliminate technical debt

**Completed:**
- ✅ v4.15.5 — Next.js 14→15.5.12 upgrade, 0 actionable npm audit vulns
- ✅ v4.15.4 — xlsx→exceljs migration (CVE remediation)
- ✅ v4.15.3 — Security dependency patches + OS patches
- ✅ v4.15.2 — Volunteer role fixes, bulk operations
- ✅ All 9 technical debt items resolved
- ✅ Test suite cleanup (131 passed, 25 skipped, 0 failed)

### Phase: Bug Fixes & Monitoring (COMPLETE - Apr 2026)
**Objective:** Fix critical production bugs and validate stability

**Completed:**
- ✅ Early Check-In tab visibility (IVS module check)
- ✅ Early Check-In mobile page access
- ✅ Availability request scoping (event-specific filtering)
- ✅ Select All checkbox (filtered vs unfiltered)
- ✅ 2-day production monitoring — no issues
- ✅ Frontend filtering patterns promoted to control plane

### Phase: Feature Development (CURRENT)
**Objective:** Deliver high-value features from backlog

**Next Steps:**
1. Review production feedback for new items
2. Pick next priority feature (Matrix/Dendrite or Edit Assignment Time)
3. Implement on STANDBY
4. Test with `/test-release`
5. Version bump with `/bump`
6. Release with `/release`
7. Sync with `/sync`

### Phase: Platform Infrastructure (PLANNED)
**Objective:** Shared services for all apps

**Deliverables:**
- Matrix/Dendrite chat platform
- Shared authentication improvements
- Cross-app analytics
- Unified notification system

---

## Recent Completions

### v4.15.8 (Apr 2026) — Bug Fixes
- Early Check-In tab visibility fix
- Early Check-In mobile page access fix
- Availability request scoping fix
- Select All checkbox filtering fix
- All fixes stable in production

### v4.15.5 (Feb 2026) — Security Sprint
- Next.js 14→15.5.12 upgrade
- xlsx→exceljs migration
- Security dependency patches
- OS patches on both nodes
- 0 actionable npm audit vulnerabilities

### v4.15.0 (Feb 2026) — Features
- Global Announcements Banner
- PWA Service Worker v2.0.0
- Offline caching improvements
- Test suite cleanup

### v4.13.0 (Feb 2026) — Conflict Management
- FB-017: Conflict detection on positions page
- Email improvements
- D-024 feedback compliance

### Earlier Releases
- v4.2.0: Location Library with Google Maps
- v4.1.1: Volunteer login redirect bug fix
- v4.0.2: Test infrastructure & stability
- v3.11.0: UI Modernization

---

## Version History

**Current:** v4.15.8 (bug fixes, stable)  
**Previous:** v4.15.5 (security sprint)  
**Baseline:** v4.0.0 (production-ready platform)

---

## Notes

- **Test Suite:** 131 passed, 25 skipped (intentional), 0 failed
- **Deployment:** Blue-green via MCP tools
- **Environments:** 
  - LIVE: GREEN (10.92.3.22)
  - STANDBY: BLUE (10.92.3.24)
- **Database:** PostgreSQL on CT131 (10.92.3.21)
- **Monitoring:** Prometheus + Grafana
- **Backups:** Automated daily backups

---

**For detailed task state and exact next steps, see TASK-STATE.md**
