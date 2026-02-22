# Implementation Plan - TheoShift

**Last Updated:** 2026-02-21  
**Current Version:** v4.15.5  
**Current Phase:** Feature Development + Platform Infrastructure

---

## 🎯 Recent Completions (Feb 21, 2026)

### ✅ v4.15.2–v4.15.5 Released - Security & Dependency Upgrade Sprint
**Completed:** Full security hardening sprint — dependency patches, xlsx→exceljs migration, Next.js major upgrade, OS patches on both nodes.

**Version:** v4.15.5  
**Released:** 2026-02-21  
**Status:** Live on theoshift.com (BLUE)

**Changes:**
- v4.15.2: Volunteer role fixes (availability emails, bulk actions, search, PDF/Excel exports, DB cleanup)
- v4.15.3: next-auth 4.24.7→4.24.13, nodemailer 6.x→7.x, @modelcontextprotocol/sdk→1.26.0, npm audit fix, OS patches (glibc, gnupg, apparmor, bind9) on both nodes
- v4.15.4: Replaced `xlsx` (abandoned/CVEs) with `exceljs` across 5 files; npm audit 69→41 vulns
- v4.15.5: Next.js 14.2.33→15.5.12 (removed swcMinify, serverComponentsExternalPackages→serverExternalPackages); npm audit 0 actionable vulns
- Control plane baseline updated: Next.js→15.5.12, TailwindCSS→3.4.17, ExcelJS 4.4.0 added
- React 19 + next-auth v5 evaluated and deferred (no security driver, next-auth v4 compat risk)

### ✅ v4.15.0 Released - Global Announcements Banner + PWA Offline Caching
**Completed:** Global Announcements Banner wired into AdminLayout, PWA Service Worker v2.0.0 with offline caching, full test suite cleanup (131 passed, 25 skipped, 0 failed).

**Version:** v4.15.0  
**Released:** 2026-02-19  
**Status:** Live on theoshift.com (GREEN)

**Changes:**
- Global Announcements Banner: `GlobalAnnouncementBanner` component, `/api/global-announcements` public endpoint, color-coded by type, dismiss-per-session
- PWA SW v2.0.0: stale-while-revalidate for volunteer APIs, cache-first for volunteer pages, background sync for check-ins
- Bug fix: volunteer login raw query used old `attendants` table name (renamed to `volunteers`) — was causing login failures
- Test suite: all previously failing/skipped tests fixed (131 passed, 25 intentional skips, 0 failed)
- qa-01 `.env.test` BASE_URL corrected to `https://theoshift.com` (was `green.theoshift.com`, broke NextAuth redirects)

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

**Current Focus:** Feature Development — v4.15.5 shipped, picking next backlog item

### Recently Completed (2026-02-21) — v4.15.5 LIVE
- [x] **v4.15.5** - Next.js 14→15.5.12 upgrade, 0 actionable npm audit vulns — released to LIVE
- [x] **v4.15.4** - xlsx→exceljs migration (5 files), npm audit 69→41 vulns — released to LIVE
- [x] **v4.15.3** - Security dep patches + OS patches on both nodes — released to LIVE
- [x] **v4.15.2** - Volunteer role fixes, availability emails, bulk actions, export fixes — released to LIVE

### Recently Completed (2026-02-19) — v4.15.0 LIVE
- [x] **v4.15.0** - Global Announcements Banner, PWA SW v2.0.0, volunteer login bug fix, full test suite cleanup — released to LIVE

### Previously Completed (2026-02-18) — v4.14.0
- [x] **v4.13.0** - FB-017 conflict detection, email fixes, D-024 feedback compliance — released to LIVE
- [x] **All Technical Debt** - All 9 debt items resolved (see section below)
- [x] **All Feedback Items** - 0 open feedback items in production system
- [x] **IVS Early Check-In** - Fully implemented (admin IVS tab + volunteer dashboard tab + APIs, released v4.4.0)
- [x] **PWA: iPhone document trap fix** - Replaced `target=_blank` with in-app fullscreen modal viewer (back button, PDF iframe, image viewer, download)
- [x] **PWA: Bottom navigation** - `PWABottomNav` component added to Dashboard, Early Check-In, Select Event pages with iOS safe-area-inset support
- [x] **Global Announcements Admin Page** - `/admin/global-announcements` with full CRUD, type/date/active controls; DB migration applied; ADMIN-only API
- [x] **Policy:** All new features must be optimized for mobile/PWA including offline capability

### In Progress / Next
- [ ] **Matrix/Dendrite Chat Platform** — Infrastructure + TheoShift integration (see full plan below)
- [x] **Mobile bottom nav expansion** — Already complete on all volunteer pages (COMPLETE)
- [x] **Admin pages mobile optimization** — overflow-x-auto fixes, search bar stacking, attendant-pins table bug fix (COMPLETE 2026-02-19)

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

## �️ Matrix/Dendrite Chat Platform (Major Initiative)

