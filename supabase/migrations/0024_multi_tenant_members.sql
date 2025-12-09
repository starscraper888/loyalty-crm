-- Migration: Multi-Tenant Member System with Junction Table
-- Purpose: Enable members to belong to multiple tenants with isolated points/tiers per tenant
-- Architecture: Many-to-many relationship via member_tenants table

-- ============================================================================
-- PART 1: Create member_tenants Junction Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS member_tenants (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Tenant-specific member data (moved from profiles)
    active_points int DEFAULT 0 CHECK (active_points >= 0),
    lifetime_points int DEFAULT 0 CHECK (lifetime_points >= 0),
    tier_id uuid REFERENCES member_tiers(id),
    
    -- OTP per membership
    otp_code text,
    otp_expires_at timestamptz,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE(member_id, tenant_id),
    CHECK (active_points <= lifetime_points) -- Active can't exceed lifetime
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_tenants_member ON member_tenants(member_id);
CREATE INDEX IF NOT EXISTS idx_member_tenants_tenant ON member_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_member_tenants_otp ON member_tenants(otp_code) WHERE otp_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_member_tenants_tier ON member_tenants(tier_id);

-- Comments
COMMENT ON TABLE member_tenants IS 'Junction table enabling many-to-many member-tenant relationships with isolated points/tiers';
COMMENT ON COLUMN member_tenants.active_points IS 'Points available for redemption (subject to expiry)';
COMMENT ON COLUMN member_tenants.lifetime_points IS 'Total points earned all-time (never decreases, used for tier calculation)';
COMMENT ON COLUMN member_tenants.otp_code IS 'One-time code for transaction verification, scoped per membership';

-- ============================================================================
-- PART 2: Add Tenant Slug Support
-- ============================================================================

-- Add slug column to tenants
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Add tenant settings for customization
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{
  "points_expiry_enabled": true,
  "points_expiry_days": 365,
  "expiry_warning_days": 30,
  "points_per_dollar": 1,
  "min_redemption_points": 100,
  "whatsapp_notifications": true,
  "theme_color": "#3B82F6"
}'::jsonb;

-- Generate slugs for existing tenants (if any)
DO $$
DECLARE
    tenant_record RECORD;
    generated_slug text;
    counter int;
BEGIN
    FOR tenant_record IN SELECT id, name FROM tenants WHERE slug IS NULL LOOP
        -- Generate slug from name
        generated_slug := LOWER(REGEXP_REPLACE(tenant_record.name, '[^a-zA-Z0-9]+', '-', 'g'));
        generated_slug := TRIM(BOTH '-' FROM generated_slug);
        
        -- Handle duplicates by appending counter
        counter := 1;
        WHILE EXISTS (SELECT 1 FROM tenants WHERE slug = generated_slug) LOOP
            generated_slug := LOWER(REGEXP_REPLACE(tenant_record.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || counter;
            counter := counter + 1;
        END LOOP;
        
        -- Update tenant with slug
        UPDATE tenants SET slug = generated_slug WHERE id = tenant_record.id;
    END LOOP;
END $$;

-- Make slug NOT NULL after backfill
ALTER TABLE tenants
ALTER COLUMN slug SET NOT NULL;

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Comments
COMMENT ON COLUMN tenants.slug IS 'URL-safe identifier for tenant (e.g., coffee-shop)';
COMMENT ON COLUMN tenants.settings IS 'JSON configuration for tenant-specific loyalty program rules';

-- ============================================================================
-- PART 3: Migrate Existing Data
-- ============================================================================

-- Migrate existing profile data to member_tenants
INSERT INTO member_tenants (
    member_id,
    tenant_id,
    active_points,
    lifetime_points,
    tier_id,
    otp_code,
    otp_expires_at,
    created_at
)
SELECT 
    p.id as member_id,
    p.tenant_id,
    COALESCE(p.points_balance, 0) as active_points,
    COALESCE(p.lifetime_points, 0) as lifetime_points,
    p.tier_id,
    p.otp_code,
    p.otp_expires_at,
    p.created_at
FROM profiles p
WHERE p.tenant_id IS NOT NULL
  AND p.role = 'member'
ON CONFLICT (member_id, tenant_id) DO NOTHING;

-- ============================================================================
-- PART 4: Update points_history for Tenant Scoping
-- ============================================================================

-- Add expires_at for points expiry tracking
ALTER TABLE points_history
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Add voided_at for reversals
ALTER TABLE points_history
ADD COLUMN IF NOT EXISTS voided_at timestamptz;

-- Update type enum to include 'expired'
-- Note: PostgreSQL doesn't support ALTER TYPE easily, so we'll add a check constraint instead
ALTER TABLE points_history
DROP CONSTRAINT IF EXISTS points_history_type_check;

ALTER TABLE points_history
ADD CONSTRAINT points_history_type_check 
CHECK (type IN ('earn', 'redeem', 'expired', 'adjustment', 'void'));

-- Set expires_at for existing earn transactions (365 days from creation)
UPDATE points_history
SET expires_at = created_at + INTERVAL '365 days'
WHERE type = 'earn' AND expires_at IS NULL;

-- Index for expiry queries
CREATE INDEX IF NOT EXISTS idx_points_history_expires ON points_history(expires_at) WHERE expires_at IS NOT NULL;

-- Comments
COMMENT ON COLUMN points_history.expires_at IS 'When earned points expire (FIFO basis). NULL for redemptions.';
COMMENT ON COLUMN points_history.voided_at IS 'Timestamp if transaction was reversed/voided';

-- ============================================================================
-- PART 5: Update Tier Tracking Function
-- ============================================================================

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS update_tier_on_points_change ON profiles;

-- Drop old function
DROP FUNCTION IF EXISTS update_member_tier(uuid);

-- New function for member_tenants tier calculation
CREATE OR REPLACE FUNCTION update_member_tenant_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_tier_id uuid;
BEGIN
    -- Find appropriate tier based on lifetime_points
    SELECT id INTO v_new_tier_id
    FROM member_tiers
    WHERE NEW.lifetime_points >= min_points
      AND (max_points IS NULL OR NEW.lifetime_points <= max_points)
    ORDER BY min_points DESC
    LIMIT 1;
    
    -- Update tier if changed
    IF v_new_tier_id IS DISTINCT FROM NEW.tier_id THEN
        NEW.tier_id := v_new_tier_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger to auto-update tier when points change
CREATE TRIGGER update_tier_on_member_tenant_points
BEFORE INSERT OR UPDATE OF lifetime_points ON member_tenants
FOR EACH ROW
EXECUTE FUNCTION update_member_tenant_tier();

-- ============================================================================
-- PART 6: Clean Up profiles Table (Keep Platform-Level Only)
-- ============================================================================

-- Remove tenant-specific columns from profiles
-- NOTE: Only remove after data migration is confirmed successful
-- These are commented out for safety - uncomment after verification

-- ALTER TABLE profiles DROP COLUMN IF EXISTS points_balance;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS lifetime_points;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS tier_id;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS otp_code;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS otp_expires_at;

-- Keep these columns in profiles (platform-level):
-- - id, phone, full_name, email, role, password_setup_completed, created_at, updated_at

-- NOTE FOR PRODUCTION: After deployment and testing, run cleanup:
-- ALTER TABLE profiles DROP COLUMN tenant_id; -- Remove single-tenant reference

-- ============================================================================
-- PART 7: Helper Functions
-- ============================================================================

-- Function to get member's active points for a tenant
CREATE OR REPLACE FUNCTION get_member_active_points(p_member_id uuid, p_tenant_id uuid)
RETURNS int
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_active_points int;
BEGIN
    SELECT active_points INTO v_active_points
    FROM member_tenants
    WHERE member_id = p_member_id AND tenant_id = p_tenant_id;
    
    RETURN COALESCE(v_active_points, 0);
END;
$$;

-- Function to create or get member_tenant relationship
CREATE OR REPLACE FUNCTION ensure_member_tenant(p_member_id uuid, p_tenant_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_membership_id uuid;
BEGIN
    -- Try to get existing membership
    SELECT id INTO v_membership_id
    FROM member_tenants
    WHERE member_id = p_member_id AND tenant_id = p_tenant_id;
    
    -- Create if doesn't exist
    IF v_membership_id IS NULL THEN
        INSERT INTO member_tenants (member_id, tenant_id)
        VALUES (p_member_id, p_tenant_id)
        RETURNING id INTO v_membership_id;
    END IF;
    
    RETURN v_membership_id;
END;
$$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify migration success
DO $$
DECLARE
    v_tenant_count int;
    v_member_count int;
    v_membership_count int;
BEGIN
    SELECT COUNT(*) INTO v_tenant_count FROM tenants WHERE slug IS NOT NULL;
    SELECT COUNT(*) INTO v_member_count FROM profiles WHERE role = 'member';
    SELECT COUNT(*) INTO v_membership_count FROM member_tenants;
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  Tenants with slugs: %', v_tenant_count;
    RAISE NOTICE '  Total members: %', v_member_count;
    RAISE NOTICE '  Member-tenant memberships: %', v_membership_count;
END $$;
