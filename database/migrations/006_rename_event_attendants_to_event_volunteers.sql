-- Migration: Rename event_attendants table to event_volunteers
-- Date: 2026-02-11
-- Purpose: Clean up naming inconsistency - align table name with Prisma model name

-- Step 1: Rename the table
ALTER TABLE event_attendants RENAME TO event_volunteers;

-- Step 2: Rename indexes to match new table name
ALTER INDEX event_attendants_pkey RENAME TO event_volunteers_pkey;
ALTER INDEX event_attendants_eventId_volunteerId_key RENAME TO event_volunteers_eventId_volunteerId_key;
ALTER INDEX event_attendants_eventId_userId_key RENAME TO event_volunteers_eventId_userId_key;
ALTER INDEX event_attendants_ivsApprovalStatus_idx RENAME TO event_volunteers_ivsApprovalStatus_idx;
ALTER INDEX event_attendants_ivsRequestRound_idx RENAME TO event_volunteers_ivsRequestRound_idx;
ALTER INDEX event_attendants_ivsImportBatchId_idx RENAME TO event_volunteers_ivsImportBatchId_idx;
ALTER INDEX event_attendants_earlyCheckinEligible_idx RENAME TO event_volunteers_earlyCheckinEligible_idx;

-- Step 3: Rename foreign key constraints
-- Note: PostgreSQL constraint names are auto-generated, we need to find and rename them

-- Get the actual constraint names first (for reference):
-- SELECT conname FROM pg_constraint WHERE conrelid = 'event_volunteers'::regclass;

-- Rename FK to events table
ALTER TABLE event_volunteers RENAME CONSTRAINT event_attendants_eventId_fkey TO event_volunteers_eventId_fkey;

-- Rename FK to volunteers table (volunteerId)
ALTER TABLE event_volunteers RENAME CONSTRAINT event_attendants_volunteerId_fkey TO event_volunteers_volunteerId_fkey;

-- Rename FK to volunteers table (keymanId) - if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_attendants_keymanId_fkey') THEN
        ALTER TABLE event_volunteers RENAME CONSTRAINT event_attendants_keymanId_fkey TO event_volunteers_keymanId_fkey;
    END IF;
END $$;

-- Rename FK to volunteers table (overseerId) - if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_attendants_overseerId_fkey') THEN
        ALTER TABLE event_volunteers RENAME CONSTRAINT event_attendants_overseerId_fkey TO event_volunteers_overseerId_fkey;
    END IF;
END $$;

-- Rename FK to users table - if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_attendants_userId_fkey') THEN
        ALTER TABLE event_volunteers RENAME CONSTRAINT event_attendants_userId_fkey TO event_volunteers_userId_fkey;
    END IF;
END $$;

-- Rename FK to ivs_import_batches - if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_attendants_ivsImportBatchId_fkey') THEN
        ALTER TABLE event_volunteers RENAME CONSTRAINT event_attendants_ivsImportBatchId_fkey TO event_volunteers_ivsImportBatchId_fkey;
    END IF;
END $$;

-- Verification query (run after migration to confirm)
-- SELECT tablename FROM pg_tables WHERE tablename = 'event_volunteers';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'event_volunteers';
-- SELECT conname FROM pg_constraint WHERE conrelid = 'event_volunteers'::regclass;
