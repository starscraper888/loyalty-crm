-- Create whatsapp_rates table
create table if not exists whatsapp_rates (
  id uuid primary key default gen_random_uuid(),
  country_code text not null, -- e.g., 'MY', 'SG'
  category text not null, -- e.g., 'marketing', 'utility', 'authentication'
  rate decimal(10, 4) not null, -- Cost per message
  currency text default 'MYR',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(country_code, category)
);

-- RLS Policies
alter table whatsapp_rates enable row level security;

-- Allow read access to authenticated users (staff need to see rates)
create policy "Allow read access to authenticated users"
  on whatsapp_rates for select
  to authenticated
  using (true);

-- Allow write access only to admins (managers/owners)
-- Assuming we check profile role. For now, let's allow authenticated to update for MVP simplicity, 
-- or strictly restrict to specific roles if we had a robust role check function ready.
-- Let's use the existing pattern: check if user exists in profiles (which they must if authenticated)
-- and maybe restrict to 'owner' or 'manager'.
create policy "Allow write access to admins"
  on whatsapp_rates for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('owner', 'manager')
    )
  );

-- Seed some default rates
insert into whatsapp_rates (country_code, category, rate) values
('MY', 'marketing', 0.3500),
('MY', 'utility', 0.1500),
('MY', 'authentication', 0.1200),
('SG', 'marketing', 0.4500),
('SG', 'utility', 0.2000),
('SG', 'authentication', 0.1800)
on conflict (country_code, category) do nothing;
