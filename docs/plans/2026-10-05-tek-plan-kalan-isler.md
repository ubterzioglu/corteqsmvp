# TEK PLAN — kalan her şey (5 Ekim 2026 akşam)

> Bu dosya, dağınık planların (KALANLAR.md, birleşik CV/ilan/rol planı, 8 ürün isteği planı, WhatsApp OTP
> planı, devir notları) **kalan işini tek yerde** toplar. Bir işe başlamadan önce buradaki "Doğrulanmadı"
> işaretlerine bak; rakamları ezberleme, komutla ölç. Karar uydurma: burada olmayan bir kural için dur ve sor.

## 0 · Önce bunu bil (5 satır)

1. **Diğer ajanın "A1–A16 tamamlandı" raporu doğrulanmadı.** Bu işlerin dosyaları çalışma ağacında
   değişmiş/izlenmeyen duruyor ama **HİÇBİRİ commit'li değil** (`git log`'da A-batch commit'i yok).
   Migration dosyaları var, hiçbiri canlıya uygulanmadı. "Tamamlandı" yerine "yazıldı, incelenmedi" say.
2. **Yeni migration'larda zaman damgası kusuru:** `202610051000000_event_published_notification.sql` ve
   `202610051100000_public_content_search_events.sql` **15 haneli** (diğerleri 14). Sürüm sıralaması bozulur
   (sayısal karşılaştırmada hepsinden sonra, metin karşılaştırmasında arada kalır). **Uygulamadan önce
   14 haneli, çakışmasız damgayla yeniden adlandırılmalı** (henüz uygulanmadıkları için güvenli).
3. **Yerelde commit'siz iş var** (başkasının): `Footer.tsx`, `AssistantBubble*`, `Pricing.tsx`, `features.ts`,
   `security.ts`, `useAdminAccess.ts`, `useProfileDocuments.ts`, `EventDetailPage.tsx`, `ProfilePage*`,
   `send-notification-emails/index.ts` vb. `git status` ile gör; **kendi dosyalarına yol belirterek commit et.**
4. **Canlıya hiçbir şey çıkmadı:** migration uygulanmadı, edge function deploy edilmedi, frontend deploy yok.
5. Push 5 Ekim akşam yapıldı (`origin/main` = `f3c604ac`); commit'siz iş push'a girmedi.

---

## 1 · VERİLEN KARARLAR (5 Ekim akşam, Burak)

