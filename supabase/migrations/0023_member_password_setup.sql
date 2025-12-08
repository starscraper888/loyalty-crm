-- Migration: Add password setup tracking for members
-- Purpose: Track which members have completed OTP-based password setup

-- Add flag to track password setup completion
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS password_setup_completed boolean DEFAULT false;

-- Comment for clarity
COMMENT ON COLUMN profiles.password_setup_completed IS 
'Indicates if member has set their password via OTP flow (true) or still needs to (false). Staff/Admin always true.';

-- Update existing users with passwords to true
UPDATE profiles p
SET password_setup_completed = true
WHERE EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = p.id 
    AND u.encrypted_password IS NOT NULL
    AND u.encrypted_password != ''
);

-- Staff/Admin always have passwords, so mark them as completed
UPDATE profiles
SET password_setup_completed = true
WHERE role IN ('staff', 'admin', 'manager', 'owner', 'super_admin');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_password_setup ON profiles(password_setup_completed) WHERE password_setup_completed = false;
