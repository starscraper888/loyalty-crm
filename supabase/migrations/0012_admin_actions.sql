-- Migration: Admin Actions and Developer Mode
-- Created: 2025-12-08
-- Purpose: Add impersonation tokens, developer mode, and enhanced tenant management

-- Create impersonation_tokens table for secure tenant impersonation
CREATE TABLE IF NOT EXISTS impersonation_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure tokens expire (30 minutes default)
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_impersonation_tokens_token ON impersonation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_impersonation_tokens_expires ON impersonation_tokens(expires_at);

-- Add developer mode column to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_developer_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS developer_mode_enabled_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS developer_mode_enabled_by UUID REFERENCES auth.users(id);

-- Add suspension fields if not exists
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id);

-- Create function to cleanup expired tokens (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_impersonation_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM impersonation_tokens
    WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Create function to extend impersonation token (on activity)
CREATE OR REPLACE FUNCTION extend_impersonation_token(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token_id UUID;
BEGIN
    -- Update last activity and extend expiry by 15 minutes
    UPDATE impersonation_tokens
    SET 
        last_activity_at = NOW(),
        expires_at = NOW() + INTERVAL '15 minutes'
    WHERE token = p_token
      AND used_at IS NOT NULL  -- Only extend active sessions
      AND expires_at > NOW()   -- Not expired
    RETURNING id INTO v_token_id;
    
    RETURN v_token_id IS NOT NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_impersonation_tokens() TO authenticated;
GRANT EXECUTE ON FUNCTION extend_impersonation_token(TEXT) TO authenticated;

-- Comments
COMMENT ON TABLE impersonation_tokens IS 'Secure time-limited tokens for platform admin impersonation';
COMMENT ON COLUMN tenants.is_developer_mode IS 'Flag for internal testing tenants (bypasses billing, has limits)';
COMMENT ON COLUMN tenants.status IS 'Tenant account status: active, suspended';
COMMENT ON FUNCTION extend_impersonation_token IS 'Extends impersonation session on activity (15 min increments)';