### Plan 1 — CV/İlan Premium kilidi + Rol Talepleri
| Madde | Karar |
|---|---|
| B1 Premium kim | **Kimse otomatik olmasın**; admin panelinden elle açar. Ödeme (Stripe) gelince aynı anahtar açılır. |
| B2 Başkasının CV'si | **Sahibi izin verirse**: profilde "CV'mi Premium üyeler görebilsin" anahtarı, **varsayılan KAPALI**; gizlilik metni güncellenir. |
| B3a Kilit kutusu görseli | Mevcut `ProLockedInboxCard` örnek alınır (REV-102 görseli repoda yok). |
| B3b İlan girişi | **Önce SQL ile birkaç örnek ilan**; admin ilan formu sonra. |
| B3c Sekme adı | "Rol Talepleri" **yalnız eski düzende** (premium düzene sekme eklenmez). |
| B4 Rol saklama | **`roles.key` AYNEN kalır; üstüne yeni katman** (`role_structure`: Excel kodu ↔ eski rol). Yeni kod başvuruda ayrıca kaydedilir, onayda mevcut `admin_set_user_role` çalışır. |
| B5 Uzmanlık deposu | **Mevcut `catalog_item_tags`** (⚠️ yalnız tahmin; canlıda ölçüp doğrula, uygun değilse dur ve sor). |
| B7a Sarı 19 satır | **Hepsi onaylı → yayına girer.** (⚠️ A5'teki "`oneri` süzülür" kuralı bu karara göre GEÇERSİZ: 19 satır listede görünecek.) |
| B7b Alt rol sayısı | **51** (Bireysel hariç). Testler/belgeler 51'e göre; 52 notu "Bireysel dahil" diye açıklanır. |
| B8a Şehir Elçisi | **Dokunma**, rol adı aynı kalır (9 kişi `User_CityAmbassador`). |
| B8b Experimental_1/2/3 | **Yalnız gizli kalsın, SİLME.** |
| B8c Landing/dizin tek kaynak | **Şimdi yapma**; yeni rol yapısı çalıştıktan sonra ayrı plan. |

### Plan 2 — 8 ürün isteği
| Madde | Karar |
|---|---|
| B9a Spam önlemi | **Ek önlem yok**; aktif etkinlik sınırı 2 aynen kalır. |
| B9b Eski `pending` etkinlikler | **Hepsini yayınla, onay maili ATMASIN** (önce sayısını ölç; çok çıkarsa sor). |
| B9c Kapsam | **Tüm üyelere**, ilk etkinlik dahil, bireysel dahil. |
| B10 Ön karttaki etkinlik | **Önce yalnız dizin sonuç kartı** (herkese açık yeni yüzey: yalnız başlık/tarih/şehir, PII yok). |
| B11a Bot beyni | **Gemini kalsın** (Claude/hibrit şimdilik YOK). |
| B11b Panel içi eğitim | **Ajan taslak yazsın, Burak düzeltsin.** |
| B11c Ziyaretçi botu | **Yalnız üyeler konuşsun** → asistan balonunun metni ziyaretçi için değişir ("Giriş yap, sorularını yanıtlayayım"). |
| B12 Arama kapsamı | **Rehberler, Konsolosluklar, Cadde gönderileri, Sayfalar** (hepsi seçildi; koşullar §2.7'de). |
| B13a Hesap silme | **Yap**; canlıda gerçek silme **AYRI onayla**, yalnız test hesabı + yedekle. |
| B13b Silinenin içeriği | **Anonimleştir** (ad/e-posta/telefon/foto silinir; içerik "Silinmiş üye" ile kalır). |
| B13c Engel durumları | **Silmeyi engelle, önce devretsin** (tek sahibi olduğu grup, yönetici/moderatör, açık abonelik). |
| Push | Evet (yapıldı). |

### SORULMADI / hâlâ açık
- **Excel "Açık Noktalar" 3 madde** (Doktor/Diş Hekimi/İK/Güzellik taslağı, sektör etiketi, kod göçü) ve
  "yeni alt roller için yeni `roles` satırı gerekir mi" — B4 sonrası, Excel'e bakılarak sorulacak.
- **Stripe / gerçek Premium tanımı** (U11, S01–S04) — kapsam dışı, hâlâ bekliyor.

---

## 2 · UYGULANACAK İŞLER (kararlardan çıkan batch'ler)

Sıra: önce **doğrulama (V)**, sonra bağımsız küçükler, sonra bağımlılar. Her batch ayrı commit; push yok;
migration uygulama ve deploy §5'teki kapıdan geçer. Kural: kabul önce KIRMIZI sonra yeşil, geri alınan
işlem, mutasyon turu (CLAUDE.md "Her batch'te zorunlu doğrulama").

### V · "A1–A16 tamamlandı" iddiasını doğrula (ilk iş, kod yazma)
- `git status` ve `git diff --stat` ile **hangi dosyalar gerçekten değişmiş** çıkar; A1–A16 ile tek tek eşle
  (A1 sekme adı · A2 `/pricing` iki satır · A3 `PremiumLockCard` · A4 iki yetki+override · A5 rol veri modülü ·
  A6 dropdown süzgeci · A7 ilan kotası · A8 `/ilanlar` UI · A9 footer · A10 asistan balonu · A11
  `useAdminAccess` · A12 ruhsat/lisans belgesi · A13 etkinlik otomatik onay · A14 "şimdi paylaşın" · A15
  etkinlik maili · A16 arama).
- Her biri için: kapı komutları (`tsc`, `vitest`, `check:dead`, `verify:text`, `ingest:tools:check`) +
  **mutasyon** + bağımsız inceleme. Kanıtı olmayan batch "yazıldı" kalır.
- 7 migration dosyasını **tek tek oku** (`20261005150000_cadde_post_reactors_list` hangi planın işi? plana yazılmamış),
  15 haneli iki damgayı düzelt (§0.2), birbirleriyle ve `applied/` ile çakışma kontrolü yap.
- `AssistantBubble` yeni diff'i B11c ile çelişiyor mu bak (§2.5).

### 2.1 · B2 — Başkasının CV'sini görme (sahibin rızasıyla)
- Depolama RLS'i GEVŞETİLMEZ. Yeni `member-cv-link` edge function: `career.cv.view` yetkisini **sunucuda** doğrular →
  hedefin CV'si var ve **paylaşıma açık** → service-role ile kısa ömürlü imzalı URL (`createSignedUrl`, `getPublicUrl` YOK).
- Sahibe anahtar: "CV'mi Premium üyeler görebilsin", **varsayılan KAPALI**; `ProfilePage.tsx:614` metni ("Sadece sen ve admin
  erişebilir") anahtara göre güncellenir (anahtar kapalıyken söz aynen geçerli).
- `role_features` satırı olmayan yetki sessizce herkese kapalıdır (T2) — `career.cv.view` için A4'teki `false` satırları doğrula.
- Kabul: Premium ✓ · Free ✗ · rıza kapalıyken Premium ✗ · anon ✗ · storage'dan doğrudan okuma hâlâ ✗.
- Deploy elle (`supabase functions deploy member-cv-link`) + `npm run check:functions` + canlıda `verify_jwt` ÖLÇ.

### 2.2 · B3b — Örnek ilanlar (SQL seed)
- `job_listings` boş (0 satır). 6–8 **açıkça "örnek" işaretli** ilan, kullanıcı-yok/test sahibiyle (gerçek şirket adı uydurma).
  Hangi `DEMO_ROUTES` / `[DEMO]` desenini izleyeceği CLAUDE.md "DEMO içerik deseni"nden; gerçek ilan gelince silinir.
- Kabul (A7 kotası ile): 5 farklı ilan açılır, 6. `career_listing_limit_reached`; tekrar açış hak harcamaz; override ile sınırsız.

### 2.3 · Rol Talepleri zinciri (sıra bağlayıcı: R1 → R2 → R3 → R4)
- **R1 · `role_structure` katmanı (B4):** tablo: ana/alt/uzmanlık, `yeni_kod`, bağlı `roles.key`, `durum`. `roles.key` ve
  prefix SQL'lerine (`is_admin`, dizin dışlamaları, `Organization%`) **DOKUNULMAZ**. Başvuruda `approval_requests.payload`'a
  `new_code`/`specialties`; onayda mevcut `admin_set_user_role`. Migration yazmadan önce `docs/plans/2026-10-05-rol-talepleri-olcum.md`'yi oku.
- **R2 · Excel → mevcut `roles.key` eşleme tablosu:** yeni alt rol (Doktor/Diş Hekimi ayrımı, Venture Hub vb.) için yeni
  `roles` satırı gerekir mi? → **soru (Excel Açık Noktalar)**; cevap gelmeden yeni `roles` satırı açma. **19 sarı satır dahil** (B7a).
  Sayı sözleşmeleri: 7 ana rol, 259 satır, başvurulabilir alt rol **51** (Bireysel hariç).
- **R3 · Uzmanlık deposu (B5):** önce canlıda `catalog_item_tags` şemasını ÖLÇ (kolonlar, RLS); kullanıcı-bazlı uzmanlığa uyuyorsa
  kullan, uymuyorsa **dur ve sor** (karar "mevcut tablo"ydı; tahmin doğrulanmadı). RPC `submit_role_change_request` `payload`'ı genişler.
- **R4 · 3 adımlı seçici UI (B6):** ana rol kartları → aranabilir alt rol (`RoleSearchSelect`) → uzmanlık chip'leri. Dropdown'da
  tabloda olmayan/tekrar eden/experimental **görünmez**; başvuru yeni kodla `approval_requests`'e düşer ve `AdminApprovalsPage`'de görünür.
- **R5 · Süzgeç (A6) düzeltmesi:** Experimental_1/2/3 yalnız gizli (SİLME); Şehir Elçisi adı değişmez; Diaspora Üyesi/Destekçi/İş Arayan/
  İçerik Moderatörü/Platform Yöneticisi gizli. `oneri` süzgeci VARSA kaldır (B7a).

### 2.4 · B9 — Etkinlik otomatik onay (A13'ü bu kararlara hizala)
- Tüm üyeler (bireysel dahil) → `published`, `approval_source='auto'`; `events.first_approval_required=false`; aktif limit **2** aynen,
  `event_date >= current_date` aynen; T1 (doğrudan `published` INSERT reddi) korunur.
- Eski `pending` etkinlikler: **önce say** (canlı salt-okunur), sonra tek geri alınabilir işlemde yayınla (`event_status.via_rpc` bayrağı),
  **mail üretme** (`corteqs.skip_*` bayrağı). Çok çıkarsa sor.
- Etkinlik e-postası (A15, beş parçalı hat): outbox CHECK + `notification_settings` + abonelik/eşleme + edge `SETTING_KEY_BY_EVENT` + `buildEmail` —
  biri eksikse mail hiç gitmez. **Toplu yayınlamada mail yok.** Edge deploy ayrı adım.

### 2.5 · B11 — Bot ve balon
- **Gemini kalır** (`providers.ts` DOKUNMA). Anthropic/hibrit yok.
- **Balon (A10) revize:** ziyaretçi (giriş yok) için metin "Giriş yap, sorularını yanıtlayayım" (bot ziyaretçiyle konuşmuyor, `GUEST_MESSAGE` dönüyor);
  üye için "Platform hakkında soracakların olursa buradayım! 👋". Panel kendiliğinden AÇILMAZ (başkasının eski diff'i açıyordu — geri al). `sessionStorage`
  patlarsa sessiz.
- **Panel içi eğitim içeriği:** ajan `docs/guides/` altına üye odaklı rehber taslakları yazar ("belgeyi nereye yüklerim", "reklamı nasıl veririm",
  "etkinliği nasıl paylaşırım"); Burak düzeltir; sonra `node scripts/ai-knowledge/ingest.mjs --source=docs-member` + `ai:embed`
  (npm `--` bayrak tuzağı!). Telif sorunu yok (ajan yazıyor); payal içeriği KULLANILMAZ.

### 2.6 · B10 — Dizin kartında "Etkinliği Var — Tarih — Başlık"
- Yalnız `DirectoryResultCard`. Anon'a açık yeni view/RPC (`public_member_next_event`): **yalnız** başlık, tarih, şehir (+kapak);
  `user_id`/e-posta/iletişim **DÖNMEZ** (P03 dersi). Eşleme `events.user_id ↔ catalog_item_managers.user_id`. `events.city` serbest metin —
  eşleşme gerektiriyorsa `catalog_search_normalize()`. Kabul: anon HTTP ile yalnız yayınlanmış+gelecek etkinlik; pending/geçmiş yok; mutasyon ≥5.

### 2.7 · B12 — Arama kapsamı (dört tür, **koşullu**)
- **Etkinlik:** A16'da var (doğrula).
- **Rehberler, Sayfalar:** yayınlanmış ve herkese açık içerik varsa eklenir.
- **Konsolosluklar:** ⚠️ **241 kaydın HEPSİ `pending_review`, yayında değil.** "Yayında değilse eklenmez" kuralı gereği **şimdi eklenemez**;
  önce "konsolosluk kayıtları doğrulanıp yayınlansın mı" kararı (KALANLAR dizin planında açık). Kod hazır olsun, veri yayınlanınca açılsın.
- **Cadde gönderileri:** kişisel içerik → yalnız `visibility`'si herkese açık, silinmemiş, banlı olmayan gönderi; PII'siz kolon; gizlilik kuralını
  yazmadan ekleme. Belirsizse dur ve sor.
- Her tür için: sonuç boş dönmesin diye hata görünür (`DirectoryPage.tsx` sessiz catch); 1 karakter kuralı korunur; `ingest:tools:check`.

### 2.8 · B13 — Profili kalıcı sil ("Tehlikeli Bölge")
Sıra: D1 → D2 → D3 → D4. **Canlıda gerçek silme AYRI onay, yalnız test hesabı + yedek.**
- **D1 · Engel kontrolü RPC:** tek sahibi olduğu grup, yönetici/moderatör rolü, açık abonelik varsa **silmeyi engelle**, "önce devret" mesajı.
- **D2 · Anonimleştirme:** kişisel veri (ad, e-posta, telefon, foto, `user_profile_attributes`, depolama `${uid}/…` tüm kovalar) silinir;
  Cadde/grup içeriği "Silinmiş üye" ile kalır. Engelleyen yabancı anahtarlar (ölçüldü): `ON DELETE RESTRICT` — `vip_invitations.created_by`,
  `platform_safety_core`, `contributor_resource_submissions.submitted_by`, `group_strikes.decided_by`; NO ACTION — `cadde_cafe_members.approved_by`,
  `cadde_moderation_queue.resolved_by`, `cadde_promotion_campaigns.approved_by`, `cadde_promotion_events.viewer_user_id`, `cadde_user_bans.created_by`,
  `survey_responses.respondent_user_id`, `surveys.approved_by/created_by` (+ ~9 sayılmadı). Her biri için `SET NULL` ya da anonimleştirme **tek tek** seç.
- **D3 · Edge function `delete-account`:** JWT doğrula, service role, `auth.admin.deleteUser`; silme günlüğü `account_deletion_log` (hash'li kimlik, zaman; kişisel veri YOK).
- **D4 · UI:** "Tehlikeli Bölge" kartı, yazılı onay ("SİL") + yeniden doğrulama; engel varsa neden gösterilir. Üyelik şartları/KVKK-GDPR metni sözle uyumlu kalır.
- Kabul: işlem-içi SQL testi (engel var → reddedilir; engel yok → kişisel veri gider, yetim satır yok) + bileşen testi. Gerçek `deleteUser` canlıda **ayrı onayla**.

### 2.9 · Diğer ajan işleri (karar gerektirmeyen)
- **G17 migration'ını uygulama** (`20261005500000`) + `supabase/qa/g17-health-score-reports-acceptance.sql` + `phone-otp-claim-acceptance.sql` + G14 deadlock iki oturumlu deneme
  (hazır dosyalar: `docs/operations/2026-10-05-hazir-sql-calisma-kilavuzu.md`) — **canlı DB izni gerekir.**
- G17 QA SQL'ine "kuyruk penceresi şikayet kalemini değiştirmez" senaryosu ekle (şu an yok).
- P06 Türkçe collate canlı ölçümü · A09a/A11/Radar yeniden ölçümü · U01 §4 SQL'i — canlı DB izni.
- `types.ts` yeniden üretim borcu (yeni RPC'ler tiplerde yok; kodda `as never`).
- `whatsapp-autoreply` repoda var, canlıda yok (bot kapalı, zararsız); deploy kararı W06 ile.

---

## 3 · SİZDEN BEKLENENLER (karar / panel / hesap)

| Konu | Ne gerekiyor |
|---|---|
| **U01** service role anahtarı | 🔴 EN ACİL: public depo geçmişinde geçerli `service_role` JWT (7 Haziran'dan beri). İptal/yenileme sizde. |
| Frontend deploy | Push'tan sonra canlıya çıkmadı; G14/OTP kartı/A-batch ekranları deploy'a kadar görünmez. |
| **G14 tasarım kararları (5)** | Kendi grubuna şikayet yasak mı · tek onay = tek ihlal mi · onaydan sonra grup gizli mi kalsın · mail gitsin mi · sebep→kırmızı çizgi eşlemesi. |
| **G16 politikası** | `group_reports` yalnız gruba karşı şikayet tutuyor; "şikayet almamış üye" ne demek? (Qwen: politika belirsiz.) |
| G10c | Eski kolonların düşürülmesi için onay (`docs/plans/2026-10-05-g10c-onay-talebi.md`). |
| K01 · K04 · K05 · K07 | Kod işi olmayan kararlar. |
| Haftalık şehir özeti | Gerçek üyelere açılsın mı (şu an kapalı). |
| Veri | AI Legion kategorisi (`meslek-kariyer`/`hobi-kultur`) · TED InnoVenture konumu · **241 konsolosluk kaydı yayınlansın mı** (B12'yi açar). |
| Excel Açık Noktalar | Doktor/Diş/İK/Güzellik taslağı · sektör etiketi · kod göçü (R2'yi açar). |
| Stripe U11 | S01 hesap · S02 🔴 vergi rejimi (profesyonel teyit) · S03 99 € tek seferlik mi yıllık mı · S04 para birimi/ülke. |
| U03 | İki gerçek mail testi (e-posta doğrulama, revizyon tamamlanma). |
| U09 / W02 / W07 / W08 | WhatsApp **botu**: Meta webhook bağlantısı + gerçek telefonla kanıt turu. |
| U08 | G03 sonrası dönüşüm gözden geçirme (takvimde, 2 hafta sonra). |

---

## 4 · PARKTA — SMS/WhatsApp ile telefon OTP

Durum: kod yazıldı, commit'li, push'lu (`b45f2747`); **canlıda yok.** Ayrıntı: `docs/plans/2026-10-05-whatsapp-otp-plani.md`.
- **Karar (5 Ekim):** önce **Meta Business Verification** yapılacak ("tüm haklarıyla", yalnız WhatsApp için değil); Twilio hesabı açıldı, yedek yol
  (A: Twilio SMS Supabase'in hazır sağlayıcısıyla — hook açılmaz, kod devre dışı kalır; B: Twilio Verify WhatsApp; C: Twilio WhatsApp Sender, Meta doğrulaması yine gerekir, önerilmez).
- Business Verification → şablon `corteqs_otp` (API ile de açılır: `POST /{WABA}/message_templates`) → migration `20261005400000` uygula → secret'lar → deploy
  (`--no-verify-jwt`) → Dashboard Send SMS hook + `SEND_SMS_HOOK_SECRET` → SMS OTP Expiry 300 sn → uçtan uca.
- Canlıda ölçülmedi: GoTrue hook hata biçimi · `verifyOtp` için `new_phone` · `+`'sız telefon · hook zaman aşımı.
- Bot ile OTP aynı numara → kullanıcı OTP'ye cevap yazarsa bot otomatik yanıtlayabilir (tasarım sorusu).

---

## 5 · UYGULAMA / DEPLOY KAPISI (kullanıcı veya izinli oturum)

**Migration uygulama sırası** (hepsi önce `supabase/qa` kabulüyle, geri alınan işlemde; `psql -f` ledger satırı YAZMAZ, elle ekle; sonra `npm run check:migrations`):
1. `20261005400000_phone_otp_send_claim.sql` (OTP kota; Meta/şablon hazır olunca)
2. `20261005500000_g17_health_score_reports.sql` (G17 şikayet kalemi)
3. `20261005600000_career_premium_features.sql` (A4 iki yetki)
4. `20261005700000_job_listing_quota.sql` (A7 ilan kotası)
5. `20261005800000_profile_license_upload.sql` (A12 ruhsat/lisans)
6. `20261005900000_events_auto_approval.sql` (A13 otomatik onay)
7. `…_event_published_notification.sql` ve `…_public_content_search_events.sql` (**önce 14 haneli yeniden adlandır**)
8. `20261005150000_cadde_post_reactors_list.sql` (plana yazılmamış; sahibini bul, oku)
⚠️ Her birini uygulamadan önce **canlı şemada ölç** (CLAUDE.md: tablo var diye ledger satırı var sanma). Canlı DB 1 GB RAM: satır başına fonksiyon çağıran keşif sorgusu YASAK.

**Edge function deploy** (Coolify deploy ETMEZ; `npx supabase functions deploy <ad>` sonra `npm run check:functions`):
`send-phone-otp-hook` (`--no-verify-jwt`) · `send-notification-emails` (A15 sonrası) · `member-cv-link` (B2) · `delete-account` (B13) · `whatsapp-autoreply` (W06, karar).

**Secret'lar** (kullanıcı girer): `WHATSAPP_OTP_ACCESS_TOKEN` · `WHATSAPP_PHONE_NUMBER_ID` · `WHATSAPP_OTP_TEMPLATE` · `WHATSAPP_OTP_TEMPLATE_LANG` · `SEND_SMS_HOOK_SECRET` (hook oluşturulunca).

**Frontend deploy** sonrası kontrol: `curl -I https://corteqs.net/` güvenlik başlıkları, tarayıcı konsolunda CSP ihlali yok, `BASE_URL=https://corteqs.net npm run verify:release`.

---

## 6 · Bilinen tuzaklar ve doğrulanmayanlar (dürüst liste)

- A1–A16 işleri **incelenmedi** (bağımsız inceleme yok, commit yok); bu dosyadaki §2'deki tüm "A" gönderme­leri o inceleme sonrasına kalır.
- Gerçek tarayıcı QA, gerçek e-posta teslimi, gerçek Meta/Twilio gönderimi, gerçek silme: **kanıtlanamaz** (izin/hesap yok).
- Vitest, başka bir node süreci çalışırken worker başlatamayabilir (`Timeout waiting for worker`) → `--maxWorkers=2`; cwd'yi **büyük harfli `C:`** ver.
- `npm run lint` tüm repoda ~35 hata verir (hepsi `corteqs-ekstre-motoru/` + `whatsapp-autoreply`, bizim değil); kendi dosyanı tek tek lint'le.
- `npm run build` `public/sitemap.xml` `lastmod`'larını değiştirir → commit'e katma, `git checkout -- public/sitemap.xml`.
- `Measure-Object -Line` boş satırları saymaz → satır sayısı için `(Get-Content f).Count`.
- Push sırasında `ajan-turu-2026-10-05` etiketi de `origin`'e gitti: anotasyonlu etiket (git kimliğiniz, `f3c604ac`'e işaret ediyor, mesajı "Push edilmemiş yerel durum" diyor — artık bayat),
  yerel `push.followTags=true` ayarı yüzünden otomatik gitti. Zararsız; istenmezse `git push origin :refs/tags/ajan-turu-2026-10-05`.
- Kaynak planlar (izlenmeyen, başkasının): `docs/plans/2026-10-05-birlesik-plan-cv-ilan-rol-talepleri.md`, `…plan-8-urun-istegi.md`, `…rol-talepleri-olcum.md`, `…olcum-raporu.md`, `…demo-sizintisi-rapor.md`.
