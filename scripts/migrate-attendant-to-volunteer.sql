-- Migration: Update ATTENDANT enum values to VOLUNTEER
-- This fixes the "Value 'ATTENDANT' not found in enum 'PositionRole'" error

BEGIN;

-- Update position_assignments role from ATTENDANT to VOLUNTEER
UPDATE position_assignments 
SET role = 'VOLUNTEER' 
WHERE role = 'ATTENDANT';

-- Verify the update
SELECT role, COUNT(*) as count 
FROM position_assignments 
GROUP BY role;

COMMIT;
