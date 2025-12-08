-- Add status column to platform_tenant_overview view
DROP VIEW IF EXISTS platform_tenant_overview;

CREATE VIEW platform_tenant_overview AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.status,
    t.is_developer_mode,
    t.created_at as tenant_created_at,
    ts.tier as subscription_tier,
    ts.status as subscription_status,
    ts.current_period_end,
    ts.stripe_customer_id,
    ts.stripe_subscription_id,
    0 as members_count,
    0 as transactions_count,
    COALESCE(t.credits_balance, 0) as credits_balance
FROM tenants t
LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
ORDER BY t.created_at DESC;
