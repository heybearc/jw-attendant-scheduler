import { test, expect } from '@playwright/test'
import { getTestCredentials, getValidEventId } from '../helpers/test-config'

test.describe('Chat pinning (release gate)', () => {
  test('staff can pin and volunteer can see pinned message', async ({ page }) => {
    const creds = getTestCredentials()

    await page.goto('/auth/signin')
    await page.click('button:has-text("Oversight")')
    await page.fill('input[type="email"]', creds.email)
    await page.fill('input[type="password"]', creds.password)
    await page.click('button[type="submit"]:has-text("Sign In")')
    await page.waitForURL(/\/events/, { timeout: 15000 })

    const eventId = await getValidEventId(page)

    // Staff chat: send message, pin it, and verify pinned panel
    await page.goto(`/events/${eventId}/chat`)
    await expect(page.locator('text=Staff Chat')).toBeVisible({ timeout: 15000 })

    const msg = `Pin test ${Date.now()}`
    await page.fill('textarea[placeholder="Send a message to this channel..."]', msg)
    await page.click('button:has-text("Send")')
    await expect(page.locator(`text=${msg}`)).toBeVisible({ timeout: 15000 })

    // Pin the message we just sent
    page.once('dialog', (d) => d.accept())
    await page.locator('button:has-text("Pin")').first().click()

    await expect(page.getByText('Pinned message', { exact: true })).toBeVisible({ timeout: 15000 })
    await expect(page.locator(`text=${msg}`)).toBeVisible()

    // Find a volunteer to view-as
    const volsRes = await page.request.get(`/api/events/${eventId}/volunteers`)
    expect(volsRes.ok()).toBeTruthy()
    const volsJson: any = await volsRes.json()
    let volunteerId = volsJson?.volunteers?.[0]?.id

    // Ensure we have at least one volunteer to view-as (release gate must be deterministic)
    if (!volunteerId) {
      const createRes = await page.request.post(`/api/events/${eventId}/volunteers`, {
        data: {
          firstName: 'Test',
          lastName: 'Volunteer',
          email: `test.volunteer.${Date.now()}@example.com`,
          phone: '555-0100',
          congregation: 'Test Congregation',
          formsOfService: ['Elder'],
        },
      })
      expect(createRes.ok()).toBeTruthy()
      const created: any = await createRes.json()
      volunteerId = created?.data?.id || created?.volunteer?.id || created?.id
    }

    expect(typeof volunteerId).toBe('string')

    // Volunteer chat (admin view-as): should see pinned message
    await page.addInitScript((id) => {
      window.localStorage.setItem('adminViewAsVolunteerId', id as string)
    }, volunteerId)

    await page.goto(`/volunteer/chat?eventId=${eventId}&viewAsVolunteerId=${volunteerId}`)
    await expect(page).toHaveURL(/\/volunteer\/chat/, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: /Event Chat/i })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Pinned message', { exact: true })).toBeVisible({ timeout: 15000 })
    await expect(page.locator(`text=${msg}`)).toBeVisible()
  })
})

