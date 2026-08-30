create table public.safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  surface text not null check (surface ~ '^[a-z][a-z0-9_-]{1,79}$'),
  subject_type text not null check (subject_type ~ '^[a-z][a-z0-9_-]{1,79}$'),
  subject_id text not null check (char_length(subject_id) between 1 and 160),
  reason text not null check (reason in ('spam', 'harassment', 'hate', 'fraud', 'privacy', 'unsafe', 'other')),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'attached', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index safety_reports_one_open_per_reporter_idx
on public.safety_reports (reporter_id, surface, subject_type, subject_id)
where status in ('open', 'attached');

create index safety_reports_subject_idx
on public.safety_reports (surface, subject_type, subject_id, created_at desc);

create table public.safety_cases (
  id uuid primary key default gen_random_uuid(),
  surface text not null check (surface ~ '^[a-z][a-z0-9_-]{1,79}$'),
  subject_type text not null check (subject_type ~ '^[a-z][a-z0-9_-]{1,79}$'),
  subject_id text not null check (char_length(subject_id) between 1 and 160),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  isolation_state text not null default 'visible' check (isolation_state in ('visible', 'isolated', 'removed')),
  report_count integer not null default 1 check (report_count > 0),
  assigned_to uuid references auth.users(id) on delete set null,
  decision_note text check (decision_note is null or char_length(decision_note) <= 2000),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index safety_cases_one_active_subject_idx
on public.safety_cases (surface, subject_type, subject_id)
where status in ('open', 'reviewing');

create index safety_cases_queue_idx
on public.safety_cases (status, report_count desc, created_at);

create table public.safety_restrictions (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope = 'global' or scope ~ '^[a-z][a-z0-9_-]{1,79}$'),
  restriction_type text not null check (restriction_type in ('write', 'interaction', 'access')),
  reason text not null check (char_length(reason) between 1 and 1000),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  revoke_reason text check (revoke_reason is null or char_length(revoke_reason) <= 1000),
  created_at timestamptz not null default now(),
  constraint safety_restriction_window check (expires_at is null or expires_at > starts_at)
);

create unique index safety_restrictions_one_active_scope_idx
on public.safety_restrictions (subject_user_id, scope, restriction_type)
where revoked_at is null;

create index safety_restrictions_lookup_idx
on public.safety_restrictions (subject_user_id, scope, starts_at, expires_at)
where revoked_at is null;

