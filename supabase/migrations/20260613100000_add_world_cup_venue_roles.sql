-- Dünya Kupası kampanyası: maç mekânı kategorileri.
--
-- Kullanıcı isteği (2026-06-12): kayıt formundaki kategori listesi maç
-- yayınına uygun mekânlarla sınırlanacak (Eczane/Hukuk Bürosu gibi kategoriler
-- formdan çıkar — roller platformda kalır, yalnız form allowlist'i daralır;
-- bkz. src/lib/dunya-kupasi-schemas.ts WORLD_CUP_CATEGORY_KEYS) ve Bar/Pub
-- benzeri mekân kategorileri eklenecek.
--
-- Yeni roller Experimental rol kalıbıyla (mig 20260612120000) eklenir:
-- AFS config (role_attributes / role_features / role_sections) 1:1
-- User_DiasporaMember kopyası — diğer 76 rolle aynı (mig 20260612110000).
-- Sort: Restoran / Cafe (1600) hemen arkasına 1601-1603.
--
-- Idempotent: roles upsert on key; AFS satırları rol başına delete-then-insert.

do $$
declare
  v_src uuid;
  v_role uuid;
  v_key text;
  v_label text;
  v_sort integer;
begin
  select id into v_src from public.roles where key = 'User_DiasporaMember';
  if v_src is null then
    raise exception 'source role User_DiasporaMember not found';
  end if;

  for v_key, v_label, v_sort in
    values ('Business_BarPub', 'Bar / Pub', 1601),
           ('Business_TeaHouse', 'Çay Bahçesi / Kahvehane', 1602),
           ('Business_HookahLounge', 'Nargile Cafe / Lounge', 1603)
  loop
    insert into public.roles (key, label, description, sort_order,
                              is_active, is_assignable, is_directory_visible, is_system)
    select v_key, v_label,
           'Maç mekânı kategorisi (Dünya Kupası kampanyası, 2026-06-12) — User_DiasporaMember AFS kopyası', v_sort,
           s.is_active, s.is_assignable, s.is_directory_visible, false
    from public.roles s
    where s.id = v_src
    on conflict (key) do nothing;

    select id into v_role from public.roles where key = v_key;

    -- role_attributes
    delete from public.role_attributes where role_id = v_role;
    insert into public.role_attributes (
      id, role_id, attribute_id, is_enabled, is_required, is_public_default,
      user_can_edit, user_can_hide, requires_admin_approval_on_change, sort_order,
      is_public, owner_can_edit, admin_can_edit, visibility
    )
    select
      gen_random_uuid(), v_role, s.attribute_id, s.is_enabled, s.is_required, s.is_public_default,
      s.user_can_edit, s.user_can_hide, s.requires_admin_approval_on_change, s.sort_order,
      s.is_public, s.owner_can_edit, s.admin_can_edit, s.visibility
    from public.role_attributes s
    where s.role_id = v_src;

    -- role_features
    delete from public.role_features where role_id = v_role;
    insert into public.role_features (role_id, feature_key, is_enabled, visibility)
    select v_role, s.feature_key, s.is_enabled, s.visibility
    from public.role_features s
    where s.role_id = v_src;

    -- role_sections
    delete from public.role_sections where role_id = v_role;
    insert into public.role_sections (id, role_id, section_id, is_enabled, requires_approval, sort_order, visibility)
    select gen_random_uuid(), v_role, s.section_id, s.is_enabled, s.requires_approval, s.sort_order, s.visibility
    from public.role_sections s
    where s.role_id = v_src;
  end loop;
end $$;
