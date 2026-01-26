-- Fix volunteer_availability status constraint to include PENDING
-- This ensures the constraint matches the application code

ALTER TABLE volunteer_availability 
DROP CONSTRAINT IF EXISTS volunteer_availability_status_check;

ALTER TABLE volunteer_availability 
ADD CONSTRAINT volunteer_availability_status_check 
CHECK (status IN ('AVAILABLE', 'NOT_AVAILABLE', 'PARTIAL', 'PENDING'));