create table public.safety_audit_events (
  id bigint generated always as identity primary key,
  case_id uuid references public.safety_cases(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 3 and 100),
  target_user_id uuid references auth.users(id) on delete set null,
  before_state jsonb not null default '{}'::jsonb check (jsonb_typeof(before_state) = 'object'),
  after_state jsonb not null default '{}'::jsonb check (jsonb_typeof(after_state) = 'object'),
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create index safety_audit_events_case_idx on public.safety_audit_events (case_id, created_at);
create index safety_audit_events_actor_idx on public.safety_audit_events (actor_id, created_at desc);

create trigger safety_cases_set_updated_at
before update on public.safety_cases
for each row execute function public.set_updated_at();

alter table public.safety_reports enable row level security;
alter table public.safety_cases enable row level security;
alter table public.safety_restrictions enable row level security;
alter table public.safety_audit_events enable row level security;

create policy safety_reports_admin_read on public.safety_reports
for select to authenticated using (public.is_admin(auth.uid()));
create policy safety_cases_admin_read on public.safety_cases
for select to authenticated using (public.is_admin(auth.uid()));
create policy safety_restrictions_admin_read on public.safety_restrictions
for select to authenticated using (public.is_admin(auth.uid()));
create policy safety_audit_events_admin_read on public.safety_audit_events
for select to authenticated using (public.is_admin(auth.uid()));

revoke all on public.safety_reports from public, anon, authenticated;
revoke all on public.safety_cases from public, anon, authenticated;
revoke all on public.safety_restrictions from public, anon, authenticated;
revoke all on public.safety_audit_events from public, anon, authenticated;
grant select on public.safety_reports, public.safety_cases, public.safety_restrictions, public.safety_audit_events to authenticated;

create or replace function public.report_safety_subject(
  p_surface text,
  p_subject_type text,
  p_subject_id text,
  p_reason text,
  p_details text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_report_id uuid;
  v_case_id uuid;
begin
  if v_actor is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if p_surface is null or p_surface !~ '^[a-z][a-z0-9_-]{1,79}$' then raise exception 'invalid_safety_surface' using errcode = '22023'; end if;
  if p_subject_type is null or p_subject_type !~ '^[a-z][a-z0-9_-]{1,79}$' then raise exception 'invalid_safety_subject_type' using errcode = '22023'; end if;
  if p_subject_id is null or char_length(btrim(p_subject_id)) not between 1 and 160 then raise exception 'invalid_safety_subject_id' using errcode = '22023'; end if;
  if p_reason not in ('spam', 'harassment', 'hate', 'fraud', 'privacy', 'unsafe', 'other') then raise exception 'invalid_safety_reason' using errcode = '22023'; end if;
  if char_length(coalesce(p_details, '')) > 1000 then raise exception 'safety_details_too_long' using errcode = '22023'; end if;

  if (select count(*) from public.safety_reports where reporter_id = v_actor and created_at >= now() - interval '24 hours') >= 20 then
    raise exception 'safety_report_rate_limited' using errcode = 'P0001';
  end if;

  insert into public.safety_reports (reporter_id, surface, subject_type, subject_id, reason, details)
  values (v_actor, p_surface, p_subject_type, btrim(p_subject_id), p_reason, nullif(left(btrim(coalesce(p_details, '')), 1000), ''))
  on conflict (reporter_id, surface, subject_type, subject_id) where status in ('open', 'attached')
  do nothing
  returning id into v_report_id;

  if v_report_id is null then
    select id into v_report_id from public.safety_reports
    where reporter_id = v_actor and surface = p_surface and subject_type = p_subject_type
      and subject_id = btrim(p_subject_id) and status in ('open', 'attached');
    update public.safety_reports
    set reason = p_reason, details = nullif(left(btrim(coalesce(p_details, '')), 1000), '')
    where id = v_report_id;
    select id into v_case_id from public.safety_cases
    where surface = p_surface and subject_type = p_subject_type and subject_id = btrim(p_subject_id)
      and status in ('open', 'reviewing');
    if v_case_id is not null then return v_case_id; end if;
  end if;

  insert into public.safety_cases (surface, subject_type, subject_id)
  values (p_surface, p_subject_type, btrim(p_subject_id))
  on conflict (surface, subject_type, subject_id) where status in ('open', 'reviewing')
  do update set report_count = public.safety_cases.report_count + 1
  returning id into v_case_id;

  update public.safety_reports set status = 'attached' where id = v_report_id;
  insert into public.safety_audit_events (case_id, actor_id, action, after_state)
  values (v_case_id, v_actor, 'report_attached', jsonb_build_object('reason', p_reason));
  return v_case_id;
end;
$$;

create or replace function public.safety_subject_is_visible(
  p_surface text,
  p_subject_type text,
  p_subject_id text
)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select not exists (
    select 1 from public.safety_cases
    where surface = p_surface and subject_type = p_subject_type and subject_id = p_subject_id
      and isolation_state in ('isolated', 'removed')
  );
$$;

create or replace function public.is_safety_actor_restricted(
  p_scope text,
  p_user_id uuid default auth.uid(),
  p_restriction_type text default 'write'
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if auth.uid() is null then return true; end if;
  if p_user_id <> auth.uid() and not public.is_admin(auth.uid()) then
    raise exception 'cannot_check_other_actor' using errcode = '42501';
  end if;
  return exists (
    select 1 from public.safety_restrictions
    where subject_user_id = p_user_id
      and scope in ('global', p_scope)
      and restriction_type in ('access', p_restriction_type)
      and starts_at <= now()
      and (expires_at is null or expires_at > now())
      and revoked_at is null
  );
end;
$$;

create or replace function public.admin_moderate_safety_case(
  p_case_id uuid,
  p_action text,
  p_note text default null,
  p_target_user_id uuid default null,
  p_duration_days integer default 7
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_case public.safety_cases%rowtype;
  v_before jsonb;
begin
  if v_actor is null or not public.is_admin(v_actor) then raise exception 'admin_required' using errcode = '42501'; end if;
  if p_action not in ('start_review', 'isolate', 'restore', 'remove', 'resolve_no_action', 'resolve_action', 'restrict_actor', 'revoke_restriction') then
    raise exception 'invalid_safety_action' using errcode = '22023';
  end if;
  if char_length(coalesce(p_note, '')) > 2000 then raise exception 'safety_note_too_long' using errcode = '22023'; end if;
  if p_duration_days is null or p_duration_days < 1 or p_duration_days > 365 then raise exception 'invalid_restriction_duration' using errcode = '22023'; end if;

  select * into v_case from public.safety_cases where id = p_case_id for update;
  if not found then raise exception 'safety_case_not_found' using errcode = 'P0002'; end if;
  v_before := jsonb_build_object('status', v_case.status, 'isolation_state', v_case.isolation_state, 'assigned_to', v_case.assigned_to);

  if p_action = 'start_review' then
    update public.safety_cases set status = 'reviewing', assigned_to = v_actor where id = p_case_id;
  elsif p_action = 'isolate' then
    update public.safety_cases set status = 'reviewing', isolation_state = 'isolated', assigned_to = v_actor where id = p_case_id;
  elsif p_action = 'restore' then
    update public.safety_cases set isolation_state = 'visible', assigned_to = v_actor where id = p_case_id;
  elsif p_action = 'remove' then
    update public.safety_cases set isolation_state = 'removed', assigned_to = v_actor where id = p_case_id;
  elsif p_action in ('resolve_no_action', 'resolve_action') then
    update public.safety_cases set
      status = 'resolved',
      isolation_state = case when p_action = 'resolve_no_action' then 'visible' else isolation_state end,
      decision_note = nullif(left(btrim(coalesce(p_note, '')), 2000), ''),
      resolved_by = v_actor,
      resolved_at = now()
    where id = p_case_id;
    update public.safety_reports set status = case when p_action = 'resolve_no_action' then 'dismissed' else 'resolved' end, resolved_at = now()
    where surface = v_case.surface and subject_type = v_case.subject_type and subject_id = v_case.subject_id and status in ('open', 'attached');
  elsif p_action = 'restrict_actor' then
    if p_target_user_id is null then raise exception 'target_user_required' using errcode = '22023'; end if;
    insert into public.safety_restrictions (subject_user_id, scope, restriction_type, reason, expires_at, created_by)
    values (p_target_user_id, v_case.surface, 'write', coalesce(nullif(btrim(p_note), ''), 'Safety case restriction'), now() + make_interval(days => p_duration_days), v_actor)
    on conflict (subject_user_id, scope, restriction_type) where revoked_at is null
    do update set reason = excluded.reason, starts_at = now(), expires_at = excluded.expires_at, created_by = excluded.created_by;
  elsif p_action = 'revoke_restriction' then
    if p_target_user_id is null then raise exception 'target_user_required' using errcode = '22023'; end if;
    update public.safety_restrictions set revoked_at = now(), revoked_by = v_actor, revoke_reason = nullif(left(btrim(coalesce(p_note, '')), 1000), '')
    where subject_user_id = p_target_user_id and scope = v_case.surface and revoked_at is null;
  end if;

  insert into public.safety_audit_events (case_id, actor_id, action, target_user_id, before_state, after_state, note)
  select p_case_id, v_actor, p_action, p_target_user_id, v_before,
    jsonb_build_object('status', c.status, 'isolation_state', c.isolation_state, 'assigned_to', c.assigned_to),
    nullif(left(btrim(coalesce(p_note, '')), 2000), '')
  from public.safety_cases c where c.id = p_case_id;

  perform public.write_admin_audit_log(
    p_action => 'safety.' || p_action,
    p_target_user_id => p_target_user_id,
    p_target_entity_type => 'safety_case',
    p_target_entity_id => p_case_id,
    p_before_value => v_before,
    p_after_value => jsonb_build_object('surface', v_case.surface, 'subject_type', v_case.subject_type, 'subject_id', v_case.subject_id)
  );
end;
$$;

revoke all on function public.report_safety_subject(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.safety_subject_is_visible(text, text, text) from public, anon, authenticated;
revoke all on function public.is_safety_actor_restricted(text, uuid, text) from public, anon, authenticated;
revoke all on function public.admin_moderate_safety_case(uuid, text, text, uuid, integer) from public, anon, authenticated;

grant execute on function public.report_safety_subject(text, text, text, text, text) to authenticated;
grant execute on function public.safety_subject_is_visible(text, text, text) to anon, authenticated;
grant execute on function public.is_safety_actor_restricted(text, uuid, text) to authenticated;
grant execute on function public.admin_moderate_safety_case(uuid, text, text, uuid, integer) to authenticated;

comment on table public.safety_cases is
  'Surface-neutral moderation contract. Product read/write paths opt in through safety_subject_is_visible and is_safety_actor_restricted.';
