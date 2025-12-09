-- Migration: Fix RLS Policy for Member OTP Updates
-- Bug #2: WITH CHECK clause preventing member OTP generation
-- Priority: CRITICAL

-- Drop the problematic policy
DROP POLICY IF EXISTS "Members can update own OTP" ON member_tenants;

-- Recreate with corrected WITH CHECK
CREATE POLICY "Members can update own OTP"
ON member_tenants
FOR UPDATE
TO authenticated
USING (auth.uid() = member_id)
WITH CHECK (auth.uid() = member_id);
-- Removed restrictive otp_code/otp_expires_at check that blocked updates

COMMENT ON POLICY "Members can update own OTP" ON member_tenants IS 
'Members can update their OTP fields for any of their memberships. Used by generateMyOTP() function.';
