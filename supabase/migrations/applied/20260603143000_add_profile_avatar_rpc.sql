begin;

alter table public.user_profiles
  add column if not exists avatar_url text;

create or replace function public.update_profile_avatar(next_avatar_url text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_attribute_id uuid;
  v_normalized_url text := nullif(btrim(next_avatar_url), '');
begin
  if v_user_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.profiles
  set avatar_url = v_normalized_url,
      updated_at = now()
  where id = v_user_id;

  update public.user_profiles
  set avatar_url = v_normalized_url,
      updated_at = now()
  where user_id = v_user_id;

  select id
  into v_attribute_id
  from public.attribute_catalog
  where key = 'profile_photo_url'
    and is_active = true
  limit 1;

  if v_attribute_id is null then
    raise exception 'profile_photo_url attribute missing' using errcode = 'P0002';
  end if;

  if v_normalized_url is null then
    delete from public.user_profile_attributes
    where user_id = v_user_id
      and attribute_id = v_attribute_id;
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
      v_user_id,
      v_attribute_id,
      v_normalized_url,
      null,
      'public',
      'approved',
      v_user_id,
      now(),
      now()
    )
    on conflict (user_id, attribute_id) do update
    set
      value_text = excluded.value_text,
      value_json = null,
      visibility = 'public',
      approval_status = 'approved',
      approved_by = excluded.approved_by,
      approved_at = excluded.approved_at,
      updated_at = now();
  end if;

  return jsonb_build_object(
    'status', 'approved',
    'avatar_url', v_normalized_url
  );
end;
$$;

revoke all on function public.update_profile_avatar(text) from public;
grant execute on function public.update_profile_avatar(text) to authenticated;

commit;
