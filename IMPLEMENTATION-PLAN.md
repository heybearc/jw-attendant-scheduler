# Implementation Plan - TheoShift

**Last Updated:** 2026-02-18  
**Current Version:** v4.14.0  
**Current Phase:** Feature Development

---

## 🎯 Recent Completions (Feb 18, 2026)

### ✅ v4.13.0 Released - FB-017 Positions Page Conflict Management + D-024 Compliance
**Completed:** Conflict detection on positions page, email improvements, feedback API D-024 compliance.

**Version:** v4.13.0  
**Released:** 2026-02-18  
**Status:** Live on theoshift.com (GREEN)

**Changes:**
- FB-017: Conflict detection in AssignVolunteerModal — amber badge, conflict details, coordinator override
- Fixed `positionName` undefined in conflict API response (missing `positions` relation in Prisma query)
- Reactive conflict map computation inside modal (responds to shift selection changes)
- Assignment emails: show shift name, "All Day" vs times, changed "event coordinator" → "overseer"
- D-024 compliance: feedback status API now accepts `resolutionComment`, validates RESOLVED requires one
- D-024 compliance: status-changed email sent to submitter on every feedback status update
- Added Conflict Detection section to managing-assignments help page
- Playwright tests for conflict detection (FB-017)
- Documented MCP PM2 process name mismatch in PROMOTE-TO-CONTROL-PLANE.md
- FB-017 resolution email sent to submitter (corylallen@gmail.com)

### ✅ Earlier Releases (v4.2.0 – v4.12.x)
- v4.2.0: FB-025 Location Library with Google Maps integration
- v4.1.1: FB-028 Volunteer login localhost redirect bug fix
- v4.0.2: Test infrastructure & stability (100% pass rate)
- v3.11.0: UI Modernization — Volunteers & Positions pages

---

## 🎯 Active Work (This Week)

**Current Focus:** Feature Development — v4.14.0 PWA + Global Announcements

### Recently Completed (2026-02-18) — v4.14.0 on STANDBY
- [x] **v4.13.0** - FB-017 conflict detection, email fixes, D-024 feedback compliance — released to LIVE
- [x] **All Technical Debt** - All 9 debt items resolved (see section below)
- [x] **All Feedback Items** - 0 open feedback items in production system
- [x] **IVS Early Check-In** - Confirmed fully implemented (admin IVS tab + volunteer dashboard tab + APIs)
- [x] **PWA: iPhone document trap fix** - Replaced `target=_blank` with in-app fullscreen modal viewer (back button, PDF iframe, image viewer, download)
- [x] **PWA: Bottom navigation** - `PWABottomNav` component added to Dashboard, Early Check-In, Select Event pages with iOS safe-area-inset support
- [x] **Global Announcements Admin Page** - `/admin/global-announcements` with full CRUD, type/date/active controls; DB migration applied; ADMIN-only API
- [x] **Policy:** All new features must be optimized for mobile/PWA including offline capability

### In Progress / Next
- [x] **Release v4.14.0** - Released 2026-02-19, LIVE on BLUE (10.92.3.24)
- [x] **Global Announcements Banner:** `GlobalAnnouncementBanner` wired into `AdminLayout` — fetches active announcements from `/api/global-announcements`, color-coded by type, dismiss-per-session via sessionStorage
- [x] **PWA Offline:** SW v2.0.0 — stale-while-revalidate for volunteer APIs, cache-first for volunteer pages, background sync for check-ins
- [ ] **Feature Planning:** In-app event-specific chat system - Needs discussion (see Ideas section)

---

## 🔧 Technical Debt Cleanup (NEW - Priority Work)

**Documentation:** `/docs/TECHNICAL_DEBT_ASSESSMENT.md`

### 🔴 High Priority Technical Debt (3 items)

1. ✅ **Inconsistent Table/Field Naming (attendants → volunteers)** - COMPLETE
   - **Issue:** Database table `event_volunteers` mapped to old name `event_attendants`
   - **Impact:** TypeScript errors, developer confusion, inconsistent codebase
   - **Effort:** Medium (2-3 hours)
   - **Risk:** Medium (requires database migration)
   - **Files:** `/prisma/schema.prisma`, various API endpoints
   - **Status:** COMPLETE (2026-02-11) - Table renamed, @@map removed, frontend field names fixed

