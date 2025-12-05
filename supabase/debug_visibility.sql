-- Debug Script: Check Profiles and Tenants
-- Run this in Supabase SQL Editor to see the current state of your users.

SELECT 
  auth.users.email,
  profiles.role,
  profiles.tenant_id,
  tenants.name as tenant_name,
  profiles.full_name,
  profiles.points_balance
FROM profiles
JOIN auth.users ON profiles.id = auth.users.id
LEFT JOIN tenants ON profiles.tenant_id = tenants.id;
