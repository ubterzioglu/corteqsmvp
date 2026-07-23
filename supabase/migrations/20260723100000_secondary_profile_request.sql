-- Secondary Profile Request — Migration: new_profile request type + RPCs
--
-- Kullanıcının mevcut profiline dokunmadan, admin onayı ile ikinci bir profil
-- (başka bir rol için) açabilmesini sağlar. Mevcut approval_requests onay
-- kuyruğuna yeni bir request_type ('new_profile') eklenir; submit_role_change_request
-- deseninin bir kopyasıdır.
--
-- Idempotent.

begin;

-- 1. request_type CHECK constraint'ini 'new_profile' değerini kapsayacak şekilde genişlet.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'approval_requests_request_type_check'
  ) then
    alter table public.approval_requests
      drop constraint approval_requests_request_type_check;
  end if;

  alter table public.approval_requests
    add constraint approval_requests_request_type_check
    check (request_type in (
      'role_change','directory_visibility','contact_visibility','featured_listing',
      'event_create','offer_create','referral_create','attribute_change','city_manage',
      'new_profile'
    ));
end $$;

comment on constraint approval_requests_request_type_check on public.approval_requests is
  'Secondary profile request 2026-07-23: added new_profile request type.';

commit;

begin;

-- 2. request_new_catalog_item: kullanıcı ikinci bir profil (başka rol için) talep eder.
-- submit_role_change_request deseninin kopyası — tek fark: kullanıcının mevcut rolüne
-- dokunmaz, sadece pending bir 'new_profile' talebi kuyruğa yazar.
create or replace function public.request_new_catalog_item(
  p_role_key text,
  p_title text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_title text;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_role_key is null or btrim(p_role_key) = '' then
    raise exception 'role key is required' using errcode = '22023';
  end if;

  if not exists (select 1 from public.roles r where r.key = p_role_key and r.is_active = true) then
    raise exception 'invalid role key' using errcode = '22023';
  end if;

  v_title := nullif(btrim(coalesce(p_title, '')), '');
  if v_title is null then
    raise exception 'title is required' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.approval_requests
    where user_id = auth.uid()
      and request_type = 'new_profile'
      and status = 'pending'
  ) then
    raise exception 'a pending new profile request already exists' using errcode = '22023';
  end if;

  insert into public.approval_requests (
    request_type, user_id, target_role_key,
    target_entity_type, payload, status
  ) values (
    'new_profile', auth.uid(), p_role_key,
    'catalog_item', jsonb_build_object('role_key', p_role_key, 'title', v_title, 'note', p_note), 'pending'
  )
  returning id into v_request_id;

  return v_request_id;
end;
$$;

grant execute on function public.request_new_catalog_item(text, text, text) to authenticated;

comment on function public.request_new_catalog_item(text, text, text) is
  'Secondary profile request 2026-07-23: user requests a second catalog_items profile for another role. Admin-approved via admin_review_approval_request.';

commit;

begin;

