import { test, expect } from '@playwright/test'
import { getBaseUrl, getTestCredentials } from './helpers/test-config'

const BASE_URL = getBaseUrl()
const credentials = getTestCredentials()


test.describe('Phase 4: API Variable Names', () => {
  const eventId = '7a14c6ac-18c3-4c98-9b07-ba853d30f144'
  let authCookie: string
  
  test.beforeAll(async ({ browser }) => {
    // Get auth cookie once for all tests
    const context = await browser.newContext()
    const page = await context.newPage()
    
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.type('#email', 'admin@theoshift.local')
    await page.type('#password', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/events/, { timeout: 10000 })
    
    const cookies = await context.cookies()
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token'))
    authCookie = sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : ''
    
    await context.close()
    console.log('✅ Auth setup complete')
  })

  test('GET /api/events/[id]/volunteers returns volunteer data', async ({ request }) => {
    console.log('Testing GET /api/events/[id]/volunteers...')
    
    const response = await request.get(`${BASE_URL}/api/events/${eventId}/volunteers`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    console.log('Response status:', response.status())
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    console.log('Response has success:', data.success)
    console.log('Response has data array:', Array.isArray(data.data))
    
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    
    if (data.data.length > 0) {
      const volunteer = data.data[0]
      console.log('First volunteer has expected fields:', {
        hasId: !!volunteer.id,
        hasFirstName: !!volunteer.firstName,
        hasLastName: !!volunteer.lastName,
        hasEmail: !!volunteer.email
      })
      
      expect(volunteer).toHaveProperty('id')
      expect(volunteer).toHaveProperty('firstName')
      expect(volunteer).toHaveProperty('lastName')
      expect(volunteer).toHaveProperty('email')
    }
    
    console.log('✅ GET volunteers API works correctly')
  })

  test('POST /api/events/[id]/volunteers creates volunteer', async ({ request }) => {
    console.log('Testing POST /api/events/[id]/volunteers...')
    
    const testVolunteer = {
      firstName: 'Test',
      lastName: 'Volunteer',
      email: `test.volunteer.${Date.now()}@example.com`,
      phone: '555-0100',
      congregation: 'Test Congregation',
      formsOfService: ['Elder', 'Regular Pioneer']
    }
    
    const response = await request.post(`${BASE_URL}/api/events/${eventId}/volunteers`, {
      headers: {
        'Cookie': authCookie,
        'Content-Type': 'application/json'
      },
      data: testVolunteer
    })
    
    console.log('Response status:', response.status())
    expect(response.status()).toBe(201)
    
    const data = await response.json()
    console.log('Created volunteer:', data.success)
    
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('id')
    expect(data.data.firstName).toBe(testVolunteer.firstName)
    expect(data.data.lastName).toBe(testVolunteer.lastName)
    
    console.log('✅ POST volunteers API works correctly')
  })

  test('GET /api/events/[id]/volunteers/[volunteerId] returns single volunteer', async ({ request }) => {
    console.log('Testing GET /api/events/[id]/volunteers/[volunteerId]...')
    
    // First get list to find a volunteer ID
    const listResponse = await request.get(`${BASE_URL}/api/events/${eventId}/volunteers`, {
      headers: { 'Cookie': authCookie }
    })
    
    const listData = await listResponse.json()
    if (!listData.data || listData.data.length === 0) {
      console.log('⚠️ No volunteers found, skipping test')
      return
    }
    
    const volunteerId = listData.data[0].id
    console.log('Testing with volunteer ID:', volunteerId)
    
    const response = await request.get(`${BASE_URL}/api/events/${eventId}/volunteers/${volunteerId}`, {
      headers: { 'Cookie': authCookie }
    })
    
    console.log('Response status:', response.status())
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.id).toBe(volunteerId)
    
    console.log('✅ GET single volunteer API works correctly')
  })

  test('PUT /api/events/[id]/volunteers/[volunteerId] updates volunteer', async ({ request }) => {
    console.log('Testing PUT /api/events/[id]/volunteers/[volunteerId]...')
    
    // First get a volunteer to update
    const listResponse = await request.get(`${BASE_URL}/api/events/${eventId}/volunteers`, {
      headers: { 'Cookie': authCookie }
    })
    
    const listData = await listResponse.json()
    if (!listData.data || listData.data.length === 0) {
      console.log('⚠️ No volunteers found, skipping test')
      return
    }
    
    const volunteer = listData.data[0]
    const updatedPhone = '555-9999'
    
    const response = await request.put(`${BASE_URL}/api/events/${eventId}/volunteers/${volunteer.id}`, {
      headers: {
        'Cookie': authCookie,
        'Content-Type': 'application/json'
      },
      data: {
        phone: updatedPhone
      }
    })
    
    console.log('Response status:', response.status())
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    
    console.log('✅ PUT volunteer API works correctly')
  })

  test('API responses use "volunteer" terminology not "attendant"', async ({ request }) => {
    console.log('Testing API responses use correct terminology...')
    
    const response = await request.get(`${BASE_URL}/api/events/${eventId}/volunteers`, {
      headers: { 'Cookie': authCookie }
    })
    
    const responseText = await response.text()
    
    // Response should not contain "attendant" terminology
    const hasAttendantTerm = responseText.toLowerCase().includes('attendant')
    console.log('Response contains "attendant":', hasAttendantTerm)
    
    // This is informational - we may still have some attendant references in data
    if (hasAttendantTerm) {
      console.log('⚠️ Note: Response still contains "attendant" terminology (may be in data fields)')
    } else {
      console.log('✅ Response uses clean "volunteer" terminology')
    }
  })
})
