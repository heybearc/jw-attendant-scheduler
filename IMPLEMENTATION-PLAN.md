# Implementation Plan - TheoShift

**Last Updated:** 2026-02-11  
**Current Version:** v4.5.0  
**Current Phase:** Technical Debt Cleanup & Feature Planning

---

## 🎯 Recent Completions (Feb 9, 2026)

### ✅ v4.2.0 Released - FB-025 Location Library
**Completed:** Centralized location management with Google Maps integration.

**Version:** v4.2.0  
**Released:** 2026-02-09  
**Status:** Live on theoshift.com (BLUE)

**Changes:**
- Implemented FB-025: Location Library with Google Maps integration
- Created LocationSelector component with autocomplete
- Built admin locations page with CRUD operations (/admin/locations)
- Added map preview and directions integration
- Implemented usage tracking for popular locations
- Fixed Prisma relation handling for locationId
- Fixed volunteer overseer field casing issues
- Configured SSH keys on qa-01 for passwordless access
- E2E tests: 52/53 passed (98% pass rate)
- Repository security implementation for external contributors
- Created SECURITY.md and sanitized DEPLOYMENT_GUIDE.md
- Removed sensitive infrastructure files from git tracking

### ✅ v4.1.1 Released - FB-028 Localhost Redirect Bug Fix
**Completed:** Fixed critical volunteer login redirect bug and improved testing infrastructure.

**Version:** v4.1.1  
**Released:** 2026-02-08  
**Status:** Live on theoshift.com (GREEN)

**Changes:**
- Fixed FB-028: Volunteer login localhost:3001 redirect bug
- Fixed hardcoded localhost fallbacks in 5 API files
- Fixed NextAuth redirect logic for volunteer logins
- Migrated E2E tests to qa-01 centralized testing infrastructure
- Implemented dynamic STANDBY detection for blue-green testing
- Created helper scripts for automated STANDBY testing
- Updated workflows and documentation
- Promoted qa-01 dynamic STANDBY testing pattern to control plane

### ✅ v4.0.2 Released - Test Infrastructure & Stability
**Completed:** Test infrastructure improvements and 100% test pass rate achieved.

**Version:** v4.0.2  
**Released:** 2026-02-06  
**Status:** Superseded by v4.1.1

**Changes:**
- Container-local test runner infrastructure (`test:e2e:container`)
- 100% test pass rate (52/52 passing)
- TypeScript error fixes in positions page
- Test suite cleanup (removed 21 obsolete tests)
- Improved test reliability and timing

### ✅ v3.11.0 Released - UI Modernization + Bug Fixes
**Completed:** Volunteers and Positions pages modernized with clean, professional interfaces. Drag-and-drop assignment bug fixed.

**Version:** v3.11.0  
**Released:** 2026-02-05  
**Status:** Superseded by v4.0.2

**Volunteers Page:**
- Replaced large header with compact design and inline stats pills (All/Active/Inactive)
- Added contextual bulk actions toolbar (appears when volunteers selected)
- Replaced large filter section with compact horizontal filter bar
- Cleaner, more data-dense professional interface
- Improved mobile responsiveness

**Positions Page:**
- Reduced 8+ overwhelming buttons to 4 clean primary actions
- Grouped secondary actions (Export, Templates, Notifications, Clear) into "More" dropdown
- Replaced emoji-heavy buttons with clean SVG icons
- Added professional segmented view toggle (List/Grid)
- Moved "Show Inactive" into Filters dropdown as checkbox
- Contextual bulk operations toolbar when positions selected

**Result:** Both pages now follow industry standards similar to Airtable, Linear, and Notion. Deployed to STANDBY for review.

---

## 🎯 Active Work (This Week)

**Current Focus:** Technical Debt Cleanup & Architecture Decisions

### Recently Completed (2026-02-11)
- [x] **Event Settings & Cloning Fixes** - Fixed volunteer overseer persistence, display, and cloning issues
- [x] **Field Naming Documentation** - Created comprehensive Prisma field mapping guides
- [x] **Volunteer Roles Architecture Analysis** - Documented global vs event-specific roles issue
- [x] **Technical Debt Assessment** - Catalogued 9 items with prioritization and effort estimates
- [x] **UI Terminology Updates** - Changed "Attendant" to "Volunteer" throughout UI
- [x] **Volunteer Creation Fix** - Fixed 500 error when adding volunteers (departmentId issue)

