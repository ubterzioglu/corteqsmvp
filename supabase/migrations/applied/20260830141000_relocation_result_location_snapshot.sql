-- C6: Araç sonuçlarında oluşturma anı konum snapshot'ı ve konum-gated rapor e-postası.
-- Tarihsel sonuçlar bilerek backfill edilmez: bugünkü profil konumunu geçmiş sonuç
-- oluşturma zamanıymış gibi yazmak yanlış olur. Kullanıcı aracı yeniden çalıştırabilir.

alter table public.relocation_tool_results
  add column if not exists location_country text,
  add column if not exists location_city text,
  add column if not exists location_source text,
  add column if not exists location_resolved_at timestamptz;

alter table public.relocation_tool_results
  drop constraint if exists relocation_tool_results_location_pair_check;

alter table public.relocation_tool_results
  add constraint relocation_tool_results_location_pair_check check (
    (location_country is null and location_city is null and location_source is null and location_resolved_at is null)
    or
    (
      location_country is not null and char_length(location_country) between 1 and 120
      and location_city is not null and char_length(location_city) between 1 and 120
      and location_source in ('approved_attributes', 'profile_core', 'mixed_profile')
      and location_resolved_at is not null
    )
  );

comment on column public.relocation_tool_results.location_country is
  'Sonuç oluşturulurken çözülen ülke snapshot''ı; tarihsel kayıtlar geriye dönük doldurulmaz.';
comment on column public.relocation_tool_results.location_city is
  'Sonuç oluşturulurken çözülen şehir snapshot''ı; profil sonradan değişse de sabit kalır.';
comment on column public.relocation_tool_results.location_source is
  'Snapshot kaynağı: approved_attributes, profile_core veya mixed_profile.';

