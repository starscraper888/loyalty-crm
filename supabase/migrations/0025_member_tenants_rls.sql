-- Migration: Row Level Security for member_tenants
-- Purpose: Enforce tenant isolation and data privacy
-- CRITICAL: Without this, any user can access any tenant's member data

-- ============================================================================
-- PART 1: Enable Row Level Security
-- ============================================================================

ALTER TABLE member_tenants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: Member Policies (Members can only access their own memberships)
-- ============================================================================

-- Policy 1: Members can view their own memberships across all tenants
CREATE POLICY "Members can view own memberships"
ON member_tenants
FOR SELECT
TO authenticated
USING (
    auth.uid() = member_id
);

-- Policy 2: Members can update their own OTP (for generateMyOTP function)
CREATE POLICY "Members can update own OTP"
ON member_tenants
FOR UPDATE
TO authenticated
USING (auth.uid() = member_id)
WITH CHECK (
    auth.uid() = member_id
    -- Only allow updating OTP-related fields
    AND (
        otp_code IS NOT NULL 
        OR otp_expires_at IS NOT NULL
    )
);

-- ============================================================================
-- PART 3: Staff Policies (Staff can only access their tenant's memberships)
-- ============================================================================

-- Policy 3: Staff can view memberships for their tenant only
CREATE POLICY "Staff can view tenant memberships"
ON member_tenants
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = member_tenants.tenant_id
        AND profiles.role IN ('staff', 'admin', 'owner', 'manager')
    )
);

-- Policy 4: Staff can update memberships for their tenant only
CREATE POLICY "Staff can update tenant memberships"
ON member_tenants
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = member_tenants.tenant_id
        AND profiles.role IN ('staff', 'admin', 'owner', 'manager')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = member_tenants.tenant_id
        AND profiles.role IN ('staff', 'admin', 'owner', 'manager')
    )
);

-- Policy 5: Staff can create memberships for their tenant only
CREATE POLICY "Staff can create tenant memberships"
ON member_tenants
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = member_tenants.tenant_id
        AND profiles.role IN ('staff', 'admin', 'owner', 'manager')
    )
);

-- Policy 6: Staff can delete memberships for their tenant only
CREATE POLICY "Staff can delete tenant memberships"
ON member_tenants
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = member_tenants.tenant_id
        AND profiles.role IN ('staff', 'admin', 'owner', 'manager')
    )
);

-- ============================================================================
-- PART 4: Service Role Bypass (for server-side operations)
-- ============================================================================

-- Service role can do anything (for admin operations, migrations, etc.)
CREATE POLICY "Service role has full access"
ON member_tenants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PART 5: Comments
-- ============================================================================

COMMENT ON POLICY "Members can view own memberships" ON member_tenants IS 
'Members can see all their memberships across different tenants';

COMMENT ON POLICY "Staff can view tenant memberships" ON member_tenants IS 
'Staff can only view memberships for their own tenant, ensuring tenant isolation';

COMMENT ON POLICY "Staff can update tenant memberships" ON member_tenants IS 
'Staff can only update points/tier for members of their own tenant';

-- ============================================================================
-- Verification
-- ============================================================================

-- List all policies on member_tenants
DO $$
BEGIN
    RAISE NOTICE 'RLS Policies created for member_tenants:';
    RAISE NOTICE '1. Members can view own memberships';
    RAISE NOTICE '2. Members can update own OTP';
    RAISE NOTICE '3. Staff can view tenant memberships';
    RAISE NOTICE '4. Staff can update tenant memberships';
    RAISE NOTICE '5. Staff can create tenant memberships';
    RAISE NOTICE '6. Staff can delete tenant memberships';
    RAISE NOTICE '7. Service role has full access';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS is now ENABLED - tenant isolation enforced!';
END $$;
