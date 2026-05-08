# Test Failures Log

## 2026-05-08 — qa-01 E2E (`/test-release` before v4.21.4 bump)

- **Suite:** `npm run test:e2e` (smoke + release-gate)
- **Target:** per `.env.test` on qa-01 (STANDBY URL)
- **Result:** 4 passed, 1 skipped
- **Outcome:** Green for bump / release

---

## 2026-05-08 — qa-01 E2E (`/test-release` before v4.21.3 bump)

- **Suite:** `npm run test:e2e` (smoke + release-gate)
- **Target:** per `.env.test` on qa-01 (STANDBY URL)
- **Result:** 4 passed, 1 skipped
- **Outcome:** Green for bump / release

---

## 2026-05-07 — qa-01 E2E (`/test-release` before v4.21.2 bump)

- **Suite:** `npm run test:e2e` (smoke + release-gate)
- **Target:** per `.env.test` on qa-01 (STANDBY URL)
- **Result:** 4 passed, 1 skipped
- **Outcome:** Green for bump / release

---

## 2026-05-06 — qa-01 E2E (`/test-release` before v4.21.1 bump)

- **Suite:** `npm run test:e2e` (smoke + release-gate)
- **Target:** `BASE_URL=https://blue.theoshift.com` (STANDBY)
- **Result:** 4 passed, 1 skipped
- **Outcome:** Green for bump / release

---

## 2026-05-06 — qa-01 E2E (`/test-release` before v4.21.0)

- **Suite:** `npm run test:e2e` (smoke + release-gate)
- **Result:** 4 passed, 1 skipped
- **Outcome:** Green for bump / release

---

**Date:** 2026-02-17  
**Test Run:** Pre-Release Testing for Phase 1-3 Deployment  
**Target:** STANDBY (green.theoshift.com)

## Summary

**Total Tests:** 123  
**Passed:** 90 (73%)  
**Failed:** 16 (13%)  
**Skipped:** 17 (14%)

**Critical Tests Status:**
- ✅ Phase 1-3 specific tests: 5/5 passed (100%)
- ✅ Core smoke tests: 10/10 passed (100%)
- ✅ Event management: 4/4 passed (100%)
- ✅ Position management: 3/3 passed (100%)

## Failing Tests (16 total)

### Category 1: Mobile Volunteer Features (14 failures)
**Status:** Not related to Phase 1-3 work  
**Priority:** Medium - Review and fix or remove  
**Impact:** Mobile volunteer portal functionality

#### Tests:
1. `phase7-mobile-features.spec.ts` - Volunteer login redirects correctly
2. `phase7-mobile-features.spec.ts` - Mobile volunteer dashboard has 4 tabs
3. `phase7-mobile-features.spec.ts` - Documents tab is visible and functional
4. `phase7-mobile-features.spec.ts` - Sign out button is visible and works
5. `phase7-mobile-features.spec.ts` - Touch targets are at least 44px
6. `phase7-mobile-features.spec.ts` - Mobile dashboard loads within 3 seconds
7. `phase7-mobile-features.spec.ts` - Refresh button works on mobile dashboard

**Root Cause:** Volunteer authentication flow issues on STANDBY environment

**Recommendation:** 
- Investigate volunteer login redirect logic
- Verify test user credentials for volunteer role
- May need to update tests if mobile volunteer feature was changed/removed

---

### Category 2: UI Modernization (7 failures)
**Status:** Not related to Phase 1-3 work  
**Priority:** Low - Review if UI modernization is planned  
**Impact:** New UI features not rendering

#### Tests:
1. `custom/ui-modernization-release.spec.ts` - Volunteers Page: compact header with inline stats pills
2. `custom/ui-modernization-release.spec.ts` - Volunteers Page: compact horizontal filter bar
3. `custom/ui-modernization-release.spec.ts` - Positions Page: Create and Bulk Create buttons
4. `custom/ui-modernization-release.spec.ts` - Positions Page: Filters dropdown with clean icon
5. `custom/ui-modernization-release.spec.ts` - Positions Page: More menu with secondary actions
6. `custom/ui-modernization-release.spec.ts` - Performance: no critical console errors on Volunteers page
7. `custom/ui-modernization-release.spec.ts` - Performance: no critical console errors on Positions page

**Root Cause:** UI elements not matching expected selectors/structure

**Recommendation:**
- Determine if UI modernization is a planned feature
- If yes: Update UI to match test expectations
- If no: Remove these tests as they're testing unreleased features

---

## Action Items

### Immediate (Before Next Release)
- [ ] None - All critical tests passing for Phase 1-3

### Short Term (Next Sprint)
- [ ] Investigate mobile volunteer login redirect issues
- [ ] Verify volunteer test user credentials
- [ ] Review UI modernization test suite relevance

### Long Term (Backlog)
- [ ] Decide: Keep or remove mobile volunteer feature tests
- [ ] Decide: Keep or remove UI modernization tests
- [ ] Update test suite to match current feature set
- [ ] Add tests for Phase 4 cleanup (template removal)

---

## Notes

- Phase 1-3 deployment is **SAFE TO PROCEED** - all critical functionality tested and passing
- Failing tests are for features outside the scope of current release
- Test suite may need cleanup to remove tests for deprecated/unreleased features
- Consider adding test coverage for:
  - Event settings tabs (Modules & Features)
  - Clone event modal with granular options
  - Module enforcement on navigation

---

## Test Environment Details

**STANDBY URL:** https://green.theoshift.com  
**Test Runner:** qa-01 (10.92.3.13)  
**Playwright Version:** 1.57.0  
**Test Event ID:** ec1e0b4d-7778-435b-8662-02d3444f4c0f (Circuit Assembly - MO - Stage)
