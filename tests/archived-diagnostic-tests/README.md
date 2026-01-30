# Archived Diagnostic Tests

**Date Archived:** 2026-01-30  
**Reason:** Diagnostic tests created during troubleshooting that are no longer needed in production test suite

## Policy Violation Identified

These tests were created to diagnose specific issues during development but were not removed after the issues were resolved. This violates testing best practices:

1. **Diagnostic tests should be temporary** - Created to troubleshoot, deleted when issue is resolved
2. **Test suite should only contain production tests** - Tests that validate ongoing functionality
3. **Debugging artifacts pollute CI/CD** - Increase test run time and create false failures

## Archived Tests

### Initial Archive (2026-01-30 AM)
- `check-event-logs.spec.ts` - Diagnostic test to capture server logs during 404 investigation
- `check-session-debug.spec.ts` - Debug test to inspect session data structure
- `event-page-diagnostic.spec.ts` - Diagnostic test for event page 404 issue (now resolved)
- `reproduce-404.spec.ts` - Test to reproduce 404 error (issue now fixed)

### Additional Archive (2026-01-30 PM)
**Fix/Issue-Specific Tests:**
- `event-page-404.spec.ts` - Test for specific 404 bug (now resolved)
- `event-selection-fix.spec.ts` - Verification test for event selection fix (now resolved)
- `simple-event-test.spec.ts` - Simple debugging test with no clear purpose

**Migration/Refactoring Tests:**
- `phase1-volunteers-route.spec.ts` - Phase 1 migration validation (attendant→volunteer)
- `phase2-volunteers-api.spec.ts` - Phase 2 API migration validation
- `phase4-api-variables.spec.ts` - Phase 4 variable naming migration validation
- `phase5-type-definitions.spec.ts` - Phase 5 TypeScript type migration validation
- `refactor-complete-suite.spec.ts` - Complete refactoring validation suite
- `refactoring-validation.spec.ts` - Week 3 refactoring validation

**Total Archived:** 13 test files

## Resolution

**Testing Policy Update Required:**
- Diagnostic tests must be clearly marked with `// DIAGNOSTIC - DELETE AFTER ISSUE RESOLVED`
- Diagnostic tests should use `.diagnostic.spec.ts` naming convention
- Add pre-commit hook to warn about diagnostic tests older than 7 days
- Document in testing guidelines

**Control Plane Promotion:**
This policy should be promoted to global-rules.md via sync-governance workflow.

## Original Issues Resolved

All issues these tests were diagnosing have been resolved:
- ✅ Event page 404 errors - Fixed by correcting BASE_URL configuration
- ✅ Session authentication - Working correctly
- ✅ Login form selectors - Fixed to use correct #email/#password IDs
