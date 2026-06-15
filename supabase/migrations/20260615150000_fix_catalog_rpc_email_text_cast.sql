-- Fix: auth.users.email is character varying(255), but three admin catalog RPCs
-- return it into a `text` column declared in RETURNS TABLE without a cast. At
-- runtime PostgreSQL raises:
--   "structure of query does not match function result type
--    Returned type character varying(255) does not match expected type text"
-- which PostgREST surfaces as HTTP 400. This broke the catalog claim panel
-- (/admin/data → Claim Talepleri → "Claim talepleri alınamadı.").
--
-- admin_list_catalog_claims fails whenever a claim row exists (email column).
-- admin_list_catalog_item_access / admin_search_profiles have the same latent
-- bug and fail as soon as a row with a non-null email is returned.
--
-- Fix: cast au.email / req_email.email to ::text so the returned type matches
-- the declared `text` column. Idempotent CREATE OR REPLACE; no data change.

begin;

-- 1) admin_list_catalog_claims — column 6 (requester_email)
CREATE OR REPLACE FUNCTION public.admin_list_catalog_claims(p_item_id uuid DEFAULT NULL::uuid, p_status text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, item_id uuid, item_title text, requested_by_user_id uuid, requester_full_name text, requester_email text, claim_type text, note text, status text, created_at timestamp with time zone, reviewed_at timestamp with time zone, reviewed_by_user_id uuid, reviewer_full_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    coalesce(
      (select upa.value_text from public.user_profile_attributes upa
       join public.afs_attributes ac on ac.id = upa.attribute_id
       where upa.user_id = ccr.requested_by_user_id and ac.key = 'full_name' limit 1),
      split_part(coalesce(req_email.email, 'corteqs-uye'), '@', 1)
    ) as requester_full_name,
    req_email.email::text as requester_email,
    ccr.claim_type,
    ccr.note,
    ccr.status,
    ccr.created_at,
    ccr.reviewed_at,
    ccr.reviewed_by_user_id,
    coalesce(
      (select upa.value_text from public.user_profile_attributes upa
       join public.afs_attributes ac on ac.id = upa.attribute_id
       where upa.user_id = ccr.reviewed_by_user_id and ac.key = 'full_name' limit 1),
      'İsimsiz kullanıcı'
    ) as reviewer_full_name
  from public.catalog_item_claims ccr
  join public.catalog_items ci on ci.id = ccr.item_id
  left join auth.users req_email on req_email.id = ccr.requested_by_user_id
  where (p_item_id is null or ccr.item_id = p_item_id)
    and (p_status is null or btrim(p_status) = '' or ccr.status = p_status)
  order by
    case when ccr.status = 'pending' then 0 else 1 end,
    ccr.created_at desc;
end;
$function$;

-- 2) admin_list_catalog_item_access — column 3 (email)
CREATE OR REPLACE FUNCTION public.admin_list_catalog_item_access(p_item_id uuid)
 RETURNS TABLE(user_id uuid, full_name text, email text, access_level text, status text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    cim.user_id,
    coalesce(
      (select upa.value_text from public.user_profile_attributes upa
       join public.afs_attributes ac on ac.id = upa.attribute_id
       where upa.user_id = cim.user_id and ac.key = 'full_name' limit 1),
      split_part(coalesce(au.email, 'corteqs-user'), '@', 1)
    ) as full_name,
    au.email::text as email,
    cim.role as access_level,
    cim.status,
    cim.created_at
  from public.catalog_item_managers cim
  left join auth.users au on au.id = cim.user_id
  where public.is_moderator(auth.uid())
    and cim.item_id = p_item_id
  order by
    case when cim.role = 'owner' then 0 when cim.role = 'manager' then 1 when cim.role = 'editor' then 2 else 3 end,
    cim.created_at asc;
$function$;

-- 3) admin_search_profiles — column 3 (email)
CREATE OR REPLACE FUNCTION public.admin_search_profiles(p_query text, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, full_name text, email text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    au.id,
    coalesce(
      (select upa.value_text from public.user_profile_attributes upa
       join public.afs_attributes ac on ac.id = upa.attribute_id
       where upa.user_id = au.id and ac.key = 'full_name' limit 1),
      split_part(coalesce(au.email, 'corteqs-uye'), '@', 1)
    ) as full_name,
    au.email::text as email
  from auth.users au
  where v_query is not null
    and (
      coalesce(au.email, '') ilike '%' || v_query || '%'
      or exists (
        select 1 from public.user_profile_attributes upa
        join public.afs_attributes ac on ac.id = upa.attribute_id
        where upa.user_id = au.id
          and ac.key = 'full_name'
          and upa.value_text ilike '%' || v_query || '%'
      )
    )
  order by
    case
      when coalesce(au.email, '') ilike v_query || '%' then 0
      else 1
    end,
    au.updated_at desc
  limit v_limit;
end;
$function$;

commit;
