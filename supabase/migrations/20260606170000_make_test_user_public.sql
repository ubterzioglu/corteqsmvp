-- Staging/test helper only.
-- Replace the UUID below before applying outside local experimentation.
-- Do not treat this file as a production seed.

do $$
declare
  v_test_user_id uuid := '00000000-0000-0000-0000-000000000000';
begin
  if not exists (
    select 1
    from public.user_profiles
    where user_id = v_test_user_id
  ) then
    raise warning 'Test user % not found in public.user_profiles', v_test_user_id;
    return;
  end if;

  insert into public.individual_profile_details (
    user_id,
    visibility_status,
    profile_settings
  )
  values (
    v_test_user_id,
    'open',
    jsonb_build_object('profile_visible', true)
  )
  on conflict (user_id) do update
  set
    visibility_status = 'open',
    profile_settings = jsonb_set(
      coalesce(public.individual_profile_details.profile_settings, '{}'::jsonb),
      '{profile_visible}',
      'true'::jsonb,
      true
    ),
    updated_at = now();
end;
$$;
