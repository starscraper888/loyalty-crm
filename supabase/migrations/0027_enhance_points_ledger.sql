-- Migration: Add points_ledger enhancements for multi-tenant
-- Bug #1: Better data modeling with member_tenant_id link
-- Priority: MEDIUM (improves data model)

-- Add member_tenant_id column to link transactions to specific memberships
ALTER TABLE points_ledger
ADD COLUMN IF NOT EXISTS member_tenant_id uuid REFERENCES member_tenants(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_points_ledger_member_tenant ON points_ledger(member_tenant_id);

-- Comment
COMMENT ON COLUMN points_ledger.member_tenant_id IS 
'Links transaction to specific member-tenant membership. Allows querying all transactions for a specific membership.';

-- Backfill existing data (match profile_id + tenant_id to member_tenant_id)
UPDATE points_ledger pl
SET member_tenant_id = mt.id
FROM member_tenants mt
WHERE pl.profile_id = mt.member_id
  AND pl.tenant_id = mt.tenant_id
  AND pl.member_tenant_id IS NULL;

-- Note: Future inserts should include member_tenant_id
