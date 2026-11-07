---
durum: aktif
son_dogrulama: 2026-11-08
---
# 1 Ocak 2027 lansmanı — tutarsızlık raporu (8 Kasım 2026)

Bu rapor, 1 Ocak planının (`C:\Users\baris-terzioglu\.claude\plans\2026-11-08-ocak-lansman-yeni-oturum-plani.md`)
§3'teki **45 bulgunun** (A7 · B8 · C5 · D3 · E5 · F10 · G7) kanıt ekidir. Depo tarafındaki her iddia
8 Kasım'da `b5a279e5` ağacında yeniden ölçüldü. **3 bulgu kapalı** (B7, G3, G6), **1 bulgu kısmen kapalı** (B8).
Ölçüm sırasında **12 yeni tutarsızlık** çıktı (bölüm H). En kritik üçü:
**(1)** fiyat modeli dört ayrı yerde dört farklı (A1 + H1 + H8);
**(2)** `role_structure` verisi L6'nın onay akışını taşıyamaz: 19 satır `oneri` diye yüklendi ve `eski_roles_key` gerçek bir `roles.key` değil (A3 + H2);
**(3)** Lovable'ın "taşınmayacak" sabit referans kodu `GGVBLA-M7SDSR` **zaten** üretim kodunda (H3).

> Satır numaraları Prettier commit'i `113dd58a` sonrası ağaçtan alındı. Plan dosyasındaki satır
> numaraları kullanılmadı. Çalışma ağacında başka bir oturum `docs/kalanlar/KALANLAR.md` ve
> `src/lib/admin-shell/admin-updates/2026-11.ts` dosyalarını değiştiriyor. Bu rapor o iki dosyaya atıf yapmaz.

---

## Ölçümler

### Depo (8 Kasım, bu rapor, `git ls-files` ile)

| Ölçüm | Değer | Kanıt |
|---|---|---|
| HEAD | `b5a279e5` | `git log -1` |
| Migration | `applied/` **280** · `archive/` **252** · üst dizinde `.sql` **0** · `_removed/` 1 | `git ls-files 'supabase/migrations/applied/*.sql'` |
| Son migration dosyası | `20261010131000_seed_command_center_meeting_t21_ek2.sql` | canlıdaki son kayıtla aynı (plan §1.2) |
| Edge function (repo) | **19** | `git ls-files 'supabase/functions/*/index.ts'` |
| Playwright | **11** `.spec.ts` | `git ls-files 'e2e/*.spec.ts'` |
| `src/App.tsx` | **408** satır · **74** `lazyWithReload(() =>` | `wc -l` · `grep -c` |
| `CLAUDE.md` | **1.068** satır | `wc -l` |
| `src/lib/role-structure.ts` | 259 kayıt = 240 `onaylandi` + 19 `oneri` · 7 ana rol | node sayımı |
| `KNOWN_DEAD_FILES` | 5 dosya (`plans.ts`, `role-structure.ts`, `CaddeReactionActorsPopover.tsx`, `RoleSelector.tsx`, `useRoleStructure.ts`) | `scripts/check-dead-code.mjs:60-66` |

### Canlı (canlı ölçüm 7–8 Kasım, Management API, salt okunur)

Bu rapor canlı veritabanını sorgulamadı. Rakamlar plan §1.2 ve §1.3'ten kopyalandı. Sorgular **Ek: SQL** bölümünde.

