-- Profil Workshop WS1 — UBT işaretleme (2026-09-04, Batch B).
-- Kural: burak_done ASLA ajans tarafından atılmaz; yalnız ubt_done ve yalnız kod
-- kanıtıyla. Kanıtlar aşağıda madde madde. psql -f ile (UTF-8) çalıştırılır:
--   psql "<pooler conn>" -v ON_ERROR_STOP=1 -f docs/operations/2026-09-04-profil-ws1-ubt-isaretleme.sql
--
-- item_no | kanıt
--   1     | ProfilePhoneField.tsx + ProfilePage "Profil Alanları" ilk satır; mig 20260904200000 (phone kuralı 78 rol)
--   2     | PremiumProfileHero "Profil tipi:" çipi + (i) balonu; legacy hero + Profil Durumu kartı
--   3     | PreferenceToggleCard `info` + ProfileInfoTip — 3 rozetin yanında (i)
--   4     | referral_source: 10 dosyadan kaldırıldı, afs_attributes.is_active=false (mig 20260904200000)
--   5     | mig 20260904200000: interests user_can_hide=false/public (canlı: 82 rol, 0 gizlenebilir);
--         | CaddeInterestsCard anahtar yerine "Herkese açık" rozeti
--   6     | LinkedIn kartı: "Tavsiye edilir" rozeti + gerekçe metni, opsiyonel kalır
--  10     | src/lib/phone-country-derivation.test.ts sözleşme testi: src/ altında alan kodu→ülke türetme yok
--  26     | Burak'ın Admin_SuperAdmin rolü: mig 20260903130000, commit 91d6247 (T19 panosunda Tamamlandi)
--
-- ⚠️ MADDE 9 BİLİNÇLİ OLARAK İŞARETLENMEDİ. Ülke/şehir gerçekten seçimle alınıyor
-- (SearchableCountrySelect → geo_countries; is_tr_resident/is_diaspora_resident bu
-- attribute'tan okur) ama maddenin ikinci yarısı — "hangi DİASPORADAN geldiği" —
-- karşılanmıyor: `diaspora_key` istemcide `?? "tr"` ile sabitleniyor
-- (src/lib/cadde-api.ts:710, :944; cadde-carsi-api.ts:230) ve ülkeden türetilmiyor.
-- Yarısı duran maddeyi tam saymak panoyu yanıltır.
--
-- Açık bırakılanlar (bilinçli): 7 (SMTP + mailer_autoconfirm kapatma — canlı auth config),
-- 8 (OTP sağlayıcısı yok), 9 (yukarı bak), 11 (7+8'e bağlı), 12 (kampanya içeriği + gönderim kararı).

update public.workshop_items
set ubt_done = true,
    ubt_done_at = coalesce(ubt_done_at, now()),
    updated_at = now()
where workshop_key = 'profil'
  and session_key = 'WS1'
  and deleted_at is null
  and item_no in (1, 2, 3, 4, 5, 6, 10, 26)
  and ubt_done = false;

-- Doğrulama: 8 madde UBT ✓ olmalı, Burak kutuları dokunulmamış (0) kalmalı.
select
  count(*) filter (where ubt_done) as ubt_done_count,
  count(*) filter (where burak_done) as burak_done_count,
  count(*) as total
from public.workshop_items
where workshop_key = 'profil' and session_key = 'WS1' and deleted_at is null;
