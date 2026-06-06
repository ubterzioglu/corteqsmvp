-- Staging/test helper only.
-- Replace the UUID below before applying outside local experimentation.
-- Do not treat this file as a production seed.

do $$
declare
  v_test_user_id uuid := '00000000-0000-0000-0000-000000000000';
begin
  update public.user_profiles
  set
    profile_visible = true,
    visibility = 'public'
  where user_id = v_test_user_id;

  if not found then
    raise warning 'Test user % not found in public.user_profiles', v_test_user_id;
  end if;
end;
$$;
