-- Fix RLS Policies for Rewards and Redemptions
-- Depends on the secure functions created in patch_rls_recursion_v2.sql

-- 1. Rewards
DROP POLICY IF EXISTS "Everyone in tenant can view rewards" ON rewards;
DROP POLICY IF EXISTS "Staff can manage rewards" ON rewards;

CREATE POLICY "Everyone in tenant can view rewards" ON rewards
  FOR SELECT USING (
    tenant_id = get_my_tenant_id_secure()
  );

CREATE POLICY "Staff can manage rewards" ON rewards
  FOR ALL USING (
    is_staff_secure() AND 
    tenant_id = get_my_tenant_id_secure()
  );

-- 2. Redemptions
DROP POLICY IF EXISTS "Users can view their own redemptions" ON redemptions;
DROP POLICY IF EXISTS "Staff can view and manage redemptions" ON redemptions;

CREATE POLICY "Users can view their own redemptions" ON redemptions
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Staff can view and manage redemptions" ON redemptions
  FOR ALL USING (
    is_staff_secure() AND 
    tenant_id = get_my_tenant_id_secure()
  );