-- 3. admin_review_approval_request: new_profile onay dalı eklendi.
-- Diğer tüm dallar (role_change, attribute_change, directory_visibility vb.)
-- 20260609100901_rebuild_010d_fix_user_profiles_leftovers.sql ile birebir aynı.
CREATE OR REPLACE FUNCTION public.admin_review_approval_request(request_id uuid, decision text, note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_request public.approval_requests%rowtype;
  v_attribute public.afs_attributes%rowtype;
  v_attribute_value jsonb;
  v_visibility text;
  v_value_text text;
  v_new_item_id uuid;
  v_new_role_id uuid;
  v_new_slug text;
  v_new_title text;
  v_new_role_key text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if decision not in ('approved', 'rejected') then
    raise exception 'invalid decision' using errcode = '22023';
  end if;

  select * into v_request
  from public.approval_requests
  where id = request_id
  limit 1;

  if v_request.id is null then
    raise exception 'approval request not found' using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'approval request is not pending' using errcode = '22023';
  end if;

  if decision = 'approved' then
    if v_request.request_type = 'role_change' then
      perform public.admin_set_user_role(v_request.user_id, v_request.target_role_key);
    elsif v_request.request_type = 'new_profile' then
      v_new_role_key := v_request.payload ->> 'role_key';
      v_new_title := nullif(btrim(coalesce(v_request.payload ->> 'title', '')), '');

      if v_new_title is null then
        v_new_title := 'CorteQS Üyesi';
      end if;

      select id into v_new_role_id
      from public.roles
      where key = v_new_role_key and is_active = true
      limit 1;

      if v_new_role_id is null then
        raise exception 'target role no longer valid' using errcode = '22023';
      end if;

      v_new_slug := 'profile-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);

      insert into public.catalog_items (
        item_type,
        slug,
        title,
        status,
        visibility,
        verification_status,
        linked_user_id,
        created_by_user_id,
        platform_role_key,
        attributes,
        published_at
      ) values (
        'member',
        v_new_slug,
        v_new_title,
        'published',
        'public',
        'claimed',
        v_request.user_id,
        v_request.user_id,
        v_new_role_key,
        jsonb_build_object('bridge_source', 'new_profile_request', 'platform_role_key', v_new_role_key),
        now()
      )
      returning id into v_new_item_id;

      insert into public.catalog_item_roles (catalog_item_id, role_id, is_primary)
      values (v_new_item_id, v_new_role_id, true)
      on conflict (catalog_item_id, role_id) do nothing;

      insert into public.catalog_item_managers (item_id, user_id, role, status)
      values (v_new_item_id, v_request.user_id, 'owner', 'active')
      on conflict (item_id, user_id, role) do update
      set status = 'active', updated_at = now();

      perform public.write_admin_audit_log(
        'catalog_item.new_profile_approved',
        v_request.user_id,
        'catalog_item',
        v_new_item_id,
        null,
        v_request.payload
      );
    elsif v_request.request_type = 'attribute_change' then
      select * into v_attribute
      from public.afs_attributes
      where key = v_request.payload ->> 'attribute_key'
      limit 1;

      v_attribute_value := v_request.payload -> 'attribute_value';
      v_visibility := coalesce(v_request.payload ->> 'visibility', 'private');
      v_value_text := nullif(btrim(coalesce(v_attribute_value #>> '{}', '')), '');

      if v_attribute.key = 'full_name' then
        insert into public.user_profile_attributes (
          user_id,
          attribute_id,
          value_text,
          value_json,
          visibility,
          approval_status,
          approved_by,
          approved_at,
          updated_at
        ) values (
          v_request.user_id,
          v_attribute.id,
          v_value_text,
          null,
          'public',
          'approved',
          auth.uid(),
          now(),
          now()
        )
        on conflict (user_id, attribute_id) do update
        set
          value_text = excluded.value_text,
          value_json = null,
          visibility = excluded.visibility,
          approval_status = 'approved',
          approved_by = excluded.approved_by,
          approved_at = excluded.approved_at,
          updated_at = now();
      else
        insert into public.user_profile_attributes (
          user_id,
          attribute_id,
          value_text,
          value_json,
          visibility,
          approval_status,
          approved_by,
          approved_at,
          updated_at
        ) values (
          v_request.user_id,
          v_attribute.id,
          case when v_attribute.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
          case when v_attribute.data_type in ('multi_select','boolean','json') then v_attribute_value else null end,
          v_visibility,
          'approved',
          auth.uid(),
          now(),
          now()
        )
        on conflict (user_id, attribute_id) do update
        set
          value_text = excluded.value_text,
          value_json = excluded.value_json,
          visibility = excluded.visibility,
          approval_status = 'approved',
          approved_by = excluded.approved_by,
          approved_at = excluded.approved_at,
          updated_at = now();
      end if;

      perform public.write_admin_audit_log(
        'attribute.value_approved',
        v_request.user_id,
        'attribute',
        null,
        null,
        v_request.payload
      );
    elsif v_request.request_type in ('directory_visibility','contact_visibility','featured_listing','event_create','offer_create','referral_create','city_manage') then
      if v_request.target_feature_key is not null then
        perform public.admin_set_user_feature_override_detailed(
          v_request.user_id,
          v_request.target_feature_key,
          true,
          coalesce(note, 'approval_request:' || v_request.id::text)
        );
      end if;
    end if;
  elsif v_request.request_type = 'attribute_change' then
    perform public.write_admin_audit_log(
      'attribute.value_rejected',
      v_request.user_id,
      'attribute',
      null,
      null,
      v_request.payload
    );
  end if;

  update public.approval_requests
  set
    status = decision,
    admin_note = note,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  where id = request_id;

  perform public.write_admin_audit_log(
    case when decision = 'approved' then 'approval.approved' else 'approval.rejected' end,
    v_request.user_id,
    'approval_request',
    v_request.id,
    to_jsonb(v_request),
    jsonb_build_object('status', decision, 'admin_note', note)
  );
end;
$function$;

comment on function public.admin_review_approval_request(uuid, text, text) is
  'Secondary profile request 2026-07-23: added new_profile branch (creates catalog_items + catalog_item_roles + catalog_item_managers on approval).';

commit;
