# Testing Policy - TheoShift

**Date Created:** 2026-01-30  
**Status:** Active - Pending Control Plane Promotion

## Issue Identified

During test suite cleanup on 2026-01-30, we discovered 4 diagnostic/debugging tests that were created during troubleshooting but never removed after issues were resolved. These tests:

1. Polluted the test suite with false failures
2. Increased CI/CD run time unnecessarily  
3. Created confusion about actual test status
4. Violated testing best practices

## Root Cause

**No formal policy existed for diagnostic test lifecycle management.**

Tests were created ad-hoc during debugging without:
- Clear naming conventions to identify them as temporary
- Documentation of their purpose and removal criteria
- Automated checks to prevent long-lived diagnostic tests
- Guidelines on when to archive vs delete

## Resolution - Testing Policy

### 1. Diagnostic Test Naming Convention

Diagnostic tests MUST use `.diagnostic.spec.ts` suffix:
```
✅ event-page-404.diagnostic.spec.ts
❌ event-page-404.spec.ts (for diagnostic test)
```

### 2. Diagnostic Test Header

All diagnostic tests MUST include header comment:
```typescript
/**
 * DIAGNOSTIC TEST - DELETE AFTER ISSUE RESOLVED
 * Issue: [Brief description]
 * Created: [Date]
 * Remove when: [Specific condition]
 */
```

### 3. Diagnostic Test Lifecycle

- **Creation:** Clearly marked with naming convention and header
- **Duration:** Maximum 7 days in active test suite
- **Resolution:** Archive to `tests/archived-diagnostic-tests/` with README explaining resolution
- **Deletion:** After 30 days in archive (if no longer needed for reference)

### 4. Playwright Config

Update `playwright.config.ts` to exclude archived tests:
```typescript
testIgnore: '**/archived-diagnostic-tests/**'
```

### 5. Pre-commit Hook (Future)

Add git hook to warn about:
- Diagnostic tests older than 7 days
- Tests with "debug", "diagnostic", "reproduce" in filename without proper suffix

## Production Test Guidelines

### What Belongs in Production Test Suite

✅ **Feature tests** - Validate core functionality  
✅ **Regression tests** - Prevent known bugs from returning  
✅ **Integration tests** - Verify system components work together  
✅ **E2E tests** - Validate critical user workflows  

### What Does NOT Belong

❌ **Diagnostic tests** - Temporary troubleshooting tests  
❌ **Debug tests** - One-off investigation tests  
❌ **Reproduction tests** - Tests to reproduce specific bugs (archive after fix)  
❌ **Experiment tests** - Tests exploring potential issues  

## Enforcement

1. **Code Review:** Reviewers must check for diagnostic test cleanup
2. **CI/CD:** Test suite must maintain >90% pass rate
3. **Documentation:** All test failures must be tracked and resolved
4. **Archival:** Diagnostic tests archived with documentation of resolution

## Control Plane Promotion

This policy should be promoted to `.cloudy-work/_cloudy-ops/global-rules.md` via `/sync-governance` workflow to apply across all projects.

### Proposed Global Rule Addition

```markdown
## Testing Standards

### Diagnostic Test Management

1. **Naming:** Diagnostic tests use `.diagnostic.spec.ts` suffix
2. **Lifecycle:** Maximum 7 days in active suite, then archive
3. **Documentation:** Header comment with issue, date, removal criteria
4. **Archival:** Move to `tests/archived-diagnostic-tests/` with README
5. **Cleanup:** Delete from archive after 30 days if no longer needed

### Test Suite Health

- Production test suite must maintain >90% pass rate
- All test failures must be investigated within 24 hours
- Failing tests block releases per CI/CD policy
- Test suite run time should be optimized (target <10 minutes)
```

## Related Files

- `tests/archived-diagnostic-tests/README.md` - Archive documentation
- `playwright.config.ts` - Test configuration with exclusions
- `.cloudy-work/_cloudy-ops/global-rules.md` - Control plane rules (pending update)

## Archived Tests (2026-01-30)

- `check-event-logs.spec.ts` - Server log capture test
- `check-session-debug.spec.ts` - Session inspection test  
- `event-page-diagnostic.spec.ts` - 404 diagnostic test
- `reproduce-404.spec.ts` - 404 reproduction test

All issues these tests diagnosed have been resolved.
