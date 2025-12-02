-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tenants Table
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Profiles (Users)
-- Linked to auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id),
  role text check (role in ('admin', 'staff', 'member')) default 'member',
  phone text,
  full_name text,
  created_at timestamptz default now()
);

-- 3. Points Ledger
create table points_ledger (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  profile_id uuid references profiles(id),
  points int not null,
  type text check (type in ('earn', 'redeem')),
  description text,
  created_at timestamptz default now()
);

-- 4. Rewards
create table rewards (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  name text not null,
  cost int not null check (cost > 0),
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 5. Redemptions
create table redemptions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  profile_id uuid references profiles(id),
  reward_id uuid references rewards(id),
  status text check (status in ('pending', 'completed', 'cancelled')) default 'pending',
  otp_code text,
  otp_expires_at timestamptz,
  redeemed_at timestamptz default now()
);

-- 6. Staff Secrets (PINs)
create table staff_secrets (
  profile_id uuid primary key references profiles(id) on delete cascade,
  tenant_id uuid references tenants(id),
  pin_hash text not null,
  created_at timestamptz default now()
);

-- 7. Audit Logs (Immutable)
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  actor_id uuid references auth.users(id),
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

-- RLS HELPERS
create or replace function get_my_tenant_id()
returns uuid as $$
  select tenant_id from profiles where id = auth.uid();
$$ language sql security definer;

-- ENABLE RLS
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table points_ledger enable row level security;
alter table rewards enable row level security;
alter table redemptions enable row level security;
alter table staff_secrets enable row level security;
alter table audit_logs enable row level security;

-- POLICIES

-- Tenants
create policy "Users can view their own tenant" on tenants
  for select using (id = get_my_tenant_id());

-- Profiles
create policy "Users can view their own profile" on profiles
  for select using (id = auth.uid());

create policy "Staff can view all profiles in their tenant" on profiles
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff') and p.tenant_id = profiles.tenant_id
    )
  );

-- Points Ledger
create policy "Users can view their own points" on points_ledger
  for select using (profile_id = auth.uid());

create policy "Staff can view all points in their tenant" on points_ledger
  for select using (
    tenant_id = get_my_tenant_id() and
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff')
    )
  );

-- Rewards
create policy "Everyone in tenant can view rewards" on rewards
  for select using (tenant_id = get_my_tenant_id());

create policy "Staff can manage rewards" on rewards
  for all using (
    tenant_id = get_my_tenant_id() and
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff')
    )
  );

-- Redemptions
create policy "Users can view their own redemptions" on redemptions
  for select using (profile_id = auth.uid());

create policy "Staff can view and manage redemptions" on redemptions
  for all using (
    tenant_id = get_my_tenant_id() and
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff')
    )
  );

-- Staff Secrets
create policy "No direct access to staff secrets" on staff_secrets
  for all using (false); -- Only accessible via security definer functions

-- Audit Logs
create policy "Staff can view audit logs" on audit_logs
  for select using (
    tenant_id = get_my_tenant_id() and
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff')
    )
  );

create policy "System can insert audit logs" on audit_logs
  for insert with check (true); -- Usually handled by triggers or server-side logic

-- IMMUTABILITY TRIGGER FOR AUDIT LOGS
create or replace function prevent_update_delete()
returns trigger as $$
begin
  raise exception 'Modifying audit logs is forbidden';
end;
$$ language plpgsql;

create trigger audit_logs_immutable
  before update or delete on audit_logs
  for each row execute procedure prevent_update_delete();

-- RPC: Verify Staff PIN
create or replace function verify_staff_pin(p_profile_id uuid, p_pin_hash text)
returns boolean as $$
declare
  valid boolean;
begin
  select (pin_hash = p_pin_hash) into valid
  from staff_secrets
  where profile_id = p_profile_id;
  
  return coalesce(valid, false);
end;
$$ language plpgsql security definer;

