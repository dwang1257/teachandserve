-- Database Security Setup for TeachAndServe
-- Run this script as a superuser to enhance database security

\c teachandserve_secure;

-- Create audit logging table for user actions
CREATE TABLE IF NOT EXISTS user_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_user_audit_user_id ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_timestamp ON user_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_audit_action ON user_audit_log(action);

-- Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Grant permissions on audit table to application user
GRANT SELECT, INSERT ON user_audit_log TO teachandserve_app;
GRANT USAGE, SELECT ON SEQUENCE user_audit_log_id_seq TO teachandserve_app;

-- Set up connection limits and security policies
ALTER DATABASE teachandserve_secure SET log_connections = on;
ALTER DATABASE teachandserve_secure SET log_disconnections = on;
ALTER DATABASE teachandserve_secure SET log_statement = 'mod';

-- Create role for read-only access (for reporting/analytics)
CREATE ROLE teachandserve_readonly;
GRANT CONNECT ON DATABASE teachandserve_secure TO teachandserve_readonly;
GRANT USAGE ON SCHEMA public TO teachandserve_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO teachandserve_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO teachandserve_readonly;

-- Revoke dangerous permissions from public role
REVOKE ALL ON DATABASE teachandserve_secure FROM public;
REVOKE ALL ON SCHEMA public FROM public;
GRANT USAGE ON SCHEMA public TO public;

-- Create backup role (if needed)
CREATE ROLE teachandserve_backup;
GRANT CONNECT ON DATABASE teachandserve_secure TO teachandserve_backup;
GRANT USAGE ON SCHEMA public TO teachandserve_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO teachandserve_backup;

COMMIT;