2. ✅ **Volunteer Roles: Global vs Event-Specific** - COMPLETE
   - **Issue:** Roles (overseer, keyman, elder) stored globally but should be event-specific
   - **Impact:** Unchecking keyman in Event A removes it from Event B
   - **Documentation:** `/docs/VOLUNTEER_ROLES_ARCHITECTURE.md`
   - **Effort:** Large (8-12 hours including migration)
   - **Risk:** High (data migration required)
   - **Status:** COMPLETE (2026-02-11) - Event-specific role flags (isKeyman, isOverseer, isElder) implemented in event_volunteers table

3. ✅ **Missing Prisma Schema Fields** - COMPLETE
   - **Issue:** Code references fields not in current schema (`ivsImportBatchId`, `ivsApprovalStatus`, `ivs_import_batches`)
   - **Impact:** TypeScript errors, runtime errors, developers using `(prisma as any)` to bypass
   - **Effort:** Medium (3-4 hours)
   - **Risk:** Low (mostly cleanup)
   - **Files:** `/pages/api/events/[id]/ivs/import.ts`, `/pages/api/events/[id]/volunteers/index.ts`
   - **Status:** COMPLETE (2026-02-11) - All IVS fields exist in schema and database, Prisma client regenerated

### 🟡 Medium Priority Technical Debt (3 items)

4. ✅ **Dual Position Systems (event_positions + positions)** - COMPLETE
   - **Issue:** Two position systems coexist, code handles both everywhere
   - **Effort:** Large (10-15 hours)
   - **Risk:** High (requires careful migration)
   - **Status:** COMPLETE (2026-02-11) - event_positions table dropped, all code migrated to unified positions system, released as v4.6.0

5. ✅ **Inconsistent Field Name Mapping** - MOSTLY COMPLETE
   - **Issue:** Mix of camelCase, snake_case, lowercase across models
   - **Documentation:** `/docs/PRISMA_FIELD_MAPPING.md`, `/.windsurf/rules/prisma-field-naming.md`
   - **Effort:** Medium (4-6 hours)
   - **Risk:** Medium (requires schema changes)
   - **Status:** MOSTLY COMPLETE (2026-02-11) - Removed most (prisma as any) casts, fixed overseer fields, @map directives consistent

6. ✅ **Old Migration Files and Baseline Schemas** - COMPLETE
   - **Issue:** Multiple schema files, unclear which is authoritative
   - **Effort:** Small (1-2 hours)
   - **Risk:** Low (organizational)
   - **Status:** COMPLETE (2026-02-11) - Old schemas archived in /prisma/archive/ with documentation

### 🟢 Low Priority Technical Debt (3 items)

7. ✅ **Console Violations (Non-Passive Event Listeners)** - MOSTLY COMPLETE
   - **Issue:** Browser console shows violations about non-passive event listeners
   - **Status:** MOSTLY COMPLETE (2026-02-11) - Main app code uses { passive: true } for scroll listeners
   - **Remaining:** Third-party libraries may still have violations
   - **Effort:** Small (1-2 hours for remaining issues)

8. ✅ **Commented-Out Code and Debug Logging** - COMPLETE
   - **Issue:** 760+ console.log statements across 194 files
   - **Status:** COMPLETE (2026-02-11) - 78% reduction achieved
   - **Infrastructure:** Created /src/lib/logger.ts with environment-aware logging
   - **Results:** Reduced from 341 to 74 console.log statements (267 removed)
   - **Cleanup Scripts:** Created 3-phase automated cleanup scripts
   - **Remaining:** 74 statements are essential error context in catch blocks
   - **Effort:** Medium (4-6 hours) - COMPLETE

