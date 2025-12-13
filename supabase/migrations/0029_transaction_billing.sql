-- Migration 0029: Transaction-Based Billing System
-- Purpose: Add usage tracking and transaction limits for subscription tiers
-- Date: December 13, 2024

-- ============================================================================
-- PART 1: Add Subscription Columns to Tenants
-- ============================================================================

-- Add subscription and billing columns
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'starter' 
  CHECK (subscription_tier IN ('starter', 'growth', 'business', 'enterprise')),
ADD COLUMN IF NOT EXISTS transaction_limit int DEFAULT 250,
ADD COLUMN IF NOT EXISTS transactions_used_this_month int DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_period_start date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS billing_period_end date DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
ADD COLUMN IF NOT EXISTS is_billing_active boolean DEFAULT true;

-- Set limits based on tier (for existing tenants)
UPDATE tenants
SET transaction_limit = CASE subscription_tier
  WHEN 'starter' THEN 250
  WHEN 'growth' THEN 1000
  WHEN 'business' THEN 3000
  WHEN 'enterprise' THEN 10000
  ELSE 250
END;

-- Comments
COMMENT ON COLUMN tenants.subscription_tier IS 'Current subscription plan: starter, growth, business, or enterprise';
COMMENT ON COLUMN tenants.transaction_limit IS 'Monthly transaction limit based on subscription tier';
COMMENT ON COLUMN tenants.transactions_used_this_month IS 'Counter for current billing period';
COMMENT ON COLUMN tenants.billing_period_start IS 'Start of current billing month';
COMMENT ON COLUMN tenants.billing_period_end IS 'End of current billing month';

-- ============================================================================
-- PART 2: Create Usage Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'otp')),
  member_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  points int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_logs_tenant ON usage_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_current_month ON usage_logs(tenant_id, created_at) 
  WHERE created_at >= date_trunc('month', CURRENT_DATE);
CREATE INDEX IF NOT EXISTS idx_usage_logs_type ON usage_logs(tenant_id, transaction_type);

-- Comments
COMMENT ON TABLE usage_logs IS 'Transaction usage logs for billing and analytics';
COMMENT ON COLUMN usage_logs.transaction_type IS 'Type: earn (points issued), redeem (points used), otp (verification)';
COMMENT ON COLUMN usage_logs.metadata IS 'Additional context: staff_id, reward_id, etc.';

-- ============================================================================
-- PART 3: Create Billing History Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  subscription_tier text NOT NULL,
  transaction_limit int NOT NULL,
  transactions_used int NOT NULL,
  overage_count int DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_history_tenant ON billing_history(tenant_id, period_start DESC);

-- Comments
COMMENT ON TABLE billing_history IS 'Monthly billing records for usage tracking and invoicing';
COMMENT ON COLUMN billing_history.overage_count IS 'Transactions beyond limit (if overage allowed)';

-- ============================================================================
-- PART 4: Helper Functions
-- ============================================================================

