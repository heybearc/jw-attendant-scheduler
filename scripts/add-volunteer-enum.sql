-- Add VOLUNTEER to PositionRole enum
ALTER TYPE "PositionRole" ADD VALUE IF NOT EXISTS 'VOLUNTEER';

-- Now migrate the data
UPDATE position_assignments SET role = 'VOLUNTEER' WHERE role = 'ATTENDANT';

-- Verify
SELECT role, COUNT(*) as count FROM position_assignments GROUP BY role;
