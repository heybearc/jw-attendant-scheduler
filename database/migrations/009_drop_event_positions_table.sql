-- Migration: Drop event_positions table (old position system)
-- Date: 2026-02-11
-- Purpose: Remove dual position systems - event_positions table is empty and unused
-- The new 'positions' table is the active system with 109 records

-- Verify table is empty before dropping (safety check)
DO $$
DECLARE
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO record_count FROM event_positions;
    
    IF record_count > 0 THEN
        RAISE EXCEPTION 'event_positions table is not empty! Contains % records. Migration aborted.', record_count;
    END IF;
    
    RAISE NOTICE 'event_positions table is empty. Safe to drop.';
END $$;

-- Drop dependent objects first (foreign keys, indexes)
-- Note: position_counts references event_positions, need to check if it's still used

-- Check if position_counts still references event_positions
DO $$
BEGIN
    -- Drop the foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'position_counts_positionId_fkey' 
        AND table_name = 'position_counts'
    ) THEN
        ALTER TABLE position_counts DROP CONSTRAINT position_counts_positionId_fkey;
        RAISE NOTICE 'Dropped position_counts_positionId_fkey constraint';
    END IF;
END $$;

-- Drop the event_positions table
DROP TABLE IF EXISTS event_positions CASCADE;

-- Verification
-- SELECT tablename FROM pg_tables WHERE tablename = 'event_positions';
-- Should return 0 rows

RAISE NOTICE 'event_positions table dropped successfully';
