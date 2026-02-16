-- Refactor Oversight Structure
-- Rename volunteerOverseer* fields to departmentOverseer*
-- Drop circuitOverseer* and assemblyOverseer* fields
-- Add keyman JSON field

-- Rename volunteer overseer fields to department overseer
ALTER TABLE events RENAME COLUMN volunteer_overseer_name TO department_overseer_name;
ALTER TABLE events RENAME COLUMN volunteer_overseer_email TO department_overseer_email;
ALTER TABLE events RENAME COLUMN volunteer_overseer_phone TO department_overseer_phone;
ALTER TABLE events RENAME COLUMN volunteer_overseer_assistants TO department_overseer_assistants;

-- Drop circuit overseer fields
ALTER TABLE events DROP COLUMN IF EXISTS circuit_overseer_name;
ALTER TABLE events DROP COLUMN IF EXISTS circuit_overseer_email;
ALTER TABLE events DROP COLUMN IF EXISTS circuit_overseer_phone;

-- Drop assembly overseer fields
ALTER TABLE events DROP COLUMN IF EXISTS assembly_overseer_name;
ALTER TABLE events DROP COLUMN IF EXISTS assembly_overseer_email;
ALTER TABLE events DROP COLUMN IF EXISTS assembly_overseer_phone;

-- Add keyman field (JSON array)
ALTER TABLE events ADD COLUMN IF NOT EXISTS keyman JSONB DEFAULT '[]'::jsonb;
