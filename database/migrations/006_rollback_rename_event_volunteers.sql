-- Rollback Migration: Rename event_volunteers back to event_attendants
-- Date: 2026-02-11
-- Purpose: Rollback script if migration 006 needs to be reverted

-- Step 1: Rename the table back
ALTER TABLE event_volunteers RENAME TO event_attendants;

-- Step 2: Rename indexes back
ALTER INDEX event_volunteers_pkey RENAME TO event_attendants_pkey;
ALTER INDEX event_volunteers_eventId_volunteerId_key RENAME TO event_attendants_eventId_volunteerId_key;
ALTER INDEX event_volunteers_eventId_userId_key RENAME TO event_attendants_eventId_userId_key;
ALTER INDEX event_volunteers_ivsApprovalStatus_idx RENAME TO event_attendants_ivsApprovalStatus_idx;
ALTER INDEX event_volunteers_ivsRequestRound_idx RENAME TO event_attendants_ivsRequestRound_idx;
ALTER INDEX event_volunteers_ivsImportBatchId_idx RENAME TO event_attendants_ivsImportBatchId_idx;
ALTER INDEX event_volunteers_earlyCheckinEligible_idx RENAME TO event_attendants_earlyCheckinEligible_idx;

-- Step 3: Rename foreign key constraints back
ALTER TABLE event_attendants RENAME CONSTRAINT event_volunteers_eventId_fkey TO event_attendants_eventId_fkey;
ALTER TABLE event_attendants RENAME CONSTRAINT event_volunteers_volunteerId_fkey TO event_attendants_volunteerId_fkey;

-- Rename optional FKs back - if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_volunteers_keymanId_fkey') THEN
        ALTER TABLE event_attendants RENAME CONSTRAINT event_volunteers_keymanId_fkey TO event_attendants_keymanId_fkey;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_volunteers_overseerId_fkey') THEN
        ALTER TABLE event_attendants RENAME CONSTRAINT event_volunteers_overseerId_fkey TO event_attendants_overseerId_fkey;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_volunteers_userId_fkey') THEN
        ALTER TABLE event_attendants RENAME CONSTRAINT event_volunteers_userId_fkey TO event_attendants_userId_fkey;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_volunteers_ivsImportBatchId_fkey') THEN
        ALTER TABLE event_attendants RENAME CONSTRAINT event_volunteers_ivsImportBatchId_fkey TO event_attendants_ivsImportBatchId_fkey;
    END IF;
END $$;

-- Verification
-- SELECT tablename FROM pg_tables WHERE tablename = 'event_attendants';
