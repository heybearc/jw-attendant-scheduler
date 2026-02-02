-- Migration script to update event_permissions roles from 5-role to 3-role structure
-- Run this on STANDBY first, then LIVE after testing

-- Map old roles to new roles:
-- OWNER -> ADMIN
-- MANAGER -> COORDINATOR
-- OVERSEER -> COORDINATOR
-- KEYMAN -> COORDINATOR (upgrade from limited to full coordinator)
-- VIEWER -> VIEWER (no change)

BEGIN;

-- Update OWNER to ADMIN
UPDATE event_permissions SET role = 'ADMIN' WHERE role = 'OWNER';

-- Update MANAGER to COORDINATOR
UPDATE event_permissions SET role = 'COORDINATOR' WHERE role = 'MANAGER';

-- Update OVERSEER to COORDINATOR
UPDATE event_permissions SET role = 'COORDINATOR' WHERE role = 'OVERSEER';

-- Update KEYMAN to COORDINATOR
UPDATE event_permissions SET role = 'COORDINATOR' WHERE role = 'KEYMAN';

-- VIEWER stays as VIEWER (no update needed)

-- Verify the migration
SELECT role, COUNT(*) as count FROM event_permissions GROUP BY role ORDER BY role;

COMMIT;
