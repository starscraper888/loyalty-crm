-- Fix Infinite Recursion in RLS Policies

-- 1. Create a secure function to check role without triggering RLS
CREATE OR REPLACE FUNCTION is_staff_or_admin()
RETURNS boolean AS $$
BEGIN
  -- Direct query to profiles bypassing RLS (security definer)
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the problematic policy
DROP POLICY IF EXISTS "Staff can view all profiles in their tenant" ON profiles;

-- 3. Re-create the policy using the secure function
CREATE POLICY "Staff can view all profiles in their tenant" ON profiles
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) 
    AND is_staff_or_admin()
  );

-- Also fix get_my_tenant_id to be safer if needed, but the main issue is the recursive role check.
-- Let's optimize get_my_tenant_id too to avoid recursion if it's used in profiles policy.

CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS uuid AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
