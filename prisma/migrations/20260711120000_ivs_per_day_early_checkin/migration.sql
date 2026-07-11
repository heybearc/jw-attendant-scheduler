-- IVS per-day early entry eligibility and check-ins
-- Replaces weekend-wide earlyCheckinEligible + checkedInAt with per convention day tracking

CREATE TYPE "ConventionDay" AS ENUM ('FRIDAY', 'SATURDAY', 'SUNDAY');

ALTER TABLE event_volunteers
  ADD COLUMN IF NOT EXISTS early_checkin_friday BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_checkin_saturday BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_checkin_sunday BOOLEAN NOT NULL DEFAULT false;

-- Migrate legacy boolean to all three days when previously eligible
UPDATE event_volunteers
SET
  early_checkin_friday = true,
  early_checkin_saturday = true,
  early_checkin_sunday = true
WHERE COALESCE(early_checkin_eligible, false) = true;

CREATE TABLE IF NOT EXISTS event_volunteer_early_checkins (
  id TEXT PRIMARY KEY,
  event_volunteer_id TEXT NOT NULL REFERENCES event_volunteers(id) ON DELETE CASCADE,
  convention_day "ConventionDay" NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by TEXT,
  checkin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_volunteer_id, convention_day)
);

CREATE INDEX IF NOT EXISTS idx_ev_early_checkins_volunteer
  ON event_volunteer_early_checkins(event_volunteer_id);

-- Migrate existing single check-ins to per-day rows (America/New_York convention calendar)
INSERT INTO event_volunteer_early_checkins (id, event_volunteer_id, convention_day, checked_in_at, checked_in_by, checkin_notes)
SELECT
  md5(ev.id || '-migrated-' || COALESCE(ev.checked_in_at::text, '')) AS id,
  ev.id,
  CASE EXTRACT(DOW FROM ev.checked_in_at AT TIME ZONE 'America/New_York')
    WHEN 5 THEN 'FRIDAY'::"ConventionDay"
    WHEN 6 THEN 'SATURDAY'::"ConventionDay"
    WHEN 0 THEN 'SUNDAY'::"ConventionDay"
    ELSE 'FRIDAY'::"ConventionDay"
  END,
  ev.checked_in_at,
  ev.checked_in_by,
  ev.checkin_notes
FROM event_volunteers ev
WHERE ev.checked_in_at IS NOT NULL
ON CONFLICT (event_volunteer_id, convention_day) DO NOTHING;

-- Keep legacy columns for rollback safety; app uses per-day fields going forward
