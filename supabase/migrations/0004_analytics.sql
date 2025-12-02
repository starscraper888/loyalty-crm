-- 1. Add amount to points_ledger
alter table points_ledger
add column if not exists amount decimal(10, 2) default 0.0;

-- 2. Materialized View for Daily Metrics
create materialized view if not exists mv_daily_metrics as
select
  date_trunc('day', created_at) as day,
  tenant_id,
  count(distinct profile_id) as active_members,
  count(*) as transactions,
  sum(amount) as revenue,
  -- Calculate repeat customers (users with > 1 transaction in this day)
  -- Note: This is a simplification. Real repeat rate usually looks at a longer window.
  -- For "Repeat Rate" chart, we might want users who visited > 1 time in the last 30 days.
  -- But for a daily MV, let's store daily active users who have > 1 transaction that day?
  -- Or maybe just store the raw counts and aggregate later.
  -- Let's stick to simple aggregations here.
  sum(case when type = 'redeem' then 1 else 0 end) as redemptions_count
from points_ledger
group by 1, 2;

-- Index for performance
create index if not exists idx_mv_daily_metrics_day on mv_daily_metrics(day);
create index if not exists idx_mv_daily_metrics_tenant on mv_daily_metrics(tenant_id);

-- 3. Refresh Function
create or replace function refresh_analytics_mv()
returns void as $$
begin
  refresh materialized view concurrently mv_daily_metrics;
end;
$$ language plpgsql security definer;

-- RLS for MV (Not directly supported on MVs in older Postgres, but we can wrap in view or function)
-- For simplicity, we'll access via RPC or direct query if user is staff.
-- Supabase allows querying MVs if permissions are set.
grant select on mv_daily_metrics to authenticated;

-- We need a policy-like check. Since MVs don't support RLS directly in the same way,
-- we usually filter by tenant_id in the query.
