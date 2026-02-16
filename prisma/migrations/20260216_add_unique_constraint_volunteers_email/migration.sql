-- Add unique constraint on volunteers.email to prevent duplicate volunteer records
-- Part of D-TS-021: Global Volunteer Registry with Event-Scoped Access

-- First, ensure no duplicates exist (should be clean after merge script)
-- This will fail if duplicates still exist, which is what we want
ALTER TABLE volunteers ADD CONSTRAINT volunteers_email_unique UNIQUE (email);
