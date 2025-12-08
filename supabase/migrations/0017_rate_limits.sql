-- Rate Limits Table
create table if not exists rate_limits (
  key text primary key,
  count int default 1,
  updated_at timestamptz default now()
);

-- Enable RLS (though mostly used by system)
alter table rate_limits enable row level security;

-- Policy: No direct access
create policy "No direct access to rate limits" on rate_limits
  for all using (false);

-- RPC: Check Rate Limit (Leaky Bucket / Fixed Window reset)
create or replace function check_rate_limit(
  p_key text,
  p_window_seconds int,
  p_limit int
) returns boolean as $$
declare
  v_count int;
  v_last_update timestamptz;
begin
  -- Lock the row
  select count, updated_at into v_count, v_last_update
  from rate_limits
  where key = p_key
  for update;

  if not found then
    insert into rate_limits(key, count, updated_at) values (p_key, 1, now());
    return true;
  end if;

  if (now() - v_last_update) > (p_window_seconds * interval '1 second') then
    -- Window expired, reset
    update rate_limits set count = 1, updated_at = now() where key = p_key;
    return true;
  else
    -- Still in window
    if v_count >= p_limit then
      return false; -- Rate limited
    else
      update rate_limits set count = count + 1 where key = p_key;
      return true;
    end if;
  end if;
end;
$$ language plpgsql security definer;

-- Allow anon and authenticated to check limits (e.g. login page)
grant execute on function check_rate_limit to anon, authenticated, service_role;