### In Progress
- [ ] **Technical Debt Cleanup** - Systematic cleanup of accumulated debt (see below)
- [ ] **Architecture Decision:** Volunteer roles (global vs event-specific) - Needs stakeholder input
- [ ] **Feature Planning:** IVS Early Check-In access model - Needs pushback/discussion
- [ ] **Feature Planning:** In-app event-specific chat system - Needs pushback/discussion

---

## 🔧 Technical Debt Cleanup (NEW - Priority Work)

**Documentation:** `/docs/TECHNICAL_DEBT_ASSESSMENT.md`

### 🔴 High Priority Technical Debt (3 items)

1. **Inconsistent Table/Field Naming (attendants → volunteers)**
   - **Issue:** Database table `event_volunteers` mapped to old name `event_attendants`
   - **Impact:** TypeScript errors, developer confusion, inconsistent codebase
   - **Effort:** Medium (2-3 hours)
   - **Risk:** Medium (requires database migration)
   - **Files:** `/prisma/schema.prisma`, various API endpoints
   - **Status:** Documented, awaiting implementation

2. **Volunteer Roles: Global vs Event-Specific**
   - **Issue:** Roles (overseer, keyman, elder) stored globally but should be event-specific
   - **Impact:** Unchecking keyman in Event A removes it from Event B
   - **Documentation:** `/docs/VOLUNTEER_ROLES_ARCHITECTURE.md`
   - **Effort:** Large (8-12 hours including migration)
   - **Risk:** High (data migration required)
   - **Decision Needed:** Which architecture approach to take (3 options documented)
   - **Status:** Awaiting stakeholder decision

3. **Missing Prisma Schema Fields**
   - **Issue:** Code references fields not in current schema (`ivsImportBatchId`, `ivsApprovalStatus`, `ivs_import_batches`)
   - **Impact:** TypeScript errors, runtime errors, developers using `(prisma as any)` to bypass
   - **Effort:** Medium (3-4 hours)
   - **Risk:** Low (mostly cleanup)
   - **Files:** `/pages/api/events/[id]/ivs/import.ts`, `/pages/api/events/[id]/volunteers/index.ts`
   - **Status:** Documented, ready for implementation

### 🟡 Medium Priority Technical Debt (3 items)

4. **Dual Position Systems (event_positions + positions)**
   - **Issue:** Two position systems coexist, code handles both everywhere
   - **Effort:** Large (10-15 hours)
   - **Risk:** High (requires careful migration)
   - **Status:** Documented, deferred until high priority items complete

5. **Inconsistent Field Name Mapping**
   - **Issue:** Mix of camelCase, snake_case, lowercase across models
   - **Documentation:** `/docs/PRISMA_FIELD_MAPPING.md`, `/.windsurf/rules/prisma-field-naming.md`
   - **Effort:** Medium (4-6 hours)
   - **Risk:** Medium (requires schema changes)
   - **Status:** Documented with quick reference guide

6. **Old Migration Files and Baseline Schemas**
   - **Issue:** Multiple schema files, unclear which is authoritative
   - **Effort:** Small (1-2 hours)
   - **Risk:** Low (organizational)
   - **Status:** Documented, low priority

### 🟢 Low Priority Technical Debt (3 items)

7. **Console Violations (Non-Passive Event Listeners)**
8. **Commented-Out Code and Debug Logging**
9. **Inconsistent Error Handling**

**Total Estimated Effort:** 40-60 hours across all items

### Cleanup Phases

**Phase 1: Quick Wins (1-2 days)** - PARTIALLY COMPLETE
- [x] Fix `departmentId` empty string issue
- [x] Update UI terminology (Attendant → Volunteer)
- [ ] Remove commented-out code
- [ ] Clean up debug logging
- [ ] Consolidate schema files
- [ ] Fix non-passive event listeners

