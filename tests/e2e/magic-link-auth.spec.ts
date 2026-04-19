import { test, expect } from '@playwright/test'

/**
 * Custom E2E Tests for Magic Link Authentication
 * Generated for test-release on 2026-04-19
 * 
 * Tests the new unified login page with:
 * - Role toggle (Oversight/Volunteer)
 * - Volunteer Email Link authentication
 * - Volunteer PIN authentication (backward compatibility)
 * - Oversight email/password authentication
 */

test.describe('Unified Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
  })

  test('should display unified login page with role toggle', async ({ page }) => {
    // Verify page loads
    await expect(page).toHaveTitle(/TheoShift/)
    
    // Verify logo
    await expect(page.locator('img[alt="TheoShift Logo"]')).toBeVisible()
    
    // Verify role toggle buttons
    await expect(page.locator('button:has-text("Oversight")')).toBeVisible()
    await expect(page.locator('button:has-text("Volunteer")')).toBeVisible()
    
    // Verify "Oversight" is selected by default
    const oversightButton = page.locator('button:has-text("Oversight")')
    await expect(oversightButton).toHaveClass(/bg-white/)
  })

  test('should toggle between Oversight and Volunteer roles', async ({ page }) => {
    // Click Volunteer toggle
    await page.click('button:has-text("Volunteer")')
    
    // Verify Volunteer is now active
    const volunteerButton = page.locator('button:has-text("Volunteer")')
    await expect(volunteerButton).toHaveClass(/bg-white/)
    
    // Verify role indicator shows "Signing in as Volunteer"
    await expect(page.locator('text=Signing in as Volunteer')).toBeVisible()
    
    // Click Oversight toggle
    await page.click('button:has-text("Oversight")')
    
    // Verify Oversight is now active
    const oversightButton = page.locator('button:has-text("Oversight")')
    await expect(oversightButton).toHaveClass(/bg-white/)
    
    // Verify role indicator shows "Signing in as Oversight"
    await expect(page.locator('text=Signing in as Oversight')).toBeVisible()
  })

  test('should persist role selection in localStorage', async ({ page }) => {
    // Select Volunteer role
    await page.click('button:has-text("Volunteer")')
    
    // Reload page
    await page.reload()
    
    // Verify Volunteer is still selected
    const volunteerButton = page.locator('button:has-text("Volunteer")')
    await expect(volunteerButton).toHaveClass(/bg-white/)
  })
})

test.describe('Oversight Login (Email + Password)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
  })

  test('should show email and password fields for Oversight', async ({ page }) => {
    // Ensure Oversight is selected
    await page.click('button:has-text("Oversight")')
    
    // Verify email field
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('label:has-text("Email Address")')).toBeVisible()
    
    // Verify password field
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('label:has-text("Password")')).toBeVisible()
    
    // Verify sign in button
    await expect(page.locator('button[type="submit"]:has-text("Sign In")')).toBeVisible()
  })

  test('should successfully login as Oversight user', async ({ page }) => {
    // Select Oversight role
    await page.click('button:has-text("Oversight")')
    
    // Fill in credentials
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!)
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
    
    // Click sign in
    await page.click('button[type="submit"]:has-text("Sign In")')
    
    // Wait for redirect
    await page.waitForURL(/\/events/, { timeout: 10000 })
    
    // Verify successful login (should be on events page)
    await expect(page).toHaveURL(/\/events/)
  })

  test('should show error for invalid Oversight credentials', async ({ page }) => {
    // Select Oversight role
    await page.click('button:has-text("Oversight")')
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    // Click sign in
    await page.click('button[type="submit"]:has-text("Sign In")')
    
    // Wait for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Volunteer Login - Email Link Method', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
    // Select Volunteer role
    await page.click('button:has-text("Volunteer")')
  })

  test('should show Email Link and PIN Login toggle for Volunteers', async ({ page }) => {
    // Verify method toggle
    await expect(page.locator('button:has-text("Email Link")')).toBeVisible()
    await expect(page.locator('button:has-text("PIN Login")')).toBeVisible()
    
    // Verify Email Link is selected by default
    const emailLinkButton = page.locator('button:has-text("Email Link")')
    await expect(emailLinkButton).toHaveClass(/bg-white/)
  })

  test('should show email input for Email Link method', async ({ page }) => {
    // Ensure Email Link is selected
    await page.click('button:has-text("Email Link")')
    
    // Verify email field
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('label:has-text("Email Address")')).toBeVisible()
    
    // Verify info message
    await expect(page.locator('text=We\'ll send you a secure sign-in link')).toBeVisible()
    
    // Verify send button
    await expect(page.locator('button:has-text("Send Sign-In Link")')).toBeVisible()
  })

  test('should show error for unregistered email', async ({ page }) => {
    // Select Email Link method
    await page.click('button:has-text("Email Link")')
    
    // Fill in unregistered email
    await page.fill('input[type="email"]', 'unregistered@example.com')
    
    // Click send button
    await page.click('button:has-text("Send Sign-In Link")')
    
    // Wait for error message
    await expect(page.locator('text=Email not registered')).toBeVisible({ timeout: 5000 })
  })

  test('should show success message for registered volunteer email', async ({ page }) => {
    // Select Email Link method
    await page.click('button:has-text("Email Link")')
    
    // Fill in registered volunteer email (from .env.test)
    await page.fill('input[type="email"]', 'corylallen@gmail.com')
    
    // Click send button
    await page.click('button:has-text("Send Sign-In Link")')
    
    // Wait for success screen
    await expect(page.locator('text=Check your email')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=corylallen@gmail.com')).toBeVisible()
    
    // Verify back button
    await expect(page.locator('text=Back to login')).toBeVisible()
  })
})

