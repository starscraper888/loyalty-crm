-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard -> Authentication -> Users.
-- 2. Create a new user (e.g., test@example.com) if you haven't already.
-- 3. Copy the 'User UID' for that user.
-- 4. Replace 'YOUR_USER_UUID_HERE' in the script below with that UID.
-- 5. Run this entire script in the Supabase SQL Editor.

-- 1. Create a Tenant (if not exists)
INSERT INTO tenants (name)
VALUES ('Demo Store')
ON CONFLICT DO NOTHING;

-- 2. Insert/Update Profile for that User
-- This links the Auth User to a Profile with a phone number and points.
INSERT INTO profiles (id, tenant_id, role, phone, full_name, points_balance)
SELECT 
  '6efa51eb-f8e5-4226-857d-485d1cfc17fc'::uuid, -- <--- PASTE YOUR UUID HERE
  id as tenant_id,
  'member',
  '+60122732109', -- <--- REPLACE WITH YOUR TEST WHATSAPP NUMBER (E.164 format)
  'Test User',
  100 -- Starting points
FROM tenants
WHERE name = 'Demo Store'
LIMIT 1
ON CONFLICT (id) DO UPDATE
SET 
  phone = EXCLUDED.phone,
  points_balance = EXCLUDED.points_balance,
  full_name = EXCLUDED.full_name;

-- 3. Verify Data
SELECT * FROM profiles WHERE phone = '+60122732109';

-- 4. Verify Rate Limits Table (Should be empty initially)
SELECT * FROM rate_limits;
