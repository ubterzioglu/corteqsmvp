-- SG3 · catalog_items kolon grant + ayrıcalıklı kolon tetikleyicisi
--
-- Kaynak: docs/security/SECURITY_AUDIT.md S7
-- Bulgu: Üye kendi dizin kaydını "verified" yapıp Seviye-2 kapısını geçer.
--
-- Yama:
-- 1. INSERT/UPDATE yetkisini anon/authenticated'dan kaldır
-- 2. Yalnız güvenli kolonlara UPDATE yetkisi ver
-- 3. Ayrıcalıklı kolonları (verification_status, platform_role_key, status, visibility)
--    koruyan BEFORE UPDATE tetikleyici ekle

begin;

-- 1. Yetkileri kaldır
revoke insert, update on public.catalog_items from anon, authenticated;

-- 2. Güvenli kolonlara UPDATE yetkisi ver
-- Bu kolonlar üye profilini düzenlemek için gerekli, ayrıcalık yükseltme yapamaz.
grant update (
  title,
  headline,
  short_description,
  long_description,
  attributes,
  city,
  country_code,
  updated_at
) on public.catalog_items to authenticated;

-- 3. BEFORE UPDATE tetikleyici: ayrıcalıklı kolonları koru
-- Eğer UPDATE ayrıcalıklı bir kolonu değiştirmeye çalışırsa ve çağıran admin değilse reddet.
create or replace function public.catalog_items_guard_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  -- Admin ise serbest
  select public.is_admin(auth.uid()) into v_is_admin;
  if v_is_admin then
    return new;
  end if;

  -- Ayrıcalıklı kolonlar değişti mi?
  if new.verification_status is distinct from old.verification_status
    or new.platform_role_key is distinct from old.platform_role_key
    or new.status is distinct from old.status
    or new.visibility is distinct from old.visibility
    or new.owner_user_id is distinct from old.owner_user_id
    or new.linked_user_id is distinct from old.linked_user_id
  then
    raise exception 'catalog_items_privileged_column_protected'
      using errcode = '28000',
            hint = 'Yalnız admin ayrıcalıklı kolonları değiştirebilir.';
  end if;

  return new;
end;
$$;

-- Yetkileri ayarla
revoke execute on function public.catalog_items_guard_privileged_columns() from public, anon, authenticated;
grant execute on function public.catalog_items_guard_privileged_columns() to service_role;

-- Tetikleyiciyi oluştur
drop trigger if exists catalog_items_guard_privileged_columns_trigger on public.catalog_items;
create trigger catalog_items_guard_privileged_columns_trigger
  before update on public.catalog_items
  for each row
  execute function public.catalog_items_guard_privileged_columns();

comment on function public.catalog_items_guard_privileged_columns() is
  'SG3: Ayrıcalıklı kolonları (verification_status, platform_role_key, status, visibility, owner_user_id, linked_user_id) korur. Yalnız admin değiştirebilir.';

commit;
