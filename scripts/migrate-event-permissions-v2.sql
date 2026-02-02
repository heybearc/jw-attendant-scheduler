-- Migration script to update event_permissions roles from 5-role to 3-role structure
-- This version adds new enum values first, migrates data, then removes old values
-- Run this on STANDBY first, then LIVE after testing

BEGIN;

-- Step 1: Add new enum values (ADMIN, COORDINATOR) to existing enum
ALTER TYPE "EventPermissionRole" ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE "EventPermissionRole" ADD VALUE IF NOT EXISTS 'COORDINATOR';

COMMIT;

-- Step 2: Migrate data (separate transaction)
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

-- Note: Old enum values (OWNER, MANAGER, OVERSEER, KEYMAN) will remain in the enum type
-- but won't be used. PostgreSQL doesn't support removing enum values easily.
-- This is safe - the application code only uses the new values.
