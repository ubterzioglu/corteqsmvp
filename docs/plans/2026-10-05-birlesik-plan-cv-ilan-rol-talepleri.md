# Birleşik Plan — (1) CV/İlan Premium kilidi + (2) Rol Talepleri yeniden yapılanma

Sıralama kuralı: **Bölüm A** = kullanıcı kararı/onayı GEREKTİRMEYEN batch'ler, küçükten büyüğe.
**Bölüm B** = karar/onay gerektirenler, en sona. Her batch ayrı commit; push yok.

## Context (ölçülmüş gerçekler)

**İş 1 — CV görüntüleme + iş ilanı detayı Premium'a bağlansın**
- İki yüzey de yok: şirket ilanı sayfası yok (`job_listings` 0 satır, kodda okuyan yok); başkasının CV'sini
  görme yok (profil CV'sini yalnız sahibi+admin açar, `ProfilePage.tsx:614` bu sözü veriyor). `/kariyer`
  CorteQS'in kendi ilanları, konu dışı.
- Premium kavramı yok, Stripe yok (kullanıcı kararı: Stripe bekler). Tek kapı: `get_current_user_features()`
  (override > rol kuralı > false). `role_features` satırı olmayan yetki herkese sessizce kapalıdır (T2).
- `/pricing` tablo değil: Freemium/Pro kartları, satırlar `Pricing.tsx` içinde 3 kullanıcı tipi × freemium/premium
  ayrı diziler. REV-102'nin kilitli kutusu repoda yok; en yakını `ProLockedInboxCard` (ilgi kaydı, ödeme değil).
- Kararlar (verildi): önce basit ilan yüzeyi · "CV" = üyelerin profil CV'si · Premium tanımı Stripe'ı bekler.

**İş 2 — Rol Talepleri (Excel: `CorteQS_Rol_Tablosu_v2.xlsx`, repo kökünde)**
- Excel: 5 sayfa; "Yeni Rol Yapısı" 259 satır, 7 ana rol (Bireysel + 6 başvurulabilir), alt rol toplamı 52
  **yalnız Bireysel'in 1'i dahilse** (6 başvurulabilir ana rolde 51), kod biçimi `ana.alt.uzmanlik`, 19 sarı
  (ÖNERİ) satır = `Durum` sütunu "ÖNERİ – onay bekliyor".
- Kod gerçeği: **noktalı rol kodu hiçbir yerde yok.** `roles.key` = `Prefix_PascalCase`; `is_admin` `ilike
  'Admin_%'`, rehber dışlamaları ve `Business_/Consultant_/Organization%` SQL dalları prefix'e bakar.
  `user_role_assignments` PK = `user_id` (kullanıcı başına TEK rol). `consultant.ambassador.*` kayıtları DB'de yok
  (istekteki "göç" öncülü boş; gerçekte 9 `User_CityAmbassador`).
- Dropdown DB'den: `get_flat_roles` RPC (düz liste) → `ProfileAccessCard.tsx:89-100` `Select`; gönderim
  `submit_role_change_request(target_role_key, note)` → `approval_requests(role_change)`; onay
  `admin_review_approval_request` → `admin_set_user_role`.
- `/profile/bireysel` premium düzende **sol menü yok**; "Erişim & Talepler" yalnız eski yan menüde
  (`profile-sidebar-menu.tsx:135-140`); premium düzende kart "Profil Ayarları" altına gömülü.
  Kayıt ekranında rol kartı bileşeni yok (istekteki "kayıt ekranındaki kartlar" bulunamadı).

## Ortak doğrulama (her batch sonu)
`npx tsc -p tsconfig.app.json --noEmit` · `npm run test` (tam takım) · `npm run verify:text` (eksik Türkçe harfi
yakalamaz, gözle bak) · `npm run check:migrations` (ledger ELLE) · `npm run ingest:tools:check` (`src/lib` eklendiyse)
· `npm run check:dead` (yeni erişilemez dosya üretme; mevcut 2 dosya bu işin değil). Migration: damga `ls ... applied`
ile çakışmasız; önce kabul KIRMIZI, sonra yeşil; geri alınan işlem; mutasyon turu.

---

# BÖLÜM A — Onay gerektirmeyenler (küçükten büyüğe)

### A1 · Sekme adı "Rol Talepleri" (çok küçük)
- `src/components/profile/profile-sidebar-menu.tsx:137` etiketi → "Rol Talepleri". `ProfilePage.test.tsx:1258` (sıralı
  menü etiketi) ve gerekirse `:714/:792` güncellenir. `CORTEQS_LANSMAN_HAZIRLIK_PLANI_v2.md` L1.4 ✅ notu.
- Premium düzende sekme yok → kart başlığı ("Başvurular & Erişimler", `ProfileAccessCard.tsx:70`) yeniden
  adlandırılmaz (istekte yalnız sekme adı geçiyor); raporda belirt.
- Kabul: etiket testi yeşil; tarayıcıda görünüm kanıtlanamaz (raporda yaz).

### A2 · /pricing iki satır (küçük)
- `src/pages/Pricing.tsx`: "CV görüntüleme" (Free ✗ / Premium ✓) ve "İş ilanı görüntüleme" (Free "5 ilan" /
  Premium "Sınırsız") → 3 kullanıcı tipi × 2 plan = 12 giriş (satır metnine gömülü; kart yapısı DEĞİŞMEZ).
  `PRICING_JSON_LD` aynı nesneden türediği için bozulmadığını kontrol et.
- Pricing için test yok → küçük test (satırlar her tipte var, değerler doğru).

### A3 · `PremiumLockCard` (küçük)
- `ProLockedInboxCard.tsx` görselinden türeyen genel kilit kutusu: başlık, açıklama, "Premium'a geç" → `/pricing`
  (ödeme akışı YOK). `ProLockedInboxCard` ve testi (fiyat/₺/telefon yasak regex'i) DEĞİŞMEZ; yeni ayrı dosya +
  `data-testid`/a11y aynı desen. Bir yerde kullanılmalı (`check:dead`): A8'de bağlanır, ondan önce testten başka
  importer yoksa A3'ü A8 ile aynı commit'te bırak.

### A4 · İki yetki + override doğrulaması (küçük-orta)
- Migration: `afs_features` upsert `career.cv.view`, `career.listing.view_unlimited` (`scope_role='*'`,
  `scope='career'`, `capability`, `is_active_globally=true`); `role_features` **her aktif rol için `is_enabled=false`**
  (desen `archive/20260610181000_cadde300_002_feature_seed.sql:46-58`). Davranış değişmez (herkes Free kalır).
- `src/lib/features.ts` iki anahtar + `FeatureMeta`; `features.test.ts`'e `toContain`.
- `AdminUserOverridesPage.tsx:86-89` seçici `scope_role === profile_type` ile süzüyor → `'*'` yetkiler görünür mü
  ÖLÇ; görünmüyorsa süzgece `'*'` ekle (admin kullanıcı bazında açıp kapatabilmeli).
- Kabul: aktif rol sayısı × 2 satır (sayıyı ölçerek yaz), hepsi `false`; override verilen kullanıcıda
  `get_current_user_features` `source='override'`. CLAUDE.md `afs_features` 61→63.

### A5 · Rol yapısı veri modülü + sözleşme testi (orta, saf veri)
- Excel'den üretilmiş **salt-okunur** `src/lib/role-structure.ts` (ya da `.json` + tipli okuyucu): ana rol, alt rol,
  uzmanlık, `yeni_kod`, `eski_kod`, `durum` (`onaylandi`/`oneri`), eski-dropdown eşlemesi. Üretim betiği
  `scripts/` altında (xlsx → ts), çıktı commit'li.
- Sözleşme testi: 7 ana rol, 259 satır, 19 `oneri`, kod biçimi regex'i, kod benzersizliği, `Eski Dropdown (77)` 77
  satır. Sayıları ÖNCE betikle say, sonra test yaz.
- Hiçbir davranış bağlanmaz; `check:dead` için A6 aynı commit'te tüketici olur ya da test importer sayılır
  (kontrol et, gerekirse A6'ya birleştir).

### A6 · Eski dropdown'dan kesin kaldırılacaklar (küçük-orta)
- `flat-roles-api.ts` `mapFlatRoleOptions`/`useProfileRoleRequests`: kullanıcı isteğinde ve Excel'de AÇIKÇA "çıkar"
  denenleri süz — Diaspora Üyesi, Destekçi, İş Arayan (Bireysel varsayılan), İçerik Moderatörü, Platform Yöneticisi,
  Experimental_1/2/3 (yalnız dropdown'dan gizle; rol SİLİNMEZ), "Eski Dropdown (77)" sayfasında "Kaldırıldı –
  fonksiyon/filtre/etiket" eylemli satırlar. Süzgeç listesi A5 verisinden türer (elle ikinci liste yok).
- `RequestNewProfileDialog` aynı `fetchFlatRoles`'u kullanıyor → süzgeç orayı da etkiler; ayrı mı ortak mı
  olacağını testle sabitle (yan etkiyi raporla).
- Kabul: dropdown'da yasaklı anahtar yok; kalan maddeler hâlâ geçerli `roles.key` (RPC `invalid role key`
  vermemeli); `ProfilePage.test.tsx`/`flat-roles-api.test.ts` güncel.

### A7 · İlan kotası + okuma RPC'leri (büyük, migration)
- Önce **ölç**: `job_listings` kolon/RLS (baseline `:20137`), `job_posting_details` 0 satır. Detay kolonlarının
  doğrudan `select` ile sızmasını kapat (liste kolonları açık, detay yalnız RPC).
- Yeni `job_listing_views(user_id, listing_id, first_viewed_at, PK (user_id, listing_id))`; RLS kullanıcı yalnız
  kendi satırı, yazma yok. Limit ayar satırı `jobs.free_view_limit=5` (kodda sabit yok; `group_settings`/
  `cadde_settings` deseni — `group_settings` izin-listesi testi var, ya bilinçli güncelle ya da küçük ayrı ayar tablosu).
- RPC'ler: `list_job_listings_public` (başlık/şirket, `hide_business_name`, sayfalı), `get_job_listing_detail_v1`
  (giriş yok→`career_login_required`; yok→`career_listing_not_found`; `career.listing.view_unlimited` açık→detay;
  daha önce açılmış→detay, hak harcanmaz; farklı ilan sayısı ≥ limit→`career_listing_limit_reached`, detay DÖNMEZ;
  aksi halde satır ekle (advisory lock/unique) + detay), `get_my_listing_quota_v1` (kalan hak).
- Kabul `supabase/qa/career-listing-quota-acceptance.sql`: 5 farklı ilan, 6. reddedilir; tekrar açış hak
  harcamaz; override ile sınırsız; **iki gerçek oturumda 6. hak yarışı tek kazanan**; anon detay RPC'sini
  çağıramaz, `job_listing_views` okunamaz. Mutasyon ≥5 (limit, tekrar muafiyeti, premium kontrolü, anon grant,
  kilit).

### A8 · İlan yüzeyi UI + paywall bağlama (büyük)
- `/ilanlar` (liste, herkese açık; `useSeo`+`canonicalPath`) ve `/ilanlar/:id` (detay, giriş ister `?next=`).
  `src/lib/job-listings-api.ts` + Zod + React Query; hata kodu→Türkçe harita (+ çift yönlü SQL⇄TS testi);
  RPC hatası düz nesne (`instanceof Error` ile daraltma).
- Kota bandı: "5 ilandan 3'ünü görüntülediniz"; hak bitince A3 `PremiumLockCard`.
- Sitemap'e detay girmez (giriş arkası); liste 3 kriteri geçerse eklenir.
- Admin ilan girişi bu batch'te YOK (B3'te karar).

---

# BÖLÜM B — Karar / onay gerektirenler (sona)

### B1 · Premium'un tanımı ve Stripe bağı
- Şimdilik Premium = iki yetkinin açık olması (admin override/rol kuralı). Stripe gelince abonelik aynı yetkileri
  açar; çağıran kod değişmez. **Karar:** hangi roller varsayılan Premium sayılsın? (Plan: hiçbiri, yalnız admin
  verir.) Stripe fazları (U11/S01–S02) kapalı kaldıkça gerçek "abone olunca açılır" kanıtlanamaz.

### B2 · CV görüntüleme (edge function + rıza)
- Depolama RLS'i GEVŞETİLMEZ. Yeni `member-cv-link` edge function: `career.cv.view` sunucuda doğrulanır → hedefin
  CV'si var ve **paylaşıma açık** → service-role ile kısa ömürlü imzalı URL. Deploy elle + `check:functions` +
  canlı `verify_jwt` ölç (yetki değil).
- 🔴 Gizlilik sözü ("Sadece sen ve admin erişebilir") bozulur → sahibe **"CV'mi Premium üyeler görebilsin"
  anahtarı, varsayılan KAPALI** + metin güncellemesi. **Karar:** bu anahtar ve metin onaylanıyor mu?
- Kabul: Premium ✓, Free ✗, rıza kapalıyken Premium ✗, anon ✗, storage'dan doğrudan okuma hâlâ ✗.

### B3 · Küçük teyitler (tek soru turu)
- REV-102 kilitli kutu görseli repoda yok → `ProLockedInboxCard` görseli referans alındı; doğru mu?
- İlan girişi: admin sayfası mı yoksa ilk aşamada SQL seed mi? (Şirket formu kapsam dışı.)
- Premium düzen bireysel profilde sekme olmadığı için A1 yalnız eski yan menüyü etkiliyor; kabul mü?

### B4 · Rol saklama modeli  🔴 (diğer rol batch'lerinin kapısı)
- İstek: "kaydedilen değer = Yeni Admin Rol Kodu". Ama `roles.key` prefix semantiğine bağlı (`is_admin`, dizin
  dışlamaları, `Organization%`), kullanıcı başına tek rol, `cadde-rules.ts` `INDIVIDUAL_ROLE_KEYS` ile SQL birebir.
- **Öneri:** `roles.key` korunur; yeni katman (`role_structure` tablosu: ana/alt/uzmanlık, `yeni_kod`, bağlı
  `roles.key`) + başvuruda `approval_requests.payload`'a `new_code`/`specialties` yazılır; onayda mevcut
  `admin_set_user_role` çalışır. Alternatif: yeni kodları `roles.key` yap (82+ satır, prefix SQL'leri ve
  `role_attributes/role_features/role_sections` kopyalama gerekir; çok daha riskli).
- Karar gelmeden yeni migration YOK. Hangi Excel alt rolü hangi mevcut `roles.key`'e bağlanır tablosu bu karardan
  sonra çıkarılır (yeni alt roller — Doktor/Diş Hekimi ayrımı, Venture Hub vb. — için yeni `roles` satırı gerekir mi?).

### B5 · Uzmanlık (3. adım, çoklu chip) depolama
- `submit_role_change_request` yalnız `target_role_key`+`note` alır; uzmanlık için RPC genişler (`payload`).
  Kalıcı depo seçenekleri: `catalog_item_tags` (serbest etiket, ~30 satır), deprecated `taxonomy_*` tabloları, ya da
  yeni tablo. Uzmanlık onay gerektirmez, profil etiketi olur. **Karar:** hangisi? **Sarı 19 satır** (ÖNERİ) onaylanana
  kadar yayına alınmaz (A5 verisi `durum='oneri'` süzülür).

### B6 · 3 adımlı seçici UI + yeni kodla onaya düşme
- Adım 1 ana rol kartları (ikon+başlık+açıklama; kayıt ekranında hazır kart yok → `directory-role-groups.ts`/Şehir
  Elçisi kartları ve `profile-card-styles.ts` referans), Adım 2 aranabilir alt rol (`RoleSearchSelect` temel),
  Adım 3 uzmanlık chip'leri (yeni bileşen; `Badge`+`Command`). "Tek aktif rol modeli korunur" notu kalır; mobilde
  tam genişlik. Kabul: dropdown tabloda olmayan/tekrar eden/experimental göstermez; başvuru yeni kodla
  `approval_requests`'e düşer ve admin onay ekranında (`AdminApprovalsPage`) görünür. B4/B5 sonrası.

### B7 · Excel sayı/kapsam teyidi
- "52 alt rol" yalnız Bireysel dahilse tutuyor (6 başvurulabilir ana rolde 51). Başvurulabilir ana rol listesinde
  Bireysel yok; Excel "Açık Noktalar" 3 madde (Doktor/Diş/İK/Güzellik taslağı, sektör etiketi, kod göçü) kullanıcıya
  gösterilir. Kabul kriteri sayıları buna göre yazılır.

### B8 · Geri alınamaz/geniş işler (onaylı sırayla)
- **Şehir Elçisi göçü:** `consultant.ambassador.*` DB'de yok; 9 `User_CityAmbassador` kullanıcı var. Yeniden
  adlandırma gerekir mi (B4 modeline bağlı)?
- **Experimental_1/2/3 silme:** FK `ON DELETE RESTRICT`, `Experimental_3` premium sunumuna bağlı
  (`profile-presentation.ts:66`) → yalnız dropdown'dan gizli (A6), silme ayrı onay.
- **Landing/profil/dizin tek kaynak:** `directory-role-groups.ts` TS'te sabit (anon `roles` okuyamıyor); yeni
  yapıdan beslemek büyük refactor — `directory-role-groups.test.ts` (25/11 sabit sayılar), `profile-types.ts`,
  `catalog-directory.ts`, 200+ rol anahtarı tüketicisi. B4 sonrası ayrı plan.

## Kapsam dışı
Stripe/abonelik, şirket ilan ekleme formu, aylık kota yenileme, `/kariyer` kısıtı, `LOCK_FROM=2027-01-01`,
CV arama/listeleme ekranı, canlı DB'de rol silme.

## Uçtan uca doğrulama
Free test hesabı: 5 ilan açılır, 6. paywall, CV kilitli; override ile Premium: sınırsız + CV. `/pricing`'de iki
satır. Profilde sekme "Rol Talepleri"; dropdown yasaklı rol göstermez. Gerçek tarayıcı QA ve Stripe sonrası
abonelik→yetki **kanıtlanamaz**, raporda açıkça yazılır.
