-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code text UNIQUE NOT NULL,
  status text CHECK (status IN ('pending', 'completed', 'rewarded')) DEFAULT 'pending',
  referrer_reward int DEFAULT 0,
  referee_reward int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  rewarded_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- RLS Policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer or referee)
CREATE POLICY "Users can view their referrals" ON referrals
  FOR SELECT USING (
    auth.uid() = referrer_id OR auth.uid() = referee_id
  );

-- Staff can view all referrals in their tenant
CREATE POLICY "Staff can view tenant referrals" ON referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('owner', 'manager', 'staff', 'admin')
      AND p.tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = referrals.referrer_id
      )
    )
  );

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(profile_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    -- Generate 8-character code: first 4 from name hash, last 4 random
    code := UPPER(
      SUBSTRING(MD5(profile_id::text) FROM 1 FOR 4) || 
      SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 4)
    );
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = code) INTO exists;
    
    -- Exit loop if unique
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Function to process referral completion
CREATE OR REPLACE FUNCTION complete_referral(p_referral_code text, p_referee_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id uuid;
  v_referrer_reward int := 100; -- Default: 100 points for referrer
  v_referee_reward int := 50;   -- Default: 50 points for referee
  v_referral_id uuid;
  v_result json;
BEGIN
  -- Find referral by code
  SELECT id, referrer_id INTO v_referral_id, v_referrer_id
  FROM referrals
  WHERE referral_code = p_referral_code
  AND status = 'pending';
  
  IF v_referral_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or already used referral code');
  END IF;
  
  -- Prevent self-referral
  IF v_referrer_id = p_referee_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot refer yourself');
  END IF;
  
  -- Update referral status
  UPDATE referrals
  SET 
    referee_id = p_referee_id,
    status = 'completed',
    completed_at = NOW(),
    referrer_reward = v_referrer_reward,
    referee_reward = v_referee_reward
  WHERE id = v_referral_id;
  
  -- Award points to referrer
  UPDATE profiles
  SET points_balance = points_balance + v_referrer_reward
  WHERE id = v_referrer_id;
  
  -- Award points to referee
  UPDATE profiles
  SET points_balance = points_balance + v_referee_reward
  WHERE id = p_referee_id;
  
  -- Log transactions
  INSERT INTO points_ledger (profile_id, points, type, description)
  VALUES 
    (v_referrer_id, v_referrer_reward, 'earn', 'Referral bonus - friend joined'),
    (p_referee_id, v_referee_reward, 'earn', 'Welcome bonus - referred by friend');
  
  RETURN json_build_object(
    'success', true,
    'referrer_reward', v_referrer_reward,
    'referee_reward', v_referee_reward
  );
END;
$$;
