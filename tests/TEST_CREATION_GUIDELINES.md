# Test Creation Guidelines for TheoShift

## Overview
This document provides guidelines for creating new Playwright E2E tests for TheoShift to ensure consistency and prevent common issues.

---

## ✅ Required Imports

Always import the test helpers at the top of your test file:

```typescript
import { test, expect } from '@playwright/test'
import { login, navigateToEventPage, waitForDataLoad } from '../test-helpers'
```

---

## 🔐 Authentication Pattern

**DO NOT** manually implement login logic in your tests. Always use the `login()` helper:

### ❌ WRONG - Manual Login
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/auth/signin')
  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL!)
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/events/select')
})
```

### ✅ CORRECT - Use Helper
```typescript
test.beforeEach(async ({ page }) => {
  await login(page)
  await waitForDataLoad(page)
})
```

---

## 🧭 Navigation Patterns

### Navigate to Event-Specific Pages

Use the `navigateToEventPage()` helper for event-specific pages:

```typescript
const TEST_EVENT_ID = process.env.TEST_EVENT_ID || '7a14c6ac-18c3-4c98-9b07-ba853d30f144'

test('Can access IVS Approvals page', async ({ page }) => {
  await navigateToEventPage(page, TEST_EVENT_ID, 'ivs-approvals')
  await expect(page.locator('h1')).toBeVisible()
})
```

### Navigate to General Pages

Use the `navigateTo()` helper for non-event pages:

```typescript
test('Can access admin page', async ({ page }) => {
  await navigateTo(page, '/admin/users')
  await waitForDataLoad(page)
})
```

---

## 📋 Test Structure Template

Use this template for new test files:

```typescript
import { test, expect } from '@playwright/test'
import { login, navigateToEventPage, waitForDataLoad } from '../test-helpers'

const TEST_EVENT_ID = process.env.TEST_EVENT_ID || '7a14c6ac-18c3-4c98-9b07-ba853d30f144'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await waitForDataLoad(page)
  })

  test('should do something', async ({ page }) => {
    await navigateToEventPage(page, TEST_EVENT_ID, 'page-path')
    
    // Your test assertions here
    await expect(page.locator('selector')).toBeVisible()
  })

  test('should handle another scenario', async ({ page }) => {
    await navigateToEventPage(page, TEST_EVENT_ID, 'page-path')
    
    // Your test assertions here
  })
})
```

---

## 🎯 Best Practices

### 1. Use Appropriate Timeouts
```typescript
// For elements that may load slowly
await expect(element).toBeVisible({ timeout: 10000 })

// For tables or dynamic content
await page.waitForSelector('table', { timeout: 5000 }).catch(() => {})
```

### 2. Handle Optional Elements Gracefully
```typescript
// Check if element exists before interacting
const checkbox = page.locator('input[type="checkbox"]').first()
if (await checkbox.isVisible()) {
  await checkbox.check()
}
```

### 3. Filter Console Errors Appropriately
```typescript
const errors: string[] = []
page.on('console', msg => {
  if (msg.type() === 'error') {
    errors.push(msg.text())
  }
})

// Filter out known/acceptable errors
const criticalErrors = errors.filter(err => 
  !err.includes('favicon') && 
  !err.includes('404') &&
  !err.includes('net::ERR')
)

expect(criticalErrors.length).toBe(0)
```

### 4. Use Descriptive Test Names
```typescript
// ❌ Bad
test('test 1', async ({ page }) => { ... })

// ✅ Good
test('should display IVS Approvals tab on event page', async ({ page }) => { ... })
```

### 5. Wait for Data to Load
Always call `waitForDataLoad()` after navigation:

```typescript
await navigateToEventPage(page, TEST_EVENT_ID, 'volunteers')
await waitForDataLoad(page)
```

---

## 🛠️ Available Test Helpers

### Authentication
- `login(page, email?, password?)` - Authenticate user
- `getTestCredentials()` - Get test user credentials

### Navigation
- `navigateTo(page, path)` - Navigate to any path
- `navigateToEvents(page)` - Navigate to events list
- `navigateToEventById(page, eventId)` - Navigate to specific event
- `navigateToEventPage(page, eventId, pagePath)` - Navigate to event sub-page
- `selectEvent(page, eventName?)` - Select an event from list

### Utilities
- `waitForDataLoad(page)` - Wait for loading indicators to disappear
- `isVisible(page, selector)` - Check if element is visible
- `takeScreenshotOnFailure(page, testName)` - Capture screenshot on failure

---

## 📝 Environment Variables

Tests rely on these environment variables (configured in `.env.test` on qa-01):

- `BASE_URL` - Target application URL (e.g., https://blue.theoshift.com)
- `TEST_USER_EMAIL` - Test user email
- `TEST_USER_PASSWORD` - Test user password
- `TEST_EVENT_ID` - Default event ID for testing

---

## 🚀 Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npx playwright test tests/custom/ivs-approvals.spec.ts
```

### Run Tests in UI Mode
```bash
npx playwright test --ui
```

### Run Tests with Debug
```bash
npx playwright test --debug
```

---

## ⚠️ Common Pitfalls to Avoid

1. **Don't hardcode URLs** - Use helpers and environment variables
2. **Don't implement custom login** - Use the `login()` helper
3. **Don't skip `waitForDataLoad()`** - Always wait for loading to complete
4. **Don't use brittle selectors** - Prefer text content and semantic selectors
5. **Don't forget error filtering** - Filter out known non-critical errors
6. **Don't use fixed waits** - Use `waitForSelector()` instead of `waitForTimeout()` when possible

---

## 📚 Example: Complete Test File

```typescript
import { test, expect } from '@playwright/test'
import { login, navigateToEventPage, waitForDataLoad } from '../test-helpers'

const TEST_EVENT_ID = process.env.TEST_EVENT_ID || '7a14c6ac-18c3-4c98-9b07-ba853d30f144'

test.describe('IVS Approvals Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await waitForDataLoad(page)
  })

  test('should display IVS Approvals page', async ({ page }) => {
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs-approvals')
    
    await expect(page.locator('h1:has-text("IVS Volunteer Approvals")')).toBeVisible()
    await expect(page.locator('button:has-text("Import Volunteers")')).toBeVisible()
  })

  test('should display mobile check-in interface', async ({ page }) => {
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs-checkin')
    
    await expect(page.locator('h1:has-text("Early Check-In")')).toBeVisible()
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
  })

  test('should load without critical errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await navigateToEventPage(page, TEST_EVENT_ID, 'ivs-approvals')
    
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('404') &&
      !err.includes('net::ERR')
    )
    
    expect(criticalErrors.length).toBe(0)
  })
})
```

---

## 🔄 Updating These Guidelines

When you discover new patterns or helpers, update this document to help future test creators.

**Last Updated:** February 10, 2026
