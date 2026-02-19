# Discoveries to Promote to Control Plane

## New Discoveries to Promote

*(No pending items — all promoted)*

---

## Promoted Items

### 🔧 PM2 Process Name Drift + Prevention Layers (2026-02-19) - ✅ PROMOTED
**Promoted to:** `_cloudy-ops/context/DECISIONS.md` as D-025  
**Commit:** 2fbf896 (Cloudy-Work), 9aa1d206 (theoshift submodule)  
**Date:** 2026-02-19

Both TheoShift nodes had drifted to generic PM2 name `theoshift` instead of `theoshift-blue`/`theoshift-green`. Root cause: stale docs in `sync.md`, `deployment.md`, `SKILL.md` all instructed `pm2 restart theoshift`. Fix applied:
- Renamed processes on both nodes; restored `ecosystem.config.js` on GREEN
- Added pre-flight PM2 name verification to MCP `server.js` (fails loudly with fix instructions)
- Fixed all stale docs to use MCP primary + correct named fallback
- Promoted as D-025 to control plane DECISIONS.md

---

### 🔒 ASSISTANT_OVERSEER Role Missing from Event Creation API (2026-02-19) - ✅ PROMOTED
**Promoted to:** App-level fix only (role-specific to TheoShift); no cross-app pattern  
**Commit:** 45e9fbf2  
**Date:** 2026-02-19

Page `getServerSideProps` allowed `ASSISTANT_OVERSEER` to access event creation form, but API POST handler only allowed `ADMIN`/`OVERSEER`, causing 403 on submit. Fixed in `pages/api/events/index.ts`. Resolved as FB-030.

---

### 📋 moduleConfig Must Be Fetched in Every Event Sub-Page SSR (2026-02-19) - ✅ PROMOTED
**Promoted to:** App-level decision D-TS-033 (TheoShift-specific pattern)  
**Commit:** 953b1d98  
**Date:** 2026-02-19

All 8 event sub-pages were passing `moduleConfig: null`, hiding conditional tabs. Fixed by fetching `event.settings.modules` in each page's `getServerSideProps` (or from client-loaded state for CSR pages). Pattern documented in D-TS-033.

---

### 🧪 Test Creation Guidelines and Authentication Patterns (2026-02-10) - ✅ PROMOTED
**Promoted to:** `_cloudy-ops/docs/testing/test-creation-guidelines.md`  
**Commit:** [pending]  
**Date:** 2026-02-12

Reusable authentication patterns for Playwright tests, navigation helpers, and module detection patterns. Prevents authentication timeout issues across all apps.

---

### 📚 Help Documentation Strategy (2026-02-10) - ✅ PROMOTED
**Promoted to:** `_cloudy-ops/docs/documentation/help-documentation-pattern.md`  
**Commit:** [pending]  
**Date:** 2026-02-12

User-friendly language guidelines, step-by-step guide structure, FAQ patterns, and role-based access control implementation for consistent help documentation.

---

### 📱 Mobile-First Check-In Interface Pattern (2026-02-10) - ✅ PROMOTED
**Promoted to:** `_cloudy-ops/docs/ui-patterns/mobile-checkin-interface.md`  
**Commit:** [pending]  
**Date:** 2026-02-12

Large touch targets, real-time search, stats dashboard, sticky header patterns, and PWA-friendly design principles for mobile check-in functionality.

---

### 🔒 Repository Security Pattern (2026-02-09) - ✅ PROMOTED
**Promoted to:** `_cloudy-ops/policy/repository-security-for-external-contributors.md` (P-014)  
**Commit:** e9fd979  
**Date:** 2026-02-09

Comprehensive policy for protecting infrastructure while enabling external collaboration on application repositories.