| Ölçüm | Değer |
|---|---|
| Üye | 180: 152 `User_DiasporaMember` · 9 `User_CityAmbassador` · 9 `Consultant_PracticalLife` · 3 kuruluş · 3 süper admin · 3 deneysel · 1 marka/patent |
| REV | 43 açık · 27 inceleniyor · 34 yapıldı · 6 iptal |
| Telefon | 0 doğrulanmış · `hook_send_sms_enabled=false` · telefon sağlayıcı kapalı · `user_verifications` 0 satır |
| Auth | Google açık · LinkedIn kapalı |
| İş ilanı | 6 satır, hepsi `seed_demo_job_listings` (mig `20261005130000`) |
| Etkinlik | toplam 1 (`pending`) · `events.first_approval_required=false` · aktif limit 2 |
| Çarşı | 0 ilan · `cadde.carsi.visible=false` · `active_item_limit=5` · 7 kategori |
| Cafe | 2 cafe, 0 açık · `default_duration_hours=24` · `max_duration_hours=168` |
| `role_structure` | 259 satır = 240 `onaylandi` + 19 `oneri` |
| Katalog | 507 yayında · 77 yer tutucu (`is_placeholder`) · 223 inceleme bekliyor |
| `group_settings` | `groups.otp_rate_limits` var |
| `cadde_settings` | `cadde.phone_verification_required=false` (⚠️ bu anahtar `group_settings`'te değil, bkz. H10) |
| Migration kaydı | 7 Kasım'dan beri yeni kayıt yok; son kayıt `20261010131000` |
| Edge function (canlı) | **16** (repoda 19). Canlıda olmayanlar: `member-cv-link`, `send-phone-otp-hook`, `whatsapp-autoreply`. Son deploy 6 Ekim |
| Frontend | Clean-code değişiklikleri ve ST00 canlıda değil (Coolify deploy bekliyor) |

---

## Bulgular

Sütunlar: **ID · iddia · kanıt · durum · batch (plan §7) · karar (plan §4)**.

### A · Ekim kararları ↔ 4 Kasım planı

| ID | İddia | Kanıt | Durum | Batch | Karar |
|---|---|---|---|---|---|
| A1 | Fiyat modeli üç yerde farklı (bu rapora göre dört; bkz. H8). | Stripe planı `docs/plans/2026-10-04-stripe-odeme-altyapisi-plani.md:24-32` (Pro 25/50/75 €, 6 fiyat). Önizleme artifact `1nt72cshzQFQb2cuvg3DMH` (Standart/Premium/Kurucu €99). Gelir Modeli Matrisi Drive `1gQXkBBQ9UKv_-Qjc9-M-RWfH5fszNgoUIU44B3gElJ4`. `src/pages/Pricing.tsx:39-40, 90-91, 141-142` (25/20 · 50/40 · 75/60). | açık | L7, L14 | 1, 2 |
| A2 | 5 Ekim B4 "göç yok" diyor, plan "tüm üyeler taşınır" diyor. Plandaki `consultant.ambassador.* → ambassador.*` kısaltması yanlış. | `docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md:39`. Doğru eşleme `src/lib/role-structure.ts:37-38`: `consultant.ambassador.networking_etkinlik` → `ambassador.sehir_elcisi.networking_etkinlik`. Etki: 22 bireysel olmayan üye (canlı ölçüm). | açık | L6 | 6 |
| A3 | 19 öneri satırı 5 Ekim'de onaylandı. Canlıda hâlâ `oneri`. | Karar: `qwen-sirali/01-…:41`. Kök neden depoda: `applied/20261007130000_role_structure_seed.sql:84` ve sonrası 19 satırı `'oneri'` ile yükler. Oysa `applied/20261005170000_role_structure.sql:11` "durum='onaylandi'" diyor. `applied/20261007130000_role_structure_table.sql:93`: UI yalnız `onaylandi` gösterir. Sonuç: 19 satır listede görünmez. | açık | L6 | 6 |
| A4 | Alt rol sayısı 49 / 51 / 52. | **Çözüldü (sayma yöntemi farkı):** 49 = tekil alt rol **adı** (`role-structure.ts:21`). 3 ad iki ana rolde geçer: "Aile & Çocuk", "Eğitim", "Medya & İçerik" (Danışman + İşletme). (ana, alt) çifti = **52**. Bireysel hariç = **51**. 5 Ekim kararı (`qwen-sirali/01-…:42`) doğru. Ayrıca bkz. H6. | açık (yalnız belge) | L6 | 6 |
| A5 | G05 WhatsApp kodu commit'li ama canlıda kapalı. Plan sağlayıcıyı "açık soru" sayıyor. | Commit `b45f2747`: `supabase/functions/send-phone-otp-hook/index.ts`, `applied/20261005400000_phone_otp_send_claim.sql`. Canlı: fonksiyon yok, `hook_send_sms_enabled=false`, 0 doğrulanmış telefon. Meta işletme doğrulaması bekliyor. | açık | L9 | 4 |
| A6 | Ücretli Çarşı öne çıkarma: üç kaynak üç farklı karar. | CARSI_SPEC Drive `1gtV6PJu2dVV4ZlSv8mh7bHp86d6j2ejO` (2/4/10 €). `docs/plans/2026-10-04-lansman-hazirlik-plani-v2.md:253` (L5.7 "lansmanda kapalı"). 4 Kasım planı B4: "B5 ödemesiyle". | açık | L12, L15 | 8 |
| A7 | Lansman v2'deki Çarşı açılış şartlarını 4 Kasım planı anmıyor. | `lansman-hazirlik-plani-v2.md:238-242`. Üç koşul: hukuk metni, sunucu limiti, moderasyon. | açık | L12 | 8 |

### B · Plan ↔ canlı ve depo

| ID | İddia | Kanıt | Durum | Batch | Karar |
|---|---|---|---|---|---|
| B1 | `/founders-1000` adresi yok. | `git grep founders-1000 -- src nginx.conf.template server.mjs` → 0 sonuç. Var olanlar: `src/App.tsx:179` `/founding-1000` · `src/App.tsx:171` `/founders` · `src/lib/redirects.ts:37` `/campaign/founding-1000` 301. | açık | L2 | 11 |
| B2 | İş İlanları "Canlı" sayılmış. 6 ilanın hepsi demo seed. | `applied/20261005130000_seed_demo_job_listings.sql:1-6` ("[DEMO] öneki", 6 ilan). Depo bunu zaten demo işaretledi: `src/lib/demo-pages.ts:75` (commit `068c560f`, 7 Kasım). Bu işaret henüz **canlıda değil** (frontend deploy bekliyor). `/ilanlar` sitemap'te yok. | açık | L2 | 10 |
| B3 | Etkinlikler "Canlı" sayılmış. Canlıda toplam 1 kayıt. | Canlı ölçüm: 1 kayıt, `pending`. Otomatik yayına rağmen bekleyen kayıt kaldı. 5 Ekim B9b "eski pending hepsini yayınla" (`qwen-sirali/01-…:51`) uygulanmamış. | açık | L2 | 5 |
| B4 | 24 saatlik cafe zaten varsayılan. Kapasite (K9) açık. | `applied/20260913140000_cadde_cafe_async_first.sql:15-16` (24 / 168). Kapasite yalnız istemcide: `src/lib/cadde-schemas.ts:10` (`[50, 100, 250, 500, 999]`). SQL yalnız `p_capacity < 1` reddeder: `applied/20260925110000_cadde_cafe_opened_bildirim.sql:116-117`. Önizleme "Standart 3 saat / 100 kişi" diyor. Lansman v2 `:159` "Standart 3 saat, Premium 24 saat" diyor. | açık | L11 | 7 |
| B5 | Çarşı 5 ilan limiti SQL'de zaten var. Platform içi mesaj yok. | `applied/20260730160000_cadde_v1_006_carsi.sql:162` (`cadde.carsi.active_item_limit`, 5). Lansman v2 `:247` (L5.1) hâlâ "limitin yalnız istemcide olması" diyor; bu bayat. `carsi_message` src'de ve `applied/`'da 0 geçiş. | açık | L12 | 8 |
| B6 | Plan mevcut altyapıyı yok sayıyor. | Hepsi depoda var: `search_directory_catalog` (`applied/20260922130000_directory_semantic_search.sql:131`) · `supabase/functions/directory-search/index.ts` · `applied/20261005110000_public_content_search_events.sql` · `applied/20261005700000_job_listing_quota.sql` · `applied/20261005600000_career_premium_features.sql` · `src/components/common/PremiumLockCard.tsx` · `supabase/functions/site-assistant/index.ts` · `applied/20260921100000_ai_knowledge_base.sql` · `src/pages/admin/AdminBulkImportPage.tsx` · `src/lib/org-verification-api.ts` · `feature_interest` yalnız girişli: `applied/20261003040000_feature_interest.sql:94`. | açık | L5, L7, L15–L17, L19 | — |
| B7 | Migration üst dizini temizlendi. | `ls supabase/migrations/` → `_removed/`, `applied/`, `archive/`. Üst dizinde `.sql` yok. `_removed/20261005120000_cv_share_with_premium.sql` kaldı. | ✅ kapandı | — | — |
| B8 | CLAUDE.md'de edge function sayısı ve T1 etkinlik notu bayat. | **Anılan iki madde düzeltilmiş:** `CLAUDE.md:897` sayı yazmıyor ("sayı ezberlenmez"). `CLAUDE.md:605-610` T1'i "BAYATTIR" diye işaretliyor. **Başka bayat rakamlar açık:** `CLAUDE.md:67` ve `:324` "329 lines, 61 `lazy()`" (gerçek 408 / 74) · `:700` ve `:832` `applied/` "151" (gerçek 280) · `:826` "403 migrations" (gerçek 532). | ⚠️ kısmen | L0 | — |

### C · Plan ↔ sözleşmeler

| ID | İddia | Kanıt | Durum | Batch | Karar |
|---|---|---|---|---|---|
| C1 | "+90 alamaz" Pasaport kuralı sözleşmeyle çelişiyor. | `src/lib/phone-country-derivation.test.ts:2-5, 16-21` (`countryFromPhone`, `dialCode`, `callingCode`, `libphonenumber` yasak). Test yalnız `src/` tarar; SQL'e yazılan kural testten kaçar ama CLAUDE.md kuralını yine çiğner. Puanlama Matrisi K03 Pasaportu "admin onayı" diye tanımlıyor (Drive `1RdHuCQuoDEKBK9JmS4f2thzdPw9DHhlh`). | açık | L9 | 4 |
| C2 | 301'ler üç dosyayı birlikte değiştirir. Lovable ve corteqs.net 12+ adreste farklı. | `src/lib/redirects.ts:34-52` (16 statik) + `:62` (2 dinamik) · `nginx.conf.template` (19 `return 301`) · `server.mjs:47-65` (17 giriş). Lovable adres farkı: Lovable CORTEQS+ projesi `3ad60224-d8bf-4b3f-be5c-b081ae69ef73`, commit `7b52386`, 7 Kasım okuması. | açık | L2, L4, L10 | 13 |
| C3 | Lovable hero'su 2B canvas, 3.400 parçacık, sürekli `requestAnimationFrame`. LCP riski var. | Lovable CORTEQS+ `3ad60224-…`, commit `7b52386`, 7 Kasım okuması (`DiasporaFlowMap` + `diasporaFlowEngine`). Bizde LCP posteri `src/components/home-trial/HeroNetworkSection.tsx:35`. 229 KB gzip taban **hiçbir kapıda ölçülmüyor** (bkz. H5). | açık | L5 | — |
| C4 | vision hedef projesi belirsiz. Prototipte korumasız `/admin` ve `/internal-cq-dashboards-7f3a9b2e1d4c` var. | Talimat Drive `1cokXr_V0uI6NQMO_orT5dqKJf4dOH1uY` (`abroad-buddy-map.lovable.app`). `default_server` sırası: `nginx.conf.template:61-75` (yönlendirme bloğu `:69`, catch-all `:74-75`). | açık | L8 | 12 |
| C5 | Müzik embed `frame-src` ister. Lovable görsel kaynakları taşınmaz. | `nginx.conf.template:53`: CSP'de `frame-src` yok, yani `default-src 'self'` geçerli ve embed engellenir. ⚠️ `img-src` **zaten** `https://images.unsplash.com` içeriyor. | açık | L8, L11 | — |

### D · Drive dosyaları kendi arasında

| ID | İddia | Kanıt | Durum | Batch | Karar |
|---|---|---|---|---|---|
| D1 | EVIM_EVIN_SPEC başlığı REV-093 diyor; doğrusu REV-094. | Drive `1DyXbV-d3CiBHD5E2VOo_KggG9pW6vYDy` | açık | L13 | 9 |
| D2 | Evim-Evin şeması yalnız `main/summer` ve `apartment/detached` taşıyor (depo/garaj yok). | Drive `1-t3ZmmP6OMO0zArYBs_bqqx2CT9VIyW2` | açık | L13 | 9 |
| D3 | `carsi_items.sql` puan kuralları Puanlama Matrisi ile uyuşmuyor. | Drive `1z6zR_QUaV98OKqvc4CG6Qn5FJAijP4fe` ↔ `1RdHuCQuoDEKBK9JmS4f2thzdPw9DHhlh` | açık | L12 | 8 |

### E · 4 Kasım planının kendi içinde

Kaynak: Drive `1AO1gXwZVVapuBKEZsaVEg4JbGR63BKM7` ve Claude Docs `SE2gvwfaakAwokkC9vvSSo` (salt okunur).

| ID | İddia | Durum | Batch | Karar |
|---|---|---|---|---|
| E1 | Karar günü bir yerde 8, bir yerde 9 Kasım. | açık | L1 | — |
| E2 | Süre bir yerde 7, bir yerde 8 hafta. | açık | L1 | — |
| E3 | "Lovable son düzenleme 27 Ekim" yanlış. Doğrusu 4 Kasım 16:58 (commit `7b52386`). | açık | L1 | — |
| E4 | K12 sorusu ("ilk 12 ay" başlangıcı) 18 soru arasında yok. Kaynak: `lansman-hazirlik-plani-v2.md:311`. | açık | L1 | 2 |
| E5 | Üstü çizili €120 için AB fiyat gösterimi riski. | açık | L7 | 1 |

### F · Lovable'dan taşınmayacaklar

Kaynak: Lovable CORTEQS+ projesi `3ad60224-d8bf-4b3f-be5c-b081ae69ef73`, commit `7b52386`, 7 Kasım okuması. Bu rapor Lovable'ı yeniden okumadı.
Depo kontrolü: `git grep` ile `src/**` ve `supabase/functions/**` tarandı.

| ID | Lovable'da | Lovable yolu | corteqs.net deposunda | Batch |
|---|---|---|---|---|
| F1 | `create-ad-checkout`: tutar tarayıcıdan gelir, auth yok, webhook yok | `supabase/functions/create-ad-checkout/` | yok | L3, L14 |
| F2 | `diaspora-search`: tablo sorgulamaz, sonuç uydurur, Gemini anahtarı URL'de | `supabase/functions/diaspora-search/` | yok (canlıdan da kalktı) | L3 |
| F3 | `corbot-chat`: Lovable gateway | `supabase/functions/corbot-chat/` | `ai.gateway.lovable.dev` / `LOVABLE_API_KEY` 0 geçiş | L3 |
| F4 | `send-phone-otp`: demo, kod yanıtta döner | `supabase/functions/send-phone-otp/` | yok; bizde `send-phone-otp-hook` | L3, L9 |
| F5 | Yedek Supabase anahtarı `azrxqgzfryzpaqchhrkk` | `vite.config.ts` | 0 geçiş | L3 |
| F6 | Sabit referans kodu `GGVBLA-M7SDSR` | sayfa bileşenleri | 🔴 **VAR:** `src/components/Founding1000Section.tsx:174` (bkz. H3) | L2, L3 |
| F7 | 13 ünlü fotoğrafı | `src/assets/guests/` | yok | L3 |
| F8 | `/__l5e/` video yolu | hero bileşeni | 0 geçiş | L3 |
| F9 | `info@diasporaconnect.com` | footer/iletişim | 0 geçiş | L3 |
| F10 | `/admin`'de sabit istatistikler | `/admin` sayfası | — (bizim admin canlı veri okur) | L8 |

### G · Depo eşlemesinden

| ID | İddia | Kanıt | Durum | Batch | Karar |
|---|---|---|---|---|---|
| G1 | Otomatik yayın (6 Ekim) ↔ REV-103 "ilk etkinlik onaya düşer". | Karar: `applied/20261006100000_events_auto_publish_final.sql:3-5, 9-12, 15-16`. Kod hâlâ eski kuralı anlatıyor: `src/lib/events-api.ts:129` ve `:138-139` · `src/components/events/CreateEventFormSection.tsx:221-222, 247, 256`. 🔴 **Her zaman görünen kopya:** `CreateEventFormSection.tsx:317` "İlk etkinliğin admin onayından sonra listede görünecek." | açık | L2 | 5 |
| G2 | `plans.ts` bağlı değil. `Pricing.tsx` sabit fiyat kullanıyor. | `scripts/check-dead-code.mjs:45-47, 61` · `src/pages/Pricing.tsx:39-40, 90-91, 141-142`. `src/lib/plans.ts` içinde **hiç fiyat yok** (bkz. H1). | açık | L7 | 1 |
| G3 | `MockStripeCheckout` kalktı (ST00). | `git grep MockStripeCheckout -- src` → yalnız `src/components/ServiceRequestForm.test.tsx:62` (yasak iddiası). Bileşen dosyası `git ls-files`'ta yok. ⚠️ Yasak testi yalnız `ServiceRequestForm.tsx`'i tarar; L2.4'teki depo geneli test henüz yok. | ✅ kapandı | L2 | — |
| G4 | REV-097 ve REV-099 kodda var ama kayıtları açık. | REV-097: `src/lib/admin-shell/admin-menu-numbering.ts:136` (`adminMenuNumberById`), kullanım `src/components/admin/shell/AdminCommandPalette.tsx:19, 76`. REV-099: `src/components/AssistantBubble.tsx:22-24` (A10, commit `8ddfd0dd`). Canlı REV durumu: 097 açık, 099 inceleniyor. | açık | L1 | — |
| G5 | `RoleSelector.tsx` bağlı değil (RT01). | `RoleSelector`/`useRoleStructure` için üretim importu 0 · `scripts/check-dead-code.mjs:55-59, 64-65`. | açık | L6 | 6 |
| G6 | `role_structure` dosyası canlıyla aynı. | `applied/20261007130000_role_structure_table.sql:35` (`eski_roles_key text`, FK yok). Bu rapor canlı şemayı yeniden ölçmedi; plan §1.2'ye dayanır. ⚠️ Yeniden kurulum riski için bkz. H4. | ✅ kapandı | L6 | — |
| G7 | Lansman v2 1 Kasım'a göre yazıldı. Venture Hub ve /creator orada kapsam dışı. | `lansman-hazirlik-plani-v2.md:64` ("Lansman 1 Kasım 2026"), `:279-280`, `:309` (K10). | açık | L4, L17 | 14 |

### H · Bu raporda bulunan yeni tutarsızlıklar

| ID | İddia | Kanıt | Batch | Karar |
|---|---|---|---|---|
| H1 | `plans.ts` "tek kaynak" diyor ama içinde fiyat yok. Plan §2 "fiyatlar `plans.ts`'ten okunur" varsayımı için dosya sıfırdan doldurulmalı. | `src/lib/plans.ts:2-5` ("Pricing.tsx'teki sabitler buradan gelir") ↔ dosyada yalnız tipler ve `LOCK_FROM` (`:13-39`). Yorum `:43` "Şu an (Ekim 2026)". | L7 | 1 |
| H2 | `role_structure.eski_roles_key` gerçek bir `roles.key` değil. L6.3'teki "onay → `eski_roles_key` → `admin_set_user_role`" akışı bu veriyle çalışmaz. | Seed değerleri `consultant.ambassador.networking_etkinlik`, `consultant.doktor (chip)` (`applied/20261007130000_role_structure_seed.sql:7, 84-85`). `roles.key` biçimi `User_CityAmbassador` (`archive/20260605090000_seed_platform_roles.sql:15`). `role_structure_table.sql:18` "yeni_kod → roles.key eşlemesi" diyor; o da tutmuyor. | L6 | 6 |
| H3 | Lovable'ın sabit referans kodu zaten canlı sayfada. L3.3 sözleşme testi bugünkü ağaçta ilk koşuda kırmızı olur. | `src/components/Founding1000Section.tsx:172-176` ("kod otomatik tanımlanır"). Kod 19 Eylül'de geldi (`74ecb4c0`). Bu dosyada kodu kayda taşıyan bağlantı görünmüyor; DB'de var mı ölçülmedi. | L2, L3 | 11 |
| H4 | `role_structure` iki migration'da tanımlı. Sıfırdan kurulumda ilk tanım kazanır ve seed FK'ye takılır. Aynı zaman damgası iki dosyada. | `applied/20261005170000_role_structure.sql:16-23` (`references roles(key)`, varsayılan `'oneri'`) ↔ `applied/20261007130000_role_structure_table.sql:29-36` (FK yok). İkisi de `create table if not exists`. `20261007130000` → `_table` + `_seed` (CLAUDE.md "timestamp yeniden kullanma" kuralı). | L6, L20 | — |
| H5 | `check:bundle` 229 KB gzip tabanını ölçmüyor. L3.2'deki "eşik tabana ayarlı mı" teyidinin cevabı hayır. | `scripts/check-bundle-size.mjs:5` (`MAX_JS_BYTES = 500 * 1024`), `:34` parça başına ham `stat().size`. Toplam ilk JS veya gzip ölçümü yok. | L3, L5 | — |
| H6 | Rol üretici betiği ile üretilmiş dosya ayrışmış. | `scripts/generate-role-structure.mjs:84` "52 alt rol (Bireysel dahil)" ↔ `src/lib/role-structure.ts:21` "49 alt rol" ↔ `role_structure_table.sql:5` "49 alt rol". Dosya betik güncellendikten sonra yeniden üretilmemiş. | L6 | 6 |
| H7 | Stripe planında S04 açık görünüyor ama karar 10 onu cevapladı. | `stripe-odeme-altyapisi-plani.md:80` (S04 "yalnız EUR mu?", işaretsiz) ↔ `:32` ("Karar 10: yalnız EUR, AB + Türkiye"). | L14 | 1 |
| H8 | `/pricing`'de dördüncü bir fiyat iddiası var. | `src/pages/Pricing.tsx:302` "3 ay süreyle Premium Pro fiyatlarda %50 indirim". `:391, 397` `€` ön ekini elle yazıyor (`format-money.ts` değil). | L7 | 1 |
| H9 | Kurucu 1000 sayfası hâlâ "29 Ekim · Full Açılış" diyor. | `src/components/Founding1000Section.tsx:28`. Benzer: `src/pages/BloggerContestPage.tsx:42` "29 Ekim CorteQS Lansmanı". | L7 | 2 |
| H10 | `cadde.phone_verification_required` bir `cadde_settings` anahtarı. Telefon kapısı yalnız profili eksik üyeye uygulanıyor. | Anahtar: `archive/20260610180000_cadde300_001_user_verifications.sql:39-40`. Kapı: `applied/20260730110000_cadde_v1_001_post_media.sql:154-156` (`if not is_cadde_profile_complete …`). L9.3 "yeniden kullanılır" derken bu koşulu bilmeli. | L9 | 4 |
| H11 | `register_feature_interest` yalnız girişli kullanıcıya ve 3 anahtara açık. L7.3 "ön kayıt" CTA'sı anonim ziyaretçiye çalışmaz. | `applied/20261004110000_recommendation_match_notification.sql:75` (`event.featured`, `event.ticketing`, `pro.inbox`) · `applied/20261003040000_feature_interest.sql:93-94` (`anon` revoke). | L7, L17 | — |
| H12 | Ekim kararlarının bulunduğu dosya plan §2.2'de yanlış anılıyor. | B1–B8 tablosu `docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md:29-45`'te. `docs/plans/2026-10-06-tek-plan-kalan-isler.md:127-129` yalnız tek paragraflık "VERİLMİŞ KARARLAR" taşıyor. İkisi de `durum: yerini-aldı` → `docs/kalanlar/KALANLAR.md`. | L0 | — |

---

## Ekim kararları (alıntılar)

Kaynak dosyalar taşınabilir. Alıntılar 8 Kasım ağacından birebir alındı.

### 5 Ekim akşamı, Burak — `docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md` "§1 VERİLEN KARARLAR"

- `:34` — "B1 Premium kim | **Kimse otomatik olmasın**; admin panelinden elle açar. Ödeme (Stripe) gelince aynı anahtar açılır."
- `:39` — "B4 Rol saklama | **`roles.key` AYNEN kalır; üstüne yeni katman** (`role_structure`: Excel kodu ↔ eski rol). Yeni kod başvuruda ayrıca kaydedilir, onayda mevcut `admin_set_user_role` çalışır."
- `:41` — "B7a Sarı 19 satır | **Hepsi onaylı → yayına girer.** (⚠️ A5'teki "`oneri` süzülür" kuralı bu karara göre GEÇERSİZ: 19 satır listede görünecek.)"
- `:42` — "B7b Alt rol sayısı | **51** (Bireysel hariç). Testler/belgeler 51'e göre; 52 notu "Bireysel dahil" diye açıklanır."
- `:43` — "B8a Şehir Elçisi | **Dokunma**, rol adı aynı kalır (9 kişi `User_CityAmbassador`)."
- `:50-52` — "B9a … aktif etkinlik sınırı 2 aynen kalır." · "B9b … **Hepsini yayınla, onay maili ATMASIN**" · "B9c … **Tüm üyelere**, ilk etkinlik dahil, bireysel dahil."

### 6 Ekim — `docs/plans/2026-10-06-tek-plan-kalan-isler.md:129` ("§5 VERİLMİŞ KARARLAR")

> "Premium = elle açılır (Stripe gelince aynı anahtar) · … · `roles.key` aynen kalır + `role_structure` katmanı ·
> sarı 19 satır yayına girer · alt rol sayısı 51 · Şehir Elçisi adı değişmez · … · etkinlik: tüm üyelere otomatik,
> limit 2, eski `pending` hepsi yayınlanır **mail atmadan** (önce say)"

### Stripe — `docs/plans/2026-10-04-stripe-odeme-altyapisi-plani.md`

- `:24` — "**⚠️ DÜZELTME (05.10, karar 9):** Ürün modeli **"Kurucu 1000 = 99 € DEĞİL"**."
- `:26-28` — "**Danışman Pro:** 25 €/ay · 20 €/ay (yıllık)" · "**Kuruluş Pro:** 50 €/ay · 40 €/ay (yıllık)" · "**İşletme Pro:** 75 €/ay · 60 €/ay (yıllık)"
- `:30-32` — "**Hepsi yinelenen abonelik.** "Kurucu 1000 = 99 €" ayrı bir kampanya olarak SONRA ele alınır … Karar 10: **yalnız EUR, AB + Türkiye.**"
- `:77` — "S01 | Stripe hesabı açık mı, doğrulanmış mı? Canlı anahtarlar alınabilir durumda mı? | Hiçbir teknik faz bu olmadan doğrulanamaz"
- `:78` — "S02 | **Vergi rejimi netleşsin** — L.L.C. üzerinden AB'li müşteriye dijital hizmet satışı KDV/VAT doğurur. Stripe Tax açılacak mı, yoksa elle mi?"

### Etkinlik otomatik yayın — `supabase/migrations/applied/20261006100000_events_auto_publish_final.sql`

- `:1` — "-- Etkinlik: otomatik yayın (limit 2) — kesin hâl"
- `:3-5` — "Karar: 6 Ekim 2026 (Soru 7). Canlıda events.first_approval_required=true kalmıştı (B8 taslağı). Ayar false'a çekilir; create_event_v1 otomatik yayın sürümüne döner"
- `:10` — "values ('events.first_approval_required', 'false'::jsonb)"
- `:15-16` — "İlk-onay kuralı KALDIRILDI. Tüm etkinlikler published + approval_source='auto'. approval_requests yazımı KALDIRILDI."
- `:60` — "v_limit := public.event_setting_int('events.active_limit', 2);"

### Lansman hazırlık v2 — `docs/plans/2026-10-04-lansman-hazirlik-plani-v2.md`

- `:307` K8 — "Öneri: yetki ve sayaç şimdi kurulsun, kilit `LOCK_FROM=2027-01-01` ile açılsın."
- `:308` K9 — "**Cafe kapasitesi:** REV-004 ✅ ile canlıda 50–100–250–500–999 seçenekleri var. İnşa Notları ise Standart 100 / Premium 1000 diyor. Hangisi geçerli?"
- `:311` K12 — "**REV-093'teki "ilk 12 ay" başlangıcı:** kayıt tarihinden mi, 1 Ocak 2027'den mi? Barış'ın notunda öneri 1 Ocak 2027; karar verilmeden faturalama kurulmaz."
- `:253` L5.7 — "Ücretli öne çıkarma (2/4/10 €) lansmanda kapalı kalsın; öne çıkarma yalnızca ödül olarak (görev/puan karşılığı) verilsin."
- `:238` — "**Üç koşul birlikte sağlanırsa** lansmana girer, biri bile eksikse "Yakında" + ön kayıt ile açılır"

---

## Ölçülmeyenler / sınırlar

- **Canlı DB bu raporda sorgulanmadı.** Bütün canlı rakamlar 7–8 Kasım ölçümüdür (plan §1.2–§1.3). L0 tekrar ölçümü ayrı yapılmalı.
- **Canlı frontend'in build commit'i ölçülmedi.** "ST00 ve clean-code canlıda değil" bilgisi plan §1.2'den gelir. Canlı chunk adı `index.html → main-*.js` zincirinden okunmalı.
- **Lovable yeniden okunmadı.** F ve C3 satırları 7 Kasım okumasına dayanır. Lovable'daki `src/assets/guests/` görsellerinin hangi sayfada kullanıldığı doğrulanmadı.
- **Drive dosyaları bu raporda açılmadı.** D satırları ve A1/A6 kaynakları plan §2.1'deki Drive ID'lerine dayanır.
- **"CorteQS İnşa Notları" Drive'da yok.** Büyük olasılıkla bir Claude proje dosyası. Lansman v2'nin K9 ve L2.7 dayanakları bu yüzden doğrulanamadı.
- **`GGVBLA-M7SDSR` canlı DB'de geçerli bir referans kodu mu, ölçülmedi** (H3).
- **G6 ve H4:** `20261005170000_role_structure.sql` canlı `schema_migrations`'ta kayıtlı mı ölçülmedi. Canlı tabloda FK olmadığı plan §1.2'ye dayanır.
- **Doğrudan `published` INSERT'in RLS'te reddedildiği ölçülmedi** (CLAUDE.md:609-610, KALANLAR CO01).
- Kökteki iki `.docx` ve bir `.pdf` (izlenmeyen) okunmadı.

---

## Ek: SQL

Plan §1.3'teki rakamları üreten sorgular, basit SELECT olarak yeniden kuruldu. Yol: `POST https://api.supabase.com/v1/projects/injprdrsklkxgnaiixzh/database/query`.
Yalnız SELECT çalıştırılır. Türkçe karakter içeren sorgu UTF-8 dosyadan gönderilir.

```sql
-- REV durumları
select status, count(*) from public.revision_requests
where deleted_at is null group by status order by 2 desc;

-- REV-085…111 listesi (plan §9)
select revision_number, status, title from public.revision_requests
where deleted_at is null and revision_number between 85 and 111 order by revision_number;

-- 1 Ekim sonrası migration kayıtları
select version, name from supabase_migrations.schema_migrations
where version > '20261001000000' order by version desc;

-- Telefon doğrulama
select count(*) as user_verifications from public.user_verifications;
select count(*) filter (where phone_confirmed_at is not null) as phone_confirmed from auth.users;

-- İş ilanları (demo öneki)
select count(*) as toplam,
       count(*) filter (where title ~ '^\[(DEMO|ÖRNEK)\]') as demo
from public.job_listings;

-- Etkinlikler ve ayarları
select status, approval_source, count(*) from public.events group by 1, 2;
select key, value from public.event_settings where key like 'events.%' order by key;

-- Rol yapısı
select durum, count(*) from public.role_structure group by durum;

-- Çarşı
select count(*) as ilan from public.carsi_items;
select count(*) as kategori from public.carsi_categories;

-- Cafe
select status, count(*) from public.cadde_cafes group by status;

-- Cadde ayarları (cafe, Çarşı, telefon)
select key, value from public.cadde_settings
where key like '%cafe%' or key like '%carsi%' or key = 'cadde.phone_verification_required'
order by key;

-- Grup ayarları (OTP)
select key, value from public.group_settings where key like '%otp%';

-- Katalog
select status, visibility, is_placeholder, count(*) from public.catalog_items
group by 1, 2, 3 order by 4 desc;

-- Üye rolleri
select r.key, count(*) from public.user_role_assignments ura
join public.roles r on r.id = ura.role_id
group by r.key order by 2 desc;
```

SQL dışı ölçümler (Management API, yalnız gereken alanlar yazdırılır):

- `GET /v1/projects/injprdrsklkxgnaiixzh/config/auth` → `hook_send_sms_enabled`, `external_phone_enabled`, `external_google_enabled`, `external_linkedin_oidc_enabled`.
- `GET /v1/projects/injprdrsklkxgnaiixzh/functions` → canlı edge function listesi (16).