**Phase 2: Schema Cleanup (3-5 days)**
- [ ] Audit Prisma schema vs actual database
- [ ] Add missing fields or remove dead references
- [ ] Standardize field name mapping
- [ ] Update events model to use @map directives
- [ ] Remove all `(prisma as any)` casts
- [ ] Regenerate Prisma client

**Phase 3: Architectural Fixes (1-2 weeks)**
- [ ] Decide on volunteer roles architecture
- [ ] Implement event-specific roles migration
- [ ] Migrate to single position system
- [ ] Standardize error handling
- [ ] Add proper logging infrastructure

**Phase 4: Database Migration (1 week)**
- [ ] Rename `event_attendants` → `event_volunteers` in database
- [ ] Remove `@@map` directive from Prisma schema
- [ ] Update all references in codebase
- [ ] Test thoroughly on STANDBY
- [ ] Deploy to production

---

## 📋 Backlog (Prioritized)

### High Priority
- [ ] **IVS Volunteer Approval & Early Check-In Module** (effort: XL, NEW 2026-02-06) - Configurable volunteer module extensions for IVS department approval workflow and early check-in management. Event-specific (approvals per event/year). **Prerequisites:** Define department spreadsheet import/export format before implementation.
  - **Phase 1: Database Schema** (effort: M)
    - Extend `event_volunteers` table with optional approval workflow fields (approvalStatus, submittedByDepartment, approvalRequestedAt, approvalNotes, approvedAt, approvedBy, deniedReason, importBatchId)
    - Add early check-in fields (earlyCheckinEligible, checkedInAt, checkedInBy, checkinNotes)
    - Extend `moduleConfig` in department_templates/events to enable/disable volunteer extensions
  - **Phase 2: Volunteers Page Extensions** (effort: L)
    - Conditional column display based on moduleConfig (approval status, department, check-in fields)
    - Conditional filters (approval status, department filter, check-in eligible)
    - Conditional bulk actions (Request Approval, Mark Approved/Denied, Export to Department Format)
    - Import department spreadsheets with batch tracking
    - Export back to department format with approval results
  - **Phase 3: Early Check-In Tab** (effort: M)
    - New event tab (conditionally shown when earlyCheckin module enabled)
    - Check-in interface for volunteers with earlyCheckinEligible flag
    - Real-time check-in status tracking
    - Export to Excel/PDF
    - Email check-in reports
  - **Phase 4: Admin Configuration** (effort: S)
    - Department template configuration UI for enabling/disabling modules
    - Custom status list configuration
    - Department list management for filtering
  - **Use Case:** IVS department manages volunteer approval workflow across multiple departments (import spreadsheets, track approval status, coordinate with service committees, export results). Separate from IVS department's own 20-volunteer scheduling needs (uses standard event workflow).
- [x] **Admin portal redesign with tabs layout** (effort: XL, COMPLETED 2026-02-10) - Redesigned admin console with tab-based navigation instead of sidebar menu. Implemented mobile hamburger menu for PWA-friendly admin access. Improved organization of admin functions into logical groups (Event Management, Admin Functions, Help). **Deployed as v4.3.0.**
- [ ] Email content refinement for assignment notifications (effort: M) - Improve clarity, tone, and user experience of notification emails

### Medium Priority
- [ ] **Global announcements admin page** (effort: L, NEW 2026-02-06) - Create admin portal page to manage system-wide announcements that appear on all pages (like rebranding banner). Should support: title, message, type (INFO/WARNING/URGENT), start/end dates, active/inactive toggle, dismissal settings. Currently only have event-specific announcements and code-based static banners.
- [ ] Mobile bottom navigation expansion (effort: M) - Ensure bottom nav appears consistently on all authenticated pages
- [ ] Admin pages mobile optimization (effort: L) - Make admin tables, forms, and UI touch-friendly for mobile

---

## 💭 Ideas & Feature Concepts (Needs Discussion)

### 1. IVS Early Check-In Access Model
**Status:** Needs pushback/discussion  
**Submitted:** 2026-02-11

**Current Situation:**
- IVS Approval - Early Check-In feature exists
- Mobile check-in and regular check-in features available
- Currently requires team members to have application login

**Question:**
- Should volunteers need full application login for early check-in?
- OR should we add an "Early Check-In" tab to volunteer dashboard (when in IVS event)?

