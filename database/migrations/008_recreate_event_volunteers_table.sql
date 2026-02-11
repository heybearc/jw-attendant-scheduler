-- Migration: Recreate event_volunteers table
-- Date: 2026-02-11
-- Description: Recreate the event_volunteers table that was accidentally dropped

CREATE TABLE IF NOT EXISTS event_volunteers (
  id TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "userId" TEXT,
  "volunteerId" TEXT,
  role "UserRole" NOT NULL DEFAULT 'ATTENDANT'::"UserRole",
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "assignedDepartments" JSONB,
  "assignedStationRanges" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "keymanId" TEXT,
  "overseerId" TEXT,
  is_keyman BOOLEAN DEFAULT false,
  is_overseer BOOLEAN DEFAULT false,
  is_elder BOOLEAN DEFAULT false,
  ivs_approval_status VARCHAR(50),
  ivs_submitted_by VARCHAR(255),
  ivs_request_round INTEGER,
  ivs_approval_requested_at TIMESTAMP,
  ivs_approval_notes TEXT,
  ivs_approved_at TIMESTAMP,
  ivs_approved_by VARCHAR(255),
  ivs_denied_reason TEXT,
  ivs_import_batch_id VARCHAR(255),
  early_checkin_eligible BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP,
  checked_in_by VARCHAR(255),
  checkin_notes TEXT,
  
  CONSTRAINT event_volunteers_eventId_volunteerId_key UNIQUE ("eventId", "volunteerId"),
  CONSTRAINT event_volunteers_eventId_userId_key UNIQUE ("eventId", "userId"),
  CONSTRAINT event_volunteers_eventId_fkey FOREIGN KEY ("eventId") REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT event_volunteers_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT event_volunteers_volunteerId_fkey FOREIGN KEY ("volunteerId") REFERENCES volunteers(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT event_volunteers_keymanId_fkey FOREIGN KEY ("keymanId") REFERENCES volunteers(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT event_volunteers_overseerId_fkey FOREIGN KEY ("overseerId") REFERENCES volunteers(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT event_volunteers_ivs_import_batch_id_fkey FOREIGN KEY (ivs_import_batch_id) REFERENCES ivs_import_batches(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS event_volunteers_ivs_approval_status_idx ON event_volunteers(ivs_approval_status);
CREATE INDEX IF NOT EXISTS event_volunteers_ivs_request_round_idx ON event_volunteers(ivs_request_round);
CREATE INDEX IF NOT EXISTS event_volunteers_ivs_import_batch_id_idx ON event_volunteers(ivs_import_batch_id);
CREATE INDEX IF NOT EXISTS event_volunteers_early_checkin_eligible_idx ON event_volunteers(early_checkin_eligible);