test.describe('Volunteer Login - PIN Method (Backward Compatibility)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
    // Select Volunteer role
    await page.click('button:has-text("Volunteer")')
    // Select PIN Login method
    await page.click('button:has-text("PIN Login")')
  })

  test('should show PIN login form fields', async ({ page }) => {
    // Verify all PIN form fields
    await expect(page.locator('label:has-text("First Name")')).toBeVisible()
    await expect(page.locator('label:has-text("Last Name")')).toBeVisible()
    await expect(page.locator('label:has-text("Congregation")')).toBeVisible()
    await expect(page.locator('label:has-text("PIN")')).toBeVisible()
    
    // Verify sign in button
    await expect(page.locator('button[type="submit"]:has-text("Sign In")')).toBeVisible()
  })

  test('should successfully login with valid PIN credentials', async ({ page }) => {
    // Fill in PIN credentials from .env.test
    await page.fill('input[id="firstName"]', process.env.VOLUNTEER_FIRST_NAME!)
    await page.fill('input[id="lastName"]', process.env.VOLUNTEER_LAST_NAME!)
    await page.fill('input[id="congregation"]', process.env.VOLUNTEER_CONGREGATION!)
    await page.fill('input[id="pin"]', process.env.VOLUNTEER_PIN!)
    
    // Click sign in
    await page.click('button[type="submit"]:has-text("Sign In")')
    
    // Wait for redirect to volunteer area
    await page.waitForURL(/\/volunteer/, { timeout: 10000 })
    
    // Verify successful login
    await expect(page).toHaveURL(/\/volunteer/)
  })

  test('should show error for invalid PIN credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[id="firstName"]', 'Invalid')
    await page.fill('input[id="lastName"]', 'User')
    await page.fill('input[id="congregation"]', 'NonExistent')
    await page.fill('input[id="pin"]', '0000')
    
    // Click sign in
    await page.click('button[type="submit"]:has-text("Sign In")')
    
    // Wait for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 })
  })

  test('should toggle between Email Link and PIN methods', async ({ page }) => {
    // Verify PIN form is visible
    await expect(page.locator('input[id="firstName"]')).toBeVisible()
    
    // Click Email Link toggle
    await page.click('button:has-text("Email Link")')
    
    // Verify Email Link form is now visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button:has-text("Send Sign-In Link")')).toBeVisible()
    
    // Verify PIN form is hidden
    await expect(page.locator('input[id="firstName"]')).not.toBeVisible()
  })
})

test.describe('Old Volunteer Login URL Redirect', () => {
  test('should redirect from /volunteer/login to unified page', async ({ page }) => {
    // Go to old volunteer login URL
    await page.goto('/volunteer/login')
    
    // Should redirect to unified login with volunteer role
    await page.waitForURL(/\/auth\/signin\?role=volunteer/, { timeout: 5000 })
    
    // Verify Volunteer role is selected
    const volunteerButton = page.locator('button:has-text("Volunteer")')
    await expect(volunteerButton).toHaveClass(/bg-white/)
  })

  test('should preserve callbackUrl when redirecting', async ({ page }) => {
    // Go to old volunteer login URL with callbackUrl
    await page.goto('/volunteer/login?callbackUrl=/volunteer/dashboard')
    
    // Should redirect with both role and callbackUrl preserved
    await page.waitForURL(/\/auth\/signin\?role=volunteer&callbackUrl=/, { timeout: 5000 })
    
    // Verify URL contains both parameters
    expect(page.url()).toContain('role=volunteer')
    expect(page.url()).toContain('callbackUrl')
  })
})

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test('should be mobile-friendly', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Verify logo is visible
    await expect(page.locator('img[alt="TheoShift Logo"]')).toBeVisible()
    
    // Verify role toggle is visible and usable
    await expect(page.locator('button:has-text("Oversight")')).toBeVisible()
    await expect(page.locator('button:has-text("Volunteer")')).toBeVisible()
    
    // Test toggle on mobile
    await page.click('button:has-text("Volunteer")')
    const volunteerButton = page.locator('button:has-text("Volunteer")')
    await expect(volunteerButton).toHaveClass(/bg-white/)
  })
})