**Considerations:**
- **Option A (Current):** Team members have full login access
  - Pros: Full access to all features, easier permission management
  - Cons: More accounts to manage, potential security concerns
  
- **Option B (Volunteer Dashboard):** Add check-in tab for IVS volunteers
  - Pros: Volunteers already have login, event-specific access, better UX
  - Cons: Need to build volunteer dashboard tab, permission complexity

**Decision Needed:** Which approach aligns better with security model and user experience?

### 2. Event-Specific In-App Chat System
**Status:** Needs pushback/discussion  
**Submitted:** 2026-02-11

**Use Case:**
- Attendant overseer needs to message team members during event
- Example: "Child is missing" - need to alert single person or broadcast to all
- Must be event-specific (not global chat)

**Requirements:**
- Event-scoped messaging (only for specific event)
- One-to-one messaging (overseer → volunteer)
- Broadcast messaging (overseer → all team members)
- Real-time delivery
- Mobile-friendly
- Role-based access (overseers can send, volunteers can receive)

**Technical Considerations:**
- **Real-time:** WebSockets vs Server-Sent Events vs Polling
- **Storage:** Database table for messages (event_messages?)
- **Notifications:** Push notifications? Email fallback?
- **UI:** Chat panel? Modal? Dedicated tab?
- **Permissions:** Who can send? Who can receive? Can volunteers reply?

**Architecture Options:**

**Option A: Simple Broadcast System**
- Overseer sends message to all team members
- One-way communication (no replies)
- Email + in-app notification
- Simpler to implement

**Option B: Full Chat System**
- Two-way messaging
- Real-time WebSocket connection
- Chat history
- Read receipts
- More complex but more flexible

**Option C: Hybrid Approach**
- Broadcast for urgent alerts (one-way)
- Direct messaging for coordination (two-way)
- Email fallback for offline users

**Effort Estimates:**
- Option A: Medium (3-5 days)
- Option B: Extra Large (2-3 weeks)
- Option C: Large (1-2 weeks)

**Questions to Answer:**
1. Is this for real-time coordination during live events?
2. Do volunteers need to reply or just receive?
3. Should messages persist after event ends?
4. What about offline users (email fallback)?
5. Mobile app integration needed?

**Decision Needed:** Scope and architecture approach before implementation

### Low Priority
- [ ] Enhanced error messages (effort: S) - Improve error message clarity across application
- [ ] Additional validation rules (effort: M) - Add more comprehensive validation
- [ ] Performance optimizations for large datasets (effort: L) - Improve query performance for events with 500+ volunteers
- [ ] Improved caching strategies (effort: M) - Reduce database queries with strategic caching

---

## 🐛 Known Bugs

### Critical (Fix Immediately)
- None currently

### Recently Fixed
- [x] **FB-028: Volunteer login localhost redirect** (CRITICAL, FIXED 2026-02-08) - Volunteer login page was redirecting to localhost:3001 instead of production URL. Fixed hardcoded fallbacks in 5 API files and corrected NextAuth redirect logic. **Deployed to LIVE (GREEN) as v4.1.1.**
- [x] **Drag-and-drop assignment creation failing with 500 error** (CRITICAL, FIXED 2026-02-05) - Multiple fixes applied: (1) Map attendantId to userId for API compatibility, (2) Fetch shift times from position data when shiftId provided, (3) Update Prisma relations from attendant to volunteer, (4) Add position existence validation. **Deployed to LIVE.**
- [x] **Event creation failing with 500 error** (CRITICAL, FIXED 2026-02-04) - Event creation API was using deprecated OWNER role instead of ADMIN after v3.9.0 permissions refactor. Fixed and deployed to LIVE immediately.
- [x] **GREEN (STANDBY) build cache issue** (FIXED 2026-02-08) - Resolved via PM2 restart. Both servers now healthy and synced.

