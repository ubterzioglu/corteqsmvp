alter table public.whatsapp_landings
  drop constraint if exists whatsapp_landings_category_check;

update public.whatsapp_landings
  set category = 'yatirim'
  where category = 'girisim';

alter table public.whatsapp_landings
  add constraint whatsapp_landings_category_check
  check (category in (
    'alumni', 'hobi', 'is', 'doktor', 'yatirim', 'akademik',
    'dayanisma', 'hr', 'kisisel-gelisim', 'diger'
  ));

alter table public.whatsapp_landings
  add column if not exists member_count integer,
  add column if not exists member_count_updated_at timestamptz,
  add column if not exists group_score integer,
  add column if not exists language text
    check (language in ('tr', 'en', 'de', 'ar')),
  add column if not exists origin text
    check (origin in ('global', 'mena', 'berlin', 'turkiye', 'avrupa'));

drop function if exists public.update_current_user_editable_whatsapp_landing(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
);

create or replace function public.update_current_user_editable_whatsapp_landing(
  p_landing_id uuid,
  p_group_name text,
  p_category text,
  p_country text,
  p_city text,
  p_hero_image text,
  p_call_to_action_text text,
  p_conditions text,
  p_whatsapp_link text,
  p_admin_name text,
  p_admin_contact text,
  p_description text,
  p_member_count integer,
  p_member_count_updated_at timestamptz,
  p_language text,
  p_origin text
)
returns public.whatsapp_landings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.whatsapp_landings%rowtype;
  v_after public.whatsapp_landings%rowtype;
begin
  if auth.uid() is null then
    raise exception 'unauthorized'
      using errcode = '42501';
  end if;

  select *
  into v_before
  from public.whatsapp_landings
  where id = p_landing_id
  limit 1;

  if v_before.id is null then
    raise exception 'landing not found'
      using errcode = 'P0002';
  end if;

  if not public.current_user_can_edit_whatsapp_landing(v_before.id) then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  update public.whatsapp_landings
  set
    group_name = btrim(p_group_name),
    category = btrim(p_category),
    country = btrim(p_country),
    city = btrim(p_city),
    hero_image = nullif(btrim(coalesce(p_hero_image, '')), ''),
    call_to_action_text = nullif(btrim(coalesce(p_call_to_action_text, '')), ''),
    conditions = nullif(btrim(coalesce(p_conditions, '')), ''),
    whatsapp_link = btrim(p_whatsapp_link),
    admin_name = nullif(btrim(coalesce(p_admin_name, '')), ''),
    admin_contact = nullif(btrim(coalesce(p_admin_contact, '')), ''),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    member_count = p_member_count,
    member_count_updated_at = p_member_count_updated_at,
    language = nullif(btrim(coalesce(p_language, '')), ''),
    origin = nullif(btrim(coalesce(p_origin, '')), ''),
    status = 'pending',
    rejection_reason = null,
    updated_at = now()
  where id = v_before.id
  returning * into v_after;

  perform public.write_admin_audit_log(
    'whatsapp_landing.editor_submitted',
    auth.uid(),
    'whatsapp_landing',
    v_after.id,
    to_jsonb(v_before),
    to_jsonb(v_after)
  );

  return v_after;
end;
$$;

grant execute on function public.update_current_user_editable_whatsapp_landing(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  timestamptz,
  text,
  text
) to authenticated;
