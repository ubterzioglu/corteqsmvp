-- Tek bireysel profil: ölü person_profile item'larını soft-delete et + member tekilliğini garanti et.
--
-- Kök neden (canlı DB ile doğrulandı 2026-06-26):
--   Profil seçim ekranı (/profile) get_my_editable_catalog_items RPC'sini çağırır; bu RPC
--   kullanıcının catalog_item_managers'da owner/manager/editor olduğu TÜM item'ları döndürür.
--   AFS rebuild'inden (member tipi, 2026-06-07) önce, eski catalog taxonomy'siyle (2026-06-04)
--   her kullanıcı için bir 'person_profile' item'ı oluşturulmuştu. Yeni sistem 'member' tipine
--   geçti ama 14 ölü person_profile satırı canlıda kaldı. Seçim ekranı item_type'a göre etiket
--   vermediği için hem member hem person_profile aynı role map olup ikisi de "Bireysel" görünüyor.
--
--   Doğrulanan canlı durum:
--     * 14 person_profile satırı; en son 2026-06-04'te oluşmuş (o tarihten beri 0 yeni) -> ölü tip.
--     * Hepsinin içi boş: 0 attribute value, 0 contact, 0 claim. Sadece otomatik üretilen
--       14 catalog_item_roles + 14 catalog_item_managers bağlantısı var.
--     * 14 kullanıcının tamamı hem bir member hem bir person_profile owner'ı -> herkes 1 fazla
--       "Bireysel" görüyor. Silmek hiç gerçek kullanıcı verisi kaybetmez.
--     * member tipinde linked_user_id zaten tekil (dublikat yok).
--
-- Ne yapar (idempotent):
--   1. Ölü person_profile item'larını soft-delete (deleted_at, private, provenance tag).
--   2. Bu item'lara asılı catalog_item_managers + catalog_item_roles bağlantılarını sil
--      (item ölü; seçim ekranına/RPC'ye düşmemeli). Bu satırlar otomatik üretilmişti.
--   3. member tekilliği için partial unique index ekle: bir kullanıcıya ikinci aktif member
--      satırı oluşmasını DB seviyesinde imkânsız kılar.
--
-- Rollback (provenance tag ile):
--   update public.catalog_items set deleted_at = null
--     where attributes->>'cleanup_source' = 'dedupe-individual-profiles-20260626';
--   (manager/role bağlantıları otomatik üretilirdi; gerekirse sync fonksiyonları yeniden kurar.)

begin;

-- ─── 1. Ölü person_profile item'larını soft-delete et ───────────────────────
update public.catalog_items ci
set
  deleted_at = now(),
  visibility = 'private',
  attributes = coalesce(ci.attributes, '{}'::jsonb)
               || jsonb_build_object('cleanup_source', 'dedupe-individual-profiles-20260626'),
  updated_at = now()
where ci.item_type = 'person_profile'
  and ci.deleted_at is null;

-- ─── 2. Ölü person_profile item'larına asılı manager + role bağlantılarını kaldır ──
delete from public.catalog_item_managers cim
using public.catalog_items ci
where cim.item_id = ci.id
  and ci.item_type = 'person_profile'
  and ci.deleted_at is not null
  and ci.attributes->>'cleanup_source' = 'dedupe-individual-profiles-20260626';

delete from public.catalog_item_roles cir
using public.catalog_items ci
where cir.catalog_item_id = ci.id
  and ci.item_type = 'person_profile'
  and ci.deleted_at is not null
  and ci.attributes->>'cleanup_source' = 'dedupe-individual-profiles-20260626';

-- ─── 3. member tekilliği: bir kullanıcıya tek aktif member profili ───────────
create unique index if not exists uq_catalog_items_one_member_per_user
  on public.catalog_items (linked_user_id)
  where item_type = 'member' and deleted_at is null and linked_user_id is not null;

comment on index public.uq_catalog_items_one_member_per_user is
  'Bir auth kullanıcısının yalnızca bir aktif (silinmemiş) member catalog item''ı olmasını '
  'garanti eder. Profil seçim ekranında çift "Bireysel" profil oluşmasını engeller.';

-- ─── 4. Rapor ───────────────────────────────────────────────────────────────
do $$
declare
  v_cleaned int;
begin
  select count(*) into v_cleaned
  from public.catalog_items
  where attributes->>'cleanup_source' = 'dedupe-individual-profiles-20260626';
  raise notice 'dedupe-individual-profiles-20260626: person_profile soft-deleted = %', v_cleaned;
end $$;

commit;
