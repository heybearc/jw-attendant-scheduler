-- Phase 4C: Assignment Workflow Enhancements
-- Migration: Add notification system, assignment templates, and volunteer confirmation
-- Date: 2026-01-25
-- Version: v3.4.0

-- ============================================================================
-- FEATURE 1: ASSIGNMENT NOTIFICATIONS
-- ============================================================================

-- Add notification settings to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "enabled": true,
  "reminderTiming": "24h",
  "sendOnCreate": true,
  "sendOnUpdate": true,
  "sendOnCancel": true,
  "sendReminders": true
}'::jsonb;

-- Track sent notifications (audit log)
CREATE TABLE IF NOT EXISTS assignment_notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  assignment_id TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('CREATED', 'UPDATED', 'CANCELLED', 'REMINDER')),
  recipient_email VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  email_subject VARCHAR(500),
  email_body TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignment_notifications_assignment ON assignment_notifications(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_notifications_type ON assignment_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_assignment_notifications_status ON assignment_notifications(status);
CREATE INDEX IF NOT EXISTS idx_assignment_notifications_sent_at ON assignment_notifications(sent_at);

-- ============================================================================
-- FEATURE 2: ASSIGNMENT TEMPLATES
-- ============================================================================

-- Store reusable position structures
CREATE TABLE IF NOT EXISTS assignment_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  department_template_id TEXT REFERENCES department_templates(id) ON DELETE SET NULL,
  event_type VARCHAR(100),
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Template structure (JSONB for flexibility)
  positions JSONB NOT NULL,
  -- Example structure:
  -- [
  --   {
  --     "positionNumber": 1,
  --     "positionName": "Main Entrance",
  --     "description": "Primary entrance monitoring",
  --     "department": "Attendants",
  --     "shifts": [
  --       {"name": "Morning", "start": "09:00", "end": "12:00", "requiredCount": 2},
  --       {"name": "Afternoon", "start": "12:00", "end": "15:00", "requiredCount": 2}
  --     ],
  --     "requirements": {
  --       "role": "ATTENDANT",
  --       "minExperience": 1,
  --       "requiresExperience": false
  --     }
  --   }
  -- ]
  
  CONSTRAINT unique_template_name_per_user UNIQUE(name, created_by)
);

CREATE INDEX IF NOT EXISTS idx_assignment_templates_department ON assignment_templates(department_template_id);
CREATE INDEX IF NOT EXISTS idx_assignment_templates_creator ON assignment_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_assignment_templates_event_type ON assignment_templates(event_type);
CREATE INDEX IF NOT EXISTS idx_assignment_templates_usage ON assignment_templates(usage_count DESC);

-- ============================================================================
-- FEATURE 4: VOLUNTEER CONFIRMATION SYSTEM
-- ============================================================================

-- Track volunteer availability for events (bulk availability requests)
CREATE TABLE IF NOT EXISTS volunteer_availability (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('AVAILABLE', 'NOT_AVAILABLE', 'PARTIAL')),
  notes TEXT,
  available_dates JSONB, -- For partial availability: ["2026-02-15", "2026-02-16"]
  available_times JSONB, -- For partial availability: {"2026-02-15": ["09:00-12:00", "15:00-18:00"]}
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_availability_per_event_user UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_volunteer_availability_event ON volunteer_availability(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_availability_user ON volunteer_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_availability_status ON volunteer_availability(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_availability_responded ON volunteer_availability(responded_at);

-- Add confirmation fields to assignments table
-- Note: assignments table already exists, we're adding new columns
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS confirmation_status VARCHAR(20) DEFAULT 'PENDING' 
  CHECK (confirmation_status IN ('PENDING', 'CONFIRMED', 'DECLINED', 'TENTATIVE', 'COMPLETED', 'NO_SHOW'));

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS confirmation_token VARCHAR(255);
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS confirmation_notes TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS declined_reason TEXT;

-- Create unique index on confirmation_token (for secure email links)
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_confirmation_token ON assignments(confirmation_token) WHERE confirmation_token IS NOT NULL;

-- Add index for confirmation status queries
CREATE INDEX IF NOT EXISTS idx_assignments_confirmation_status ON assignments(confirmation_status);
CREATE INDEX IF NOT EXISTS idx_assignments_confirmed_at ON assignments(confirmed_at);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update assignment_templates.updated_at automatically
CREATE OR REPLACE FUNCTION update_assignment_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_assignment_template_timestamp
  BEFORE UPDATE ON assignment_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_template_timestamp();

-- Function to update volunteer_availability.updated_at automatically
CREATE OR REPLACE FUNCTION update_volunteer_availability_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_volunteer_availability_timestamp
  BEFORE UPDATE ON volunteer_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_volunteer_availability_timestamp();

-- ============================================================================
-- DATA MIGRATION / BACKFILL
-- ============================================================================

-- Set default notification settings for existing events
UPDATE events 
SET notification_settings = '{
  "enabled": true,
  "reminderTiming": "24h",
  "sendOnCreate": true,
  "sendOnUpdate": true,
  "sendOnCancel": true,
  "sendReminders": true
}'::jsonb
WHERE notification_settings IS NULL;

-- Set default confirmation status for existing assignments
UPDATE assignments 
SET confirmation_status = 'PENDING'
WHERE confirmation_status IS NULL;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE assignment_notifications IS 'Audit log of all assignment notification emails sent';
COMMENT ON TABLE assignment_templates IS 'Reusable position structure templates for events';
COMMENT ON TABLE volunteer_availability IS 'Tracks volunteer availability responses for bulk availability requests';

COMMENT ON COLUMN events.notification_settings IS 'JSON configuration for assignment notifications per event';
COMMENT ON COLUMN assignments.confirmation_status IS 'Volunteer confirmation status for assignment';
COMMENT ON COLUMN assignments.confirmation_token IS 'Secure token for email-based confirmation links';
COMMENT ON COLUMN assignments.confirmed_at IS 'Timestamp when volunteer confirmed assignment';
COMMENT ON COLUMN assignments.confirmation_notes IS 'Optional notes from volunteer when confirming';
COMMENT ON COLUMN assignments.declined_reason IS 'Reason provided when volunteer declines assignment';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignment_notifications') THEN
    RAISE EXCEPTION 'Migration failed: assignment_notifications table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignment_templates') THEN
    RAISE EXCEPTION 'Migration failed: assignment_templates table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'volunteer_availability') THEN
    RAISE EXCEPTION 'Migration failed: volunteer_availability table not created';
  END IF;
  
  RAISE NOTICE 'Phase 4C migration completed successfully';
END $$;
