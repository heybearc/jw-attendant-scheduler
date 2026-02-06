-- Complete Volunteer Refactor: Rename all attendant references to volunteer
-- This migration removes the need for @map directives by aligning database names with code

-- Step 1: Rename the main table
ALTER TABLE "attendants" RENAME TO "volunteers";

-- Step 2: Rename columns in position_assignments
ALTER TABLE "position_assignments" RENAME COLUMN "attendantId" TO "volunteerId";

-- Step 3: Rename columns in volunteer_availability (snake_case)
ALTER TABLE "volunteer_availability" RENAME COLUMN "attendant_id" TO "volunteer_id";

-- Step 4: Rename columns in document_publications
ALTER TABLE "document_publications" RENAME COLUMN "attendantId" TO "volunteerId";

-- Step 5: Rename columns in event_attendants (legacy table)
ALTER TABLE "event_attendants" RENAME COLUMN "attendantId" TO "volunteerId";

-- Step 6: Rename columns in events table
ALTER TABLE "events" RENAME COLUMN "attendantsNeeded" TO "volunteersNeeded";
ALTER TABLE "events" RENAME COLUMN "attendantoverseername" TO "volunteeroverseername";
ALTER TABLE "events" RENAME COLUMN "attendantoverseerphone" TO "volunteeroverseerphone";
ALTER TABLE "events" RENAME COLUMN "attendantoverseeremail" TO "volunteeroverseeremail";
ALTER TABLE "events" RENAME COLUMN "attendantoverseerassistants" TO "volunteeroverseerassistants";

-- Step 7: Update existing role data from ATTENDANT to VOLUNTEER
UPDATE "position_assignments" SET "role" = 'VOLUNTEER' WHERE "role" = 'ATTENDANT';

-- Step 8: Update index names (if they reference old names)
-- PostgreSQL automatically renames indexes when columns are renamed, but we'll verify

-- Note: Foreign key constraints are automatically updated when columns are renamed
