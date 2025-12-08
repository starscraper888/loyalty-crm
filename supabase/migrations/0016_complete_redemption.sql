-- Atomic redemption completion
create or replace function complete_redemption(
  p_redemption_id uuid,
  p_otp text
) returns jsonb as $$
declare
  v_redemption record;
  v_reward record;
  v_balance int;
begin
  -- Lock Redemption Row
  select * into v_redemption
  from redemptions
  where id = p_redemption_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Redemption not found');
  end if;

  if v_redemption.status != 'pending' then
    return jsonb_build_object('success', false, 'error', 'Redemption already processed');
  end if;

  if v_redemption.otp_code != p_otp then
    return jsonb_build_object('success', false, 'error', 'Invalid OTP');
  end if;

  if v_redemption.otp_expires_at < now() then
     return jsonb_build_object('success', false, 'error', 'OTP Expired');
  end if;

  -- Get Reward Cost
  select * into v_reward from rewards where id = v_redemption.reward_id;
  
  -- Lock Profile to check balance
  select points_balance into v_balance 
  from profiles 
  where id = v_redemption.profile_id 
  for update;
  
  if v_balance < v_reward.cost then
      return jsonb_build_object('success', false, 'error', 'Insufficient balance');
  end if;

  -- Update Redemption
  update redemptions 
  set status = 'completed', redeemed_at = now(), otp_code = null 
  where id = p_redemption_id;

  -- Deduct Points (Trigger `sync_points_balance` will update profile balance)
  insert into points_ledger (tenant_id, profile_id, points, type, description)
  values (v_redemption.tenant_id, v_redemption.profile_id, -v_reward.cost, 'redeem', 'Redeemed: ' || v_reward.name);

  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;

grant execute on function complete_redemption to authenticated;
