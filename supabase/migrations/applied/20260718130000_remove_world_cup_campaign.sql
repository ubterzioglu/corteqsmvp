-- Dünya Kupası işletme kampanyasını tamamen kaldır (backend).
--
-- Kampanya sona erdi; tablolar/RPC'ler/storage bucket'ı ve kampanyaya özel
-- 3 mekân rolü (Bar/Pub, Çay Bahçesi, Nargile) kaldırılıyor. Bu kampanyadan
-- Business_* rolü atanmış olabilecek kullanıcılar varsayılan role döndürülür.
--
-- Not: canlıda tek onaylı kayıt admin'in kendi test başvurusuydu
-- (role_assigned=false, Admin_SuperAdmin korunmuştu) — gerçek kullanıcı etkisi yok.

begin;

-- ─── 1. Kampanyadan Business_* rolü atanmış kullanıcıları varsayılan role döndür ──

update public.user_role_assignments ura
set role_id = (select id from public.roles where key = 'User_DiasporaMember'),
    updated_at = now()
from public.roles r
where ura.role_id = r.id
  and r.key in ('Business_BarPub', 'Business_TeaHouse', 'Business_HookahLounge');

-- ─── 2. Kampanyaya özel mekân rollerini deaktif et (roller silinmez, sadece kapatılır) ──

update public.roles
set is_active = false,
    is_assignable = false,
    is_directory_visible = false
where key in ('Business_BarPub', 'Business_TeaHouse', 'Business_HookahLounge');

-- ─── 3. RPC'ler ──────────────────────────────────────────────────────────────

drop function if exists public.list_world_cup_registrations_admin_v1(text);
drop function if exists public.list_world_cup_businesses_v1(integer);
drop function if exists public.admin_review_world_cup_registration_v1(uuid, boolean, text);
drop function if exists public.create_world_cup_registration_v1(text, text, text, text, text, text, boolean, text, text);
drop function if exists public.create_world_cup_registration_v1(text, text, text, text, text, boolean, text);
drop function if exists public.world_cup_campaign_is_active();

-- ─── 4. Storage: policy'ler ───────────────────────────────────────────────────
-- Bucket'ın kendisi (storage.buckets satırı) Storage Admin API ile ayrıca
-- silinir — storage.buckets/objects'e direkt DELETE Supabase tarafından
-- engellenir (Storage API zorunlu, bkz. storage.protect_delete()).

drop policy if exists "World cup images user upload" on storage.objects;
drop policy if exists "World cup images admin delete" on storage.objects;

-- ─── 5. Tablolar (RLS policy'leri tabloyla birlikte düşer) ───────────────────

drop table if exists public.world_cup_registrations;
drop table if exists public.world_cup_campaign_settings;

commit;
