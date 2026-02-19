# Discoveries to Promote to Control Plane

## New Discoveries to Promote

### 🔧 MCP deploy_to_standby PM2 Process Name Mismatch (2026-02-18) - ✅ RESOLVED (2026-02-19)

**Discovery:** The `homelab-blue-green-deployment` MCP server's `deploy_to_standby` tool for `theoshift` fails at the PM2 restart step because it expects the process to be named `theoshift-green`, but the actual PM2 process on the GREEN server (10.92.3.22) is named `theoshift`.

**Error observed:**
```
[PM2][ERROR] Process or Namespace theoshift-green not found
```

**Why this matters:**
The MCP tool is the intended deployment mechanism for STANDBY — it provides health checks, backup creation, and a controlled deployment pipeline. When it fails at PM2 restart, the build completes but the server is not restarted, leaving stale code running. This forces a manual SSH fallback (`pm2 restart theoshift`) which bypasses the MCP's health check and audit trail.

**Root cause:**
The MCP server configuration in the control plane hardcodes `theoshift-green` as the PM2 process name for the GREEN server, but the PM2 ecosystem on the server uses a single generic name `theoshift` regardless of which color the server is.

**Fix options (for control plane):**
1. **Preferred:** Update the MCP server config to use `theoshift` as the PM2 process name for theoshift deployments (matches actual server state)
2. **Alternative:** Rename the PM2 process on GREEN to `theoshift-green` via `pm2 delete theoshift && pm2 start ... --name theoshift-green` and update the ecosystem config

**Workaround until fixed:**
After `deploy_to_standby` fails, SSH to GREEN and run `pm2 restart theoshift` manually to complete the deployment.

---

## Promoted Items

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

