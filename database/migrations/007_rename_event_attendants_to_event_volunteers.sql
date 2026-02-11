-- Migration: Drop unused event_volunteers table and rename event_attendants to event_volunteers
-- Date: 2026-02-11
-- Description: 
--   1. Drop the unused legacy event_volunteers table (173 records, old schema with departmentId)
--   2. Rename event_attendants table to event_volunteers (359 active records, current schema)
--   3. This eliminates the need for @@map("event_attendants") in Prisma schema

-- Step 1: Drop the unused legacy event_volunteers table
-- This table has a different schema (departmentId field) and is not used by the application
DROP TABLE IF EXISTS event_volunteers CASCADE;

-- Step 2: Rename event_attendants to event_volunteers
-- This is the active table with 359 records that the application currently uses
ALTER TABLE event_attendants RENAME TO event_volunteers;

-- Note: After running this migration, update schema.prisma:
-- 1. Remove @@map("event_attendants") from event_volunteers model
-- 2. Run: npx prisma generate to regenerate client
-- 3. Rebuild and restart the application
