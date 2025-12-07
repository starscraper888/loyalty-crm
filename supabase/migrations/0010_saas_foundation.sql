-- Migration: SaaS Foundation
-- Description: Add subscription management, tenant settings, usage tracking, and credits system
-- Version: 0010

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TENANT SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  tier TEXT CHECK (tier IN ('developer', 'starter', 'pro', 'enterprise')) DEFAULT 'developer',
  status TEXT CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')) DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TENANT SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  business_name TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  custom_domain TEXT UNIQUE,
  whatsapp_number TEXT,
  email_from TEXT,
  timezone TEXT DEFAULT 'Asia/Singapore',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. USAGE TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  members_count INT DEFAULT 0,
  transactions_count INT DEFAULT 0,
  messages_sent INT DEFAULT 0,
  whatsapp_cost_cents INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. TENANT CREDITS (Prepaid WhatsApp Usage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_credits (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  balance_cents INT DEFAULT 0,
  auto_recharge_enabled BOOLEAN DEFAULT FALSE,
  auto_recharge_threshold_cents INT DEFAULT 1000, -- Recharge when balance < $10
  auto_recharge_amount_cents INT DEFAULT 2000, -- Add $20
  stripe_payment_method_id TEXT,
  last_recharge_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. TIER LIMITS CONFIGURATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS tier_limits (
  tier TEXT PRIMARY KEY CHECK (tier IN ('developer', 'starter', 'pro', 'enterprise')),
  max_members INT,
  max_transactions_per_month INT,
  max_messages_per_month INT, -- -1 means pay-as-you-go
  price_monthly_cents INT,
  features JSONB
);

-- Insert default tier limits
INSERT INTO tier_limits (tier, max_members, max_transactions_per_month, max_messages_per_month, price_monthly_cents, features) VALUES
('developer', 50, 100, 50, 0, '{
  "whatsapp": "sandbox_limit_50",
  "analytics": "basic",
  "support": "community",
  "staff_accounts": 2,
  "trial_days": 0,
  "powered_by_footer": true
}'),
('starter', 1000, 5000, -1, 2900, '{
  "whatsapp": "pay_as_you_go",
  "analytics": "basic",
  "support": "email_48h",
  "staff_accounts": 3,
  "trial_days": 30
}'),
('pro', 10000, 50000, -1, 9900, '{
  "whatsapp": "pay_as_you_go",
  "analytics": "advanced",
  "support": "priority_24h",
  "api_access": true,
  "webhooks": true,
  "automation": true,
  "staff_accounts": 15,
  "trial_days": 30
}'),
('enterprise', -1, -1, -1, 29900, '{
  "whatsapp": "pay_as_you_go",
  "analytics": "custom",
  "support": "dedicated_4h",
  "api_access": true,
  "webhooks": true,
  "automation": true,
  "white_label": true,
  "custom_domain": true,
  "sso": true,
  "staff_accounts": -1,
  "sla": "99.9%",
  "trial_days": 30
}')
ON CONFLICT (tier) DO UPDATE SET
  max_members = EXCLUDED.max_members,
  max_transactions_per_month = EXCLUDED.max_transactions_per_month,
  max_messages_per_month = EXCLUDED.max_messages_per_month,
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  features = EXCLUDED.features;

-- ============================================================================
-- 6. INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_stripe_customer ON tenant_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant ON tenant_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_period ON tenant_usage(period_start, period_end);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_credits ENABLE ROW LEVEL SECURITY;

-- Owners can view their subscription
CREATE POLICY "Owners can view their subscription" ON tenant_subscriptions
  FOR SELECT USING (
    tenant_id = get_my_tenant_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Owners can manage their settings
CREATE POLICY "Owners can view settings" ON tenant_settings
  FOR SELECT USING (
    tenant_id = get_my_tenant_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Owners can update settings" ON tenant_settings
  FOR UPDATE USING (
    tenant_id = get_my_tenant_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Owners can view usage
CREATE POLICY "Owners can view usage" ON tenant_usage
  FOR SELECT USING (
    tenant_id = get_my_tenant_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Owners can view credits
CREATE POLICY "Owners can view credits" ON tenant_credits
  FOR SELECT USING (
    tenant_id = get_my_tenant_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenant_subscriptions_updated_at
  BEFORE UPDATE ON tenant_subscriptions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tenant_settings_updated_at
  BEFORE UPDATE ON tenant_settings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tenant_credits_updated_at
  BEFORE UPDATE ON tenant_credits
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Get current tenant's subscription tier
CREATE OR REPLACE FUNCTION get_my_subscription_tier()
RETURNS TEXT AS $$
  SELECT tier FROM tenant_subscriptions 
  WHERE tenant_id = get_my_tenant_id()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if tenant has reached usage limit
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_tenant_id UUID,
  p_limit_type TEXT -- 'members', 'transactions', 'messages'
) RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_limit INT;
  v_current_usage INT;
BEGIN
  -- Get tenant tier
  SELECT tier INTO v_tier
  FROM tenant_subscriptions
  WHERE tenant_id = p_tenant_id;
  
  -- Get tier limit
  IF p_limit_type = 'members' THEN
    SELECT max_members INTO v_limit FROM tier_limits WHERE tier = v_tier;
    SELECT COUNT(*) INTO v_current_usage FROM profiles WHERE tenant_id = p_tenant_id AND role = 'member';
  ELSIF p_limit_type = 'transactions' THEN
    SELECT max_transactions_per_month INTO v_limit FROM tier_limits WHERE tier = v_tier;
    SELECT transactions_count INTO v_current_usage 
    FROM tenant_usage 
    WHERE tenant_id = p_tenant_id 
      AND period_start >= DATE_TRUNC('month', NOW())
    ORDER BY period_start DESC LIMIT 1;
  ELSIF p_limit_type = 'messages' THEN
    SELECT max_messages_per_month INTO v_limit FROM tier_limits WHERE tier = v_tier;
    -- -1 means unlimited/pay-as-you-go
    IF v_limit = -1 THEN
      RETURN TRUE;
    END IF;
    SELECT messages_sent INTO v_current_usage 
    FROM tenant_usage 
    WHERE tenant_id = p_tenant_id 
      AND period_start >= DATE_TRUNC('month', NOW())
    ORDER BY period_start DESC LIMIT 1;
  END IF;
  
  -- -1 means unlimited
  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Check if under limit
  RETURN COALESCE(v_current_usage, 0) < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_my_subscription_tier TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limit TO authenticated;

-- ============================================================================
-- 10. INITIALIZE EXISTING TENANTS
-- ============================================================================

-- Create default subscription for existing tenants (Developer tier)
INSERT INTO tenant_subscriptions (tenant_id, tier, status)
SELECT id, 'developer', 'active'
FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM tenant_subscriptions);

-- Create default settings for existing tenants
INSERT INTO tenant_settings (tenant_id, business_name)
SELECT id, name
FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM tenant_settings);

-- Create default credits for existing tenants
INSERT INTO tenant_credits (tenant_id, balance_cents)
SELECT id, 0
FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM tenant_credits);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
