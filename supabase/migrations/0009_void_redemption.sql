-- Add status column to redemptions table
ALTER TABLE redemptions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' 
CHECK (status IN ('completed', 'voided'));

-- Add void tracking columns
ALTER TABLE redemptions
ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS void_reason TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);

-- Create RPC function for atomic void operation
CREATE OR REPLACE FUNCTION void_redemption(
  p_redemption_id UUID,
  p_void_reason TEXT,
  p_voided_by UUID
) RETURNS JSON AS $$
DECLARE
  v_redemption RECORD;
  v_refund_amount INTEGER;
  v_reward_name TEXT;
BEGIN
  -- Get redemption details
  SELECT r.*, rw.name as reward_name, rw.cost
  INTO v_redemption
  FROM redemptions r
  JOIN rewards rw ON r.reward_id = rw.id
  WHERE r.id = p_redemption_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Redemption not found');
  END IF;

  IF v_redemption.status = 'voided' THEN
    RETURN json_build_object('success', false, 'error', 'Already voided');
  END IF;

  -- Get refund amount (reward cost)
  v_refund_amount := v_redemption.cost;
  v_reward_name := v_redemption.reward_name;

  -- Mark redemption as voided
  UPDATE redemptions
  SET status = 'voided',
      voided_at = NOW(),
      voided_by = p_voided_by,
      void_reason = p_void_reason
  WHERE id = p_redemption_id;

  -- Refund points to customer
  INSERT INTO points_ledger (
    tenant_id,
    profile_id,
    points,
    type,
    description
  ) VALUES (
    v_redemption.tenant_id,
    v_redemption.profile_id,
    v_refund_amount,
    'earn',
    'Refund: ' || v_reward_name || ' (Voided - ' || p_void_reason || ')'
  );

  RETURN json_build_object(
    'success', true,
    'refunded_points', v_refund_amount,
    'reward_name', v_reward_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION void_redemption TO authenticated;
