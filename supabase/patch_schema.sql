-- PATCH: Fix missing columns and triggers
-- Run this if you started with 20240522000000_init.sql and are missing columns.

-- 1. Add missing columns to 'profiles'
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS points_balance int default 0,
ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- 2. Add missing columns to 'rewards'
ALTER TABLE rewards 
ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- 3. Create 'sync_points_balance' function and trigger
CREATE OR REPLACE FUNCTION sync_points_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles
    SET points_balance = points_balance + NEW.points
    WHERE id = NEW.profile_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles
    SET points_balance = points_balance - OLD.points
    WHERE id = OLD.profile_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_points ON points_ledger;
CREATE TRIGGER trigger_sync_points
  AFTER INSERT OR DELETE ON points_ledger
  FOR EACH ROW EXECUTE PROCEDURE sync_points_balance();

-- 4. Create 'update_updated_at_column' function and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_rewards_updated_at ON rewards;
CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. Re-run the manual seed logic (optional, but helpful to retry the failed insert)
-- You can run the manual_seed.sql script again after this.
