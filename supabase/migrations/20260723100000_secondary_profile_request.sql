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
