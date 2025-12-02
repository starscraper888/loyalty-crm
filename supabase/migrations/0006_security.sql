-- Rate Limits Table
create table if not exists rate_limits (
  key text primary key, -- e.g., 'ip:127.0.0.1', 'user:uuid'
  points int not null,
  last_refill timestamptz default now()
);

-- RLS: Only system (service role) should access this usually, 
-- but we might allow authenticated users to check their own limits if we wanted client-side feedback.
-- For now, keep it strict.
alter table rate_limits enable row level security;

-- Atomic Rate Limit Check (Token Bucket)
create or replace function check_rate_limit(
  p_key text,
  p_cost int,
  p_capacity int,
  p_refill_rate int -- points per second
)
returns boolean as $$
declare
  v_points int;
  v_last_refill timestamptz;
  v_now timestamptz := now();
  v_elapsed float;
  v_new_points int;
  v_allowed boolean;
begin
  -- Lock the row or insert if missing
  insert into rate_limits (key, points, last_refill)
  values (p_key, p_capacity, v_now)
  on conflict (key) do nothing;

  select points, last_refill into v_points, v_last_refill
  from rate_limits
  where key = p_key
  for update;

  -- Calculate refill
  v_elapsed := extract(epoch from (v_now - v_last_refill));
  v_new_points := floor(v_points + (v_elapsed * p_refill_rate));
  
  if v_new_points > p_capacity then
    v_new_points := p_capacity;
  end if;

  -- Check cost
  if v_new_points >= p_cost then
    v_new_points := v_new_points - p_cost;
    v_allowed := true;
  else
    v_allowed := false;
  end if;

  -- Update state
  update rate_limits
  set points = v_new_points,
      last_refill = v_now
  where key = p_key;

  return v_allowed;
end;
$$ language plpgsql security definer;
