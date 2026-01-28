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

### D-TS-005: Standardize Admin Credentials
**Date:** 2026-01-24  
**Context:** Admin password was inconsistent between documentation (admin123) and production standard (AdminPass123!)  
**Decision:** Standardize all admin credentials to admin@theoshift.local / AdminPass123! across all environments and documentation  
**Consequences:**
- Updated database passwords on both blue and green containers
- Updated all seeding scripts and test documentation
- Updated .env.test files on both containers
- Tests now pass with consistent credentials

### D-TS-006: Skip apex Comment Cleanup
**Date:** 2026-01-24  
**Context:** Found 417 "apex" references in codebase during Batch 6 cleanup  
**Decision:** Keep all apex references as they are documentation comments only (e.g., "// APEX GUARDIAN: ..."), not functional code  
**Consequences:**
- No code changes needed for Batch 6
- Historical context preserved in comments
- Zero functional impact from keeping comments
- No imports, function calls, or dependencies to remove

### D-TS-007: Infrastructure Already Migrated
**Date:** 2026-01-24  
**Context:** Discovered during Batch 7 that database and HAProxy had already been migrated from jw_attendant to theoshift naming  
**Decision:** Update code files to align with already-migrated infrastructure rather than performing new infrastructure migration  
**Consequences:**
- Database already renamed: theoshift_scheduler / theoshift_user
- HAProxy backends already renamed: theoshift_blue / theoshift_green
- Updated .env.postgresql, backup scripts, and MCP health checks to match
- Legacy ACLs (is_jw_attendant) preserved until Feb 1, 2026 for domain migration

