-- Fix Infinite Recursion in RLS Policies (V2)

-- 1. Helper to get tenant_id without triggering RLS
CREATE OR REPLACE FUNCTION get_my_tenant_id_secure()
RETURNS uuid AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Access profiles table directly with system privileges
  SELECT tenant_id INTO v_tenant_id
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper to check role without triggering RLS
CREATE OR REPLACE FUNCTION is_staff_secure()
RETURNS boolean AS $$
BEGIN
  -- Access profiles table directly with system privileges
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop ALL existing policies on profiles to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Staff can view all profiles in their tenant" ON profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;

-- 4. Re-create policies using the SECURE functions
-- Policy A: Self access
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Policy B: Staff access (using secure functions to avoid recursion)
CREATE POLICY "Staff can view all profiles in their tenant" ON profiles
  FOR SELECT USING (
    is_staff_secure() AND 
    tenant_id = get_my_tenant_id_secure()
  );
