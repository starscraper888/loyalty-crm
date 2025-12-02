-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tenants Table
create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Profiles (Users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id),
  role text check (role in ('owner', 'manager', 'staff', 'member')) default 'member',
  phone text,
  full_name text,
  points_balance int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Points Ledger
create table if not exists points_ledger (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  profile_id uuid references profiles(id),
  points int not null,
  type text check (type in ('earn', 'redeem')),
  description text,
  created_at timestamptz default now()
);

-- 4. Rewards
create table if not exists rewards (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  name text not null,
  cost int not null check (cost > 0),
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Redemptions
create table if not exists redemptions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  profile_id uuid references profiles(id),
  reward_id uuid references rewards(id),
  status text check (status in ('pending', 'completed', 'cancelled')) default 'pending',
  otp_code text,
  otp_expires_at timestamptz,
  redeemed_at timestamptz,
  created_at timestamptz default now()
);

-- 6. Staff Secrets (PINs)
create table if not exists staff_secrets (
  profile_id uuid primary key references profiles(id) on delete cascade,
  tenant_id uuid references tenants(id),
  pin_hash text not null,
  created_at timestamptz default now()
);

-- 7. Audit Logs (Immutable)
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  actor_id uuid references auth.users(id),
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

-- INDEXES
create index if not exists idx_profiles_tenant on profiles(tenant_id);
create index if not exists idx_profiles_phone on profiles(phone);
create index if not exists idx_points_ledger_profile on points_ledger(profile_id);
create index if not exists idx_points_ledger_tenant on points_ledger(tenant_id);
create index if not exists idx_redemptions_otp on redemptions(otp_code);
create index if not exists idx_redemptions_tenant on redemptions(tenant_id);

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
    tenant_id = get_my_tenant_id() and
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'manager', 'staff')
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
      where p.id = auth.uid() and p.role in ('owner', 'manager', 'staff')
    )
  );

create policy "Staff can insert points" on points_ledger
  for insert with check (
    tenant_id = get_my_tenant_id() and
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'manager', 'staff')
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
      where p.id = auth.uid() and p.role in ('owner', 'manager', 'staff')
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
      where p.id = auth.uid() and p.role in ('owner', 'manager', 'staff')
    )
  );

-- Staff Secrets
create policy "No direct access to staff secrets" on staff_secrets
  for all using (false);

-- Audit Logs
create policy "Staff can view audit logs" on audit_logs
  for select using (
    tenant_id = get_my_tenant_id() and
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'manager', 'staff')
    )
  );

-- TRIGGERS

-- 1. Sync Points Balance
create or replace function sync_points_balance()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update profiles
    set points_balance = points_balance + NEW.points
    where id = NEW.profile_id;
  elsif (TG_OP = 'DELETE') then
    update profiles
    set points_balance = points_balance - OLD.points
    where id = OLD.profile_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger trigger_sync_points
  after insert or delete on points_ledger
  for each row execute procedure sync_points_balance();

-- 2. Audit Logs Immutability
create or replace function prevent_update_delete()
returns trigger as $$
begin
  raise exception 'Modifying audit logs is forbidden';
end;
$$ language plpgsql;

create trigger audit_logs_immutable
  before update or delete on audit_logs
  for each row execute procedure prevent_update_delete();

-- 3. Updated At Timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at_column();

create trigger update_rewards_updated_at
  before update on rewards
  for each row execute procedure update_updated_at_column();

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
