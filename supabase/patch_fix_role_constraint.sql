-- Fix Role Check Constraint
-- The existing constraint might be missing 'manager' or 'admin'.
-- We will drop it and recreate it with all necessary roles.

ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('owner', 'manager', 'staff', 'member', 'admin'));
