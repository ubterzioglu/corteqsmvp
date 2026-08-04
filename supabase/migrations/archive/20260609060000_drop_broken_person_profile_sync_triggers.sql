-- =============================================================================
-- Fix: DROP'lu public.profiles / public.user_profiles tablolarına dayanan
-- bozuk "person_profile" katalog senkron trigger'larını kaldır.
--
-- Sorun: 2026-06-09'da legacy profiles/user_profiles/admin_users tabloları
-- DROP edildi. Ancak iki trigger hâlâ public.catalog_sync_person_profile()
-- fonksiyonunu çağırıyor; bu fonksiyon `public.profiles%rowtype` ve
-- `select ... from public.profiles` içerdiği için artık her tetiklenişte
--   ERROR: relation "public.profiles" does not exist
-- veriyor. Sonuç: aşağıdaki attribute key'leri CANLIDA KAYDEDİLEMİYOR:
--   bio_short, city, country, interests, linkedin_url, website_url
-- (trigger bunlarda tetikleniyor) ve individual_profile_details her INSERT/
-- UPDATE'inde de patlıyor.
--
-- Çözüm: Bu eski "person_profile" köprüsü, güncel "member" köprüsü
-- (catalog_items.item_type='member' + sync_member_catalog_role_for_user) ile
-- değiştirildiği için işlevsizdir. İlgili iki trigger ve üç fonksiyon güvenle
-- kaldırılır. Bağımsız profile-okuyan RPC'ler (search_directory_catalog,
-- admin_list_member_catalog_profiles, vb.) bu migration'ın KAPSAMI DIŞINDADIR
-- (ayrı bir B1/type-drift temizliği konusu).
-- =============================================================================

begin;

-- 1) Bozuk trigger'ları kaldır.
drop trigger if exists trg_catalog_sync_person_profile_attributes
  on public.user_profile_attributes;

drop trigger if exists trg_catalog_sync_person_profile_details
  on public.individual_profile_details;

-- 2) Yalnızca bu trigger'lar tarafından kullanılan bozuk fonksiyonları kaldır.
--    (member köprüsü bunları kullanmaz; person_profile köprüsü ölü.)
drop function if exists public.catalog_sync_person_profile_attribute_trigger();
drop function if exists public.catalog_sync_person_profile_trigger();
drop function if exists public.catalog_sync_person_profile(uuid);

commit;
