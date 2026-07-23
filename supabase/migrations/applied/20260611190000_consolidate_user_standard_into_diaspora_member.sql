-- Rol konsolidasyonu: User_Standard -> User_DiasporaMember (2026-06-11)
--
-- İki rol işlevsel olarak birebir aynıydı: AFS matrisi tüm rollerde uniform
-- (rebuild_013 doğrulaması), cadde feature seti aynı (cadde300_002), ikisi de
-- TR-bireysel listesinde (can_post_kopru / cadde-rules.ts). Varsayılan rol
-- zaten User_DiasporaMember (handle_new_auth_user_role + sync_member_catalog_
-- role_for_user). Ürün kararıyla User_Standard pasifleştirilir, tüm kayıtları
-- User_DiasporaMember'a taşınır.
--
-- HARD DELETE yapılmaz: user_role_assignments.role_id FK'si on delete restrict,
-- catalog_items.platform_role_key FK'si roles(key)'e gider; ayrıca demo seed
-- (20260610170000) fresh rebuild'de bu rolün varlığına bakar (kronolojik olarak
-- bu migration'dan önce koştuğu için sıralama bozulmaz). Admin/directory
-- sorguları is_active = true filtrelediğinden pasif rol tüm seçicilerden düşer.
--
-- can_post_kopru SQL listesi ve cadde-rules.ts INDIVIDUAL_ROLE_KEYS bilinçli
-- olarak DEĞİŞTİRİLMEZ: 'User_Standard' anahtarı hiçbir kullanıcıda
-- kalmayacağı için listede inert durur, SQL<->TS ayna kontratı bozulmaz.
--
-- İdempotent: tekrar çalıştırıldığında etkilenen satır 0 olur.

begin;

-- ── 0. Guard ─────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from public.roles
    where key = 'User_DiasporaMember' and is_active = true and deleted_at is null
  ) then
    raise exception 'User_DiasporaMember aktif degil - konsolidasyon iptal';
  end if;
end $$;

do $$
declare
  v_std_id uuid;
  v_dia_id uuid;
  v_count int;
begin
  select id into v_std_id from public.roles where key = 'User_Standard';
  select id into v_dia_id from public.roles where key = 'User_DiasporaMember';

  if v_std_id is null then
    raise notice 'User_Standard zaten yok - tasima adimlari atlandi';
    return;
  end if;

  -- ── 1. user_role_assignments (user_id PK -> düz UPDATE yeterli) ───────────
  -- Not: trg_sync_member_catalog_role_from_user_role_assignments tetiklenir ve
  -- üye katalog köprüsünü kendisi günceller (istenen davranış).
  update public.user_role_assignments
  set role_id = v_dia_id, updated_at = now()
  where role_id = v_std_id;
  get diagnostics v_count = row_count;
  raise notice 'user_role_assignments tasinan: %', v_count;

  -- ── 2. catalog_item_roles (dedup-güvenli: önce çakışanları sil) ───────────
  delete from public.catalog_item_roles cir
  where cir.role_id = v_std_id
    and exists (
      select 1 from public.catalog_item_roles d
      where d.catalog_item_id = cir.catalog_item_id and d.role_id = v_dia_id
    );
  get diagnostics v_count = row_count;
  raise notice 'catalog_item_roles dedup silinen: %', v_count;

  update public.catalog_item_roles
  set role_id = v_dia_id
  where role_id = v_std_id;
  get diagnostics v_count = row_count;
  raise notice 'catalog_item_roles tasinan: %', v_count;

  -- ── 3. catalog_items.platform_role_key ────────────────────────────────────
  update public.catalog_items
  set platform_role_key = 'User_DiasporaMember', updated_at = now()
  where platform_role_key = 'User_Standard';
  get diagnostics v_count = row_count;
  raise notice 'catalog_items.platform_role_key tasinan: %', v_count;

  -- ── 4. Rolü pasifleştir ────────────────────────────────────────────────────
  update public.roles
  set is_active = false, deleted_at = now(), updated_at = now()
  where id = v_std_id and is_active = true;
end $$;

-- ── 5. Assertion: kalan referans 0 olmalı ────────────────────────────────────
do $$
declare
  v_std_id uuid;
  v_left int;
begin
  select id into v_std_id from public.roles where key = 'User_Standard';
  if v_std_id is null then return; end if;

  select (select count(*) from public.user_role_assignments where role_id = v_std_id)
       + (select count(*) from public.catalog_item_roles where role_id = v_std_id)
       + (select count(*) from public.catalog_items where platform_role_key = 'User_Standard')
  into v_left;

  if v_left > 0 then
    raise exception 'User_Standard referansi kaldi: % (beklenen 0)', v_left;
  end if;

  if exists (select 1 from public.roles where id = v_std_id and is_active = true) then
    raise exception 'User_Standard hala aktif (beklenen pasif)';
  end if;
end $$;

commit;
