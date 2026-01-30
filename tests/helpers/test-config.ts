/**
 * Test Configuration Helper
 * Provides BASE_URL from environment for consistent test execution
 */

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
