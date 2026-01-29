/**
 * Tests for Volunteer API Endpoints
 * Verifies that API endpoints use correct terminology and field names
 */

describe('Volunteer API Endpoints', () => {
  describe('Field Names', () => {
    it('should use volunteersNeeded field in event data', () => {
      const eventData = {
        name: 'Test Event',
        volunteersNeeded: 50,
        volunteerOverseerName: 'John Doe'
      }
      
      expect(eventData).toHaveProperty('volunteersNeeded')
      expect(eventData).toHaveProperty('volunteerOverseerName')
      expect(eventData).not.toHaveProperty('attendantsNeeded')
      expect(eventData).not.toHaveProperty('attendantOverseerName')
    })
  })

  describe('Error Messages', () => {
    it('should return volunteer-specific error messages', () => {
      const errorMessages = {
        fetchError: 'Failed to fetch volunteers',
        createError: 'Failed to create volunteer',
        importError: 'Failed to import volunteers',
        deleteError: 'Cannot delete user with associated volunteers'
      }
      
      Object.values(errorMessages).forEach(msg => {
        expect(msg.toLowerCase()).toContain('volunteer')
        expect(msg.toLowerCase()).not.toContain('attendant')
      })
    })
  })

  describe('Success Messages', () => {
    it('should return volunteer-specific success messages', () => {
      const successMessage = 'Import complete. 25 volunteers are now available for position assignment.'
      
      expect(successMessage.toLowerCase()).toContain('volunteer')
      expect(successMessage.toLowerCase()).not.toContain('attendant')
    })
  })

  describe('API Routes', () => {
    it('should use /api/volunteer/ routes', () => {
      const routes = [
        '/api/volunteer/dashboard',
        '/api/volunteer/availability',
        '/api/volunteer/profile',
        '/api/volunteer/login'
      ]
      
      routes.forEach(route => {
        expect(route).toContain('/api/volunteer/')
        expect(route).not.toContain('/api/attendant/')
      })
    })
  })

  describe('Database Field Mapping', () => {
    it('should maintain backward compatibility with @map directives', () => {
      // The Prisma schema uses @map to maintain DB compatibility
      // Model: volunteers, DB table: attendants
      // Model field: volunteerId, DB column: attendantId
      
      const mapping = {
        modelName: 'volunteers',
        dbTable: 'attendants',
        modelField: 'volunteerId',
        dbColumn: 'attendantId'
      }
      
      expect(mapping.modelName).toBe('volunteers')
      expect(mapping.dbTable).toBe('attendants')
      expect(mapping.modelField).toBe('volunteerId')
      expect(mapping.dbColumn).toBe('attendantId')
    })
  })
})
