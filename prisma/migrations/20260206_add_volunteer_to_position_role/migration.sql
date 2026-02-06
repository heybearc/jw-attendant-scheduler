-- Add VOLUNTEER to PositionRole enum to support volunteer terminology refactor
-- This allows the code to use 'VOLUNTEER' while maintaining backward compatibility with 'ATTENDANT'

ALTER TYPE "PositionRole" ADD VALUE IF NOT EXISTS 'VOLUNTEER';