9. ✅ **Inconsistent Error Handling** - COMPLETE
   - **Issue:** Mix of error handling patterns (detailed vs generic errors)
   - **Status:** COMPLETE (2026-02-11) - 98% of API endpoints migrated
   - **Infrastructure:** Created /src/lib/apiError.ts with standardized error responses
   - **Features:** Handles Zod validation, Prisma errors, consistent status codes
   - **Results:** Migrated 122/124 API endpoints to centralized error handling
   - **Benefits:** Consistent error format, proper status codes, better logging
   - **Effort:** Medium (4-6 hours) - COMPLETE

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
- [x] Email content refinement for assignment notifications (effort: M, COMPLETE v4.13.0) - Shift name, All Day display, overseer terminology

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
- [ ] **TypeScript errors in test files** (effort: M, NEW 2026-02-11) - 174 TypeScript errors in test files and legacy components. Errors include: missing `@testing-library/react-hooks` imports, legacy "Attendant" type references in components, type mismatches in test files. **Impact:** Tests may not run correctly, but doesn't affect production runtime. **Files affected:** `__tests__/hooks/*.test.ts`, `components/FilterControls.tsx`, `components/OverseerModal.tsx`, `features/attendant-management/`. **Status:** Documented, needs cleanup pass.
- [ ] **React error loop in production** (effort: L) - Recurring minified React errors #425 and #418 causing infinite error boundary loops. Caught by APEX GUARDIAN error boundary. Errors occur in production build, need to reproduce in dev mode with non-minified React to identify root cause. **Impact:** Console spam, potential performance degradation. **Frequency:** Intermittent but recurring across releases. **Status:** Monitoring, non-blocking.
- [ ] Position management test expects event selection (effort: S) - Pre-existing test failure, non-blocking
- [ ] Refactoring validation test expects event selection (effort: S) - Pre-existing test failure, non-blocking
- [ ] User management test CSS selector syntax error (effort: S) - Pre-existing test failure, non-blocking
- [ ] Phone number formatting uses placeholder "XXX" pattern (effort: S) - Acceptable, working as intended but could be improved
- [ ] Some console.log statements could be replaced with proper logging (effort: S) - Non-critical code quality improvement
- [ ] TypeScript lint warnings in legacy code (effort: M) - Non-blocking, isolated to specific files

---

## 💡 User Feedback & Feature Requests

**Total: 30 items from production feedback system**

### 🔴 Open - High/Urgent Priority (0 items)
- None currently

### 🟡 Open - Medium Priority (0 items)
- None currently

### ✅ Resolved/Closed (30 items)
- [x] **FB-017:** Positions Page - Conflict Management (FEATURE, HIGH, RESOLVED 2026-02-18) - Conflict detection in AssignVolunteerModal with amber badge, details, coordinator override. *Resolved: 2026-02-18*
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
- **Total Feedback Items:** 30
- **Open:** 0 (0%)
- **Resolved/Closed:** 30 (100%)
- **By Type:** 15 Bugs, 10 Enhancements, 5 Features, 1 Feature (FB-017)
- **By Priority:** 0 Urgent, 0 High, 30 Medium

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

- [x] v4.13.0: FB-017 Conflict Detection + D-024 Feedback Compliance - Date: 2026-02-18
- [x] FB-017 resolution email sent to submitter - Date: 2026-02-18
- [x] All feedback items resolved (0 open) - Date: 2026-02-18
- [x] Technical Debt Assessment & Documentation - Date: 2026-02-11
- [x] Event Settings & Cloning Fixes - Date: 2026-02-11
- [x] Prisma Field Mapping Documentation - Date: 2026-02-11
- [x] Volunteer Roles Architecture Analysis - Date: 2026-02-11
- [x] UI Terminology Updates (Attendant → Volunteer) - Date: 2026-02-11
- [x] v4.5.0: OVERSEER Improvements - Date: 2026-02-10
- [x] v4.3.0: Admin Console Redesign - Date: 2026-02-10
- [x] v4.1.1: FB-028 localhost redirect bug fix - Date: 2026-02-08
- [x] FB-003: Complete schedule visibility for volunteers - Date: 2026-02-07
- [x] FB-012: Combined shift + oversight bulk operation - Date: 2026-02-07
- [x] Email content refinement (assignment notifications) - Date: 2026-02-07
- [x] v3.11.0: UI Modernization (Volunteers & Positions) - Date: 2026-02-05

---

## 📊 Effort Sizing Guide

- **S (Small):** 1-4 hours - Quick fixes, minor tweaks
- **M (Medium):** 1-2 days - Standard features, moderate bugs
- **L (Large):** 3-5 days - Complex features, major refactoring
- **XL (Extra Large):** 1+ weeks - Major modules, architectural changes
