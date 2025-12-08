-- Secure transaction processing to prevent race conditions
create or replace function process_points_transaction(
  p_profile_id uuid,
  p_points int,
  p_type text,
  p_description text
) returns int as $$
declare
  v_new_balance int;
  v_current_balance int;
  v_tenant_id uuid;
begin
  -- Lock the profile row to prevent concurrent updates
  select tenant_id, points_balance 
  into v_tenant_id, v_current_balance
  from profiles
  where id = p_profile_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  -- For redemptions (negative points), ensure sufficient balance
  if p_points < 0 and (v_current_balance + p_points < 0) then
    raise exception 'Insufficient balance: Current %s, Attempting to redeem %s', v_current_balance, abs(p_points);
  end if;

  -- Insert into ledger (Trigger `trigger_sync_points` will update profile balance)
  -- The trigger runs within the same transaction, inheriting the lock.
  insert into points_ledger (tenant_id, profile_id, points, type, description)
  values (v_tenant_id, p_profile_id, p_points, p_type, p_description);

  -- Get the updated balance (Trigger should have fired)
  select points_balance into v_new_balance
  from profiles
  where id = p_profile_id;

  return v_new_balance;
end;
$$ language plpgsql security definer;

-- Grant execute to authenticated users (Staff will use this)
grant execute on function process_points_transaction to authenticated;
