-- Create member tiers table
CREATE TABLE IF NOT EXISTS member_tiers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  min_points int NOT NULL,
  max_points int,
  multiplier decimal(3,2) DEFAULT 1.0,
  color text NOT NULL,
  icon text NOT NULL,
  benefits jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add tier tracking to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tier_id uuid REFERENCES member_tiers(id),
ADD COLUMN IF NOT EXISTS lifetime_points int DEFAULT 0;

-- Create index for tier lookups
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier_id);
CREATE INDEX IF NOT EXISTS idx_profiles_lifetime_points ON profiles(lifetime_points);

-- Insert default tiers
INSERT INTO member_tiers (name, min_points, max_points, multiplier, color, icon, benefits) VALUES
('Bronze', 0, 999, 1.0, '#CD7F32', '🥉', '{"description": "Welcome tier for new members", "perks": ["Standard earning rate", "Access to basic rewards"]}'),
('Silver', 1000, 4999, 1.2, '#C0C0C0', '🥈', '{"description": "Loyal members with consistent engagement", "perks": ["20% bonus points", "Access to Silver-exclusive rewards", "Priority support"]}'),
('Gold', 5000, 14999, 1.5, '#FFD700', '🥇', '{"description": "Premium members driving business growth", "perks": ["50% bonus points", "Access to Gold-exclusive rewards", "VIP support", "Early access to new rewards"]}'),
('Platinum', 15000, NULL, 2.0, '#E5E4E2', '💎', '{"description": "Elite members - our most valued customers", "perks": ["100% bonus points (2x earnings)", "Access to ALL rewards including Platinum-exclusives", "Dedicated account manager", "Special birthday rewards", "Exclusive events access"]}')
ON CONFLICT (name) DO NOTHING;

-- Function to calculate and update member tier
CREATE OR REPLACE FUNCTION update_member_tier(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_lifetime_points int;
  v_new_tier_id uuid;
BEGIN
  -- Get current lifetime points
  SELECT lifetime_points INTO v_lifetime_points
  FROM profiles
  WHERE id = p_profile_id;
  
  -- Find appropriate tier
  SELECT id INTO v_new_tier_id
  FROM member_tiers
  WHERE min_points <= v_lifetime_points
    AND (max_points IS NULL OR max_points >= v_lifetime_points)
  ORDER BY min_points DESC
  LIMIT 1;
  
  -- Update profile tier
  UPDATE profiles
  SET tier_id = v_new_tier_id
  WHERE id = p_profile_id;
END;
$$;

-- Trigger to update lifetime points and tier when points are earned
CREATE OR REPLACE FUNCTION track_lifetime_points()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only increment lifetime points for 'earn' transactions
  IF NEW.type = 'earn' AND NEW.points > 0 THEN
    UPDATE profiles
    SET lifetime_points = lifetime_points + NEW.points
    WHERE id = NEW.profile_id;
    
    -- Update tier after points change
    PERFORM update_member_tier(NEW.profile_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists to make migration idempotent
DROP TRIGGER IF EXISTS trigger_track_lifetime_points ON points_ledger;

CREATE TRIGGER trigger_track_lifetime_points
AFTER INSERT ON points_ledger
FOR EACH ROW
EXECUTE FUNCTION track_lifetime_points();

-- Add tier requirement to rewards table
ALTER TABLE rewards
ADD COLUMN IF NOT EXISTS min_tier_id uuid REFERENCES member_tiers(id);

-- Create index for tier-based reward filtering
CREATE INDEX IF NOT EXISTS idx_rewards_min_tier ON rewards(min_tier_id);

-- Initialize existing members to Bronze tier
DO $$
DECLARE
  v_bronze_tier_id uuid;
BEGIN
  SELECT id INTO v_bronze_tier_id FROM member_tiers WHERE name = 'Bronze';
  
  UPDATE profiles
  SET tier_id = v_bronze_tier_id,
      lifetime_points = COALESCE(points_balance, 0)
  WHERE tier_id IS NULL;
  
  -- Update tiers for all members based on their current points
  PERFORM update_member_tier(id) FROM profiles WHERE tier_id IS NOT NULL;
END $$;
