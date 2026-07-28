import { test, expect, Page } from '@playwright/test'

/**
 * Cross-browser mobile audit for volunteer Early Check-In.
 * Run with projects: Mobile Chrome, Mobile Safari, Mobile Firefox, iPad.
 */

async function volunteerLogin(page: Page) {
  const firstName = process.env.VOLUNTEER_FIRST_NAME || 'Cory'
  const lastName = process.env.VOLUNTEER_LAST_NAME || 'Allen'
  const congregation = process.env.VOLUNTEER_CONGREGATION || 'Twinsburg'
  const pin = process.env.VOLUNTEER_PIN || ''

  await page.goto('/volunteer/login')
  await expect(page.getByRole('heading', { name: /Volunteer Access/i })).toBeVisible({
    timeout: 20000,
  })
  await page.fill('input[name="firstName"]', firstName)
  await page.fill('input[name="lastName"]', lastName)
  await page.fill('input[name="congregation"]', congregation)
  await page.fill('input[name="pin"]', pin)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/volunteer\/(select-event|dashboard)/, { timeout: 20000 })
}

async function resolveEventId(page: Page): Promise<string | null> {
  const fromUrl = page.url().match(/eventId=([^&]+)/)
  if (fromUrl?.[1]) return decodeURIComponent(fromUrl[1])

  const sessionResp = await page.request.get('/api/auth/session')
  if (!sessionResp.ok()) return null
  const session = await sessionResp.json()
  const volunteerId = session?.user?.id
  if (!volunteerId) return null

  const eventsResp = await page.request.get(
    `/api/volunteer/events?volunteerId=${encodeURIComponent(volunteerId)}`,
  )
  if (!eventsResp.ok()) return null
  const body = await eventsResp.json()
  const events = body?.data?.events || []
  return events[0]?.id || null
}

test.describe('Mobile Early Check-In browser audit', () => {
  test('bottom nav Check-In opens and day tabs work', async ({ page }, testInfo) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(String(err)))

    await volunteerLogin(page)
    const eventId = await resolveEventId(page)
    test.skip(!eventId, 'No volunteer event available for audit account')

    await page.goto(`/volunteer/dashboard?eventId=${encodeURIComponent(eventId!)}`)
    await page.waitForLoadState('domcontentloaded')

    const checkInNav = page.locator('nav').getByText('Check-In', { exact: true })
    await expect(checkInNav).toBeVisible({ timeout: 20000 })

    // If enabled, nav is a link; if disabled, still visible but greyed
    const checkInLink = page.locator('nav a').filter({ hasText: 'Check-In' })
    const enabled = (await checkInLink.count()) > 0
    testInfo.annotations.push({
      type: 'checkin-nav',
      description: enabled ? 'enabled' : 'disabled',
    })

    if (!enabled) {
      // Still assert no hard JS crashes on dashboard
      expect(consoleErrors.filter((e) => !e.includes('favicon')).length).toBe(0)
      test.skip(true, 'Check-In disabled for this volunteer/event — roster/IVS gate')
      return
    }

    await checkInLink.click()
    await expect(page).toHaveURL(/\/volunteer\/early-checkin\?eventId=/, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: /IVS Early Check-In/i })).toBeVisible({
      timeout: 15000,
    })

    for (const day of ['Today', 'Fri', 'Sat', 'Sun']) {
      const tab = page.getByRole('button', { name: new RegExp(`^${day}`) })
      await expect(tab).toBeVisible()
      await tab.click()
      await expect(tab).toHaveClass(/bg-blue-600/)
    }

    // List area either loads, shows empty day message, or a clear error — never blank forever
    await expect(
      page
        .locator('text=Loading...')
        .or(page.locator('text=PENDING'))
        .or(page.locator('text=not a convention day'))
        .or(page.locator('text=Could not load'))
        .or(page.locator('text=No pending check-ins'))
        .or(page.locator('text=CHECKED IN')),
    ).toBeVisible({ timeout: 15000 })

    // Bottom nav still reachable above home indicator region
    const navBox = await page.locator('nav').last().boundingBox()
    expect(navBox).toBeTruthy()
    expect(navBox!.height).toBeGreaterThanOrEqual(48)

    const fatal = consoleErrors.filter(
      (e) =>
        !/favicon|Download the React DevTools|third-party|hydration/i.test(e),
    )
    expect(fatal, `Console errors on ${testInfo.project.name}: ${fatal.join(' | ')}`).toHaveLength(
      0,
    )
  })
})