-- Function: Check if tenant can perform transaction
CREATE OR REPLACE FUNCTION can_perform_transaction(p_tenant_id uuid)
RETURNS TABLE(
  allowed boolean,
  current_usage int,
  limit_amount int,
  tier text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (t.transactions_used_this_month < t.transaction_limit AND t.is_billing_active) as allowed,
    t.transactions_used_this_month as current_usage,
    t.transaction_limit as limit_amount,
    t.subscription_tier as tier
  FROM tenants t
  WHERE t.id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_perform_transaction IS 'Check if tenant is within transaction limit for current billing period';

-- Function: Increment transaction counter
CREATE OR REPLACE FUNCTION increment_transaction_counter(p_tenant_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE tenants
  SET transactions_used_this_month = transactions_used_this_month + 1,
      updated_at = NOW()
  WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_transaction_counter IS 'Increment monthly transaction counter for a tenant';

-- Function: Get usage statistics
CREATE OR REPLACE FUNCTION get_usage_stats(p_tenant_id uuid)
RETURNS TABLE(
  tier text,
  limit_amount int,
  used int,
  remaining int,
  usage_percent numeric,
  period_start date,
  period_end date,
  is_active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.subscription_tier as tier,
    t.transaction_limit as limit_amount,
    t.transactions_used_this_month as used,
    (t.transaction_limit - t.transactions_used_this_month) as remaining,
    ROUND((t.transactions_used_this_month::numeric / NULLIF(t.transaction_limit, 0) * 100), 2) as usage_percent,
    t.billing_period_start as period_start,
    t.billing_period_end as period_end,
    t.is_billing_active as is_active
  FROM tenants t
  WHERE t.id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_usage_stats IS 'Get comprehensive usage statistics for a tenant';

-- Function: Reset monthly usage (run via cron)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS TABLE(tenants_reset int) AS $$
DECLARE
  v_reset_count int;
BEGIN
  -- Archive current usage to billing history
  INSERT INTO billing_history (
    tenant_id, 
    period_start, 
    period_end, 
    subscription_tier, 
    transaction_limit, 
    transactions_used,
    overage_count
  )
  SELECT 
    id,
    billing_period_start,
    billing_period_end,
    subscription_tier,
    transaction_limit,
    transactions_used_this_month,
    GREATEST(0, transactions_used_this_month - transaction_limit) as overage_count
  FROM tenants
  WHERE billing_period_end <= CURRENT_DATE;
  
  -- Get count of tenants being reset
  SELECT COUNT(*) INTO v_reset_count
  FROM tenants
  WHERE billing_period_end <= CURRENT_DATE;
  
  -- Reset counters and update billing periods
  UPDATE tenants
  SET 
    transactions_used_this_month = 0,
    billing_period_start = CURRENT_DATE,
    billing_period_end = CURRENT_DATE + INTERVAL '1 month',
    updated_at = NOW()
  WHERE billing_period_end <= CURRENT_DATE;
  
  RETURN QUERY SELECT v_reset_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_monthly_usage IS 'Archive billing period and reset counters for new month. Run via cron.';

-- ============================================================================
-- PART 5: Triggers
-- ============================================================================

-- Trigger to auto-record usage when points_ledger is inserted
CREATE OR REPLACE FUNCTION auto_record_transaction_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record for actual transactions (not admin adjustments)
  IF NEW.type IN ('earn', 'redeem') THEN
    INSERT INTO usage_logs (tenant_id, transaction_type, member_id, points)
    VALUES (NEW.tenant_id, NEW.type, NEW.profile_id, NEW.points);
    
    -- Increment counter
    PERFORM increment_transaction_counter(NEW.tenant_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_record_usage
AFTER INSERT ON points_ledger
FOR EACH ROW
EXECUTE FUNCTION auto_record_transaction_usage();

COMMENT ON TRIGGER trigger_auto_record_usage ON points_ledger IS 
'Automatically log transactions and increment counter when points are issued or redeemed';

-- ============================================================================
-- PART 6: RLS Policies for New Tables
-- ============================================================================

-- Enable RLS
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- Policies for usage_logs
CREATE POLICY "Tenants can view own usage logs"
ON usage_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = usage_logs.tenant_id
      AND profiles.role IN ('admin', 'owner', 'manager')
  )
);

CREATE POLICY "Service role has full access to usage logs"
ON usage_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policies for billing_history
CREATE POLICY "Tenants can view own billing history"
ON billing_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = billing_history.tenant_id
      AND profiles.role IN ('admin', 'owner', 'manager')
  )
);

CREATE POLICY "Service role has full access to billing history"
ON billing_history FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PART 7: Initial Data & Verification
-- ============================================================================

-- Verify all tenants have valid billing setup
DO $$
DECLARE
  v_tenant_count int;
  v_invalid_count int;
BEGIN
  SELECT COUNT(*) INTO v_tenant_count FROM tenants;
  
  SELECT COUNT(*) INTO v_invalid_count 
  FROM tenants 
  WHERE subscription_tier IS NULL 
     OR transaction_limit IS NULL 
     OR billing_period_start IS NULL;
  
  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % tenants with invalid billing setup', v_invalid_count;
  END IF;
  
  RAISE NOTICE 'Migration 0029 successful:';
  RAISE NOTICE '  - % tenants configured with billing', v_tenant_count;
  RAISE NOTICE '  - usage_logs table created';
  RAISE NOTICE '  - billing_history table created';
  RAISE NOTICE '  - 4 helper functions created';
  RAISE NOTICE '  - Auto-tracking trigger enabled';
  RAISE NOTICE '  - RLS policies applied';
END $$;
