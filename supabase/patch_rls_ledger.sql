-- Fix RLS Policies for Points Ledger
-- Depends on the secure functions created in patch_rls_recursion_v2.sql

-- 1. Drop existing policies on points_ledger
DROP POLICY IF EXISTS "Users can view their own points" ON points_ledger;
DROP POLICY IF EXISTS "Staff can view all points in their tenant" ON points_ledger;
DROP POLICY IF EXISTS "Staff can insert points" ON points_ledger;

-- 2. Re-create policies using secure functions
-- Policy A: Users view their own
CREATE POLICY "Users can view their own points" ON points_ledger
  FOR SELECT USING (profile_id = auth.uid());

-- Policy B: Staff view all in tenant
CREATE POLICY "Staff can view all points in their tenant" ON points_ledger
  FOR SELECT USING (
    is_staff_secure() AND 
    tenant_id = get_my_tenant_id_secure()
  );

-- Policy C: Staff insert points
CREATE POLICY "Staff can insert points" ON points_ledger
  FOR INSERT WITH CHECK (
    is_staff_secure() AND 
    tenant_id = get_my_tenant_id_secure()
  );
