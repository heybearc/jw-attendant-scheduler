-- Option C: multi-body shifts (default 1 preserves legacy one-volunteer-per-shift)
ALTER TABLE "position_shifts" ADD COLUMN IF NOT EXISTS "volunteersNeeded" INTEGER NOT NULL DEFAULT 1;