### D-TS-008: Phase 4C Scope Revision - Focus on Notifications and Confirmations
**Date:** 2026-01-25  
**Context:** Evaluated Phase 4C features against actual needs. Clone event feature already handles event metadata but not positions/assignments.  
**Decision:** Approved 3 of 4 features - Assignment notifications, Assignment templates (complements clone), and enhanced Volunteer confirmation system (with bulk availability requests). Deferred assignment history/analytics to Phase 6.  
**Consequences:**
- Reduced timeline from 3-4 weeks to 2-3 weeks
- Focus on high-value coordination features (notifications and confirmations)
- Bulk availability requests added per user request
- Assignment templates still needed (clone doesn't copy positions)
- History/analytics deferred to Phase 6 (Reporting)
- Detailed plan created: `/docs/PHASE_4C_REVISED_PLAN.md`

### D-TS-009: Navigation Consistency Requirement
**Date:** 2026-01-25  
**Context:** Created Assignment Templates feature but only added to admin dashboard, not sidebar menu  
**Decision:** All new pages MUST have navigation in ALL relevant menus (dashboard cards AND sidebar)  
**Requirements:**
- **Admin pages:** Must appear in both admin dashboard cards AND AdminLayout sidebar
- **User pages:** Must appear in relevant user navigation menus
- **Hidden pages:** Must be explicitly documented as intentionally hidden (e.g., token-based pages, API endpoints)
- **Documentation:** Navigation locations must be noted in commit messages

**Consequences:**
- Improved discoverability of features
- Consistent user experience
- Prevents orphaned pages
- Navigation updates required for all new pages
- Hidden pages must be justified in code comments or documentation

### D-TS-010: Database and Code Naming Convention Standard
**Date:** 2026-01-25  
**Context:** Inconsistent naming between database (snake_case) and code (camelCase) caused confusion and bugs during Phase 4C deployment. Need clear standard for all new features.  
**Decision:** Adopt industry-standard PostgreSQL naming conventions with Prisma @map directives:
- **Database layer:** snake_case for tables/columns (e.g., `assignment_templates`, `notification_settings`)
- **Code layer:** PascalCase for models, camelCase for fields (e.g., `AssignmentTemplate`, `notificationSettings`)
- **Bridge:** Use Prisma `@map` and `@@map` directives to connect the two
- **API layer:** kebab-case for endpoints, camelCase for JSON

**Rationale:**
- PostgreSQL automatically lowercases unquoted identifiers, making snake_case natural
- Avoids double-quote requirements in SQL queries
- Maintains idiomatic TypeScript/JavaScript conventions in code
- Industry standard approach recommended by Prisma and PostgreSQL community

**Consequences:**
- All new tables/columns must use snake_case in database
- All new Prisma models must include @map directives
- Created comprehensive documentation: `/docs/NAMING-CONVENTIONS.md`
- Migration checklist added for new features
- Reduces confusion and prevents schema mismatch bugs

### D-TS-011: Configurable Debug Logging System
**Date:** 2026-01-25  
**Context:** Need better visibility into application behavior without cluttering production logs  
**Decision:** Implement environment-variable controlled debug logging system with configurable contexts and levels  
**Consequences:**
- Created `src/lib/debug.ts` utility with DEBUG_LEVEL and DEBUG_CONTEXTS support
- Documentation in `docs/DEBUG-MODE.md`
- Can enable/disable debug output per context (auth, api, db, etc.)
- Helps troubleshoot issues without modifying code

### D-TS-012: Navigation Consistency Requirement
**Date:** 2026-01-25  
**Context:** Created Assignment Templates feature but only added to admin dashboard, not sidebar menu  
**Decision:** All new pages MUST have navigation in ALL relevant menus (dashboard cards AND sidebar)  
**Requirements:**
- **Admin pages:** Must appear in both admin dashboard cards AND AdminLayout sidebar
- **User pages:** Must appear in relevant user navigation menus
- **Hidden pages:** Must be explicitly documented as intentionally hidden (e.g., token-based pages, API endpoints)
- **Documentation:** Navigation locations must be noted in commit messages

**Consequences:**
- Improved discoverability of features
- Consistent user experience
- Prevents orphaned pages
- Navigation updates required for all new pages
- Hidden pages must be justified in code comments or documentation

### D-TS-013: Database Naming Convention Exceptions
**Date:** 2026-01-25  
**Context:** During Phase 4C deployment, discovered that `count_sessions` and `position_counts` tables use camelCase column names (eventId, sessionName, countSessionId) instead of snake_case like other tables. This caused Prisma query errors when incorrect @map directives were added.  
**Decision:** Accept that not all tables follow snake_case convention. Only add @map directives to tables that actually use snake_case in the database. Verify actual database schema before adding mappings.  
**Consequences:** Must check actual database column names (via `\d table_name`) before assuming naming convention. D-TS-010 naming standard applies to new tables, but legacy tables may vary.

### D-TS-014: PM2 Ecosystem Config is Container-Local Only
**Date:** 2026-01-28  
**Context:** Found `ecosystem.config.js` versioned in git with only `theoshift-green` defined, causing both blue and green containers to run identical configs. Blue container had errored `theoshift-blue` process (96 restarts) plus `theoshift-green` process. This violated container-first development and blue-green isolation principles.  
**Decision:** Remove `ecosystem.config.js` from version control (already in .gitignore). Each container maintains its own container-specific config file:
- Blue container: Defines only `theoshift-blue` process
- Green container: Defines only `theoshift-green` process  

**Rationale:** 
- Container-first development: Configuration is container-local, not versioned
- Blue-green isolation: Each container runs only its own process
- Industry standard: Environment-specific configs are not versioned  

**Implementation:**
- Removed from git: `git rm --cached ecosystem.config.js`
- Created blue config: `/opt/theoshift/ecosystem.config.js` with `theoshift-blue`
- Created green config: `/opt/theoshift/ecosystem.config.js` with `theoshift-green`
- Cleaned up PM2 processes and restarted with correct configs  

**Consequences:** 
- Each container now runs only one process (correct isolation)
- Config changes must be made on containers, not in git
- Deployment scripts should not assume ecosystem.config.js exists in repo

---

## Shared Decisions

For architectural decisions that apply across all apps, see:
`.cloudy-work/_cloudy-ops/context/DECISIONS.md`