**Status:** Planned — awaiting LXC IP assignment to begin Phase 1  
**Decision Date:** 2026-02-19  
**Scope:** Shared infrastructure serving TheoShift, LDC Tools, QuantShift, and future apps  
**Effort:** XL (2-3 weeks total across all phases)

### Why Matrix/Dendrite

- **Open protocol** (Apache 2.0) — no vendor lock-in, industry standard used by Mozilla, German government, French military
- **Single homeserver, multiple apps** — TheoShift, LDC Tools, QuantShift all share one Dendrite instance; rooms are app-scoped, users never cross app boundaries
- **Dendrite over Synapse** — Go binary (vs Python), single process, 80-150MB RAM at idle vs 400-800MB, same feature set for closed private rooms, no federation needed
- **Real-time two-way chat** — WebSocket-based, WhatsApp/Slack-style UX, typing indicators, read receipts, message history, reactions — all standard Matrix features
- **PWA push notifications** — Web Push works on iOS 16.4+ Safari and all Android browsers; APNs/FCM via Sygnal push gateway when Apple Developer account is ready
- **Event-scoped rooms** — each event = a Matrix room (`#event-{eventId}:matrix.theoshift.com`); volunteers only see rooms for their assigned event; admins see all rooms for their events

### Environment

| Component | Value |
|---|---|
| Homeserver subdomain | `matrix.theoshift.com` |
| Dendrite LXC | New CT on Proxmox — IP TBD by user |
| LXC spec | Debian 12, 2 vCPU, 2GB RAM |
| PostgreSQL | Existing server at `10.92.3.21` (PG 17.6) — new `dendrite` database |
| HAProxy | Existing — add Dendrite as upstream backend |
| Push gateway | Sygnal — co-located on Dendrite LXC |

### Phase 1 — Infrastructure (LXC + Dendrite + PostgreSQL)

**Prerequisite:** User provides LXC IP and CT ID

- [ ] Create Proxmox LXC (Debian 12, 2 vCPU, 2GB RAM, 20GB disk)
- [ ] Install Dendrite binary (Go, single binary via GitHub releases)
- [ ] Create `dendrite` database on `10.92.3.21` with dedicated user
- [ ] Configure `dendrite.yaml` — server name `matrix.theoshift.com`, PostgreSQL connection, media store path
- [ ] Generate Matrix signing key (`dendrite generate-keys`)
- [ ] Configure TLS — Let's Encrypt cert on the LXC via certbot + nginx reverse proxy on LXC
- [ ] Add `matrix.theoshift.com` DNS A record → LXC IP
- [ ] Add Matrix well-known delegation on `theoshift.com` (`/.well-known/matrix/server`, `/.well-known/matrix/client`)
- [ ] Start Dendrite via systemd service
- [ ] Verify homeserver health: `https://matrix.theoshift.com/_matrix/client/versions`
- [ ] Add Dendrite LXC as upstream in HAProxy health checks

**Deliverable:** Functional Matrix homeserver at `matrix.theoshift.com`

### Phase 2 — TheoShift Integration

- [ ] Add `matrix-js-sdk` to TheoShift (`npm install matrix-js-sdk`)
- [ ] Create Matrix provisioning service (`src/lib/matrix.ts`) — auto-create Matrix user on NextAuth login, no separate Matrix login needed
  - Username pattern: `@{userId}:matrix.theoshift.com`
  - Display name: `{firstName} {lastName}`
  - Access token stored in NextAuth session (server-side only)
- [ ] Create event room provisioning — when an event is created, auto-create Matrix room `#event-{eventId}:matrix.theoshift.com`
- [ ] Room membership sync — when volunteer is assigned to event, invite their Matrix user to the room; when removed, kick from room
- [ ] **Volunteer dashboard** — add "Messages" tab to `MobileVolunteerDashboard` (5th tab)
  - Shows only rooms for volunteer's assigned event
  - Real-time message display via matrix-js-sdk sync
  - Send message input at bottom (WhatsApp-style)
  - Unread badge on tab
- [ ] **Admin event pages** — add chat drawer/panel to event layout
  - Floating chat button (bottom-right) with unread badge
  - Slide-in panel showing event room
  - All users with event access (ADMIN, OVERSEER, ASSISTANT_OVERSEER, KEYMAN) can send
- [ ] **API route** `POST /api/matrix/provision` — called by NextAuth `signIn` callback to ensure Matrix user exists
- [ ] **API route** `GET /api/matrix/token` — returns Matrix access token for client-side SDK init (server-side session only, never exposed in page source)
- [ ] Add Matrix env vars to `.env`: `MATRIX_HOMESERVER_URL`, `MATRIX_ADMIN_TOKEN`, `MATRIX_SERVER_NAME`

**Deliverable:** Full two-way real-time chat in TheoShift for volunteers and admins, event-scoped

### Phase 3 — LDC Tools Integration

