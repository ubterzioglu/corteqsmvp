-- Contributor kaynak kuyruğu — authenticated Contributor self-service batch.
-- Tarayıcıya doğrudan INSERT/UPDATE yetkisi verilmez; yazma yalnız kontrollü RPC'den geçer.

create policy contributor_resource_submissions_owner_select
  on public.contributor_resource_submissions
  for select to authenticated
  using (
    submitted_by = auth.uid()
    or public.is_admin(auth.uid())
  );

create or replace function public.submit_contributor_resource_submission(
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
  v_source_url text := btrim(coalesce(p_source_url, ''));
begin
  if v_uid is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = v_uid
      and r.key = 'User_Contributor'
      and r.is_active = true
      and r.deleted_at is null
  ) then
    raise exception 'contributor_role_required' using errcode = '42501';
  end if;

  if (
    select count(*)
    from public.contributor_resource_submission_events e
    where e.actor_id = v_uid
      and e.action = 'created'
      and e.created_at > now() - interval '1 hour'
  ) >= 10 then
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
  if char_length(btrim(coalesce(p_display_name, ''))) not between 2 and 200 then
    raise exception 'invalid_display_name' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_country, ''))) not between 2 and 100
     or char_length(btrim(coalesce(p_city, ''))) not between 2 and 100 then
    raise exception 'invalid_location' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_summary, ''))) not between 10 and 1000 then
    raise exception 'invalid_summary' using errcode = '22023';
  end if;
  if p_verified_on is null or p_verified_on > current_date then
    raise exception 'invalid_verified_on' using errcode = '22023';
  end if;
  if char_length(v_source_url) > 2048
     or v_source_url !~ '^https?://[^[:space:]]+$'
     or v_source_url ~ '^https?://[^/@[:space:]]+@' then
    raise exception 'invalid_source_url' using errcode = '22023';
  end if;
  if char_length(coalesce(p_conflict_disclosure, '')) > 1000 then
    raise exception 'conflict_disclosure_too_long' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.contributor_resource_submissions s
    where s.submitted_by = v_uid
      and lower(s.source_url) = lower(v_source_url)
      and s.status in ('submitted', 'accepted')
  ) then
    raise exception 'source_already_submitted' using errcode = '23505';
  end if;

  insert into public.contributor_resource_submissions (
    resource_type,
    display_name,
    country,
    city,
    source_url,
    summary,
    verified_on,
    permission_status,
    conflict_disclosure,
    status,
    submitted_by
  ) values (
    p_resource_type,
    btrim(p_display_name),
    btrim(p_country),
    btrim(p_city),
    v_source_url,
    btrim(p_summary),
    p_verified_on,
    p_permission_status,
    nullif(btrim(p_conflict_disclosure), ''),
    'submitted',
    v_uid
  ) returning id into v_id;

  return v_id;
end;
$fn$;

revoke all on function public.submit_contributor_resource_submission(
  text, text, text, text, text, text, date, text, text
) from public, anon;
grant execute on function public.submit_contributor_resource_submission(
  text, text, text, text, text, text, date, text, text
) to authenticated;
