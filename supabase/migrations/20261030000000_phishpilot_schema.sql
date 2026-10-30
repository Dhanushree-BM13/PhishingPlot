create extension if not exists pgcrypto;

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 500),
  sender text not null,
  reporter text not null,
  raw_email text not null check (char_length(raw_email) <= 100000),
  received_at timestamptz not null default now(),
  status text not null default 'investigating'
    check (status in ('new', 'investigating', 'awaiting_approval', 'resolved')),
  risk text check (risk in ('low', 'medium', 'high')),
  risk_score integer check (risk_score between 0 and 100),
  evidence jsonb not null default '[]'::jsonb,
  recommendation text
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  incident_id uuid not null references public.incidents(id) on delete cascade,
  agent_name text not null,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  result jsonb not null default '{}'::jsonb,
  completed_at timestamptz
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  incident_id uuid not null references public.incidents(id) on delete cascade,
  action text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  decided_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  actor text not null,
  event text not null,
  target text not null,
  created_at timestamptz not null default now()
);

create index if not exists incidents_owner_received_idx
  on public.incidents (owner_id, received_at desc);
create index if not exists agent_runs_owner_completed_idx
  on public.agent_runs (owner_id, completed_at desc);
create index if not exists approvals_owner_created_idx
  on public.approvals (owner_id, created_at desc);
create index if not exists audit_logs_owner_created_idx
  on public.audit_logs (owner_id, created_at desc);

alter table public.incidents enable row level security;
alter table public.agent_runs enable row level security;
alter table public.approvals enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users manage their own incidents"
  on public.incidents for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "Users manage their own agent runs"
  on public.agent_runs for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.incidents i
      where i.id = incident_id and i.owner_id = (select auth.uid())
    )
  );
create policy "Users manage their own approvals"
  on public.approvals for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.incidents i
      where i.id = incident_id and i.owner_id = (select auth.uid())
    )
  );
create policy "Users read their own audit logs"
  on public.audit_logs for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "Users create their own audit logs"
  on public.audit_logs for insert to authenticated
  with check (owner_id = (select auth.uid()));

grant select, insert, update, delete on public.incidents to authenticated;
grant select, insert, update, delete on public.agent_runs to authenticated;
grant select, insert, update, delete on public.approvals to authenticated;
grant select, insert on public.audit_logs to authenticated;
