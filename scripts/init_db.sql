-- PostgreSQL Database Initialization Script
-- For JW Attendant Scheduler on postgres-01 (10.92.3.21)

-- Create database and user (if not exists)
-- Note: These commands may need to be run as postgres superuser

-- Create user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'jw_scheduler') THEN

      CREATE ROLE jw_scheduler LOGIN PASSWORD 'Cloudy_92!';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE jw_scheduler TO jw_scheduler;
GRANT ALL ON SCHEMA public TO jw_scheduler;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO jw_scheduler;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO jw_scheduler;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO jw_scheduler;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO jw_scheduler;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'America/New_York';

-- Performance optimizations
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();
