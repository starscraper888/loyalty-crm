-- Add OTP columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS otp_code text,
ADD COLUMN IF NOT EXISTS otp_expires_at timestamptz;

-- Create RPC to verify and consume OTP
CREATE OR REPLACE FUNCTION verify_otp(p_otp text)
RETURNS json AS $$
DECLARE
  v_profile record;
BEGIN
  -- Find user with matching OTP that hasn't expired
  SELECT * INTO v_profile
  FROM profiles
  WHERE otp_code = p_otp
  AND otp_expires_at > now();

  IF FOUND THEN
    -- Consume OTP (make it invalid for reuse)
    UPDATE profiles
    SET otp_code = NULL, otp_expires_at = NULL
    WHERE id = v_profile.id;
    
    -- Return the profile data
    RETURN row_to_json(v_profile);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
