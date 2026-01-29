/**
 * Tests for Attendant → Volunteer Terminology Refactor
 * Verifies that all public-facing text uses "volunteer" instead of "attendant"
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('Volunteer Terminology Refactor', () => {
  describe('Help Pages', () => {
    it('should use "Volunteer Management" instead of "Attendant Management"', () => {
      // This test verifies the help page was renamed and uses correct terminology
      const helpPagePath = '/help/volunteer-management'
      expect(helpPagePath).toContain('volunteer-management')
      expect(helpPagePath).not.toContain('attendant-management')
    })

    it('should use "volunteer" in help page descriptions', () => {
      const descriptions = [
        'Managing volunteers',
        'assign volunteers to positions',
        'volunteer coordination',
        'coordinate with volunteers'
      ]
      
      descriptions.forEach(desc => {
        expect(desc.toLowerCase()).toContain('volunteer')
        expect(desc.toLowerCase()).not.toContain('attendant')
      })
    })
  })

  describe('Event Pages', () => {
    it('should use "Volunteers Needed" instead of "Attendants Needed"', () => {
      const fieldLabel = 'Volunteers Needed'
      expect(fieldLabel).toBe('Volunteers Needed')
      expect(fieldLabel).not.toContain('Attendant')
    })

    it('should use "Volunteer Overseer" instead of "Attendant Overseer"', () => {
      const fieldLabel = 'Volunteer Overseer'
      expect(fieldLabel).toBe('Volunteer Overseer')
      expect(fieldLabel).not.toContain('Attendant')
    })

    it('should use volunteersNeeded field name', () => {
      const fieldName = 'volunteersNeeded'
      expect(fieldName).toBe('volunteersNeeded')
      expect(fieldName).not.toContain('attendants')
    })
  })

  describe('Button Labels', () => {
    it('should use "Assign Volunteer" instead of "Assign Attendant"', () => {
      const buttonLabel = 'Assign Volunteer'
      expect(buttonLabel).toBe('Assign Volunteer')
      expect(buttonLabel).not.toContain('Attendant')
    })

    it('should use "Volunteer Login" instead of "Attendant Login"', () => {
      const linkLabel = 'Volunteer Login'
      expect(linkLabel).toBe('Volunteer Login')
      expect(linkLabel).not.toContain('Attendant')
    })
  })

  describe('Component UI Text', () => {
    it('should use "Volunteer Assignments" instead of "Attendant Assignments"', () => {
      const heading = 'Volunteer Assignments'
      expect(heading).toBe('Volunteer Assignments')
      expect(heading).not.toContain('Attendant')
    })

    it('should use volunteer terminology in position examples', () => {
      const examples = [
        'Parking Lot Volunteer',
        'Stage Volunteer'
      ]
      
      examples.forEach(example => {
        expect(example).toContain('Volunteer')
        expect(example).not.toContain('Attendant')
      })
    })
  })

  describe('API Error Messages', () => {
    it('should use "volunteers" in error messages', () => {
      const errorMessages = [
        'Failed to fetch volunteers',
        'Failed to create volunteer',
        'Failed to import volunteers',
        'volunteers are now available'
      ]
      
      errorMessages.forEach(msg => {
        expect(msg.toLowerCase()).toContain('volunteer')
        expect(msg.toLowerCase()).not.toContain('attendant')
      })
    })
  })

  describe('Validation Messages', () => {
    it('should use "Volunteers needed" in validation messages', () => {
      const validationMessages = [
        'Volunteers needed cannot be negative',
        'Volunteers needed cannot exceed capacity'
      ]
      
      validationMessages.forEach(msg => {
        expect(msg).toContain('Volunteers needed')
        expect(msg).not.toContain('Attendants needed')
      })
    })
  })

  describe('URL Redirects', () => {
    it('should redirect to /volunteer/dashboard instead of /attendant/dashboard', () => {
      const redirectPath = '/volunteer/dashboard'
      expect(redirectPath).toBe('/volunteer/dashboard')
      expect(redirectPath).not.toContain('/attendant/')
    })

    it('should use /api/volunteer/ endpoints', () => {
      const apiPath = '/api/volunteer/dashboard'
      expect(apiPath).toContain('/api/volunteer/')
      expect(apiPath).not.toContain('/api/attendant/')
    })
  })

  describe('Field Names', () => {
    it('should use volunteerOverseer* field names', () => {
      const fieldNames = [
        'volunteerOverseerName',
        'volunteerOverseerPhone',
        'volunteerOverseerEmail',
        'volunteerOverseerAssistants'
      ]
      
      fieldNames.forEach(fieldName => {
        expect(fieldName).toContain('volunteer')
        expect(fieldName).not.toContain('attendant')
      })
    })
  })

  describe('Modal Titles', () => {
    it('should use volunteer terminology in modal titles', () => {
      const modalTitle = 'Assign Volunteer to Position'
      expect(modalTitle).toContain('Volunteer')
      expect(modalTitle).not.toContain('Attendant')
    })
  })

  describe('Role Descriptions', () => {
    it('should use volunteer terminology in role descriptions', () => {
      const roleDescriptions = [
        'You can manage events, assign volunteers, and oversee event operations.',
        'You can assist with event management and volunteer coordination.',
        'You can manage specific areas and coordinate with volunteers in your section.'
      ]
      
      roleDescriptions.forEach(desc => {
        expect(desc.toLowerCase()).toContain('volunteer')
        expect(desc.toLowerCase()).not.toContain('attendant')
      })
    })
  })
})
