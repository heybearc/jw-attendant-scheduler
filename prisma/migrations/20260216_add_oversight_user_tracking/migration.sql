-- Add userId field to track linked user for Department Overseer
ALTER TABLE "events" ADD COLUMN "department_overseer_user_id" TEXT;

-- Note: departmentOverseerAssistants and keyman JSON fields will store userId within each object
-- Example: [{"name": "John Doe", "phone": "555-0123", "email": "john@example.com", "userId": "user-123"}]
