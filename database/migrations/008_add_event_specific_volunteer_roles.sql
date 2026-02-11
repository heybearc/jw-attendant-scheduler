-- Migration: Add event-specific volunteer role fields
-- Date: 2026-02-11
-- Purpose: Implement Option 1 - Event-Specific Roles Only
-- Allows volunteers to have different roles in different events

-- Step 1: Add event-specific role fields to event_volunteers table
ALTER TABLE event_attendants 
ADD COLUMN is_keyman BOOLEAN DEFAULT false,
ADD COLUMN is_overseer BOOLEAN DEFAULT false,
ADD COLUMN is_elder BOOLEAN DEFAULT false;

-- Step 2: Create indexes for performance
CREATE INDEX idx_event_volunteers_is_keyman ON event_attendants(is_keyman) WHERE is_keyman = true;
CREATE INDEX idx_event_volunteers_is_overseer ON event_attendants(is_overseer) WHERE is_overseer = true;
CREATE INDEX idx_event_volunteers_is_elder ON event_attendants(is_elder) WHERE is_elder = true;

-- Step 3: Migrate existing global role data to event-specific
-- For each volunteer in each event, copy their global role flags
UPDATE event_attendants ev
SET 
    is_keyman = COALESCE(v.is_keyman, false),
    is_overseer = COALESCE(v.is_overseer, false),
    is_elder = COALESCE(v.is_elder, false)
FROM volunteers v
WHERE ev."volunteerId" = v.id;

-- Step 4: Add comment explaining the fields
COMMENT ON COLUMN event_attendants.is_keyman IS 'Event-specific: Is this volunteer serving as a keyman for THIS event?';
COMMENT ON COLUMN event_attendants.is_overseer IS 'Event-specific: Is this volunteer serving as an overseer for THIS event?';
COMMENT ON COLUMN event_attendants.is_elder IS 'Event-specific: Is this volunteer an elder for THIS event?';

-- Verification queries (run after migration)
-- SELECT COUNT(*) FROM event_attendants WHERE is_keyman = true;
-- SELECT COUNT(*) FROM event_attendants WHERE is_overseer = true;
-- SELECT COUNT(*) FROM event_attendants WHERE is_elder = true;

-- Check that data was migrated correctly
-- SELECT 
--     e.name as event_name,
--     v.first_name || ' ' || v.last_name as volunteer_name,
--     ev.is_keyman,
--     ev.is_overseer,
--     ev.is_elder,
--     v.is_keyman as global_keyman,
--     v.is_overseer as global_overseer,
--     v.is_elder as global_elder
-- FROM event_attendants ev
-- JOIN events e ON ev.event_id = e.id
-- JOIN volunteers v ON ev.volunteer_id = v.id
-- WHERE ev.is_keyman = true OR ev.is_overseer = true OR ev.is_elder = true
-- LIMIT 20;