- [ ] Same homeserver (`matrix.theoshift.com`) — no new infrastructure
- [ ] Add `matrix-js-sdk` to LDC Tools Next.js app
- [ ] Implement same provisioning pattern (`src/lib/matrix.ts`) with LDC Tools NextAuth
- [ ] Room namespace: `#ldctools-{contextId}:matrix.theoshift.com` (context = project, job, or whatever LDC Tools scopes by)
- [ ] UI integration TBD based on LDC Tools page structure

**Deliverable:** LDC Tools users on same homeserver, isolated rooms

### Phase 4 — QuantShift + Future Apps

- [ ] Same pattern — provision Matrix users on signup, create rooms per context
- [ ] Public users get Matrix accounts automatically — they never see or interact with Matrix directly
- [ ] Room namespace: `#quantshift-{contextId}:matrix.theoshift.com`
- [ ] Scale note: Dendrite handles thousands of concurrent users in monolith mode — no architecture change needed at QuantShift scale

### Phase 5 — Push Notifications

**Prerequisite:** Apple Developer account for APNs

- [ ] Install Sygnal (Matrix push gateway) on Dendrite LXC — Python service, lightweight
- [ ] Configure Web Push (VAPID keys) — works immediately on iOS 16.4+ PWA and all Android
- [ ] Configure FCM (Firebase Cloud Messaging) — free Firebase project, Android + Chrome push
- [ ] Configure APNs — Apple Developer account cert, iOS Safari push
- [ ] Register push rules in Dendrite — notify on new message in joined rooms
- [ ] TheoShift PWA: register push subscription on volunteer dashboard load
- [ ] Test: message sent by admin → volunteer receives push notification even with app backgrounded

**Deliverable:** Full push notification pipeline — in-app + background push on iOS and Android

### Phase 6 — HA / Resilience (Future)

- [ ] Dendrite worker mode — split sync, federation, media into separate processes (only needed at high load)
- [ ] Media store on NFS mount — shared between potential future Dendrite replicas
- [ ] HAProxy active/passive for Dendrite LXC — failover to second LXC if primary goes down
- [ ] PostgreSQL replication already handled by existing PG infrastructure

### Key Decisions Made

| Decision | Choice | Reason |
|---|---|---|
| Engine | Dendrite (Go) | Single binary, low memory, LXC-friendly, PG 17 native |
| vs Synapse | Rejected | Python complexity, 4-5x memory, overkill for closed rooms |
| vs Rocket.Chat | Rejected | BSL license, EmbeddedChat is immature (v0.2.3, 1yr stale) |
| vs Mattermost | Rejected | iframe embed only, no real React SDK |
| Federation | Disabled | All apps are closed — no need to talk to external Matrix servers |
| Subdomain | `matrix.theoshift.com` | Clean, standard, DNS-resolvable |
| Auth | SSO via NextAuth | Users never see a Matrix login — provisioned automatically |
| Rooms | Event-scoped | `#event-{eventId}:matrix.theoshift.com` — enforced by membership |

### Pending From User

- [ ] **LXC IP and CT ID** — needed to start Phase 1
- [ ] **Apple Developer account** — needed for Phase 5 APNs push (iOS native push)
- [ ] **LDC Tools context model** — what does a "conversation scope" map to in LDC Tools? (project? job? team?)

---

## �� Backlog (Prioritized)

### High Priority
- [x] **IVS Volunteer Approval & Early Check-In Module** (COMPLETE) — IVS approvals, spreadsheet import/export, bulk operations, mobile check-in interface, early check-in tab on volunteer dashboard. Released in v4.4.0.
- [x] **IVS Early Check-In access model** — Early Check-In tab exists on volunteer dashboard (COMPLETE)
- [x] **Admin portal redesign with tabs layout** (effort: XL, COMPLETED 2026-02-10) - Redesigned admin console with tab-based navigation instead of sidebar menu. Implemented mobile hamburger menu for PWA-friendly admin access. Improved organization of admin functions into logical groups (Event Management, Admin Functions, Help). **Deployed as v4.3.0.**
- [x] Email content refinement for assignment notifications (effort: M, COMPLETE v4.13.0) - Shift name, All Day display, overseer terminology

### Medium Priority
- [x] **Global announcements admin page** (COMPLETE v4.14.0) - `/admin/global-announcements` with full CRUD, type/date/active controls, banner component wired into AdminLayout, public API endpoint.
- [x] **Mobile bottom navigation expansion** (COMPLETE 2026-02-19) - PWABottomNav confirmed on all 3 volunteer pages (dashboard via MobileVolunteerDashboard, early-checkin, select-event).
- [x] **Admin pages mobile optimization** (COMPLETE 2026-02-19) - overflow-x-auto on all admin tables, mobile-stacking search bar on users page, fixed attendant-pins raw query using old `attendants` table name.

---

## 💭 Ideas & Feature Concepts

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