### Non-Critical (Backlog)
- [ ] **React error loop in production** (effort: L) - Recurring minified React errors #425 and #418 causing infinite error boundary loops. Caught by APEX GUARDIAN error boundary. Errors occur in production build, need to reproduce in dev mode with non-minified React to identify root cause. **Impact:** Console spam, potential performance degradation. **Frequency:** Intermittent but recurring across releases. **Status:** Monitoring, non-blocking.
- [ ] Position management test expects event selection (effort: S) - Pre-existing test failure, non-blocking
- [ ] Refactoring validation test expects event selection (effort: S) - Pre-existing test failure, non-blocking
- [ ] User management test CSS selector syntax error (effort: S) - Pre-existing test failure, non-blocking
- [ ] Phone number formatting uses placeholder "XXX" pattern (effort: S) - Acceptable, working as intended but could be improved
- [ ] Some console.log statements could be replaced with proper logging (effort: S) - Non-critical code quality improvement
- [ ] TypeScript lint warnings in legacy code (effort: M) - Non-blocking, isolated to specific files

---

## 💡 User Feedback & Feature Requests

**Total: 27 items from production feedback system**

### 🔴 Open - High/Urgent Priority (0 items)
- None currently

### 🟡 Open - Medium Priority (3 items)
- [ ] **FB-025:** Location library (ENHANCEMENT, MEDIUM) - Track previously used locations with addresses, Google Maps integration, search/autocomplete when creating events to avoid retyping same information. *Submitted: 2026-02-04*
- [ ] **FB-026:** Feedback notifications banner (ENHANCEMENT, MEDIUM) - Implement feedback notifications banner like LDC Tools, add paste screenshot capability to feedback form. *Submitted: 2026-02-04*
- [ ] **FB-027:** Event selection page organization (ENHANCEMENT, MEDIUM) - Better organization for admins viewing all events, add search functionality, improve parent/child relationship visualization with connectors/expanders. Clarify if parent event admins automatically get admin access to child events. *Submitted: 2026-02-04*
- [ ] **FB-017:** Positions Page - Conflict Management (ENHANCEMENT, MEDIUM) - Highlight conflicts when scheduling manually, dynamic suggestion card to help placement without conflicts. *Submitted: 2025-10-24*

