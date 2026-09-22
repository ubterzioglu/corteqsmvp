-- Persistent, privacy-minimal usage ledger for AI assistants.
-- Message content is deliberately excluded; only actor, function, provider,
-- token counters, outcome and timestamp are retained.

create table if not exists public.ai_assistant_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  function_name text not null
    check (function_name in ('site-assistant', 'relocation-assistant')),
  provider text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  total_tokens integer not null default 0 check (total_tokens >= 0),
  status text not null default 'success'
    check (status in ('success', 'quota_exceeded', 'error')),
  http_status integer not null check (http_status between 100 and 599),
  created_at timestamptz not null default now()
);

create index if not exists ai_assistant_usage_created_at_idx
  on public.ai_assistant_usage (created_at desc);
create index if not exists ai_assistant_usage_function_created_idx
  on public.ai_assistant_usage (function_name, created_at desc);
create index if not exists ai_assistant_usage_status_created_idx
  on public.ai_assistant_usage (status, created_at desc);

alter table public.ai_assistant_usage enable row level security;

drop policy if exists ai_assistant_usage_admin_select on public.ai_assistant_usage;
create policy ai_assistant_usage_admin_select
  on public.ai_assistant_usage
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

revoke all on table public.ai_assistant_usage from public, anon, authenticated;
grant select on table public.ai_assistant_usage to authenticated;
grant insert on table public.ai_assistant_usage to service_role;

comment on table public.ai_assistant_usage is
  'AI assistant token/quota telemetry. No prompts, answers, email, IP or free text are stored.';
