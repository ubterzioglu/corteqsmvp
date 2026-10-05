-- SG4 · whatsapp_landings INSERT/UPDATE guard + host CHECK
--
-- Kaynak: docs/security/SECURITY_AUDIT.md S8, S6, O8
-- Bulgu: Grup satırı doğrudan INSERT ile yayın/skor/rozet/sahiplik sahteciliği.
--
-- Yama:
-- 1. BEFORE INSERT guard: listing_status/status/ownership/owner_user_id/group_score/has_approved_badge sıfırla
-- 2. BEFORE UPDATE guard: whatsapp_link değişimini kontrol et (onaylı gruplarda yasak)
-- 3. whatsapp_link host CHECK (NOT VALID — mevcut veriyi doğrulama)
--
-- ⚠️ Eski INSERT politikasını KALDIRMA (§B4) — yeni bundle yayında olunca kaldırılır.

begin;

-- 1. BEFORE INSERT guard
create or replace function public.whatsapp_landings_guard_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_via_rpc boolean;
begin
  -- Admin veya via_rpc bayrağı varsa serbest
  select public.is_admin(auth.uid()) into v_is_admin;
  v_via_rpc := (current_setting('corteqs.skip_group_guard', true) = 'true');

  if v_is_admin or v_via_rpc then
    return new;
  end if;

  -- Sıfırla: ayrıcalıklı alanlar
  new.listing_status := 'pending';
  new.status := 'draft';
  new.ownership := 'unverified';
  new.owner_user_id := auth.uid();
  new.group_score := 0;
  new.has_approved_badge := false;
  new.verified_at := null;
  new.verified_by := null;

  return new;
end;
$$;

revoke execute on function public.whatsapp_landings_guard_insert() from public, anon, authenticated;
grant execute on function public.whatsapp_landings_guard_insert() to service_role;

drop trigger if exists whatsapp_landings_guard_insert_trigger on public.whatsapp_landings;
create trigger whatsapp_landings_guard_insert_trigger
  before insert on public.whatsapp_landings
  for each row
  execute function public.whatsapp_landings_guard_insert();

-- 2. BEFORE UPDATE guard: whatsapp_link değişimini kontrol et
-- Mevcut guard (20261002070000) listing_status/status/ownership koruyor ama whatsapp_link YOK.
create or replace function public.whatsapp_landings_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_via_rpc boolean;
begin
  select public.is_admin(auth.uid()) into v_is_admin;
  v_via_rpc := (current_setting('corteqs.skip_group_guard', true) = 'true');

  if v_is_admin or v_via_rpc then
    return new;
  end if;

  -- Ayrıcalıklı alanları koru
  if new.listing_status is distinct from old.listing_status
    or new.status is distinct from old.status
    or new.ownership is distinct from old.ownership
    or new.owner_user_id is distinct from old.owner_user_id
    or new.group_score is distinct from old.group_score
    or new.has_approved_badge is distinct from old.has_approved_badge
  then
    raise exception 'whatsapp_landings_privileged_column_protected'
      using errcode = '28000',
            hint = 'Yalnız admin ayrıcalıklı alanları değiştirebilir.';
  end if;

  -- O8: Onaylı gruplarda whatsapp_link değişimi yasak
  if old.ownership = 'verified' and new.whatsapp_link is distinct from old.whatsapp_link then
    raise exception 'whatsapp_link_verified_group_immutable'
      using errcode = '28000',
            hint = 'Onaylı grupların linki değiştirilemez.';
  end if;

  return new;
end;
$$;

revoke execute on function public.whatsapp_landings_guard_update() from public, anon, authenticated;
grant execute on function public.whatsapp_landings_guard_update() to service_role;

drop trigger if exists whatsapp_landings_guard_update_trigger on public.whatsapp_landings;
create trigger whatsapp_landings_guard_update_trigger
  before update on public.whatsapp_landings
  for each row
  execute function public.whatsapp_landings_guard_update();

-- 3. whatsapp_link host CHECK (NOT VALID — mevcut veriyi doğrulama)
-- Basit regex: http/https ile başlamalı, geçerli hostname karakterleri.
alter table public.whatsapp_landings
  add constraint whatsapp_landings_link_format_check
  check (whatsapp_link is null or whatsapp_link ~ '^https?://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/[^\s]*)?$')
  not valid;

comment on function public.whatsapp_landings_guard_insert() is
  'SG4: INSERT guard — ayrıcalıklı alanları sıfırla (admin/via_rpc hariç).';

comment on function public.whatsapp_landings_guard_update() is
  'SG4: UPDATE guard — ayrıcalıklı alanları koru + onaylı gruplarda link değişimi yasak (O8).';

commit;
