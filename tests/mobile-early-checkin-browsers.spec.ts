import { test, expect, Page } from '@playwright/test'

/**
 * Cross-browser mobile audit for volunteer Early Check-In.
 * Uses staff credentials (magic-link PIN UI was removed from /volunteer/login).
 */

async function staffLogin(page: Page) {
  const email = process.env.TEST_USER_EMAIL || ''
  const password = process.env.TEST_USER_PASSWORD || ''
  expect(email, 'TEST_USER_EMAIL required').toBeTruthy()
  expect(password, 'TEST_USER_PASSWORD required').toBeTruthy()

  await page.goto('/auth/signin')
  await page.waitForLoadState('domcontentloaded')

  const oversight = page.locator('button:has-text("Oversight")')
  if (await oversight.isVisible({ timeout: 5000 }).catch(() => false)) {
    await oversight.click()
  }

  await page.waitForSelector('input[id="oversight-email"], input[id="email"]', {
    state: 'visible',
    timeout: 15000,
  })
  if (await page.locator('input[id="oversight-email"]').count()) {
    await page.fill('input[id="oversight-email"]', email)
    await page.fill('input[id="oversight-password"]', password)
  } else {
    await page.fill('input[id="email"]', email)
    await page.fill('input[id="password"]', password)
  }

  await Promise.all([
    page.waitForURL(/\/(dashboard|events|volunteer)/, { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ])
}

async function firstIvsEventId(page: Page): Promise<string | null> {
  const base = process.env.BASE_URL || ''
  const resp = await page.request.get(`${base}/api/events`)
  if (!resp.ok()) return null
  const body = await resp.json()
  const events = body?.data?.events || body?.events || body
  if (!Array.isArray(events) || !events.length) return null
  const ivs = events.find((e: { name?: string }) => /IVS/i.test(e.name || ''))
  return (ivs || events[0])?.id || null
}

test.describe('Mobile Early Check-In browser audit', () => {
  test('early-checkin page + day tabs work on mobile viewport', async ({ page }, testInfo) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(String(err)))

    await staffLogin(page)
    const dismiss = page.getByRole('button', { name: 'Dismiss' })
    if (await dismiss.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismiss.click()
    }
    const eventId = await firstIvsEventId(page)
    test.skip(!eventId, 'No events available')

    await page.goto(`/volunteer/early-checkin?eventId=${encodeURIComponent(eventId!)}`, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page).toHaveURL(/\/volunteer\/early-checkin/, { timeout: 15000 })

    // Either Check-In UI or Access Denied (event without IVS) — both must render cleanly
    const heading = page.getByRole('heading', { name: /IVS Early Check-In|Access Denied/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    const hasAccess = await page.getByRole('heading', { name: /IVS Early Check-In/i }).isVisible()
    testInfo.annotations.push({
      type: 'access',
      description: hasAccess ? 'granted' : 'denied-no-ivs-or-rights',
    })

    if (hasAccess) {
      for (const day of ['Today', 'Fri', 'Sat', 'Sun']) {
        const tab = page.getByRole('button', { name: new RegExp(`^${day}`) })
        await expect(tab).toBeVisible()
        const box = await tab.boundingBox()
        expect(box, `${day} tab hit target`).toBeTruthy()
        expect(box!.height).toBeGreaterThanOrEqual(40)
        await tab.click()
        await expect(tab).toHaveClass(/bg-blue-600/)
      }

      await expect(
        page
          .locator('text=Loading...')
          .or(page.locator('text=PENDING'))
          .or(page.locator('text=not a convention day'))
          .or(page.locator('text=Could not load'))
          .or(page.locator('text=No pending check-ins'))
          .or(page.locator('text=CHECKED IN')),
      ).toBeVisible({ timeout: 15000 })

      const checkInNav = page.locator('nav a, nav [aria-disabled="true"]').filter({
        hasText: 'Check-In',
      })
      await expect(checkInNav.first()).toBeVisible()
      const navBox = await page.locator('nav').last().boundingBox()
      expect(navBox!.height).toBeGreaterThanOrEqual(48)
    }

    // Search input (when present) must be ≥16px to avoid iOS zoom
    const search = page.locator('input[type="search"], input[placeholder*="Search"]').first()
    if (await search.count()) {
      const fontSize = await search.evaluate((el) => getComputedStyle(el).fontSize)
      expect(parseFloat(fontSize)).toBeGreaterThanOrEqual(16)
    }

    const fatal = consoleErrors.filter(
      (e) => !/favicon|Download the React DevTools|third-party|hydration|net::ERR_/i.test(e),
    )
    expect(fatal, `Console errors on ${testInfo.project.name}: ${fatal.join(' | ')}`).toHaveLength(
      0,
    )
  })
})
