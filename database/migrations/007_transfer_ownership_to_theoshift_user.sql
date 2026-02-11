-- Migration: Transfer all database object ownership to theoshift_user
-- Date: 2026-02-11
-- Purpose: Consolidate ownership from jw_scheduler, jw_scheduler_staging, and postgres to theoshift_user
-- This enables the application user to perform schema changes without permission issues

-- Note: This script must be run as a superuser (postgres) or database owner

-- Step 1: Transfer table ownership from jw_scheduler
ALTER TABLE "Account" OWNER TO theoshift_user;
ALTER TABLE "Session" OWNER TO theoshift_user;
ALTER TABLE "VerificationToken" OWNER TO theoshift_user;
ALTER TABLE assignments OWNER TO theoshift_user;
ALTER TABLE count_sessions OWNER TO theoshift_user;
ALTER TABLE document_publications OWNER TO theoshift_user;
ALTER TABLE email_configurations OWNER TO theoshift_user;
ALTER TABLE event_attendants OWNER TO theoshift_user;
ALTER TABLE event_documents OWNER TO theoshift_user;
ALTER TABLE event_positions OWNER TO theoshift_user;
ALTER TABLE events OWNER TO theoshift_user;
ALTER TABLE feedback OWNER TO theoshift_user;
ALTER TABLE feedback_attachments OWNER TO theoshift_user;
ALTER TABLE feedback_comments OWNER TO theoshift_user;
ALTER TABLE lanyard_settings OWNER TO theoshift_user;
ALTER TABLE lanyards OWNER TO theoshift_user;
ALTER TABLE oversight_assignments OWNER TO theoshift_user;
ALTER TABLE position_assignments OWNER TO theoshift_user;
ALTER TABLE position_counts OWNER TO theoshift_user;
ALTER TABLE position_oversight_assignments OWNER TO theoshift_user;
ALTER TABLE position_shifts OWNER TO theoshift_user;
ALTER TABLE positions OWNER TO theoshift_user;
ALTER TABLE shift_templates OWNER TO theoshift_user;
ALTER TABLE station_ranges OWNER TO theoshift_user;
ALTER TABLE system_settings OWNER TO theoshift_user;
ALTER TABLE users OWNER TO theoshift_user;
ALTER TABLE volunteers OWNER TO theoshift_user;

-- Step 2: Transfer table ownership from jw_scheduler_staging
ALTER TABLE _prisma_migrations OWNER TO theoshift_user;
ALTER TABLE announcements OWNER TO theoshift_user;
ALTER TABLE user_activity OWNER TO theoshift_user;

-- Step 3: Transfer table ownership from postgres
ALTER TABLE assignment_templates OWNER TO theoshift_user;
ALTER TABLE department_templates OWNER TO theoshift_user;
ALTER TABLE event_departments OWNER TO theoshift_user;
ALTER TABLE event_permissions OWNER TO theoshift_user;
ALTER TABLE event_volunteers OWNER TO theoshift_user;
ALTER TABLE ivs_import_batches OWNER TO theoshift_user;
ALTER TABLE locations OWNER TO theoshift_user;
ALTER TABLE volunteer_availability OWNER TO theoshift_user;

-- Step 4: Transfer sequence ownership (for auto-increment columns)
DO $$
DECLARE
    seq RECORD;
BEGIN
    FOR seq IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(seq.sequence_name) || ' OWNER TO theoshift_user';
    END LOOP;
END $$;

-- Step 5: Transfer schema ownership
ALTER SCHEMA public OWNER TO theoshift_user;

-- Step 6: Grant all privileges on all tables to theoshift_user (redundant but ensures completeness)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO theoshift_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO theoshift_user;

-- Verification queries (run after migration)
-- SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public' ORDER BY tableowner, tablename;
-- SELECT sequence_name, sequence_schema FROM information_schema.sequences WHERE sequence_schema = 'public';
