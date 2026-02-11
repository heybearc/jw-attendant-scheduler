-- Migration: Rename event_attendants to event_volunteers and fix events table field names
-- Date: 2026-02-11
-- Description: 
--   1. Rename event_attendants table to event_volunteers
--   2. Fix events table lowercase fields to use proper snake_case

-- Step 1: Rename event_attendants table to event_volunteers
ALTER TABLE event_attendants RENAME TO event_volunteers;

-- Step 2: Fix events table field names (lowercase -> snake_case)
ALTER TABLE events RENAME COLUMN assemblyoverseeremail TO assembly_overseer_email;
ALTER TABLE events RENAME COLUMN assemblyoverseername TO assembly_overseer_name;
ALTER TABLE events RENAME COLUMN assemblyoverseerphone TO assembly_overseer_phone;
ALTER TABLE events RENAME COLUMN volunteeroverseerassistants TO volunteer_overseer_assistants;
ALTER TABLE events RENAME COLUMN volunteeroverseeremail TO volunteer_overseer_email;
ALTER TABLE events RENAME COLUMN volunteeroverseername TO volunteer_overseer_name;
ALTER TABLE events RENAME COLUMN volunteeroverseerphone TO volunteer_overseer_phone;
ALTER TABLE events RENAME COLUMN circuitoverseeremail TO circuit_overseer_email;
ALTER TABLE events RENAME COLUMN circuitoverseername TO circuit_overseer_name;
ALTER TABLE events RENAME COLUMN circuitoverseerphone TO circuit_overseer_phone;
ALTER TABLE events RENAME COLUMN parenteventid TO parent_event_id;
ALTER TABLE events RENAME COLUMN departmenttemplateid TO department_template_id;

-- Note: After running this migration, update schema.prisma:
-- 1. Remove @@map("event_attendants") from event_volunteers model
-- 2. Update events model @map directives to use snake_case
-- 3. Run: npx prisma db pull to sync schema
-- 4. Run: npx prisma generate to regenerate client
