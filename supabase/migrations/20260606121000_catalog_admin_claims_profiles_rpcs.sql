begin;

create or replace function public.admin_list_catalog_claims(
  p_item_id uuid default null,
  p_status text default null
)
returns table (
  id uuid,
  item_id uuid,
  item_title text,
  requested_by_user_id uuid,
  requester_full_name text,
  requester_email text,
  claim_type text,
  note text,
  status text,
  created_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by_user_id uuid,
  reviewer_full_name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    ccr.id,
    ccr.item_id,
    ci.title as item_title,
    ccr.requested_by_user_id,
    coalesce(nullif(requester.display_name, ''), nullif(requester.full_name, ''), 'İsimsiz kullanıcı') as requester_full_name,
    requester.email as requester_email,
    ccr.claim_type,
    ccr.note,
    ccr.status,
    ccr.created_at,
    ccr.reviewed_at,
    ccr.reviewed_by_user_id,
    coalesce(nullif(reviewer.display_name, ''), nullif(reviewer.full_name, ''), 'İsimsiz kullanıcı') as reviewer_full_name
  from public.catalog_claim_requests ccr
  join public.catalog_items ci on ci.id = ccr.item_id
  join public.profiles requester on requester.id = ccr.requested_by_user_id
  left join public.profiles reviewer on reviewer.id = ccr.reviewed_by_user_id
  where (p_item_id is null or ccr.item_id = p_item_id)
    and (p_status is null or btrim(p_status) = '' or ccr.status = p_status)
  order by
    case when ccr.status = 'pending' then 0 else 1 end,
    ccr.created_at desc;
end;
$$;

create or replace function public.admin_reject_catalog_claim(
  p_claim_id uuid,
  p_review_note text default null
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.review_catalog_claim_request(p_claim_id, 'rejected', p_review_note);
$$;

create or replace function public.admin_search_profiles(
  p_query text,
  p_limit integer default 10
)
returns table (
  id uuid,
  full_name text,
  email text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_limit integer := greatest(least(coalesce(p_limit, 10), 25), 1);
  v_query text := nullif(btrim(coalesce(p_query, '')), '');
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    coalesce(nullif(p.display_name, ''), nullif(p.full_name, ''), split_part(coalesce(p.email, 'corteqs-uye'), '@', 1)) as full_name,
    p.email
  from public.profiles p
  where v_query is not null
    and (
      coalesce(p.display_name, '') ilike '%' || v_query || '%'
      or coalesce(p.full_name, '') ilike '%' || v_query || '%'
      or coalesce(p.email, '') ilike '%' || v_query || '%'
    )
  order by
    case
      when coalesce(p.display_name, '') ilike v_query || '%' then 0
      when coalesce(p.full_name, '') ilike v_query || '%' then 1
      when coalesce(p.email, '') ilike v_query || '%' then 2
      else 3
    end,
    p.updated_at desc
  limit v_limit;
end;
$$;

revoke all on function public.admin_list_catalog_claims(uuid, text) from public;
revoke all on function public.admin_reject_catalog_claim(uuid, text) from public;
revoke all on function public.admin_search_profiles(text, integer) from public;

grant execute on function public.admin_list_catalog_claims(uuid, text) to authenticated;
grant execute on function public.admin_reject_catalog_claim(uuid, text) to authenticated;
grant execute on function public.admin_search_profiles(text, integer) to authenticated;

commit;
