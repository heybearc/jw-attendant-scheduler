-- Multi-day events: optional calendar day on each shift (null = legacy undated / single-day)
ALTER TABLE "position_shifts" ADD COLUMN IF NOT EXISTS "shiftDate" DATE;
