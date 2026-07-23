-- Admin_SuperAdmin rolünü ubterzioglu@gmail.com ve burakakcakanat@gmail.com için ata

do $$
declare
  v_role_id uuid;
  v_user_id uuid;
begin
  -- Admin_SuperAdmin rolünün id'sini al
  select id into v_role_id from public.roles where key = 'Admin_SuperAdmin';
  if v_role_id is null then
    raise exception 'Admin_SuperAdmin role not found';
  end if;

  -- ubterzioglu@gmail.com
  select id into v_user_id from auth.users where email = 'ubterzioglu@gmail.com';
  if v_user_id is not null then
    insert into public.user_role_assignments (user_id, role_id)
    values (v_user_id, v_role_id)
    on conflict (user_id) do update set role_id = excluded.role_id;
  end if;

  -- burakakcakanat@gmail.com
  select id into v_user_id from auth.users where email = 'burakakcakanat@gmail.com';
  if v_user_id is not null then
    insert into public.user_role_assignments (user_id, role_id)
    values (v_user_id, v_role_id)
    on conflict (user_id) do update set role_id = excluded.role_id;
  end if;
end;
$$;
