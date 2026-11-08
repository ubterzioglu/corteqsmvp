---
durum: aktif
son_dogrulama: 2026-11-08
---

# 1 Ocak 2027 Lansmanı — Uygulama planı (L0–L21)

> **Ajan sürümü.** Kanıtlar: `docs/audits/2026-11-08-ocak-lansman-tutarsizlik-raporu.md`.
> Barış sürümü: Claude Docs (bağlantı aşağıda). Kaynak plan Burak'ın 4 Kasım planıdır (REV-111);
> o dokümana dokunulmaz. Her batch sonunda aşağıdaki tablo ve Güncellemeler kaydı güncellenir.
> Rakamlar bayatlar: her batch başında §1'deki ölçüm yolu ile yeniden ölç.

**Barış sürümü (Claude Docs):** https://claude.ai/artifact/UpF7j4Uu9UoTmSznSvKKDG

## Batch durum tablosu

| Batch | Durum | Tarih | Commit | Güncellemeler kaydı |
|---|---|---|---|---|
| L0 | ✅ tamam | 2026-11-08 | L0 commit'i (hash L1'de yazılır) | `20261108-lansman-l0-plan-ve-tutarsizlik-raporu` |
| L1 | ⏳ 9 Kasım toplantısını bekliyor | — | — | — |
| L3 | ✅ tamam | 2026-11-09 | `b41683e6` | `20261109-lansman-l3-l10a-l5-ana-dalda` |
| L5 | ✅ tamam (küre animasyonu alınmadı; arama kapsamı genişletmesi açık) | 2026-11-09 | `92138ed8` (merge) | aynı kayıt |
| L10a | ✅ tamam — migration `20261108120000` canlıya UYGULANMADI | 2026-11-09 | `b41683e6` | aynı kayıt |
| L10b | ✅ kod + mig `20261109100000` CANLIDA · ayar KAPALI (açmadan önce hukuk/opt-out + metin onayı) | 2026-11-09 | `c9f0bb75` | `20261109-lansman-l10b-ana-dalda-ve-migrationlar-canlida` |
| L2, L4, L6–L9, L11–L21 | ⏳ bekliyor | — | — | — |

> **Süreç kuralı (Barış, 9 Kasım):** batch başına TEK bağımsız inceleme. İncelemenin istediği düzeltme
> ikinci incelemeye girmez; yalnız kapılardan geçer.

## L0 doğrulamasıyla gelen düzeltmeler (8 Kasım — aşağıdaki batch metninden ÖNCE gelir)

Tutarsızlık raporu (§H, H1–H12) batch'lerin bazı varsayımlarını çürüttü. Çakışmada bu bölüm geçerlidir.

| Batch | Eski varsayım | Düzeltme (kanıt raporda) |
|---|---|---|
| L2.1 | Etkinlik metni yalnız `events-api.ts:136` ve `CreateEventFormSection.tsx:204`'te | Satırlar kaydı: `events-api.ts:129/138` · `CreateEventFormSection.tsx:221/247/256/317`. **`:317` her zaman görünen metinde hâlâ "admin onayı" diyor** |
| L2.2 | `/ilanlar` demo işareti eklenecek | Depoda zaten DEMO işaretli (`demo-pages.ts:75`, 7 Kasım); canlıya çıkmadı. İş = karar 10'a göre seed'i sil/gizle + deploy |
| L2 (yeni) | — | B9b kararı ("eski pending etkinlikleri yayınla") uygulanmamış; canlıda 1 pending kayıt. Karar 5 ile birlikte kapanır |
| L3.2 | `check:bundle` 229 KB gzip tabanını ölçer | **Ölçmüyor** (parça başına ham 500 KB). İlk JS gzip bütçesi için `check:bundle`'a yeni ölçü eklenir |
| L3.3 | Yasak listesinde `GGVBLA-` | **`GGVBLA-M7SDSR` zaten `src/components/Founding1000Section.tsx:174`'te** (19.09'dan beri, `74ecb4c0`). Bu corteqs'in kendi kampanya referans kodu mu, Lovable kopyası mı → önce sor; yasak listeye koyma |
| L3.3 (yeni) | `MockStripeCheckout` yasağı ST00'da var | Yasak testi yalnız tek dosyayı tarıyor; depo geneli sözleşme testi L3'te yazılır |
| L6.3 | Onay `role_structure.eski_roles_key` ile `admin_set_user_role` çalıştırır | **Çalışmaz:** `eski_roles_key` gerçek `roles.key` değil (`consultant.doktor (chip)` biçimi). L6'nın ilk adımı = gerçek `roles.key` eşleme tablosu (RT01: "alt rol = ETİKET, yeni `roles` satırı yok") |
| L6.4 | 19 öneri satırı canlıda bir karar sonucu `oneri` kaldı | Seed (`20261007130000_role_structure_seed.sql`) onları **bilerek** `oneri` yüklüyor; B7a'ya aykırı. Düzeltme migration'ı + seed notu |
| L6 (yeni) | — | `role_structure` iki migration'da tanımlı (biri FK'li); sıfırdan kurulumda seed FK'ye takılır; `20261007130000` damgası iki dosyada. Sıfırdan kurulum testi (rebuild) L6'da |
| L7.1 | `plans.ts` "tek kaynak" | İçinde **hiç fiyat yok** (yalnız tipler + `LOCK_FROM`). Fiyatlar L7'de eklenir. `Pricing.tsx:302`'de dördüncü bir fiyat iddiası ("%50 indirim") var — o da kalkar |
| L7.3 | Ön kayıt `register_feature_interest` ile | Yalnız **girişli** kullanıcıya ve 3 anahtara açık. Anonim ziyaretçi için düğme `/login?next=/pricing`'e gider; anonim bekleme listesi L17'de |
| L7.4 | Kurucu 1000 "29 Ekim" metni | `src/components/Founding1000Section.tsx:28`'de "29 Ekim · Full Açılış" duruyor |
| L9 | `cadde.phone_verification_required` `group_settings`'te | `cadde_settings` anahtarıdır; kapı bugün yalnız profili eksik üyeye uygulanıyor |
| §2.2 | Ekim kararları `2026-10-06-tek-plan-kalan-isler.md`'de | B1–B8 tablosu `docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md:29-45`'te; 10-06 dosyasında yalnız bir paragraf |
| B8 | CLAUDE.md bayat rakamlar | İki madde düzelmiş; kalanlar: "329 satır / 61 lazy" (gerçek 408 / 74), "151" (gerçek 280), "403" (gerçek 532). Rakam bloğu temizliği clean-code D6'nın devamıdır |
| A4 | Alt rol sayısı çelişkisi | Sayma yöntemi farkı: 49 tekil ad · 52 (ana, alt) çifti · 51 Bireysel hariç. **51 kararı doğru**; üretici betik "52", üretilmiş dosya "49" diyor (H6) |
| Stripe | S04 açık | Karar 10 S04'ü cevapladı (H7) |
---

## 0. Yeni oturum: ilk 10 dakika

1. **Oku:** bu dosya → `CLAUDE.md` → `docs/handover/2026-11-07-clean-code-devir-notu.md` (§3 tuzaklar, §6 devam noktası) → `docs/kalanlar/KALANLAR.md` (bölüm başlıkları + RT01).
2. **Teyit et:** `git fetch origin && git status --short --branch`. Beklenen: `main` = `origin/main` = `b5a279e5` ya da sonrası.
   - Yeni commit varsa önce ne değiştiğine bak.
   - Paralel oturum var mı? `worktree-kadro-konsolu` başka bir oturuma ait; **dokunma**.
