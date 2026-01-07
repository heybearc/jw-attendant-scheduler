-- Phase 4C Week 2: Assignment Templates
-- Migration to add assignment_templates table

-- Create assignment_templates table
CREATE TABLE IF NOT EXISTS assignment_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  department_template_id TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create template_assignments table (stores the assignment pattern)
CREATE TABLE IF NOT EXISTS template_assignments (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  position_number INTEGER NOT NULL,
  position_name TEXT NOT NULL,
  area TEXT,
  shift_start TEXT NOT NULL,  -- Time in HH:MM format
  shift_end TEXT NOT NULL,    -- Time in HH:MM format
  required_count INTEGER NOT NULL DEFAULT 1,
  role TEXT,
  notes TEXT,
  sequence INTEGER NOT NULL DEFAULT 0,
  
  FOREIGN KEY (template_id) REFERENCES assignment_templates(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignment_templates_created_by ON assignment_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_assignment_templates_event_type ON assignment_templates(event_type);
CREATE INDEX IF NOT EXISTS idx_assignment_templates_active ON assignment_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_template_assignments_template_id ON template_assignments(template_id);

-- Create template_usage_log table (track when templates are applied)
CREATE TABLE IF NOT EXISTS template_usage_log (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  applied_by TEXT NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  positions_created INTEGER NOT NULL DEFAULT 0,
  
  FOREIGN KEY (template_id) REFERENCES assignment_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (applied_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_template_usage_log_template_id ON template_usage_log(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_log_event_id ON template_usage_log(event_id);

-- Insert default templates

-- Template 1: Weekend Convention - Attendant Rotation
INSERT INTO assignment_templates (id, name, description, event_type, created_by, usage_count)
VALUES (
  'tpl_weekend_convention',
  'Weekend Convention - Attendant Rotation',
  'Standard attendant rotation for weekend conventions with 20 positions across 3 shifts',
  'Convention',
  'system',
  0
);

INSERT INTO template_assignments (id, template_id, position_number, position_name, shift_start, shift_end, required_count, sequence)
VALUES
  ('tpl_wc_1', 'tpl_weekend_convention', 1, 'Main Entrance', '08:00', '12:00', 2, 1),
  ('tpl_wc_2', 'tpl_weekend_convention', 2, 'Main Entrance', '12:00', '16:00', 2, 2),
  ('tpl_wc_3', 'tpl_weekend_convention', 3, 'Main Entrance', '16:00', '20:00', 2, 3),
  ('tpl_wc_4', 'tpl_weekend_convention', 4, 'Side Entrance', '08:00', '12:00', 1, 4),
  ('tpl_wc_5', 'tpl_weekend_convention', 5, 'Side Entrance', '12:00', '16:00', 1, 5),
  ('tpl_wc_6', 'tpl_weekend_convention', 6, 'Side Entrance', '16:00', '20:00', 1, 6),
  ('tpl_wc_7', 'tpl_weekend_convention', 7, 'Auditorium Section A', '08:00', '12:00', 2, 7),
  ('tpl_wc_8', 'tpl_weekend_convention', 8, 'Auditorium Section A', '12:00', '16:00', 2, 8),
  ('tpl_wc_9', 'tpl_weekend_convention', 9, 'Auditorium Section A', '16:00', '20:00', 2, 9),
  ('tpl_wc_10', 'tpl_weekend_convention', 10, 'Auditorium Section B', '08:00', '12:00', 2, 10);

-- Template 2: Circuit Assembly - Standard Setup
INSERT INTO assignment_templates (id, name, description, event_type, created_by, usage_count)
VALUES (
  'tpl_circuit_assembly',
  'Circuit Assembly - Standard Setup',
  'Standard setup for circuit assembly with 15 positions',
  'Circuit Assembly',
  'system',
  0
);

INSERT INTO template_assignments (id, template_id, position_number, position_name, shift_start, shift_end, required_count, sequence)
VALUES
  ('tpl_ca_1', 'tpl_circuit_assembly', 1, 'Main Entrance', '08:30', '12:30', 2, 1),
  ('tpl_ca_2', 'tpl_circuit_assembly', 2, 'Main Entrance', '12:30', '16:30', 2, 2),
  ('tpl_ca_3', 'tpl_circuit_assembly', 3, 'Parking Lot', '08:00', '12:30', 2, 3),
  ('tpl_ca_4', 'tpl_circuit_assembly', 4, 'Parking Lot', '12:30', '17:00', 2, 4),
  ('tpl_ca_5', 'tpl_circuit_assembly', 5, 'Auditorium', '08:30', '12:30', 3, 5),
  ('tpl_ca_6', 'tpl_circuit_assembly', 6, 'Auditorium', '12:30', '16:30', 3, 6);

-- Template 3: Memorial - Full Coverage
INSERT INTO assignment_templates (id, name, description, event_type, created_by, usage_count)
VALUES (
  'tpl_memorial',
  'Memorial - Full Coverage',
  'Complete coverage for Memorial observance with parking, entrance, and auditorium positions',
  'Memorial',
  'system',
  0
);

INSERT INTO template_assignments (id, template_id, position_number, position_name, shift_start, shift_end, required_count, sequence)
VALUES
  ('tpl_mem_1', 'tpl_memorial', 1, 'Parking Lot', '18:00', '21:00', 3, 1),
  ('tpl_mem_2', 'tpl_memorial', 2, 'Main Entrance', '18:30', '21:00', 2, 2),
  ('tpl_mem_3', 'tpl_memorial', 3, 'Side Entrance', '18:30', '21:00', 2, 3),
  ('tpl_mem_4', 'tpl_memorial', 4, 'Auditorium Section 1', '18:30', '21:00', 2, 4),
  ('tpl_mem_5', 'tpl_memorial', 5, 'Auditorium Section 2', '18:30', '21:00', 2, 5),
  ('tpl_mem_6', 'tpl_memorial', 6, 'Auditorium Section 3', '18:30', '21:00', 2, 6),
  ('tpl_mem_7', 'tpl_memorial', 7, 'Auditorium Section 4', '18:30', '21:00', 2, 7);

-- Template 4: Regional Convention - 3-Day Setup
INSERT INTO assignment_templates (id, name, description, event_type, created_by, usage_count)
VALUES (
  'tpl_regional_convention',
  'Regional Convention - 3-Day Setup',
  'Comprehensive 3-day regional convention setup with 30+ positions',
  'Regional Convention',
  'system',
  0
);

INSERT INTO template_assignments (id, template_id, position_number, position_name, area, shift_start, shift_end, required_count, sequence)
VALUES
  ('tpl_rc_1', 'tpl_regional_convention', 1, 'Main Gate', 'Entrance', '07:30', '12:00', 3, 1),
  ('tpl_rc_2', 'tpl_regional_convention', 2, 'Main Gate', 'Entrance', '12:00', '16:30', 3, 2),
  ('tpl_rc_3', 'tpl_regional_convention', 3, 'North Entrance', 'Entrance', '07:30', '12:00', 2, 3),
  ('tpl_rc_4', 'tpl_regional_convention', 4, 'North Entrance', 'Entrance', '12:00', '16:30', 2, 4),
  ('tpl_rc_5', 'tpl_regional_convention', 5, 'Section 100', 'Auditorium', '08:00', '12:00', 4, 5),
  ('tpl_rc_6', 'tpl_regional_convention', 6, 'Section 100', 'Auditorium', '12:00', '16:00', 4, 6),
  ('tpl_rc_7', 'tpl_regional_convention', 7, 'Section 200', 'Auditorium', '08:00', '12:00', 4, 7),
  ('tpl_rc_8', 'tpl_regional_convention', 8, 'Section 200', 'Auditorium', '12:00', '16:00', 4, 8);

COMMIT;
