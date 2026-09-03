-- burakakcakanat@gmail.com hesabini Admin_SuperAdmin rolune cek.
--
-- Gerekce: hesabin rolu 2026-09-03 10:40'ta deneme sirasinda Consultant_BusinessSetupWork'e
-- degistirilmisti. Bu migration o degisikligi geri almiyor, hesabi kalici olarak SuperAdmin
-- yapiyor (kullanici karari).
--
-- `public.user_role_assignments` PRIMARY KEY'i (user_id) — yani kullanici basina TEK rol vardir.
-- Bu yuzden dogru islem INSERT degil, mevcut satirin role_id'sini degistirmektir; satir yoksa
-- (hic rol atanmamis hesap) eklenir.
--
-- Idempotent ve savunmali: hesap yoksa (temiz kurulum, farkli ortam) migration NOTICE birakip
-- gecer, patlamaz. Rol anahtari bulunamazsa hata verir — o gercek bir sema sorunudur.

begin;

do $$
declare
  v_user_id uuid;
  v_role_id uuid;
  v_previous_role text;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = 'burakakcakanat@gmail.com';

  if v_user_id is null then
    raise notice 'burakakcakanat@gmail.com bu ortamda yok - rol atamasi atlandi.';
    return;
  end if;

  select id into v_role_id
  from public.roles
  where key = 'Admin_SuperAdmin';

  if v_role_id is null then
    raise exception 'Admin_SuperAdmin rolu bulunamadi - roles tablosu beklenen durumda degil.';
  end if;

  select r.key into v_previous_role
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = v_user_id;

  insert into public.user_role_assignments (user_id, role_id, updated_at)
  values (v_user_id, v_role_id, now())
  on conflict (user_id) do update
    set role_id = excluded.role_id,
        updated_at = now();

  raise notice 'burakakcakanat@gmail.com: % -> Admin_SuperAdmin',
    coalesce(v_previous_role, '(rol yoktu)');
end
$$;

commit;

-- Dogrulama:
-- select u.email, r.key, public.is_admin(u.id)
-- from public.user_role_assignments ura
-- join public.roles r on r.id = ura.role_id
-- join auth.users u on u.id = ura.user_id
-- where lower(u.email) = 'burakakcakanat@gmail.com';

-- Rollback (deneme oncesi rol):
-- update public.user_role_assignments
-- set role_id = (select id from public.roles where key = 'Consultant_BusinessSetupWork'),
--     updated_at = now()
-- where user_id = (select id from auth.users where lower(email) = 'burakakcakanat@gmail.com');
