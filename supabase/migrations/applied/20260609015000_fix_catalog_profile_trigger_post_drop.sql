-- handle_auth_user_catalog_profile trigger fonksiyonu public.profiles tablosunu
-- çağırıyor, ancak bu tablo 20260609003000 migration'ında DROP edildi.
-- Her yeni auth.users INSERT'i "Database error creating new user" ile crash yapıyor.
-- Çözüm: trigger'ı yeni sisteme (user_role_assignments) yönlendir.
-- Yeni kullanıcı oluşturulduğunda otomatik olarak 'bireysel' rolü ata.

begin;

-- Eski fonksiyonu drop et (profiles bağımlılığı var)
drop trigger if exists on_auth_user_created_catalog_profile on auth.users;
drop trigger if exists on_auth_user_updated_catalog_profile on auth.users;
drop function if exists public.handle_auth_user_catalog_profile() cascade;
drop function if exists public.upsert_profile_from_auth_identity(uuid, text, jsonb, jsonb) cascade;

-- Yeni trigger fonksiyonu: yeni kullanıcıya otomatik 'bireysel' rolü ata
create or replace function public.handle_new_auth_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bireysel_role_id uuid;
begin
  select id into v_bireysel_role_id
  from public.roles
  where key = 'bireysel' and is_active = true
  limit 1;

  if v_bireysel_role_id is not null then
    insert into public.user_role_assignments (user_id, role_id)
    values (new.id, v_bireysel_role_id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created_assign_role
after insert on auth.users
for each row execute function public.handle_new_auth_user_role();

commit;
