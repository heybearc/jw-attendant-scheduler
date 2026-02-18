-- Migration: Remove deprecated template system
-- Date: 2026-02-18
-- Description: Drop department_templates, event_departments, assignment_templates tables
--              and remove departmentTemplateId column from events table.
--              All template functionality has been replaced by event.settings (JSON).

-- Step 1: Drop foreign key constraints that reference department_templates
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_departmentTemplateId_fkey";
ALTER TABLE "event_departments" DROP CONSTRAINT IF EXISTS "event_departments_templateId_fkey";
ALTER TABLE "event_departments" DROP CONSTRAINT IF EXISTS "event_departments_parentId_fkey";
ALTER TABLE "event_departments" DROP CONSTRAINT IF EXISTS "event_departments_eventId_fkey";
ALTER TABLE "assignment_templates" DROP CONSTRAINT IF EXISTS "assignment_templates_department_template_id_fkey";
ALTER TABLE "assignment_templates" DROP CONSTRAINT IF EXISTS "assignment_templates_created_by_fkey";
ALTER TABLE "department_templates" DROP CONSTRAINT IF EXISTS "department_templates_parentId_fkey";

-- Step 2: Drop indexes on events.departmentTemplateId
DROP INDEX IF EXISTS "events_departmentTemplateId_idx";

-- Step 3: Drop departmentTemplateId column from events
ALTER TABLE "events" DROP COLUMN IF EXISTS "department_template_id";

-- Step 4: Drop event_departments table (depends on department_templates)
DROP TABLE IF EXISTS "event_departments";

-- Step 5: Drop assignment_templates table (depends on department_templates)
DROP TABLE IF EXISTS "assignment_templates";

-- Step 6: Drop department_templates table
DROP TABLE IF EXISTS "department_templates";
