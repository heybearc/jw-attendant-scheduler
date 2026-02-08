# Discoveries to Promote to Control Plane

## Promoted Items

### ✅ /release Workflow - MCP Server Direct Usage (2026-02-07)
- Promoted to control plane
- Updated: `.cloudy-work/_cloudy-ops/docs/workflows/theoshift/release.md`
- Changed from shell script to MCP server with `requireApproval=false`
- Eliminates redundant approval steps

### ✅ NEXTAUTH Configuration (2026-02-05)
- Promoted to control plane as D-023
- Runbook created: `_cloudy-ops/runbooks/nextauth-blue-green-config.md`
- Available for LDC Tools and QuantShift

## New Discoveries to Promote

### qa-01 Dynamic STANDBY Testing Pattern (2026-02-08)
**Type:** infrastructure
**Target:** `_cloudy-ops/docs/infrastructure/qa-01-dynamic-standby-testing.md`
**Affects:** all apps using blue-green deployment
**Date:** 2026-02-08

**Discovery:**
qa-01 tests were initially configured to test production URLs (https://theoshift.com), but for blue-green deployments, tests MUST run against STANDBY before traffic switch to verify readiness.

**Solution Implemented:**
1. **Helper Scripts on qa-01:**
   - `/opt/tests/shared/detect-standby.sh [app]` - Queries HAProxy stats to determine STANDBY
   - `/opt/tests/shared/run-tests-against-standby.sh [app] [test-suite]` - Runs tests against detected STANDBY

2. **Dynamic URL Override:**
   - Playwright config supports `BASE_URL` environment variable override
   - Tests can target: production, green.theoshift.com, or blue.theoshift.com
   - Runtime override: `BASE_URL=https://green.theoshift.com npm run test:e2e`

3. **Blue-Green Testing Workflow:**
   - Before `/release`: Tests run against STANDBY (green or blue)
   - After `/release`: STANDBY becomes LIVE, old LIVE becomes new STANDBY
   - Tests verify STANDBY readiness before traffic switch

**Implementation Details:**
- HAProxy stats endpoint: `http://10.92.3.26:8404/stats/;csv`
- Parse backend status to determine which server is STANDBY
- Return appropriate URL (e.g., `https://green.theoshift.com`)
- Test runner automatically detects and uses STANDBY URL

**Benefits:**
- ✅ Tests verify STANDBY before traffic switch
- ✅ Prevents deploying broken code to production
- ✅ Supports dynamic blue-green rotation
- ✅ No manual URL configuration needed

**Applies To:**
- TheoShift (implemented)
- LDC Tools (pending)
- QuantShift (pending)
- Any app using blue-green deployment pattern

**Files to Create in Control Plane:**
- `_cloudy-ops/docs/infrastructure/qa-01-dynamic-standby-testing.md` - Full documentation
- Update `_cloudy-ops/docs/infrastructure/qa-01-testing-runbook.md` - Add STANDBY detection section
- Update `_cloudy-ops/context/APP-MAP.md` - Mark TheoShift as fully configured with dynamic testing
