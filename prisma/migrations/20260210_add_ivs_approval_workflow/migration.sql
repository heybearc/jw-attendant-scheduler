-- IVS Volunteer Approval Workflow Migration
-- Created: 2026-02-10
-- Purpose: Add IVS approval workflow fields and import batch tracking

-- Create ivs_import_batches table
CREATE TABLE IF NOT EXISTS ivs_import_batches (
  id VARCHAR(255) PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  request_round INTEGER NOT NULL,
  imported_by VARCHAR(255) NOT NULL,
  imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  file_name VARCHAR(500) NOT NULL,
  department_name VARCHAR(255),
  volunteer_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_ivs_import_batches_event
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_ivs_import_batches_user
    FOREIGN KEY (imported_by) REFERENCES users(id) ON DELETE NO ACTION
);

-- Create indexes for ivs_import_batches
CREATE INDEX idx_ivs_import_batches_event ON ivs_import_batches(event_id);
CREATE INDEX idx_ivs_import_batches_round ON ivs_import_batches(request_round);
CREATE INDEX idx_ivs_import_batches_imported_at ON ivs_import_batches(imported_at);

-- Add IVS approval workflow fields to event_attendants (event_volunteers)
ALTER TABLE event_attendants
  ADD COLUMN IF NOT EXISTS ivs_approval_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS ivs_submitted_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ivs_request_round INTEGER,
  ADD COLUMN IF NOT EXISTS ivs_approval_requested_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS ivs_approval_notes TEXT,
  ADD COLUMN IF NOT EXISTS ivs_approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS ivs_approved_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ivs_denied_reason TEXT,
  ADD COLUMN IF NOT EXISTS ivs_import_batch_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS early_checkin_eligible BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS checked_in_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS checkin_notes TEXT;

-- Add foreign key constraint for import batch
ALTER TABLE event_attendants
  ADD CONSTRAINT fk_event_attendants_ivs_import_batch
    FOREIGN KEY (ivs_import_batch_id) REFERENCES ivs_import_batches(id) ON DELETE SET NULL;

-- Create indexes for IVS fields on event_attendants
CREATE INDEX idx_event_attendants_ivs_approval_status ON event_attendants(ivs_approval_status);
CREATE INDEX idx_event_attendants_ivs_request_round ON event_attendants(ivs_request_round);
CREATE INDEX idx_event_attendants_ivs_import_batch ON event_attendants(ivs_import_batch_id);
CREATE INDEX idx_event_attendants_early_checkin ON event_attendants(early_checkin_eligible);

-- Add comment to document the IVS approval status values
COMMENT ON COLUMN event_attendants.ivs_approval_status IS 'IVS approval status: Pending, Requested, Approved, Not Approved';
