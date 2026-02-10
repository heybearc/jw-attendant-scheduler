# Discoveries to Promote to Control Plane

## New Discoveries to Promote

### 1. Test Creation Guidelines and Authentication Patterns (2026-02-10) - ⏳ PENDING
**Source:** `tests/TEST_CREATION_GUIDELINES.md`  
**Proposed location:** `_cloudy-ops/docs/testing/test-creation-guidelines.md`  
**Priority:** HIGH

**What it provides:**
- Reusable authentication patterns for Playwright tests
- Navigation helpers (navigateToEventPage, navigateToEventById)
- Module detection pattern for optional features
- Best practices and common pitfalls
- Complete test file template

**Why promote:** Prevents authentication timeout issues across all apps. Standardizes test creation patterns. Universal pattern for any app with E2E tests.

**Impact:** All apps with Playwright tests can use this pattern to avoid manual authentication implementation and timeout issues.

---

### 2. Help Documentation Strategy (2026-02-10) - ⏳ PENDING
**Source:** `pages/help/ivs-approvals.tsx` (pattern)  
**Proposed location:** `_cloudy-ops/docs/documentation/help-documentation-pattern.md`  
**Priority:** MEDIUM

**What it provides:**
- User-friendly language guidelines (no technical jargon)
- Step-by-step guide structure with "What you'll see" sections
- FAQ section patterns
- Role-based access control implementation
- Help index integration pattern

**Why promote:** Ensures consistent, high-quality help documentation across all apps. Part of /bump workflow checklist.

**Impact:** All apps can create consistent user-facing documentation that follows the same patterns and quality standards.

---

### 3. Mobile-First Check-In Interface Pattern (2026-02-10) - ⏳ PENDING
**Source:** `pages/events/[id]/ivs-checkin.tsx`  
**Proposed location:** `_cloudy-ops/docs/ui-patterns/mobile-checkin-interface.md`  
**Priority:** LOW

**What it provides:**
- Large touch targets (44px minimum)
- Real-time search with auto-filtering
- Stats dashboard design pattern
- Sticky header patterns
- PWA-friendly design principles

**Why promote:** Reusable pattern for any app needing mobile check-in functionality.

**Impact:** Apps needing mobile check-in interfaces can follow this proven pattern.

---

## Promoted Items

### 🔒 Repository Security Pattern (2026-02-09) - ✅ PROMOTED
**Promoted to:** `_cloudy-ops/policy/repository-security-for-external-contributors.md` (P-014)  
**Commit:** e9fd979  
**Date:** 2026-02-09

Comprehensive policy for protecting infrastructure while enabling external collaboration on application repositories.
