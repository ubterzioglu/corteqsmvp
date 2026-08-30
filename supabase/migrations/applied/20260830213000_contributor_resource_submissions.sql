-- Contributor kaynak kabul kuyruğu — admin-only ilk batch.
-- Contributor self-service yazma yetkisi bilerek bu migration'ın dışında tutulur.

create table public.contributor_resource_submissions (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null check (resource_type in (
    'business', 'advisor', 'association', 'whatsapp_group', 'influencer',
    'event', 'facebook_group', 'instagram_page', 'professional_community', 'local_service'
  )),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 200),
  country text not null check (char_length(btrim(country)) between 2 and 100),
  city text not null check (char_length(btrim(city)) between 2 and 100),
  source_url text not null check (
    char_length(source_url) <= 2048
    and source_url ~ '^https?://[^[:space:]]+$'
  ),
  summary text not null check (char_length(btrim(summary)) between 10 and 1000),
  verified_on date not null check (verified_on <= current_date),
  permission_status text not null default 'unknown'
    check (permission_status in ('unknown', 'confirmed', 'not_required')),
  conflict_disclosure text check (conflict_disclosure is null or char_length(conflict_disclosure) <= 1000),
  status text not null default 'submitted'
    check (status in ('draft', 'submitted', 'accepted', 'needs_info', 'rejected', 'duplicate')),
  decision_note text check (decision_note is null or char_length(decision_note) <= 1000),
  canonical_submission_id uuid references public.contributor_resource_submissions(id) on delete set null,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (canonical_submission_id is null or canonical_submission_id <> id),
  check (
    (status = 'duplicate' and canonical_submission_id is not null)
    or (status <> 'duplicate' and canonical_submission_id is null)
  )
);

create index contributor_resource_submissions_status_created_idx
  on public.contributor_resource_submissions(status, created_at desc);
create index contributor_resource_submissions_source_url_idx
  on public.contributor_resource_submissions(lower(source_url));

