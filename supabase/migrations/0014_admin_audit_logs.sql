-- Migration: Admin Audit Logs
-- Created: 2025-12-08
-- Purpose: Track all platform admin actions for compliance and debugging

-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_id ON admin_audit_logs(target_id);

-- Enable RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Platform admins can view all logs
CREATE POLICY "Platform admins can view audit logs"
    ON admin_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM platform_admins
            WHERE user_id = auth.uid()
        )
    );

-- Comments
COMMENT ON TABLE admin_audit_logs IS 'Audit trail of all platform admin actions';
COMMENT ON COLUMN admin_audit_logs.action IS 'Type of action performed (e.g., suspend_tenant, change_plan)';
COMMENT ON COLUMN admin_audit_logs.metadata IS 'Additional context about the action in JSON format';