create or replace function public.rl_clean_location_value(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when p_value is null then null
    when btrim(p_value) = '' then null
    when lower(btrim(p_value)) in ('-', 'unknown', 'null', 'belirtilmedi', 'bilinmiyor') then null
    else left(btrim(p_value), 120)
  end;
$$;

create or replace function public.rl_resolve_user_location_snapshot(p_user_id uuid)
returns table(country text, city text, source text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_attr_country text;
  v_attr_city text;
  v_core_country text;
  v_core_city text;
  v_country text;
  v_city text;
  v_source text;
begin
  select public.rl_clean_location_value(upa.value_text)
    into v_attr_country
  from public.user_profile_attributes upa
  join public.afs_attributes aa on aa.id = upa.attribute_id
  where upa.user_id = p_user_id
    and upa.approval_status = 'approved'
    and aa.key = 'country'
    and aa.is_active
  order by upa.updated_at desc, upa.id desc
  limit 1;

  select public.rl_clean_location_value(upa.value_text)
    into v_attr_city
  from public.user_profile_attributes upa
  join public.afs_attributes aa on aa.id = upa.attribute_id
  where upa.user_id = p_user_id
    and upa.approval_status = 'approved'
    and aa.key = 'city'
    and aa.is_active
  order by upa.updated_at desc, upa.id desc
  limit 1;

  select
    public.rl_clean_location_value(ipd.active_country),
    public.rl_clean_location_value(ipd.active_city)
  into v_core_country, v_core_city
  from public.individual_profile_details ipd
  where ipd.user_id = p_user_id;

  v_country := coalesce(v_attr_country, v_core_country);
  v_city := coalesce(v_attr_city, v_core_city);

  if v_country is null or v_city is null then
    return;
  end if;

  v_source := case
    when v_attr_country is not null and v_attr_city is not null then 'approved_attributes'
    when v_attr_country is null and v_attr_city is null then 'profile_core'
    else 'mixed_profile'
  end;

  return query select v_country, v_city, v_source;
end;
$$;

revoke all on function public.rl_clean_location_value(text) from public, anon, authenticated;
revoke all on function public.rl_resolve_user_location_snapshot(uuid) from public, anon, authenticated;

-- Bütün araç skor RPC'lerinin kullandığı tek yazıcı: snapshot burada alınır.
create or replace function public.rl_tool_write_result(
  p_session_id uuid,
  p_result_kind text,
  p_total_score numeric,
  p_score_bucket text,
  p_primary_result jsonb,
  p_sub_scores jsonb,
  p_recommendations jsonb,
  p_explanations jsonb,
  p_ctas jsonb,
  p_source_quality jsonb default '{}'::jsonb,
  p_model_version text default 'rule-v1'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype;
  v_result_id uuid;
  v_location record;
begin
  select * into v_session
  from public.relocation_tool_sessions
  where id = p_session_id;

  if not found then
    raise exception 'rl_session_not_found';
  end if;

  select * into v_location
  from public.rl_resolve_user_location_snapshot(v_session.user_id);

  delete from public.relocation_tool_results where session_id = p_session_id;

  insert into public.relocation_tool_results (
    session_id, user_id, tool_key, result_kind, total_score, score_bucket,
    primary_result, sub_scores, recommendations, explanations, ctas, source_quality, model_version,
    location_country, location_city, location_source, location_resolved_at
  ) values (
    p_session_id, v_session.user_id, v_session.tool_key, p_result_kind, p_total_score, p_score_bucket,
    coalesce(p_primary_result, '{}'::jsonb), coalesce(p_sub_scores, '{}'::jsonb),
    coalesce(p_recommendations, '[]'::jsonb), coalesce(p_explanations, '[]'::jsonb),
    coalesce(p_ctas, '[]'::jsonb), coalesce(p_source_quality, '{}'::jsonb), p_model_version,
    v_location.country, v_location.city, v_location.source,
    case when v_location.country is not null and v_location.city is not null then now() else null end
  )
  returning id into v_result_id;

  update public.relocation_tool_sessions
    set status = 'completed', completed_at = now()
    where id = p_session_id;

  return jsonb_build_object(
    'result_id', v_result_id,
    'tool_key', v_session.tool_key,
    'result_kind', p_result_kind,
    'total_score', p_total_score,
    'score_bucket', p_score_bucket,
    'primary_result', coalesce(p_primary_result, '{}'::jsonb),
    'sub_scores', coalesce(p_sub_scores, '{}'::jsonb),
    'recommendations', coalesce(p_recommendations, '[]'::jsonb),
    'explanations', coalesce(p_explanations, '[]'::jsonb),
    'ctas', coalesce(p_ctas, '[]'::jsonb),
    'location_snapshot', case
      when v_location.country is null or v_location.city is null then null
      else jsonb_build_object(
        'country', v_location.country,
        'city', v_location.city,
        'source', v_location.source
      )
    end
  );
end;
$$;

-- İç yardımcı doğrudan çağrılamaz; yalnız sahiplik doğrulayan skor RPC'leri kullanır.
revoke all on function public.rl_tool_write_result(uuid, text, numeric, text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text)
  from public, anon, authenticated;

-- Kullanıcının kendisine giden transactional rapor e-postası outbox türü.
alter table public.notification_email_outbox
  drop constraint if exists notification_email_outbox_event_type_check;

alter table public.notification_email_outbox
  add constraint notification_email_outbox_event_type_check
  check (event_type in ('new_member', 'admin_update', 'member_welcome', 'revision_request', 'relocation_tool_report'));

comment on table public.notification_email_outbox is
  'Bildirim e-postası kuyruğu. relocation_tool_report:<result_id> anahtarı aynı sonucu en fazla bir kez gönderir.';

create or replace function public.request_relocation_tool_report(p_result_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_result record;
  v_email text;
  v_status text;
begin
  if v_uid is null then
    raise exception 'rl_auth_required';
  end if;

  select
    r.id,
    r.user_id,
    r.tool_key,
    r.result_kind,
    r.total_score,
    r.score_bucket,
    r.location_country,
    r.location_city,
    t.slug as tool_slug,
    t.title_tr as tool_title
  into v_result
  from public.relocation_tool_results r
  join public.relocation_tools t on t.key = r.tool_key
  where r.id = p_result_id
    and r.user_id = v_uid;

  if not found then
    raise exception 'rl_result_not_found';
  end if;

  -- UI kontrolü atlanabilse bile gönderim DB sınırında durur.
  if v_result.location_country is null or v_result.location_city is null then
    raise exception 'rl_report_location_required';
  end if;

  select u.email
    into v_email
  from auth.users u
  where u.id = v_uid
    and u.email_confirmed_at is not null
    and u.email is not null;

  if v_email is null then
    raise exception 'rl_report_verified_email_required';
  end if;

  if (
    select count(*)
    from public.notification_email_outbox o
    where o.event_type = 'relocation_tool_report'
      and o.payload ->> 'user_id' = v_uid::text
      and o.created_at >= now() - interval '24 hours'
  ) >= 10 then
    raise exception 'rl_report_rate_limited';
  end if;

  insert into public.notification_email_outbox (event_type, dedupe_key, payload)
  values (
    'relocation_tool_report',
    'relocation_tool_report:' || v_result.id::text,
    jsonb_build_object(
      'user_id', v_uid::text,
      'email', v_email,
      'result_id', v_result.id::text,
      'tool_key', v_result.tool_key,
      'tool_slug', v_result.tool_slug,
      'tool_title', v_result.tool_title,
      'result_kind', v_result.result_kind,
      'total_score', v_result.total_score,
      'score_bucket', v_result.score_bucket,
      'location_country', v_result.location_country,
      'location_city', v_result.location_city,
      'created_at', now()
    )
  )
  on conflict (dedupe_key) do nothing;

  select o.status into v_status
  from public.notification_email_outbox o
  where o.dedupe_key = 'relocation_tool_report:' || v_result.id::text;

  perform public.poke_notification_dispatcher();

  return jsonb_build_object(
    'result_id', v_result.id,
    'status', coalesce(v_status, 'pending'),
    'location_country', v_result.location_country,
    'location_city', v_result.location_city
  );
end;
$$;

revoke all on function public.request_relocation_tool_report(uuid) from public, anon;
grant execute on function public.request_relocation_tool_report(uuid) to authenticated;

