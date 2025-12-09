-- Migration: Verify and fix tier calculation trigger
-- Bug #5: Ensure tier updates happen automatically on points changes
-- Priority: MEDIUM

-- Drop existing trigger if any (idempotent)
DROP TRIGGER IF EXISTS update_member_tenant_tier_trigger ON member_tenants;

-- Recreate trigger to fire on lifetime_points updates
CREATE TRIGGER update_member_tenant_tier_trigger
AFTER INSERT OR UPDATE OF lifetime_points ON member_tenants
FOR EACH ROW
EXECUTE FUNCTION update_member_tenant_tier();

-- Verify function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'update_member_tenant_tier'
    ) THEN
        RAISE EXCEPTION 'Function update_member_tenant_tier does not exist! Migration 0024 must be applied first.';
    END IF;
    
    RAISE NOTICE 'Tier calculation trigger verified and recreated successfully';
END $$;

-- Test: Backfill tiers for existing memberships based on current lifetime_points
UPDATE member_tenants
SET tier_id = (
    SELECT id FROM member_tiers
    WHERE min_points <= member_tenants.lifetime_points
    ORDER BY min_points DESC
    LIMIT 1
)
WHERE tier_id IS NULL OR tier_id != (
    SELECT id FROM member_tiers
    WHERE min_points <= member_tenants.lifetime_points
    ORDER BY min_points DESC
    LIMIT 1
);

-- Comment
COMMENT ON TRIGGER update_member_tenant_tier_trigger ON member_tenants IS 
'Automatically updates member tier when lifetime_points changes. Ensures tiers are always current.';
