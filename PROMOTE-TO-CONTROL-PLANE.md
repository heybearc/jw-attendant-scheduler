# Discoveries to Promote to Control Plane

## New Discoveries to Promote

### 🔁 MCP `switch_traffic` ACL Overmatch Causing Wrong Routing Detection/Switches (2026-04-29)
**Promote to:** `_cloudy-ops/context/DECISIONS.md` (new decision) + `shared/mcp-servers/homelab-blue-green-mcp/server.js`  
**Type:** Critical deployment safety fix (cross-app, control-plane level)

**Issue observed:**
- TheoShift release/sync reported complete, but LIVE still served old version.
- MCP `switch_traffic`/status logic used substring ACL matching (`is_theoshift`) that also matched `is_theoshift_blue` and `is_theoshift_green`.
- Result: HAProxy line rewrites and LIVE/STANDBY detection could target the wrong line(s).

**Fix pattern:**
- In `getHAProxyBackend`, match only the exact production ACL line (`... if is_<app>$`).
- In `switch_traffic`, replace only the exact production routing line with anchored regex; never touch direct blue/green host routes.

**Validation performed:**
- Ran MCP `switch_traffic` via stdio client.
- Verified HAProxy post-switch lines and LIVE/STANDBY with `verify-live-standby.sh`.
- Confirmed LIVE now on TheoShift GREEN (`v4.17.1`) and STANDBY BLUE (`v4.17.0`) as expected.

---

### 🔒 xlsx → ExcelJS Migration Pattern (2026-02-21) - ✅ PROMOTED
**Promoted to:** `_cloudy-ops/context/DECISIONS.md` as D-027  
**Commit:** 1fb2f23 (Cloudy-Work)  
**Date:** 2026-02-21

Replace `xlsx` (abandoned, unfixable CVEs) with `exceljs`. Migration pattern documented for server-side export, client-side download, and file import. Key gotcha: `row.values` is 1-indexed in ExcelJS.

---

### ⬆️ Next.js Major Version Upgrade Pattern (2026-02-21) - ✅ PROMOTED
**Promoted to:** `_cloudy-ops/context/DECISIONS.md` as D-028  
**Commit:** 1fb2f23 (Cloudy-Work)  
**Date:** 2026-02-21

Target current stable major's latest patch (not `latest` npm tag). Pages Router async params changes do NOT apply. React upgrade optional. Config renames: `swcMinify` removed, `serverComponentsExternalPackages` → `serverExternalPackages`.

---

### 📋 Dependency Baseline Updated (2026-02-21) - ✅ PROMOTED
**Promoted to:** `_cloudy-ops/policy/dependency-stability.md`  
**Commit:** 1fb2f23 (Cloudy-Work)  
**Date:** 2026-02-21

Next.js: 14.2.14 → 15.5.12, TailwindCSS: 3.4.1 → 3.4.17, ExcelJS 4.4.0 added (xlsx removed).

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

