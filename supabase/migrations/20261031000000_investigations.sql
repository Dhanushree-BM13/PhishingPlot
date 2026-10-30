-- Investigations produced by the multi-agent backend (POST /api/analyze).
-- Only the FastAPI backend writes and reads these tables, using the project's
-- secret key. RLS is enabled with no policies, so browser clients using the
-- publishable key can neither read nor write them.

create extension if not exists pgcrypto;

create table if not exists public.investigations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  subject text not null check (char_length(subject) between 1 and 500),
  sender text not null check (char_length(sender) between 3 and 320),
  body text not null check (char_length(body) <= 100000),
  urls jsonb not null default '[]'::jsonb,
  risk text not null check (risk in ('low', 'medium', 'high', 'critical')),
  risk_score integer not null check (risk_score between 0 and 100),
  explanation text not null default '',
  indicators jsonb not null default '[]'::jsonb,
  status text not null default 'awaiting_approval'
    check (status in ('awaiting_approval', 'closed'))
);

create table if not exists public.investigation_agent_runs (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations(id) on delete cascade,
  position smallint not null,
  agent_id text not null,
  name text not null,
  status text not null check (status in ('completed', 'failed')),
  task text not null,
  evidence jsonb not null default '[]'::jsonb,
  reasoning text not null,
  confidence numeric(4, 3) not null check (confidence between 0 and 1),
  duration_ms numeric(10, 1) not null default 0
);

create table if not exists public.investigation_actions (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations(id) on delete cascade,
  action_key text not null,
  title text not null,
  target text not null,
  impact text not null,
  status text not null default 'pending_approval'
    check (status in ('pending_approval', 'approved', 'rejected')),
  decided_at timestamptz,
  unique (investigation_id, action_key)
);

create table if not exists public.investigation_audit (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations(id) on delete cascade,
  created_at timestamptz not null default now(),
  event text not null,
  detail text not null default ''
);

create index if not exists investigations_created_idx
  on public.investigations (created_at desc);
create index if not exists investigation_agent_runs_parent_idx
  on public.investigation_agent_runs (investigation_id, position);
create index if not exists investigation_actions_parent_idx
  on public.investigation_actions (investigation_id);
create index if not exists investigation_audit_parent_idx
  on public.investigation_audit (investigation_id, created_at);

alter table public.investigations enable row level security;
alter table public.investigation_agent_runs enable row level security;
alter table public.investigation_actions enable row level security;
alter table public.investigation_audit enable row level security;

revoke all on public.investigations from anon, authenticated;
revoke all on public.investigation_agent_runs from anon, authenticated;
revoke all on public.investigation_actions from anon, authenticated;
revoke all on public.investigation_audit from anon, authenticated;
