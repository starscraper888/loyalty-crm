-- 1. Webhook Events (Idempotency)
create table if not exists webhook_events (
  id uuid primary key default uuid_generate_v4(),
  event_id text not null, -- From WhatsApp (id)
  tenant_id uuid references tenants(id),
  payload jsonb,
  processed_at timestamptz default now(),
  unique(event_id)
);

-- 2. Job Queue (Automation)
create table if not exists job_queue (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  job_type text not null, -- e.g. 'send_welcome', 'process_redemption'
  payload jsonb,
  status text check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  created_at timestamptz default now(),
  processed_at timestamptz
);

-- RLS for new tables
alter table webhook_events enable row level security;
alter table job_queue enable row level security;

-- Policies (System only, usually)
-- But for now let's allow authenticated staff to view for debugging
create policy "Staff can view webhook events" on webhook_events
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'manager', 'staff')
    )
  );

create policy "Staff can view job queue" on job_queue
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'manager', 'staff')
    )
  );

-- Indexes
create index if not exists idx_webhook_events_event_id on webhook_events(event_id);
create index if not exists idx_job_queue_status on job_queue(status);