3. **Yeniden ölç (§1):** salt okunur SQL ve dosya kontrolleri. Bu planla çelişen bir ölçüm çıkarsa önce planı düzelt, sonra devam et.
4. **Barış'tan onay al:** "L0'a başlıyorum". L0 kod içermez. Kod batch'leri (L2+) ayrı onayla başlar.

Çalışma dili Türkçedir; Barış'a yanıt Türkçe verilir. Uygulayıcı Barış (Umut Barış Terzioğlu), planın sahibi Burak Akçakanat.

---

## 1. Durum (ölçüldü: 8 Kasım 2026)

### 1.1 Clean-code oturumunun kapanış raporu (7 Kasım gecesi, Barış'ın aktardığı)

- **Depo:** `main` = `b5a279e5`, uzakla aynı, CI yeşil. Açık branch yok.
- **Başka bir oturum:** `worktree-kadro-konsolu` başka bir oturuma ait.
- **İzlenmeyen dosyalar:** yalnız kökteki 2 `.docx` ve 1 `.pdf` (karar Barış'ta).
- **Main'e girenler:**
  - W3 tekilleştirme: relocation yardımcıları, `getCurrentUserId`, `slugify`, para ve tarih biçimleri tek yerde.
  - Düzeltilen hatalar: "İstanbul" → i-stanbul, "Kış" → k-s, iş bulma aracındaki LinkedIn puanı.
  - **ST00:** hizmet talebi formundaki sahte kart ekranı ve "Ödeme alındı" bildirimi kalktı.
  - Demo hastane sayfası kart istemiyor; demo bandı geldi.
  - **EV01:** gece yarısını aşan ve 24 saatlik etkinlik uyarıları + 13 saat dilimi.
  - **CH01:** ölü kayıt sohbeti silindi.
- **Doğrulama:** 10/10 kapı yeşil, 516 dosya / 4.465 test. 5 yönetici maili gitti.
- **Barış'ta kalanlar:**
  - Coolify deploy.
  - 🔴 **GB1 anahtar rotasyonu.** Kapsama `experimental3@corteqs.net` demo hesabının açıkta duran parolası da eklendi.
  - KALANLAR kararları: HA01, DM02, K15, K17, G10c, W02b, K18, PS01, SF01, CO01.
  - `C:/tmp/corteqs-cleanup-yedek-2026-11-07/` dizini silinmeli; içinde `.env` dosyaları var.

### 1.2 8 Kasım teyidi (bu oturum ölçtü)

| Konu | Durum |
|---|---|
| Clean-code tag'leri | `clean-code-dokuman-duzenleme-oncesi-2026-11-07`, `…-faz1-…`, `…-faz2-…`, `…-faz3-devam-…` |
| **X1** rol zinciri | ✅ `RoleSelector.tsx`, `useRoleStructure.ts`, `role-structure.ts`, `generate-role-structure.mjs` ve kökteki xlsx yerinde. Hepsi `KNOWN_DEAD_FILES`'ta; KALANLAR'da **RT01** "Rol seçici bağlanır" |
| **X2** `plans.ts` | ✅ yerinde, `KNOWN_DEAD_FILES`'ta |
| **X3** W4 | ✅ `ProfilePage`, `CaddeFeedView` ve `CreateEventFormSection` parçalanmadı. Bu dosyalara yalnız Prettier, format-date ve EV01 dokundu |
| **X4** Prettier | ✅ `113dd58a`, `.git-blame-ignore-revs` içinde. Kapı P **açık**, kod yazılabilir |
| Yeni kapılar | `format` / `format:check` · `check:knip` · `check:docs` / `check:docs:strict` · ESLint `max-lines` / `complexity` / `max-depth` (taban `eslint-suppressions.json`) |
| Migration üst dizini | ✅ temiz; yalnız `_removed/20261005120000_cv_share_with_premium.sql` kaldı |
| `role_structure` sapması (G6) | ✅ `applied/20261007130000_role_structure_table.sql` artık canlıyla aynı (`eski_roles_key`) |
| Güncellemeler | `admin-updates/2026-11.ts` **var**: 6 kayıt, en üstte `20261107-olu-kod-ve-bicim-temizligi` |
| `MockStripeCheckout` | ✅ üretim kodundan kalktı (ST00); yalnız testte geçiyor |
| Bot korpusu | ✅ `sources.mjs` archive, reference, history ve `durum: yerini-aldı` dosyalarını dışlıyor |
| Doküman kuralı | `check-docs.mjs`: `docs/plans`, `docs/audits`, `docs/handover`, `docs/operations` ve `docs/kalanlar` altında tarihli ad (`YYYY-MM-DD-kebab.md`) zorunlu |
| CLAUDE.md | 1.068 satır (hedef ≤500'e inilmedi) |
| Canlı DB | 7 Kasım'dan beri yeni migration kaydı **yok** (son: `20261010131000`) |
| Canlı edge function | **16** (repoda 19). Son deploy 6 Ekim. Canlıda olmayanlar: `member-cv-link`, `send-phone-otp-hook`, `whatsapp-autoreply` |
| Frontend | Clean-code değişiklikleri ve ST00 **canlıda değil**; Coolify deploy Barış'ta |

### 1.3 Canlı ölçümler (7 Kasım; L0'da tekrar ölç)

| Ölçüm | Değer |
|---|---|
| Üye | 180: 152 `User_DiasporaMember`, 9 `User_CityAmbassador`, 9 `Consultant_PracticalLife`, 3 kuruluş, 3 süper admin, 3 deneysel, 1 marka/patent |
| REV | 43 açık · 27 inceleniyor · 34 yapıldı · 6 iptal (REV-085…111 listesi §9'da) |
| Telefon | 0 doğrulanmış · `hook_send_sms_enabled=false` · telefon sağlayıcı kapalı · `user_verifications` 0 |
| Auth | Google açık · LinkedIn kapalı |
| İş ilanı | 6, hepsi `seed_demo_job_listings` (mig `20261005130000`) |
| Etkinlik | toplam 1 (pending) · 6 Ekim kararı: otomatik yayın, en fazla 2, `first_approval_required=false` |
| Çarşı | 0 ilan · `cadde.carsi.visible=false` · `active_item_limit=5` · 7 kategori |
| Cafe | 2 cafe, 0 açık · `default_duration_hours=24` · `max_duration_hours=168` · kapasite yalnız frontend'de (50/100/250/500/999) |
| `role_structure` | 259 satır = 240 onaylandı + 19 öneri |
| Katalog | 507 yayında · 77 yer tutucu (`is_placeholder`) · 223 inceleme bekliyor |
| `group_settings` | `groups.otp_rate_limits` var · `cadde.phone_verification_required=false` |

**Ölçüm yolu:**
- psql bu makinede yok. Sorgular Management API'ye gider: `POST https://api.supabase.com/v1/projects/injprdrsklkxgnaiixzh/database/query`.
- Token `.env.local`'daki `SUPABASE_ACCESS_TOKEN`'dan (yoksa `.secretdb`'deki `sbp_…`) okunur. Komut `dangerouslyDisableSandbox` gerektirir.
- Yalnız SELECT ve küçük sorgular. `geo_cities` gibi büyük tablolarda satır başına fonksiyon çalıştırılmaz.
- Fonksiyon listesi: `GET /v1/projects/<ref>/functions`. Auth ayarı: `GET /v1/projects/<ref>/config/auth`; yalnız gereken alanlar yazdırılır, secret'lar gizli kalır.

---

## 2. Bağlam

- **Plan sahibi:** Burak'ın 4 Kasım planı.
  - Claude Docs: https://claude.ai/artifact/SE2gvwfaakAwokkC9vvSSo (salt okunur; **dokunulmaz**).
  - REV-111. Paketler B0–B7.
  - Sprint sonları 22 Kasım, 6 Aralık ve 20 Aralık. Kod dondurma 21 Aralık, go/no-go 30 Aralık, soft lansman 1 Ocak 2027, büyük lansman 19 Mayıs 2027.
- **Lovable CORTEQS+:**
  - Proje `3ad60224-d8bf-4b3f-be5c-b081ae69ef73`, commit `7b52386`, son düzenleme 4 Kasım 16:58.
  - Yalnız görünüm ve akış referansıdır; Lovable'a hiçbir şey taşınmaz.
  - Lovable MCP'sinde yalnız `list_files` / `read_file` / `get_project` kullanılır; `send_message` kredi harcar.
- **Üyelik önizlemesi:** https://claude.ai/artifact/1nt72cshzQFQb2cuvg3DMH
  - Standart €1/ay ilk 12 ay (€12/yıl), sonra €10/ay veya €96/yıl, yalnız yıllık.
  - Kurucu 1000 €99/yıl, 3 yıla kadar.
  - Premium €9,50/ay yıllıkta (€114), sonra €190/yıl; aylık €19.
  - Ücretli dönem 1 Ocak 2027. +VAT.
- **Kullanıcı kararları (7 Kasım):**
  - Barış sürümü **Claude Docs** olacak.
  - Burak'ın dokümanına **dokunulmaz**.
  - Fiyatlar **`src/lib/plans.ts`'ten** okunur; iki model de veri olarak taşınır, seçim 9 Kasım kararıyla.
  - X1–X4 (§1.2) uygulandı.
  - İş batch'ler hâlinde yürür. Her batch sonunda **Güncellemeler** kaydı yazılır.

### 2.1 Drive dosyaları (salt okunur)

| Dosya | ID |
|---|---|
| 1 Ocak Lansman Planı .docx | `1AO1gXwZVVapuBKEZsaVEg4JbGR63BKM7` |
| Üyelik sayfası HTML (REV-093) | `1fNz4yvVuNgv0_LQQOzXGLp4qfeMPlHs_` |
| #9 Barış notu (üyelik) | `1a2FQGcH3nCHAidnxC7hDQWC9mjzpOSp4vGlZit0gDW4` |
| Rol Tablosu v2 (REV-100) | `1nGBE-NNrlU6B7aOkGD6W4YtNQpuumt81` |
| CARSI_SPEC.md (REV-092) | `1gtV6PJu2dVV4ZlSv8mh7bHp86d6j2ejO` |
| carsi_items.sql | `1z6zR_QUaV98OKqvc4CG6Qn5FJAijP4fe` |
| EVIM_EVIN_SPEC.md v1.1 (REV-094) | `1DyXbV-d3CiBHD5E2VOo_KggG9pW6vYDy` |
| evim_evin.sql | `1-t3ZmmP6OMO0zArYBs_bqqx2CT9VIyW2` |
| Lansman Hazırlık Planı v2 (REV-107, eski) | `18InWbfL-Q9-iD7v3uo53YzC7N3KsaHLt` |
| vision.corteqs.net talimatı (REV-109) | `1cokXr_V0uI6NQMO_orT5dqKJf4dOH1uY` |
| Gelir Modeli Matrisi | `1gQXkBBQ9UKv_-Qjc9-M-RWfH5fszNgoUIU44B3gElJ4` |
| Puanlama Matrisi | `1RdHuCQuoDEKBK9JmS4f2thzdPw9DHhlh` |
| Rehber Motoru v1.1 zip (REV-088) | `1t5aR2gqSNpiT1FCw9hhVMNPWLD3kbtW6` |
| İnşa notları eklentisi (Dijital Gruplar) | `1MvvVls7PY1ScoUkV76ugOtTtCCDbLDLq` |

Ana "CorteQS İnşa Notları" Drive'da yok; büyük olasılıkla bir Claude proje dosyası.

### 2.2 Depoda ilgili Ekim belgeleri

Clean-code D3/D4 bu belgelerin bir kısmını `docs/history/` altına taşımış olabilir; yolları `git ls-files` ile bul.

- `tek-plan-kalan-isler.md` (5 Ekim). "VERİLEN KARARLAR":
  - B1: Premium elle açılır.
  - B4: `roles.key` aynen kalır, üstte `role_structure`.
  - B7a: 19 öneri satırı onaylı.
  - B7b: 51 alt rol.
  - B8a: Şehir Elçisi'ne dokunulmaz.
- `2026-10-04-stripe-odeme-altyapisi-plani.md`. Karar 9: Kurucu 1000 = 99 € değil; Pro 25/50/75 €. Karar 10: yalnız EUR, AB + TR. Faz 0–7; S01/S02 açık.
- `2026-10-04-lansman-hazirlik-plani-v2.md`: hedef 1 Kasım'dı.
  - K8: `LOCK_FROM=2027-01-01`.
  - K9: cafe kapasitesi.
  - K12: "ilk 12 ay" başlangıcı.
  - L5.7: ücretli Çarşı öne çıkarma kapalı.
- Mig `20261006100000` (satır 3–16): etkinlik otomatik yayın kararı.

---

## 3. Tutarsızlık kaydı (L0'da kanıtlarıyla rapora dökülecek)

✅ = 8 Kasım'da kapanmış.

**A. Ekim kararları ↔ 4 Kasım planı**
- **A1 · Fiyat modeli üç yerde farklı.**
  - 5 Ekim karar 9: Pro 25/50/75 €.
  - 4 Kasım ve önizleme: Standart/Premium/Kurucu €99.
  - Gelir Modeli Matrisi: Freemium → Premium → Premium Pro, Kurucu tek ödeme.
  - Stripe planı Faz 1, 6 fiyata göre yazılmış.
- **A2 · Rol göçü.** 5 Ekim B4 "göç yok" diyor; plan "tüm üyeler yeni kodlara taşınır" diyor. Etki yalnız 22 bireysel olmayan üye. Plandaki `consultant.ambassador.* → ambassador.*` kısaltması yanlış; doğrusu `ambassador.sehir_elcisi.*`.
- **A3 · 19 öneri satırı.** 5 Ekim'de onaylandı; canlıda hâlâ `oneri`; plan "9 Kasım'da karar" diyor.
- **A4 · Alt rol sayısı.** 49 (`role-structure.ts` başlığı) / 51 (5 Ekim) / 52 (Excel ve plan, Bireysel dahil).
- **A5 · Telefon doğrulama.** G05 WhatsApp kodu commit'li (`b45f2747`) ama canlıda kapalı. Meta işletme doğrulaması bekleniyor. Plan sağlayıcıyı "açık soru" sayıyor.
- **A6 · Ücretli Çarşı öne çıkarma.** CARSI_SPEC 2/4/10 € diyor; lansman v2 L5.7 "kapalı" diyor; plan B4 "B5 ödemesiyle" diyor.
- **A7 · Çarşı'nın açılış şartları** (lansman v2): hukuk metni, sunucu limiti ve moderasyon. Plan bunları anmıyor.

**B. Plan ↔ canlı ve depo**
- **B1 ·** `/founders-1000` adresi yok (önizleme ve Lovable bunu kullanıyor). Var olanlar: `/founding-1000` ve SEO kilitli `/founders`.
- **B2 ·** İş İlanları "Canlı" sayılmış; 6 ilanın hepsi demo seed.
- **B3 ·** Etkinlikler "Canlı" sayılmış; canlıda toplam 1 kayıt.
- **B4 ·** 24 saat cafe canlıda zaten varsayılan. Önizleme Standart için 3 saat/100 kişi diyor. Kapasite (K9) açık.
- **B5 ·** Çarşı 5 ilan limiti SQL'de zaten var (`create_carsi_item_v1`). Platform içi mesaj yok.
- **B6 · Plan mevcut altyapıyı yok sayıyor:**
  - Arama: `search_directory_catalog`, `directory-search`, `public_content_search_events`
  - Kilitler: `job_listing_quota`, `career_premium_features`, `PremiumLockCard`
  - Bot: `site-assistant`, `ai_knowledge_documents`
  - İçe aktarma: `AdminBulkImportPage`
  - Sahiplenme: `catalog_item_claims`, `org-verification-api`
  - Bekleme listesi: `feature_interest` (yalnız girişli kullanıcı)
- **B7 ✅ ·** Migration üst dizini temizlendi.
- **B8 ·** CLAUDE.md'de kısmen bayat bilgi var: edge function sayısı ve T1 etkinlik notu. ⚠️ Bunları L0'da kontrol et.

**C. Plan ↔ sözleşmeler**
- **C1 · Pasaport.** "+90 alamaz" kuralı `phone-country-derivation.test.ts` ile çelişiyor. Puanlama Matrisi K03 Pasaportu "admin onayı" olarak tanımlıyor.
- **C2 · 301'ler** üç dosyayı birlikte değiştirir: `redirects.ts` + `nginx.conf.template` + App.tsx (`server.mjs` hizalanır). Lovable ve corteqs.net 12+ adreste farklı.
- **C3 · Lovable hero'su:** 2B canvas, 3.400 parçacık, sürekli `requestAnimationFrame`. LCP riski var (taban: ilk JS 229 KB gzip).
- **C4 · vision.** Hedef proje belirsiz: talimat `abroad-buddy-map.lovable.app` diyor, plan CORTEQS+ diyor. Prototipte korumasız `/admin` ve `/internal-cq-dashboards-7f3a9b2e1d4c` var. nginx'te `default_server` sırası önemli.
- **C5 · CSP.** Müzik embed gelirse `frame-src` güncellenir. Lovable'ın görsel kaynakları (pravatar, unsplash, dicebear) taşınmaz.

**D. Drive dosyaları kendi arasında**
- EVIM_EVIN_SPEC başlığı REV-093 diyor; doğrusu REV-094.
- Evim-Evin şeması yalnız `main/summer` ve `apartment/detached` taşıyor.
- `carsi_items.sql` puan kuralları ↔ Puanlama Matrisi uyuşmuyor.

**E. Planın kendi içinde**
- 8 / 9 Kasım tarihi.
- 7 / 8 hafta süresi.
- "Lovable son düzenleme 27 Ekim" yanlış.
- K12 sorusu 18 soru arasında yok.
- Üstü çizili €120 için AB riski.

**F. Lovable'dan taşınmayacaklar**
- `create-ad-checkout`: tutar tarayıcıdan geliyor, auth yok, webhook yok.
- `diaspora-search`: tablo sorgulamıyor, sonuç uyduruyor; Gemini anahtarını URL'de taşıyor.
- `corbot-chat`: Lovable gateway kullanıyor.
- `send-phone-otp`: demo; kod yanıtta dönüyor.
- `vite.config` içinde yedek Supabase anahtarı (`azrxqgzfryzpaqchhrkk`).
- Sabit referans kodları (`GGVBLA-M7SDSR` …).
- `src/assets/guests/` altında 13 ünlü fotoğrafı.
- `/__l5e/` video yolu.
- `info@diasporaconnect.com`.
- `/admin`'deki sabit istatistikler.

**G. Depo eşlemesinden**
- **G1 · Etkinlik onayı.** Otomatik yayın (6 Ekim) ↔ REV-103 "ilk etkinlik onaya düşer".
- **G2 · `plans.ts` bağlı değil.** `Pricing.tsx` sabit fiyat kullanıyor: Pro 25/20, 50/40, 75/60 €.
- **G3 ✅ ·** `MockStripeCheckout` kalktı (ST00).
- **G4 ·** REV-097 (menü numarası) ve REV-099 (karşılama balonu) kodda var, ama kayıtları açık.
- **G5 ·** `RoleSelector.tsx` bağlı değil (RT01).
- **G6 ✅ ·** `role_structure` dosyası canlıyla aynı.
- **G7 ·** Lansman v2 1 Kasım'a göre yazılmıştı. Venture Hub ve /creator orada kapsam dışıydı.

---

## 4. 9 Kasım karar kartı

Kapanmayan karar "önerilen varsayım" ile ilerler.

| # | Karar | Etkilediği batch | Önerilen varsayım |
|---|---|---|---|
| 1 | Fiyat modeli | L7, L14 | `plans.ts`'te iki model; 4 Kasım önizlemesi aktif |
| 2 | "İlk 12 ay" başlangıcı (K12) | L7, L14 | 1 Ocak 2027 |
| 3 | Kilit tarihi | L15 | Ödeme 1 Ocak'ta açılır, kilitler 1 Şubat'ta |
| 4 | Pasaport tanımı ve +90 kuralı | L9 | Telefon kodu; +90 kuralı kalkar, sözleşme testi korunur |
| 5 | Etkinlik onayı | L2 | 6 Ekim kararı (otomatik yayın) kalır; REV-103 güncellenir |
| 6 | Rol göçü ve 19 öneri satırı | L6 | Toplu göç yok; 19 satır `onaylandi` |
| 7 | Cafe süre ve kapasite (K9) | L11 | 24 saat herkese 19 Mayıs'a kadar; kapasite 100/1.000, SQL'de |
| 8 | Çarşı açılışı ve öne çıkarma | L12 | Üç şart sağlanınca açılır; ücretli öne çıkarma kapalı |
| 9 | Evim-Evin depo/garaj | L13 | Ayrı bir ek adım |
| 10 | İş İlanları demo verisi | L2 | Demo silinir; sekme "Yakında" |
| 11 | Kurucu 1000 adresi | L2 | `/founding-1000` kalır + `/founders-1000` 301 |
| 12 | vision hedef projesi | L8 | CORTEQS+; admin yolları proxy'de 404 |
| 13 | URL politikası | L4 | corteqs.net adresleri korunur; yeni sayfalar Lovable adını alır |
| 14 | Venture Hub ve /creator | L4, L17 | Yalnız "Yakında" + bekleme listesi |

---

## 5. Ortak batch protokolü

1. **Ölç.** Batch başında ilgili canlı ve depo rakamlarını yeniden ölç (§1.3 yolu).
2. **Tag at** (kod batch'lerinde): `lansman-l<N>-oncesi-<YYYY-MM-DD>`.
   - Annotated olur; mesaj UTF-8 dosyadan okunur.
   - `git push origin <tag>` + `git ls-remote` ile teyit edilir.
   - Kural clean-code tag'leriyle aynı.
3. **Kodu yaz.**
   - Önce test (TDD). Cadde dosyalarında önce mevcut davranışı sabitleyen test.
   - Yeni kod kapılara uyar: `max-lines` 800, `complexity` 15, `max-depth` 4, Prettier. Lovable bileşenleri olduğu gibi kopyalanmaz.
   - Veri katmanı `src/lib/*-api.ts` + React Query.
   - Para ve tarih biçimi `format-money.ts` / `format-date.ts` ile; slug için `text-normalization.ts` (W3).
   - Türkçe metin kuralları (`trIncludes`/`trUpper`/`trLower`) uygulanır.
4. **Bağımsız incele.** Yazan ajan ile inceleyen ajan ayrı; inceleyenin görevi "çürütmeye çalışmak".
5. **Kapılardan geçir.**
   - Her batch: `npm run verify:text` · `npm run lint` · `npm run typecheck` · `npm run test` · `npm run build` (`check:bundle`) · `npm run format:check` · `npm run check:dead` · `npm run check:drift` · `npm run check:docs` · `npm run check:knip` (rapor).
   - `src/lib` değiştiyse ayrıca `npm run ingest:tools` + `ingest:tools:check`.
   - Migration varsa ayrıca `check:migrations:warn`. Edge function varsa ayrıca `check:functions`.
   - ⚠️ `\uXXXX` kaçışı taşıyan dosyalar `.prettierignore`'dadır; kaçışlar korunur.
6. **Güncellemeler kaydı.**
   - `src/lib/admin-shell/admin-updates/2026-11.ts`'in **en üstüne** yeni kayıt eklenir. Aralık'ta `2026-12.ts` açılır ve barrel'a `.ts` uzantısıyla en üste import edilir.
   - id: `YYYYMMDD-lansman-l<N>-<slug>`.
   - Dil sade, kalıp şu: **KISACA · NE YAPILDI · SİZDEN BEKLENEN · BİLMENİZ GEREKEN**. Teknik terim yerine açık cümle; 2026-10.ts ve 2026-11.ts örnek alınır.
   - Commit sonrası kanca (`scripts/sync-admin-updates.mjs`) kaydı kuyruğa alır; 18:00'de (Berlin) Barış'a ve Burak'a özet mail gider. Doğru çıktı: "1 yeni kayıt kuyruğa alındı".
   - Mevcut kaydı düzenlemek mail üretmez.
7. **Commit at.** Yalnız pathspec ile (`git commit -- <dosyalar>`). Mesaj Türkçe ve conventional önekli. Push Barış'ın onayıyla.
8. **Durumu işle.** Ajan planındaki batch durum tablosunu ve KALANLAR'daki L satırını güncelle.
9. **Canlıya alma Barış'ta.** Migration uygulama, edge function deploy, Coolify deploy ve ayar açma kayıtta "SİZDEN BEKLENEN" altına yazılır. Canlıya alındıktan sonraki batch'te yeniden ölç ve "doğrulandı" yaz.

---

## 6. Takvim

```text
8–9 Kas    L0  Belgeler + ilk Güncellemeler kaydı (kod yok)
9–10 Kas   L1  9 Kasım kararlarının kaydı
Sprint 1 (10–22 Kas):  L2 demo/küçük kesinler · L3 güvence kapıları · L4 menü/URL
                       L5 hero/arama · L6 Rol Talepleri · L7 fiyat config + /pricing
                       L8 staging/vision nginx · L9 Pasaport (Meta onayına bağlı)
Sprint 2 (23 Kas–6 Ara): L10 profil e-posta + geri bildirim · L11 Cadde + cafe
                       L12 Çarşı · L13 Evim-Evin · L14 Stripe (başlangıç) · L16 CorBot (başlangıç)
Sprint 3 (7–20 Ara):   L14 bitiş · L15 reklam + kilitler · L16 bitiş · L17 "Yakında" sayfaları
                       L18 içerik taşımaları · L19 araştırma içe aktarma + skill
21–31 Ara  L20 dondurma, test, go/no-go (30 Ara), yayın (1 Oca)
Ocak       L21 ertelenenler
```

Burak'ın takviminden iki fark var:
- **Fiyat sayfası (L7) Sprint 1'e çekildi.** Ödemesiz çalışır.
- **Stripe (L14) Sprint 2'de başlar.** En riskli iş son iki haftaya sıkışmasın.

---

## 7. Batch'ler

Kısaltmalar: **C** = Claude · **B** = Barış (deploy, hesaplar, DNS, canlı açma) · **E** = Burak ve ekip (içerik, karar, hukuk). Boyut: S/M/L.

### L0 — Belgeler ve ilk kayıt (kod yok · S)

1. **Tutarsızlık raporu:** `docs/audits/2026-11-08-ocak-lansman-tutarsizlik-raporu.md`.
   - Frontmatter: `durum: aktif` · `son_dogrulama: 2026-11-08`.
   - İçerik: §1 ölçümleri ve SQL'leri; §3'ün her maddesi kanıtıyla (`path:line`, SQL sonucu, Drive ID); Ekim kararlarının **alıntısı** (yalnız satır atfı değil — kaynak dosya taşınmış olabilir); Lovable doğrulama tablosu; ölçülmeyenler.
   - Bu dosyadaki kanıtları yeniden üret, ezberden yazma. Lovable iddiaları için Lovable MCP'si `read_file`.
2. **Ajan planı:** `docs/plans/2026-11-08-ocak-lansman-uygulama-plani.md`. Bu dosyanın §4–§8'i + batch durum tablosu (durum · tarih · commit · Güncellemeler id).
3. **KALANLAR'a "L — 1 Ocak lansmanı (L0–L21)" bölümü.**
   - Mevcut bölüm ve ID düzenine uy (bkz. RT01). RT01, L6'ya bağlanır.
   - Kararlar bölümüne (K) 9 Kasım kararları eklenir. Clean-code'un açık bıraktığı kararlar (HA01, DM02, K15, K17, G10c, W02b, K18, PS01, SF01, CO01) dokunulmadan kalır.
4. **Barış sürümü (Claude Docs).**
   - Önce docs becerisi yüklenir.
   - İskelet tek `batch` ile kurulur, sonra Artifact `open` ile açılır.
   - Her bölüm ayrı çağrıyla doldurulur: Özet · 9 Kasım karar kartı · Batch yol haritası (çizilmiş zaman çizelgesi) · Kim ne yapar · Tutarsızlıklar (okunur 10–12 madde) · Riskler · Kaynaklar.
5. **Güncellemeler kaydı:** `2026-11.ts`'in en üstüne `20261108-lansman-l0-plan-ve-tutarsizlik-raporu`. Konu: "1 Ocak planı yerinde incelendi; 14 karar 9 Kasım'a; çalışma 22 batch'te ilerleyecek".
6. **Hafıza:** proje hafıza dosyasını güncelle (`project_ocak_lansman_plani_2026_11_08.md`).
7. **Commit** (pathspec): rapor, plan, KALANLAR ve `2026-11.ts`.

**Kabul:**
- `check:docs` (yeni dosyaların adı ve frontmatter'ı) yeşil.
- `verify:text`, `typecheck`, `admin-updates.test.ts` yeşil.
- Kanca çıktısı "1 yeni kayıt".
- Docs outline okumasında bekleyen blok yok.

### L1 — 9 Kasım kararlarının kaydı (S)

1. §4'teki kararlar rapora, ajan planına, Docs'a ve KALANLAR K bölümüne "verildi" ya da "varsayım" olarak işlenir.
2. **REV listesi hazırlanır** (canlı yazma Barış'ta, admin panelinden):
   - REV-097 ve REV-099 → yapıldı.
   - REV-103 → kararla uyumlu hâle getirilir.
   - REV-107 → kapanır.
   - REV-110 → iptal.
   - REV-111 → açıklaması güncellenir.
3. Güncellemeler kaydı.

**Kim:** C + B + E.

### L2 — Kalan demo ve küçük kesinler (S)

L2.1 `MockStripeCheckout` ST00 ile kapandı; çıkarıldı.

1. **Etkinlik metinleri karar 5 ile uyumlu hâle gelir:**
   - `events-api.ts:136` ve `CreateEventFormSection.tsx:204` (yorum ve metin).
   - Kullanıcıya "onaya düştü" diyen kopya varsa düzeltilir.
   - EV01'in dokunduğu satırlarla çakışma kontrol edilir.
2. **İş ilanları (karar 10):** yeni migration 6 demo ilanı siler ya da gizler; `/ilanlar` boş durum ya da "Yakında" gösterir; sitemap girdisi kontrol edilir.
3. **`/founders-1000` → `/founding-1000` 301:** `redirects.ts` + `nginx.conf.template` + `server.mjs` `legacyRedirectMap`.
4. **Sözleşme testi:** `MockStripeCheckout`'un üretim kodunda yeniden görünmesini yasaklar. ST00'da yazılmamışsa eklenir.

**Kabul:** `redirects.test.ts` ve `generate-sitemap.test.mjs` yeşil; deploy sonrası `/ilanlar`'da demo kayıt yok.

**Kim:** C; B migration ve deploy.

### L3 — Güvence kapıları (M)

1. **Regresyon listesi:** Burak'ın 12 maddesi için tablo çıkarılır: madde · mevcut test · eksik · yeni test. Eksikler yazılır. Örnekler:
   - Profil sekme sayısı azalmaz.
   - 18 araç sayfası durur.
   - Analitik etiketleri (`public/analytics.js`) durur.
   - Rehber ve Radar adresleri değişmez.
2. **Performans bütçesi:** `check:bundle` eşiklerinin 229 KB gzip tabanına göre ayarlı olduğu teyit edilir. Lighthouse için elle protokol yazılır; raporlar gitignore'lu bir dizine gider.
3. **"Lovable'dan gelmesin" sözleşme testi.** `src/**` ve `supabase/functions/**` içinde şunlar geçmez:
   - `ai.gateway.lovable.dev`, `LOVABLE_API_KEY`, `@lovable.dev/cloud-auth-js`, `/__l5e/`
   - `diasporaconnect.com`, `i.pravatar.cc`, `api.dicebear.com`
   - `azrxqgzfryzpaqchhrkk`, `GGVBLA-`
   - `lovable-tagger` serbest.
   - Test mutasyonla sınanır.
4. **Playwright smoke** (port 8099): ana sayfa, dizin araması, giriş, fiyat sayfası, Cadde kapısı.

**Kim:** C.

### L4 — Menü, URL, "Yakında" kabukları (M)

1. **URL eşleme tablosu** (karar 13). Lovable menüsü: Cadde `/cadde` · Çarşı `/carsi` · İş ▸ Danışmanlar/İşletmeler/Venture Hub/İş İlanları/Kuruluşlar · Sosyal ▸ Kişiler/Etkinlikler/Dijital Gruplar/V-Blogger/Medya · Kampanyalar ▸ Liderlik/Blogger/Vlogger/Kurucu 1000/Oyunlar · Araçlar ▸ Taşınma Motoru/Haritada Ara/Araçlar/Rehberler · CorteQSTransfer.
   - Her öğe bir corteqs.net rotasına eşlenir: `/cadde/carsi`, `/consultants`, `/businesses`, `/associations`, `/ilanlar`, `/directory`, `/events`, `/addcom`, `/radar`, `/liderlik`, `/campaign/*`, `/founding-1000`, `/relocation`, `/tools`, `/radar/rehberler`.
2. **Menü config'i:** tek kaynak `src/lib/navigation/main-menu.ts`. Her öğe `status: canli|beta|yakinda` taşır. Test: her hedef `App.tsx`'te bir rotaya karşılık geliyor; ölü link yok.
3. **`SiteHeader.tsx`** config'ten çizilir: masaüstü açılır menüler ve mobil menü. "Biz kimiz?" ve "Geri Bildirim" üst menüden kalkar. `/feedback` L10'a kadar çalışmaya devam eder.
4. **`/venture-hub`, `/transfer`, `/creator`:** ortak bir `ComingSoonPage` kullanılır. L17'ye kadar sitemap'e girmezler.
5. **Footer:** Hikâyemiz eklenmez. Hakkımızda bugün `/founders`'a gidiyor (`footerLinks.ts:16`); karara göre kalır ya da kalkar.

**Kabul:** `redirects.test`, `generate-sitemap.test` ve `App.notfound-seo` yeşil; Playwright ekran görüntülerinde 360/768/1024/1440 px'te taşma yok.

**Kim:** C.

### L5 — Hero ve arama (M/L)

1. **`home-trial/HeroNetworkSection.tsx`:** Lovable düzeni alınır: başlık, "Kaydol — Diaspora Pasaportun Çıksın" butonu, WhatsApp / Kurucu 1000 / Blogger / Vlogger butonları ve 2 kampanya kartı.
   - LCP için statik poster (`hero-network-poster.webp`) korunur.
   - Canvas küre (Lovable'da `DiasporaFlowMap` + `diasporaFlowEngine`) ertelenmiş, boşta yüklenir. Görünmezken durur, mobilde parçacık azalır, reduced-motion'a uyar.
   - Bütçeyi aşarsa animasyon çıkar.
2. **Sabit sayılar** gerçek sayımla değişir ya da kalkar. Kaynak: `getTotalDirectoryCount` (`search_directory_catalog`, `p_limit=1`).
3. **`DiasporaSearchSection`** Lovable'daki yerine alınır. Kapsama etkinlik, dijital grup ve Çarşı eklenir (`public-content-search.ts`; `\u` kaçışı taşıyor, Prettier dışında). Filtre sonrası "Ara" butonu. "Diasporada / Türkiye dahil" ayrımı için önce veri ölçülür.

**Kabul:** `check:bundle` bütçe içinde; Lighthouse mobil skoru batch öncesinin altında değil; canlıda "Berlin avukat" gerçek kayıt getiriyor.

**Kim:** C.

### L6 — Rol Talepleri, REV-100 = KALANLAR RT01 (M)

1. **Ölç:** mevcut başvuru akışı (`useProfileRoleRequests`, `ProfileAccessCard`, `AdminApprovalsPage`); yeni kodun nerede saklanacağı. Gerekirse migration ile kolon eklenir.
   - ⚠️ RT01 notu: "alt rol = ETİKET, yeni `roles` satırı yok".
2. **`RoleSelector.tsx`** legacy düzendeki sekmeye bağlanır (`profile-sidebar-menu.tsx`). Sekme adı "Rol Talepleri". Uzmanlıklar `user_specialty_tags` RPC'leriyle yönetilir.
3. **Admin onayı:** 3 seviyeli yol gösterilir. Onay, `role_structure.eski_roles_key` eşlemesiyle `admin_set_user_role` çalıştırır. `roles.key` değişmez.
4. **19 öneri satırı** → `onaylandi` (karar 6).
5. **Temizlik:** `RoleSelector` ve `useRoleStructure`, `KNOWN_DEAD_FILES`'tan çıkar. `role-structure.ts` (statik) hâlâ kullanılmıyorsa silinmesi ayrı karar.

**Kabul:** E2E: seçim → talep → onay → rol atanır. `check:dead` ve `check:knip` temiz.

**Kim:** C; B migration.

### L7 — `plans.ts` ve /pricing, ödemesiz (M)

1. **`src/lib/plans.ts`** iki modeli veri olarak taşır; K12 ve `LOCK_FROM` burada. `KNOWN_DEAD_FILES`'tan çıkar.
2. **`Pricing.tsx`** önizleme tasarımıyla yeniden yazılır:
   - Segment sekmeleri: Danışman / Kuruluş / İşletme.
   - Yıllık varsayılan; aylık yalnız Premium'da. Aylık seçiliyken diğer kartlarda "Yalnızca yıllık".
   - "Yakında" etiketli özellikler tıklanmaz.
   - +VAT notu.
   - Influencer şeridi → `/creator`.
   - Mobilde Kurucu 1000 ilk sırada.
   - `info@corteqs.net`.
   - Üstü çizili €120 yerine "Lansman fiyatı".
   - Para biçimi `format-money.ts` ile.
3. **CTA:** "Ön kayıt / fiyatı kilitle". `register_feature_interest` beyaz listesine `pricing.prelaunch` eklenir (migration + TS; ayna testi).
4. **Kurucu 1000 sayfası:** "29 Ekim" → "Ücretli dönem 1 Ocak 2027'de başlar".
5. **Sözleşme testi:** `Pricing.tsx`'te `€` ile başlayan sayı sabiti olmaz.

**Kim:** C.

### L8 — staging ve vision için nginx (S/M · karar 12)

1. **`nginx.conf.template`'e iki sunucu bloğu.** Catch-all `default_server` kalır. Güvenlik başlıkları her `location`'da tekrarlanır.
2. **vision:**
   - `proxy_pass` hedefi karar 12'deki Lovable adresi.
   - `X-Robots-Tag: noindex, nofollow`; `/robots.txt` → `Disallow: /`.
   - `/admin` ve `/internal-cq-dashboards-*` → 404.
   - corteqs CSP'si uygulanmaz.
3. **staging:** host bazlı noindex. Supabase kararı runbook'a yazılır: `operations/` altında tarihli bir runbook.
4. **Testler:** `redirects.test.ts` genişletilir: blok sırası, noindex başlığı, admin engeli.

**Kim:** C taslak; B DNS, Coolify ve deploy (sonra `curl -I`).

### L9 — Diaspora Pasaportu (M · ön koşul: Meta işletme doğrulaması + karar 4)

1. **Tanım:** `passport_verified` = doğrulanmış telefon (`is_phone_verified()`, `user_verifications` aynası). "+90" kuralı yalnız karar 4 korursa SQL'de yazılır; o durumda sözleşme testi ve CLAUDE.md kuralı bilinçli olarak güncellenir.
2. **Rozet:** "Diaspora Üyesi" profilde ve dizin kartında görünür.
3. **Kapı:** Pasaport şu işlerde istenir: Cadde paylaşımı, cafe açma/katılma, Çarşı ilanı, mesaj, reklam ve sahiplenme.
   - Tek bir SQL yardımcısı kullanılır.
   - `cadde.phone_verification_required` yeniden kullanılır.
   - `role_features` kuralı olmayan feature flag kullanılmaz.
4. **Açma (B):** `send-phone-otp-hook` deploy edilir, Supabase "Send SMS" kancası açılır, Alman numarasıyla deneme yapılır.

**Kim:** C; B.

### L10 — Profil: doluluk e-postası ve geri bildirim sekmesi (M)

1. **Doluluk e-postası (0., 3. ve 10. gün; en fazla 3 kez).** Beş parçalı bildirim hattı (CLAUDE.md Kariyer md.8):
   - Outbox CHECK migration'ı
   - Ayar anahtarı
   - Edge function'da `SETTING_KEY_BY_EVENT` + `buildEmail`
   - Günlük `pg_cron` işi
   - Metin E'den gelir.
2. **Doluluk kartı** legacy düzende de görünür.
3. **Profilde Geri Bildirim sekmesi:** `feedback.ts` yeniden kullanılır.
   - Admin'de "REV'e taşı" düğmesi (yeni admin RPC'si).
   - `/feedback` → profil sekmesi 301'i (üç dosya).
4. **REV-096** testle doğrulanır.
5. **Olursa iyi:** LinkedIn (B Supabase OIDC'yi açar).

**Kim:** C, E, B.

### L11 — Cadde ve cafe (L)

1. **Önce ölç:** REV 002, 006, 013, 015, 016, 026, 029, 050, 085.
2. **Lovable'ın üç sütunu** yeni sarmalayıcı bileşenlerle kurulur. `CaddeFeedView`'ın içi değişmez; X3 Ocak'a kadar geçerli.
3. **`create_cadde_cafe_v2`:**
   - Kapasite ve süre `cadde_settings`'teki paket kurallarından okunur (karar 7).
   - Ad yasak listesi SQL'e taşınır; `CAFE_NAME_BLOCKLIST` ↔ otomatik tarama regex'i ayna sözleşmesi genişletilir.
   - Yeni `cadde_*` hata kodları Türkçe mesaj haritasına eklenir.
4. **Sağ kolon** yalnız CorteQS duyurularını gösterir (`PromotionRail`).
5. **Olursa iyi:** müzik embed'i. YouTube/Spotify resmi embed; CSP `frame-src` güncellenir.

**Kabul:** 24 saatlik cafe açılıp süresi dolunca kapanıyor; 101. kişi sunucu tarafında giremiyor; yenilemede footer'a kayma yok; ABD filtresi tüm şehirleri gösteriyor.

**Kim:** C.

### L12 — Çarşı (M/L)

1. **Kategoriler 7 → 14:** veri migration'ı (pet-bakıcı, depo, garaj, son-dakika + eksik temel kategoriler).
2. **Son dakika kuralları:** fiyat 0, teslim alma en fazla 7 gün sonra, süre dolunca kapatan iş. Burak'ın SQL'i uyarlanır.
3. **Açılış (karar 8):** üç şart sağlanınca `cadde.carsi.visible=true` (B). Menüde üst başlık olur.
4. **Admin CSV** (BOM'lu).
5. **Olursa iyi:** platform içi mesajlaşma.

**Kim:** C, B, E hukuk.

### L13 — Evim-Evin (M)

1. **Migration:** Drive'daki `evim_evin.sql`'den uyarlanır: `evim_evin_interest` + `evim_evin_homes`, en fazla 3 ev, anonim `pool_stats`. Depo/garaj karar 9'a göre.
2. **Profil sekmesi:** iki düzende de; girişsiz kullanıcı kayıttan sonra `?next=` ile döner.
3. **Havuz sayacı** 50'nin altında gizli.
4. **Admin** listesi + CSV.
5. **Çarşı'ya Evim-Evin şeridi.**

**Kim:** C.

### L14 — Stripe abonelik (L · ön koşul: S01/S02 + karar 1/3)

1. **Stripe planı karara göre revize edilir;** frontmatter `durum` güncellenir.
2. **Migration:** `subscriptions`, `stripe_customers`, `payment_events` (idempotent), RLS. Fiyat ID'leri `plans.ts` + ortam değişkenleri.
3. **Edge function'lar:**
   - `create-checkout-session`: giriş zorunlu, fiyat sunucuda bulunur.
   - `stripe-webhook`: imza doğrulanır; yetki 5 Ekim B1'deki admin anahtarıyla açılır.
4. **Müşteri portalı** ve admin gelir görünümü.
5. **Test modu:** uçtan uca; ardından `check:functions`.

**Kabul:** test kartıyla Standart alınıyor ve yetki anında açılıyor; iptal çalışıyor; aynı webhook ikinci kez gelince çift kayıt yok.

**Kim:** C; B hesap, Tax, secret'lar ve deploy.

### L15 — Reklam ve kilitler (M/L · ön koşul: L14)

1. **Profilde "Reklam ver":** görsel + metin, hedef ülke/şehir, tarih aralığı, model kararı.
   - %80 lansman indirimi 19 Mayıs'a kadar, sunucuda hesaplanır.
   - Ödeme tek seferlik checkout ile.
   - Onay `/admin/cadde/promotions`'ta.
   - Yayın `SponsoredFeedCard` ile; süre sonunda reklam düşer.
2. **Premium %20 reklam indirimi** config'ten okunur; lansman indirimiyle üst üste binmez.
3. **REV-102 ve REV-106 kilitleri** `LOCK_FROM`'dan okunur (karar 3); banda eklenir.

**Kim:** C.

### L16 — CorBot

Clean-code 0.3/2.6 bitti; ön koşul sağlandı.

1. **Yeni `sitemap` kaynağı:** App.tsx rotaları + menü config'i + rol/paket gereksinimleri.
2. **Yeni `kilavuz` kaynağı:** `guides/` altında yeni kullanım kılavuzu dosyası (kitle frontmatter'ı clean-code 2.1'e göre). Metni E yazar.
3. **`site-assistant`** sayfa ve rol bağlamını alır. Bağlam bulunamayan soru (`hasContext=false`) talep kuyruğu tablosuna yazılır. Geri bildirim isteği `member_feedback`'e yazılır.
4. **Değerlendirme betiği:** 30 soru, en az 27 doğru yönlendirme. Alaka eşiği 0.35 ölçülmeden değiştirilmez.
5. **Deploy W6 ile birleşir** (B).

**Kim:** C, E, B.

### L17 — "Yakında" sayfaları ve bekleme listesi (M)

1. **`waitlist_signups` tablosu + `join_waitlist_v1` RPC'si:** anonim çağrılabilir, hız sınırlı. Admin listesi + CSV.
2. **`/venture-hub`:** 12 segment + erken kayıt (REV-087).
3. **`/transfer`:** bulanık görsel + slogan + bekleme listesi. Görsel E'den gelir.
4. **`/creator` Faz 0:** Instagram kullanıcı adı, takipçi aralığı, ülke/şehir, niş. İlk 100 kayıt "Kurucu Creator" sayılır.
5. **Sitemap:** içerik kriterini karşılayınca eklenir.

**Kim:** C, E.

### L18 — İçerik taşımaları ve dizinler (M/L)

1. Radar "Sosyal › Medya" etiketiyle görünür; Rehberler "Araçlar" altına geçer (L4 config'iyle).
2. Danışman, işletme ve kuruluş dizinleri Lovable kart ve filtre düzenini alır; veri katalogdan gelir.
3. REV 066, 069, 090 (form kısmı), 001, 005 ve 014. Her biri önce ölçülür.
4. **Sözleşme testi:** menüdeki her öğe `canli`, `beta` ya da `yakinda`; demo kayıt yok.

**Kim:** C.

### L19 — Araştırma içe aktarma ve skill (L)

1. **`scripts/research/export-taxonomy.mjs`** → `taxonomy.json`.
2. **`src/lib/research-import-schema.ts`:** Zod şeması.
3. **`AdminBulkImportPage`'e "Araştırma Kayıtları" kipi:** yükle → doğrula → taslak (`is_placeholder=true`) → onayla → aday profil.
   - "Profilini sahiplen", mevcut claim akışıyla çalışır ve Pasaport ister.
   - Aday profilde kaldırma talebi bağlantısı bulunur.
4. **Skill paketi:** `SKILL.md` (5.000 token'ın altında), 10 modül, `validate.py`, `dedupe.py`, `profiles/tr.json`. Depodaki yeri batch başında Barış'la netleşir.
5. **Deneme:** staging'de 50 kayıt.

**Kim:** C, E.

### L20 — Dondurma, test ve lansman (21–31 Aralık)

1. 21 Aralık'ta kod dondurulur.
2. Tüm kapılar çalıştırılır: Playwright, Lighthouse, `check:functions`, `check:migrations` (sıkı).
3. **Güvenlik:** admin rota korumaları, önizleme kapıları, Supabase advisor'ları, RLS örnek kontrolleri.
4. **20 Aralık üye bildirimi:** şartlar ve ücretli dönem.
5. **Go/no-go listesi:** `operations/` altında 30 Aralık tarihli go/no-go listesi.
6. **1 Ocak yayını** (B). Ardından `BASE_URL=https://corteqs.net npm run verify:release` ve `curl -I`.

### L21 — Ocak

- W4'ün üç dosyası: `ProfilePage`, `CaddeFeedView`, `CreateEventFormSection`.
- "Olursa iyi" maddelerinden kalanlar: Çarşı mesajlaşma, LinkedIn, müzik embed, WhatsApp botu.

---

## 8. Barış'ta olan işler (Claude yapamaz)

- **Deploy:** Coolify (clean-code değişiklikleri ve ST00 dahil — **şu an bekliyor**).
- **Güvenlik:** 🔴 GB1 anahtar rotasyonu (+ `experimental3` parolası).
- **Yedek:** `C:/tmp/corteqs-cleanup-yedek-2026-11-07/` dizinini sil.
- **DNS:** staging ve vision alt alan adları.
- **Stripe:** hesap ve doğrulama, Stripe Tax (S01/S02).
- **Meta:** işletme doğrulaması.
- **Canlıda açma:** telefon kancası, Çarşı görünürlüğü, migration'lar ve edge function deploy'ları.
- **Kararlar:** KALANLAR'daki 10 karar + 9 Kasım'ın 14 kararı.
- **Burak ve ekipten gelecekler:** kılavuz, e-posta metinleri, Transfer görseli, 30 soruluk bot test seti, hukuk metinleri.

## 9. Ek: REV-085…111 (7 Kasım)

| REV | Durum | Konu |
|---|---|---|
| 085 | açık | Cafe dekorasyon |
| 086 | açık | Bot kullanıcı |
| 087 | açık | Venture Hub sayfası |
| 088 | açık | Rehber Motoru v1.1 kurulum |
| 089 | inceleniyor | Muhasebe ekstre motoru |
| 090 | inceleniyor | Dijital Gruplar ekleme |
| 091 | inceleniyor | Ekip / Kariyer |
| 092 | açık | Çarşı v2 |
| 093 | açık | Üyelik sayfası |
| 094 | açık | Çarşı + Evim-Evin |
| 095 | açık | Gamification |
| 096 | inceleniyor | Şifremi unuttum |
| 097 | açık | Admin menü numaraları (kodda var) |
| 098 | inceleniyor | WhatsApp bot |
| 099 | inceleniyor | Karşılama balonu (kodda var) |
| 100 | inceleniyor | Rol Talepleri |
| 101 | açık | Üyelik sayfası v2 |
| 102 | açık | PRO paket akışı (kilitli gelen kutusu) |
| 103 | açık | Topluluk çekirdeği |
| 104 | açık | Creator Studio |
| 105 | inceleniyor | Footer'da CorteQS Global |
| 106 | inceleniyor | CV/ilan Premium |
| 107 | inceleniyor | Lansman planı v2 |
| 108 | açık | Login |
| 109 | açık | vision.corteqs.net |
| 110 | açık | Hikâyemiz |
| 111 | açık | 1 Ocak planı |

## 10. Doğrulama (her batch sonunda)

- §5.5'teki kapılar yeşil.
- Kanca "1 yeni kayıt kuyruğa alındı" diyor.
- Batch durum tablosu ve Docs güncel.
- Canlıya giden iş bir sonraki batch'te ölçülüp "doğrulandı" diye yazılıyor.
