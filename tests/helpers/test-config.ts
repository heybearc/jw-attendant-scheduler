/**
 * Test Configuration Helper
 * Provides BASE_URL from environment for consistent test execution
 */

import { Page } from '@playwright/test'

export const getBaseUrl = (): string => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001'
  return baseUrl
}

export const getTestCredentials = () => {
  return {
    email: process.env.TEST_USER_EMAIL || 'admin@theoshift.local',
    password: process.env.TEST_USER_PASSWORD || 'AdminPass123!'
  }
}

export async function getValidEventId(page: Page): Promise<string> {
  const baseUrl = getBaseUrl()
  const response = await page.request.get(`${baseUrl}/api/events`)
  if (response.ok()) {
    const body = await response.json()
    const events = body?.data?.events || body?.events || body
    if (Array.isArray(events) && events.length > 0) {
      const id = events[0].id
      if (id) return id
    }
  }
  throw new Error('Could not find a valid event ID via API')
}
