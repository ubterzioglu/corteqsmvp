-- Komuta Merkezi durum tazeleme: kodda/canlıda FİİLEN yapılmış ama panoda
-- 'Baslanmadi' kalmış 9 toplantı maddesini 'Tamamlandi' yapar.
--
-- Gerekçe: durum alanı yalnız elle güncelleniyor; iş bitince kimse geri dönüp
-- işaretlemiyor. 25 Eylül'de T16-T21 arası 121 açık madde dört ayrı ölçümle
-- tarandı; aşağıdaki 9'u kanıtla kapandı. Her satırın detail'ine kanıt eklenir
-- ki bir sonraki tur aynı ölçümü baştan yapmasın.
--
-- ⚠️ Kanıtla YAPILMADI çıkanlara dokunulmaz (Radar, üç nokta menüsü, gönderi
--    edit/delete, davet kodu, Cadde logosu, SMS doğrulama, checkout, RAG
--    kütüphanesi, sayfa kılavuzları, revizyona dosya yükleme, Venture Hub,
--    'diaspora' kelime ağırlığı, kapak görseli alanı, kapasite dokümanı,
--    ön kart envanteri, rol matrisi, 17 Eylül toplantısı).
-- ⚠️ 25.09 akşamı yazılan m93/m94 migration'ları commit'siz ve canlıda YOK;
--    o maddeler 'Devam ediyor' olarak DURUR — canlıda video hâlâ 50 MB.
--
-- Eşleştirme legacy_source_title üzerinden yapılır (UNIQUE indeks var).
-- Idempotent: yalnız status <> 'Tamamlandi' olan satırları günceller.

do $$
declare
  v_updated int;
  v_expected constant int := 9;
begin
  with kanit(baslik, ek) as (
    values
      ('Kuruluş/İşletme/Profesyonel dizinini kart görünümüne çevir',
       'ÖLÇÜM 25.09: DirectoryPage.tsx:401-403 grid + DirectoryResultCard.tsx:31-33 gerçek kart. Not: ÜYE kayıtları hâlâ satır biçiminde (DirectoryResultRow, :416) — istenirse ayrı madde açılmalı.'),
      ('Landing alt bölümlerden arka sayfalara CTA ekle',
       'ÖLÇÜM 25.09: SEOContentSection.tsx featuredLinks = 8 CTA (/founders, /founding-1000, /campaign/blogger, /campaign/vlogger, WhatsApp topluluk, /addcom, /blog, /radar) + DiasporaMarqueeSection.tsx:56 → /radar.'),
      ('Kafeden ana akışa dönüş butonunu ekle',
       'ÖLÇÜM 25.09: CaddeCafePage.tsx:469 "← Cadde''ye Dön" sayfanın en altında ortalanmış, :205''te de bir tane var. git blame 48c33770 (11.06.2026) — toplantıdan 2,5 ay önce zaten vardı.'),
      ('Profil alanlarını yeniden düzenle: telefon en üste, profil tipi netleşsin',
       'ÖLÇÜM 25.09: ProfileFieldsCard.tsx:83-98 telefon CardContent''in ilk çocuğu; bilgi (i) ikonu ProfileInfoTip.tsx ile "Profil tipi" rozetinin yanında (ProfileLegacyHeroCard.tsx:92,119). Canlı: phone attribute 78 rolde etkin.'),
      ('Kayıt formundaki "Bizi nereden buldunuz?" alanını kaldır',
       'ÖLÇÜM 25.09: canlı afs_attributes.key=''referral_source'' → is_active=false. Kayıt akışında adım yok (chatConfig.ts:48, STEP_ORDER); chatConfig.test.ts:45-47 kilitliyor. REFERRAL_SOURCE_OPTIONS geçmiş kayıtları etiketlemek için DURUR.'),
      ('Admin panelinde Güncellemeler sekmesini kapalı karta al, rol onaylarını öne çıkar',
       'ÖLÇÜM 25.09: AdminUpdatesCard.tsx:32-34 Accordion defaultValue YOK → kapalı başlıyor. Onaylar AdminAttentionQueue.tsx:25 amber satırı + KPI''da. Çekince: AdminDashboardPage.tsx:39 güncelleme kartını hâlâ KPI bloğunun ÜSTÜNE koyuyor (kapalı tek satır olduğu için pratikte sorun değil).'),
      ('Referans kodu giriş alanını giriş sonrası (post-login) aşamaya taşı',
       'ÖLÇÜM 25.09: chat akışından çıkarıldı (chatConfig.ts:89,327 — m17). Profil formunda: ProfileRoleSpecificCard.tsx:70,105 + useProfileAttributeForm.ts:333. Canlı: referral_code 82 rolde etkin.'),
      ('Google Auth ve admin paneli yetkilendirme rehberini hazırla',
       'ÖLÇÜM 25.09: docs/operations/2026-09-25-google-auth-admin-yetkilendirme-rehberi.md (commit 757f828). ⚠️ REHBER hazır, UYGULAMA değil — rehberin kendisi "hiçbir adım başlamadı, add-on açılmadı" diyor. Uygulama ayrı madde.'),
      ('Siteye Facebook linki ekle',
       'ÖLÇÜM 25.09: Footer.tsx:23-25 facebook.com/corteqs (Mayıs''tan beri). Sitede tek sosyal link bloğu footer; Facebook''un eksik olduğu başka yer bulunamadı. Başka bir yere isteniyorsa yeni madde açılmalı.')
  )
  update public.command_center_items as c
  set status = 'Tamamlandi',
      detail = c.detail || E'\n\n' || k.ek
  from kanit as k
  where c.legacy_source_title = k.baslik
    and c.item_type = 'meeting_note'
    and c.deleted_at is null
    and c.status <> 'Tamamlandi';

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise notice 'Durum tazeleme zaten uygulanmış, atlanıyor.';
    return;
  end if;

  if v_updated <> v_expected then
    raise exception 'Beklenen % satır güncellenmeliydi, % güncellendi. Başlıklar değişmiş olabilir.', v_expected, v_updated;
  end if;
end
$$;
