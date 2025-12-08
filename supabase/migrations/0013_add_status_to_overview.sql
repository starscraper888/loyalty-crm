-- Add status column to platform_tenant_overview view with correct column names
-- NOTE: Emails are in auth.users, not profiles
DROP VIEW IF EXISTS platform_tenant_overview;

CREATE VIEW platform_tenant_overview AS
SELECT 
    t.id as tenant_id,
    t.name as business_name,
    t.status,
    t.is_developer_mode,
    t.created_at as tenant_created_at,
    ts.tier as tier,
    ts.status as subscription_status,
    ts.current_period_end,
    ts.stripe_customer_id,
    ts.stripe_subscription_id,
    0 as members_count,
    0 as transactions_count,
    p.full_name as owner_name,
    '' as owner_email
FROM tenants t
LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
LEFT JOIN profiles p ON t.id = p.tenant_id AND p.role = 'owner'
ORDER BY t.created_at DESC;
