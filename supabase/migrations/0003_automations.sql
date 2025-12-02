-- 1. Update Profiles
alter table profiles 
add column if not exists birthdate date,
add column if not exists last_interaction_at timestamptz default now();

create index if not exists idx_profiles_birthdate on profiles(birthdate);
create index if not exists idx_profiles_last_interaction on profiles(last_interaction_at);

-- 2. WhatsApp Templates (Cost Tracking)
create table if not exists whatsapp_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  category text, -- e.g. 'marketing', 'utility'
  cost_per_msg decimal(10, 4) default 0.0,
  created_at timestamptz default now()
);

-- Seed some templates
insert into whatsapp_templates (name, category, cost_per_msg) values
('birthday_greeting', 'marketing', 0.05),
('winback_offer', 'marketing', 0.05),
('low_balance_alert', 'utility', 0.03)
on conflict (name) do nothing;

-- 3. Automation Logs (Rate Limiting & Cost)
create table if not exists automation_logs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  profile_id uuid references profiles(id),
  template_id uuid references whatsapp_templates(id),
  automation_type text not null, -- 'birthday', 'winback', 'low_balance'
  cost decimal(10, 4) default 0.0,
  sent_at timestamptz default now()
);

-- Indexes for Rate Limiting
create index if not exists idx_automation_logs_profile_type 
on automation_logs(profile_id, automation_type, sent_at);

-- RLS
alter table whatsapp_templates enable row level security;
alter table automation_logs enable row level security;

create policy "Staff can view templates" on whatsapp_templates
  for select using (true); -- Public read for authenticated users

create policy "Staff can view automation logs" on automation_logs
  for select using (
    tenant_id = get_my_tenant_id() and
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'manager', 'staff')
    )
  );