create table public.contributor_resource_submission_events (
  id bigint generated always as identity primary key,
  submission_id uuid not null references public.contributor_resource_submissions(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('created', 'reviewed')),
  from_status text,
  to_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index contributor_resource_submission_events_submission_idx
  on public.contributor_resource_submission_events(submission_id, created_at desc);
create index contributor_resource_submission_events_actor_rate_idx
  on public.contributor_resource_submission_events(actor_id, created_at desc);

alter table public.contributor_resource_submissions enable row level security;
alter table public.contributor_resource_submission_events enable row level security;

revoke all on public.contributor_resource_submissions from anon, authenticated;
revoke all on public.contributor_resource_submission_events from anon, authenticated;
grant select on public.contributor_resource_submissions to authenticated;
grant select on public.contributor_resource_submission_events to authenticated;

create policy contributor_resource_submissions_admin_select
  on public.contributor_resource_submissions
  for select to authenticated
  using (public.is_admin(auth.uid()));

create policy contributor_resource_submission_events_admin_select
  on public.contributor_resource_submission_events
  for select to authenticated
  using (public.is_admin(auth.uid()));

create or replace function public.contributor_resource_submission_audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if tg_op = 'INSERT' then
    insert into public.contributor_resource_submission_events (
      submission_id, actor_id, action, from_status, to_status, note
    ) values (
      new.id, auth.uid(), 'created', null, new.status, null
    );
  elsif old.status is distinct from new.status
     or old.decision_note is distinct from new.decision_note
     or old.canonical_submission_id is distinct from new.canonical_submission_id then
    insert into public.contributor_resource_submission_events (
      submission_id, actor_id, action, from_status, to_status, note
    ) values (
      new.id, auth.uid(), 'reviewed', old.status, new.status, new.decision_note
    );
  end if;
  return new;
end;
$fn$;

revoke all on function public.contributor_resource_submission_audit_trigger() from public, anon, authenticated;

create trigger contributor_resource_submission_audit
after insert or update on public.contributor_resource_submissions
for each row execute function public.contributor_resource_submission_audit_trigger();

create or replace function public.admin_create_contributor_resource_submission(
  p_resource_type text,
  p_display_name text,
  p_country text,
  p_city text,
  p_source_url text,
  p_summary text,
  p_verified_on date,
  p_permission_status text default 'unknown',
  p_conflict_disclosure text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null or not public.is_admin(v_uid) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  if (
    select count(*)
    from public.contributor_resource_submission_events e
    where e.actor_id = v_uid and e.created_at > now() - interval '1 minute'
  ) >= 60 then
    raise exception 'rate_limit_exceeded' using errcode = 'P0001';
  end if;

  if p_resource_type not in (
    'business', 'advisor', 'association', 'whatsapp_group', 'influencer',
    'event', 'facebook_group', 'instagram_page', 'professional_community', 'local_service'
  ) then
    raise exception 'invalid_resource_type' using errcode = '22023';
  end if;
  if p_permission_status not in ('unknown', 'confirmed', 'not_required') then
    raise exception 'invalid_permission_status' using errcode = '22023';
  end if;
  if nullif(btrim(p_display_name), '') is null
     or nullif(btrim(p_country), '') is null
     or nullif(btrim(p_city), '') is null
     or nullif(btrim(p_summary), '') is null
     or p_verified_on is null then
    raise exception 'required_fields_missing' using errcode = '22023';
  end if;
  if p_verified_on > current_date then
    raise exception 'verified_on_in_future' using errcode = '22023';
  end if;
  if p_source_url is null or p_source_url !~ '^https?://[^[:space:]]+$' then
    raise exception 'invalid_source_url' using errcode = '22023';
  end if;

  insert into public.contributor_resource_submissions (
    resource_type, display_name, country, city, source_url, summary, verified_on,
    permission_status, conflict_disclosure, status, submitted_by
  ) values (
    p_resource_type, btrim(p_display_name), btrim(p_country), btrim(p_city),
    btrim(p_source_url), btrim(p_summary), p_verified_on, p_permission_status,
    nullif(btrim(p_conflict_disclosure), ''), 'submitted', v_uid
  ) returning id into v_id;

  return v_id;
end;
$fn$;

create or replace function public.admin_review_contributor_resource_submission(
  p_submission_id uuid,
  p_status text,
  p_decision_note text default null,
  p_canonical_submission_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.is_admin(v_uid) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  if (
    select count(*)
    from public.contributor_resource_submission_events e
    where e.actor_id = v_uid and e.created_at > now() - interval '1 minute'
  ) >= 60 then
    raise exception 'rate_limit_exceeded' using errcode = 'P0001';
  end if;

  if p_status not in ('accepted', 'needs_info', 'rejected', 'duplicate') then
    raise exception 'invalid_review_status' using errcode = '22023';
  end if;
  if p_status in ('needs_info', 'rejected', 'duplicate')
     and nullif(btrim(p_decision_note), '') is null then
    raise exception 'decision_note_required' using errcode = '22023';
  end if;
  if p_status = 'duplicate' then
    if p_canonical_submission_id is null or p_canonical_submission_id = p_submission_id then
      raise exception 'canonical_submission_required' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.contributor_resource_submissions s
      where s.id = p_canonical_submission_id and s.status <> 'duplicate'
    ) then
      raise exception 'canonical_submission_not_found' using errcode = '22023';
    end if;
  elsif p_canonical_submission_id is not null then
    raise exception 'canonical_submission_only_for_duplicate' using errcode = '22023';
  end if;

  update public.contributor_resource_submissions
  set status = p_status,
      decision_note = nullif(btrim(p_decision_note), ''),
      canonical_submission_id = case when p_status = 'duplicate' then p_canonical_submission_id else null end,
      reviewed_by = v_uid,
      reviewed_at = now(),
      updated_at = now()
  where id = p_submission_id;

  if not found then
    raise exception 'submission_not_found' using errcode = 'P0002';
  end if;
end;
$fn$;

revoke all on function public.admin_create_contributor_resource_submission(text, text, text, text, text, text, date, text, text) from public, anon;
revoke all on function public.admin_review_contributor_resource_submission(uuid, text, text, uuid) from public, anon;
grant execute on function public.admin_create_contributor_resource_submission(text, text, text, text, text, text, date, text, text) to authenticated;
grant execute on function public.admin_review_contributor_resource_submission(uuid, text, text, uuid) to authenticated;
