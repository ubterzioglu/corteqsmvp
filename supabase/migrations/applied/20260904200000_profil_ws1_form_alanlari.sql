-- Profil Workshop WS1 (3 Eylül 2026 "Profiller" toplantısı, T19) — madde 1, 4 ve 5
-- için AFS kural değişiklikleri. Pano: /admin/workshop/profil.
--
-- 1) Madde 1 — "Telefon numarası profil formunda en üste, ilk kutuya alınacak."
--    Ölçüm (2026-09-04): `phone` attribute'u hiçbir rolün role_attributes listesinde
--    YOKTU (0 satır); 116 kullanıcıda private `phone` değeri duruyordu (onboarding
--    yazmış) ama /profile formu alanı hiç göstermiyordu — get_current_user_profile
--    yalnız role_attributes'ta etkin kuralı olan alanları döner.
--    Tüm aktif rollere kural eklenir: zorunlu, private varsayılan, kullanıcı düzenler.
--    ⚠️ user_can_hide=TRUE bilinçlidir: update_profile_attribute, user_can_hide=false
--    olan alanda 'public' dışı görünürlüğü REDDEDER ("attribute visibility cannot be
--    changed"). Telefon her zaman private yazılır; gizlilik garantisi
--    afs_attributes.storage_strategy='private_storage'tan gelir — public sayfa RPC'si
--    (get_catalog_item_public_page_v2) bu stratejiyi baştan eler.
--
-- 2) Madde 5 — KARAR: bireysel ilgi alanları diğer kullanıcılara görünür (public).
--    `interests` kuralı gizlenemez + public yapılır; mevcut private satırlar public'e
--    çevrilir (ölçüm: 12 satırın 12'si zaten public, güvence için yine de çalışır).
--
-- 3) Madde 4 — 'Kayıt formundaki "Bizi nereden buldunuz?" alanı tamamen kaldırılacak.'
--    `referral_source` attribute'u pasifleştirilir: form RPC'leri is_active=false
--    alanı listelemez/yazmaz. Veri SİLİNMEZ (112 kullanıcıda geçmiş değer; admin
--    başvuru detayı göstermeye devam eder). Geri alma: is_active=true.

-- ── 1) phone → tüm aktif roller ──────────────────────────────────────────────
insert into public.role_attributes (
  role_id, attribute_id, is_enabled, is_required, is_public_default,
  user_can_edit, user_can_hide, requires_admin_approval_on_change, sort_order,
  is_public, owner_can_edit, admin_can_edit, visibility
)
select
  r.id, a.id, true, true, false,
  true, true, false, 5,
  false, true, true, 'private'
from public.roles r
cross join public.afs_attributes a
where a.key = 'phone'
  and r.is_active = true
  and r.deleted_at is null
  and not exists (
    select 1 from public.role_attributes ra
    where ra.role_id = r.id and ra.attribute_id = a.id
  );

-- ── 2) interests → herkese açık, gizlenemez ─────────────────────────────────
update public.role_attributes ra
set user_can_hide = false,
    is_public = true,
    is_public_default = true,
    visibility = 'public',
    updated_at = now()
from public.afs_attributes a
where a.id = ra.attribute_id
  and a.key = 'interests'
  and (ra.user_can_hide or not ra.is_public or not ra.is_public_default or ra.visibility <> 'public');

update public.user_profile_attributes upa
set visibility = 'public',
    updated_at = now()
from public.afs_attributes a
where a.id = upa.attribute_id
  and a.key = 'interests'
  and upa.visibility <> 'public';

-- ── 3) referral_source → pasif ──────────────────────────────────────────────
update public.afs_attributes
set is_active = false,
    updated_at = now()
where key = 'referral_source'
  and is_active;

-- ── Doğrulama: sessiz eksik uygulama olmasın ────────────────────────────────
do $$
declare
  v_active_roles integer;
  v_phone_rules integer;
  v_interests_hideable integer;
  v_referral_active integer;
begin
  select count(*) into v_active_roles
  from public.roles where is_active = true and deleted_at is null;

  select count(*) into v_phone_rules
  from public.role_attributes ra
  join public.afs_attributes a on a.id = ra.attribute_id
  join public.roles r on r.id = ra.role_id
  where a.key = 'phone' and r.is_active = true and r.deleted_at is null and ra.is_enabled;

  if v_phone_rules <> v_active_roles then
    raise exception 'phone kuralı % aktif rolün %''inde var; hepsinde olmalıydı.', v_active_roles, v_phone_rules;
  end if;

  select count(*) into v_interests_hideable
  from public.role_attributes ra
  join public.afs_attributes a on a.id = ra.attribute_id
  where a.key = 'interests' and (ra.user_can_hide or not ra.is_public);

  if v_interests_hideable <> 0 then
    raise exception 'interests hâlâ % rolde gizlenebilir/private.', v_interests_hideable;
  end if;

  select count(*) into v_referral_active
  from public.afs_attributes where key = 'referral_source' and is_active;

  if v_referral_active <> 0 then
    raise exception 'referral_source hâlâ aktif.';
  end if;
end
$$;