### ✅ Resolved/Closed (26 items)
- [x] **Event Settings & Cloning Issues** (BUG, HIGH, RESOLVED 2026-02-11) - Fixed volunteer overseer persistence, display on overview page, cloning 400/500 errors, position oversight assignment errors. Created comprehensive field mapping documentation. *Resolved: 2026-02-11*
- [x] **UI Terminology Inconsistency** (BUG, MEDIUM, RESOLVED 2026-02-11) - Updated all "Attendant" references to "Volunteer" in add/import dialogs and help text. *Resolved: 2026-02-11*
- [x] **FB-003:** Complete schedule visibility (FEATURE, MEDIUM, RESOLVED 2026-02-07) - Volunteers can now see the complete schedule for their assigned positions, showing who is assigned before and after their shift. Helps with coordination and handoffs. *Submitted: 2025-11-03*
- [x] **FB-012:** Bulk edit enhancement (ENHANCEMENT, MEDIUM, RESOLVED 2026-02-07) - Added combined shift creation + oversight assignment operation in bulk edit modal. Users can now create shifts AND assign oversight in one action with selection preserved. *Submitted: 2025-10-24*
- [x] **Email Content Refinement** (ENHANCEMENT, MEDIUM, RESOLVED 2026-02-07) - Improved assignment notification emails with better subject lines, clearer content, actionable guidance, and enhanced UX. More conversational tone and better mobile readability.
- [x] **FB-004:** Search by name feature (FEATURE, MEDIUM, RESOLVED 2026-02-07) - Added Assignments column to volunteers table showing all positions assigned to each volunteer. Users can now search for a volunteer and immediately see all their assignments. *Submitted: 2025-11-02*
- [x] **FB-023:** Template enforcement update (ENHANCEMENT, HIGH, RESOLVED 2026-02-05) - Already implemented. EventPageLayout component conditionally renders Count Times and Lanyards tabs based on moduleConfig settings. Template enforcement working correctly across all event pages. *Submitted: 2026-02-04*
- [x] **FB-024:** Positions page layout update (BUG, MEDIUM, RESOLVED 2026-02-05) - Completely modernized both Positions and Volunteers pages with professional, industry-standard UI design. Reduced button clutter, added clean icons, grouped secondary actions, improved mobile responsiveness. *Submitted: 2026-02-04*
- [x] **FB-001:** Attendant Overseer Assistants labels (BUG, HIGH, RESOLVED 2026-02-04) - Replaced raw JSON textarea with professional UI featuring individual fields for name, phone, email with add/remove buttons. *Submitted: 2025-12-22*
- [x] **FB-007:** Attendant view without edit screen (BUG, MEDIUM, RESOLVED 2026-02-04) - Added "View Details" button to actions dropdown with read-only modal showing all volunteer information. *Submitted: 2025-10-28*
- [x] **FB-002:** Active Sessions Page showing old stale sessions (BUG, MEDIUM, RESOLVED) - Troubleshoot why this is happening. *Submitted: 2025-12-21*
- [x] **FB-005:** Action drop down not working (BUG, URGENT, RESOLVED) - Can't get Action drop down menu to expand. *Submitted: 2025-10-29*
- [x] **FB-006:** Add comment malfunction (BUG, MEDIUM, RESOLVED) - Unable to respond to questions. *Submitted: 2025-10-28*
- [x] **FB-008:** Submit Feedback not working (BUG, MEDIUM, CLOSED) - Testing. *Submitted: 2025-10-28*
- [x] **FB-009:** Event Attendants Page - Pagination (BUG, URGENT, RESOLVED) - Need to show 10/20/50/100/all in list. *Submitted: 2025-10-24*
- [x] **FB-010:** Event Attendants page - Filter not sticking (BUG, MEDIUM, RESOLVED) - Lost filter after editing attendant properties. *Submitted: 2025-10-24*
- [x] **FB-011:** Positions Page - Station Active/Inactive in Edit Field (BUG, HIGH, RESOLVED) - No way to individually edit station to make inactive, must use bulk edit. *Submitted: 2025-10-24*
- [x] **FB-013:** Check Attendant DB Structure (BUG, MEDIUM, RESOLVED) - Global attendants table vs event_attendants table clarification needed. *Submitted: 2025-10-24*
- [x] **FB-014:** Positions Page - Clear All Assignments Button (ENHANCEMENT, MEDIUM, RESOLVED) - Button to clear all assignments, button to clear all shifts. *Submitted: 2025-10-24*
- [x] **FB-015:** Positions Page - Filtering and Exporting (FEATURE, MEDIUM, RESOLVED) - Export all positions, filter and export based on Oversight. *Submitted: 2025-10-24*
- [x] **FB-016:** Positions Page - Shift add Manual name stick (BUG, MEDIUM, RESOLVED) - Shift name doesn't stick when added via bulk edit or manual create. *Submitted: 2025-10-24*
- [x] **FB-018:** Filtering change - Sort attendants by overseer and keyman (ENHANCEMENT, MEDIUM, RESOLVED) *Submitted: 2025-10-23*
- [x] **FB-019:** Positions Edit - Assistant Overseer Cannot Edit positions (BUG, HIGH, RESOLVED) - Fix permissions as Assistant Overseer not in Event. *Submitted: 2025-10-22*
- [x] **FB-020:** File upload feature test (ENHANCEMENT, MEDIUM, RESOLVED) *Submitted: 2025-10-19*
- [x] **FB-021:** File upload feature (ENHANCEMENT, MEDIUM, RESOLVED) *Submitted: 2025-10-19*
- [x] **FB-022:** Test final (BUG, MEDIUM, RESOLVED) - Testing. *Submitted: 2025-10-19*

### 📊 Summary Statistics
- **Total Feedback Items:** 29
- **Open:** 5 (17%)
- **Resolved/Closed:** 24 (83%)
- **By Type:** 15 Bugs, 10 Enhancements, 5 Features
- **By Priority:** 0 Urgent, 0 High, 29 Medium

---

## 🗺️ Roadmap (Strategic)

### Q1 2026 (Jan-Mar)
- [x] Phase 7: Mobile Optimization (v3.8.0) - COMPLETE
- [x] Permissions Refactor (v3.9.0) - Code complete, in testing
- [ ] Help Docs + Mobile Polish (v3.10.0) - Planned

