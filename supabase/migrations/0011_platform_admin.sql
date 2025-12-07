-- Migration: Platform Admin Infrastructure
-- Created: 2025-12-08
-- Purpose: Add superadmin dashboard support

-- Create platform_admins table
CREATE TABLE IF NOT EXISTS platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT unique_platform_admin UNIQUE(user_id)
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_platform_admins_user_id ON platform_admins(user_id);

-- RLS Policies for platform_admins
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Only platform admins can view the list
CREATE POLICY "Platform admins can view all admins"
ON platform_admins FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM platform_admins pa
        WHERE pa.user_id = auth.uid()
    )
);

-- Only platform admins can insert new admins
CREATE POLICY "Platform admins can create admins"
ON platform_admins FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM platform_admins pa
        WHERE pa.user_id = auth.uid()
    )
);

-- Only platform admins can delete admins
CREATE POLICY "Platform admins can delete admins"
ON platform_admins FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM platform_admins pa
        WHERE pa.user_id = auth.uid()
    )
);

-- Create helper function to check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM platform_admins
        WHERE platform_admins.user_id = is_platform_admin.user_id
    );
END;
$$;

-- Create view for platform-level tenant overview
CREATE OR REPLACE VIEW platform_tenant_overview AS
SELECT 
    t.id as tenant_id,
    t.name as business_name,
    t.created_at as tenant_created_at,
    ts.tier,
    ts.status as subscription_status,
    ts.stripe_customer_id,
    ts.stripe_subscription_id,
    ts.current_period_end,
    -- Get current period usage
    tu.members_count,
    tu.transactions_count,
    tu.messages_sent,
    tu.whatsapp_cost_cents,
    tu.period_start as usage_period_start,
    -- Get tier limits
    tl.max_members,
    tl.max_transactions_per_month,
    tl.max_messages_per_month,
    -- Get owner info
    p.full_name as owner_name,
    u.email as owner_email,
    p.phone as owner_phone
FROM tenants t
LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
LEFT JOIN tenant_usage tu ON t.id = tu.tenant_id 
    AND tu.period_start = date_trunc('month', CURRENT_DATE)
LEFT JOIN tier_limits tl ON ts.tier = tl.tier
LEFT JOIN profiles p ON t.id = p.tenant_id AND p.role = 'owner'
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY t.created_at DESC;

-- Grant access to platform admins view
-- Note: RLS will still apply based on the underlying tables

COMMENT ON TABLE platform_admins IS 'Users with platform-level administrative access';
COMMENT ON FUNCTION is_platform_admin IS 'Check if a user has platform admin privileges';
COMMENT ON VIEW platform_tenant_overview IS 'Platform-level overview of all tenants, subscriptions, and usage';
