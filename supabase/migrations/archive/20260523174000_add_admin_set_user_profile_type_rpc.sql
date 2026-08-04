begin;

create or replace function public.admin_set_user_profile_type(
  target_user_id uuid,
  next_profile_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  if next_profile_type not in (
    'bireysel',
    'danisman',
    'isletme',
    'kurulus-dernek',
    'blogger-vlogger-youtuber',
    'sehir-elcisi'
  ) then
    raise exception 'invalid profile type'
      using errcode = '22023';
  end if;

  update public.user_profiles
  set
    profile_type = next_profile_type,
    updated_at = now()
  where user_id = target_user_id;

  if not found then
    raise exception 'user profile not found'
      using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.admin_set_user_profile_type(uuid, text) to authenticated;

commit;