### Q2 2026 (Apr-Jun)
- [ ] Phase 8: Advanced Volunteer Features (v3.10.0+) - Photo management, skills/certifications, enhanced bulk operations, communication tools

### Future (No Timeline)
- [ ] Phase 9: Integration & Automation - Calendar integration, AI-powered assignment suggestions, external system integration
- [ ] Phase 10: Advanced Platform Features - Multi-language support, custom branding, white-label deployment, GDPR compliance
- [ ] Phase 11: Enterprise Features - Multi-tenant architecture, organization hierarchy, circuit-level coordination, SSO/SAML

### Deferred Indefinitely
- [ ] Phase 6: Reporting & Analytics - Current reporting capabilities sufficient, users have not requested advanced analytics
- [ ] Assignment update notifications - Not needed, handled manually
- [ ] Automatic reminder scheduling - Manual send sufficient
- [ ] Coordinator availability dashboard - Handled via Volunteers page
- [ ] Dedicated availability management page - Existing workflow sufficient
- [ ] Template integration into positions workflow - Clone event handles this
- [ ] Assignment history & analytics - Deferred to Phase 6 (which is deferred indefinitely)

---

## 📝 Deferred Items

**Items explicitly deferred with rationale:**

- [ ] Assignment update notifications - **Deferred because:** Not needed, manual workflow sufficient - **Revisit:** If users request automated updates
- [ ] Automatic reminder scheduling system - **Deferred because:** Manual send button works well - **Revisit:** If workload increases significantly
- [ ] Coordinator availability dashboard - **Deferred because:** Handled via existing Volunteers page - **Revisit:** If coordinators request dedicated view
- [ ] Template integration into positions workflow - **Deferred because:** Clone event feature handles this use case - **Revisit:** If users request direct template application
- [ ] Phase 6: Reporting & Analytics - **Deferred because:** Current reporting sufficient, no user demand - **Revisit:** If users request advanced analytics or historical tracking

---

## ✅ Recently Completed (Last 30 Days)

- [x] Technical Debt Assessment & Documentation - Date: 2026-02-11
- [x] Event Settings & Cloning Fixes - Date: 2026-02-11
- [x] Prisma Field Mapping Documentation - Date: 2026-02-11
- [x] Volunteer Roles Architecture Analysis - Date: 2026-02-11
- [x] UI Terminology Updates (Attendant → Volunteer) - Date: 2026-02-11
- [x] v4.5.0: OVERSEER Improvements - Date: 2026-02-10
- [x] v4.3.0: Admin Console Redesign - Date: 2026-02-10
- [x] Tab-based navigation replacing sidebar menu - Date: 2026-02-10
- [x] Mobile hamburger menu for PWA-friendly admin access - Date: 2026-02-10
- [x] 100% test pass rate (81/81 tests) - Date: 2026-02-10
- [x] v4.1.1: FB-028 localhost redirect bug fix - Date: 2026-02-08
- [x] qa-01 testing migration with dynamic STANDBY detection - Date: 2026-02-08
- [x] Promoted qa-01 testing pattern to control plane - Date: 2026-02-08
- [x] FB-003: Complete schedule visibility for volunteers - Date: 2026-02-07
- [x] FB-012: Combined shift + oversight bulk operation - Date: 2026-02-07
- [x] Email content refinement (assignment notifications) - Date: 2026-02-07
- [x] v4.0.2: Test Infrastructure & Stability - Date: 2026-02-06
- [x] Container-local test runner (100% pass rate) - Date: 2026-02-06
- [x] FB-004: Search by name with assignments display - Date: 2026-02-07
- [x] TypeScript error fixes in positions page - Date: 2026-02-07
- [x] v3.11.0: UI Modernization (Volunteers & Positions) - Date: 2026-02-05
- [x] Drag-and-drop assignment bug fix - Date: 2026-02-05
- [x] Phase 7: Mobile Optimization (v3.8.0) - Date: 2026-02-02

---

## 📊 Effort Sizing Guide

- **S (Small):** 1-4 hours - Quick fixes, minor tweaks
- **M (Medium):** 1-2 days - Standard features, moderate bugs
- **L (Large):** 3-5 days - Complex features, major refactoring
- **XL (Extra Large):** 1+ weeks - Major modules, architectural changes
