-- Dual membership: IVS import and Volunteers roster share one event_volunteers row.
-- Roster visibility is gated by on_volunteer_roster (not by clearing IVS fields).

ALTER TABLE "event_volunteers"
ADD COLUMN IF NOT EXISTS "on_volunteer_roster" BOOLEAN NOT NULL DEFAULT false;

-- Existing non-IVS rows were already shown on Volunteers / Positions
UPDATE "event_volunteers"
SET "on_volunteer_roster" = true
WHERE "ivs_import_batch_id" IS NULL;

CREATE INDEX IF NOT EXISTS "event_volunteers_on_volunteer_roster_idx"
ON "event_volunteers"("on_volunteer_roster");
