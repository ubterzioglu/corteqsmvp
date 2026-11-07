# CLAUDE.md arşivi — 2026-11-07

> Bu dosya CLAUDE.md'den **kelimesi kelimesine** taşınan bayat rakam ve tarihçe bloklarını tutar.
> Burada yazan sayılar ÖLÇÜM ANINA aittir; güncel değer için CLAUDE.md'deki komutları çalıştır.
> Kurallar CLAUDE.md'de kaldı; bu dosya yalnız "neden böyle" sorusunun tarihçesidir.

## Key Metrics + Recent major changes + doküman düzeni

_CLAUDE.md satır 9–91 (2026-11-07 öncesi)._

**Key Metrics (ölçüldü 2026-09-21 akşamı — önceki tur 19 Eylül'dü ve SEKİZ rakamı birden
bayatlamıştı; ezberleme, komutu çalıştır):**
> ⚠️ **Rakamlar 2026-09-28 GECE yeniden ölçüldü (A13a).** Aşağıdaki blokta yazan
> **1.195 dosya · 275 test · 151 applied migration · 306 dosya/2.361 test ·
> 61 `lazy()` · App.tsx 329 satır** rakamlarının HEPSİ bayattır; aynı gün sabah
> yazılan 1.270/316/359 rakamları da bayatladı. Güncel değerler:
>
> | İddia (eski) | Ölçüm (28.09 gece) |
> |---|---|
> | 1.270 `.ts`/`.tsx` | **1.278** |
> | 316 test dosyası (src) | **320** |
> | 359 dosya / 2.765 test | **364 dosya / 2.811 test** |
> | 151 applied migration | **182** (archive 252, toplam 434 · canlı kayıt da **434**) |
> | App.tsx 329 satır · 61 `lazy()` | **336 satır · 61 `lazyWithReload()`** |
> | 5 dosya 800+ satır | **3** — ve yalnız 1'i üretim (`zgen-data.ts` **980**, VERİ) |
> | `check:dead` 1 bilinen borç | **0** · 955 erişilebilir kaynak |
> | 3 (sonra 2) gerçek `as any` cast | **0** — 12 geçişin HEPSİ yorum satırı |
> | Playwright 10 `.spec.ts` | **11** |
> | 76 rol / 75 aktif | **82 / 78** · afs_attributes **57** · afs_features **61** · afs_sections 7 |
>
> ⚠️ `lazy()` artık DOĞRUDAN kullanılmıyor: `lazyWithReload()` sarmalayıcısı var
> (`src/lib/lazy-with-reload.ts`). `grep -c "lazy("` **0** döner ve "kod bölme
> kaldırılmış" sanılır — doğru desen `lazyWithReload(() =>`.
>
> ⚠️ **Sayarken `git ls-files` kullan, çıplak `find` DEĞİL.** Bu makinede depo kökünün
> altında **gitignore'lu `referanslovable/` klonu** duruyor. 28.09'da `find` Playwright
> spec'lerini **44** saydı; gerçek sayı **11**'dir (33 fazlası o klondan geldi).
> Aynı tuzak `.ts`/`.tsx` sayımında da vardır.
>
> ⚠️ **`as any` sayarken metin geçişini cast sanma.** Bugün dosyalarda `as any` geçen
> 12 satırın hepsi, şimin NEDEN kaldırıldığını anlatan **yorum**dur. Gerçek cast yok;
> "12 cast kaldı" sonucuna varma.

- **1.195** `.ts`/`.tsx` files under `src` (`find src -name '*.ts' -o -name '*.tsx' | wc -l`;
  bunun **275**'i test dosyası). 2026-09-06 ölü kod temizliğiyle 1.092 → 950'ye inmişti;
  13 Eylül gecesi iki dalgalık büyük dosya ayrıştırmasıyla yeniden **çıktı** — bu
  bilinçlidir, 11 dev dosya ~140 küçük modüle bölündü, bkz. Known Limitations md.7
- **403 Supabase migrations** — **151** in `supabase/migrations/applied/`
  + 252 in `supabase/migrations/archive/` (2026-08-04 baseline split).
  ⚠️ Parent `supabase/migrations/` içinde **0** `.sql` olmalıdır; orada kalan dosya
  sürüm karşılaştırmasına girmez (kör nokta, aşağıda ayrıntılı)
- **306 dosya / 2.361 test** yeşil (`npm run test`) — **275** src + **19** scripts
  + **8** supabase + **4** workers. 245, 271, 276, 278 ve 279 taban rakamları bayattı.
  ⚠️ Test dosyası sayarken `find`'ı `-not -path '*/node_modules/*'` ile sınırla; aksi
  hâlde `workers/` için 4 yerine 284 gelir
- `npm run lint` → **0 problem** · `npx tsc -p tsconfig.app.json --noEmit` → **0 hata**
  (eski "1280 problem" ve "5 hata" notları bayattı)
- `src/App.tsx`: **336** lines, **61** `lazyWithReload()` imports
- Playwright: **11** `.spec.ts` (eski "18" ve "10" bayattı) — ⚠️ bu makinede
  `npm run test:e2e` port 8080 başka uygulamada olduğu için düşer; yol haritası **B09**
- TypeScript with relaxed strict mode (intentional trade-off) — **`tsc` hatası SIFIRA indi**
  (109 → 22 → 16 → 12 → 9 → **0**, 2026-09-13; 19 Eylül gecesi 3 hataya çıkıp yeniden **0**'a
  indirildi). "Known Limitations" md.5 artık KAPALI — eski sınıf tablosunu ezberleme, aşağıdaki
  not güncel. ⚠️ `tsc` ne `prelint`te ne `pretest`te koşar; dosya ekleyen her oturum
  `npx tsc -p tsconfig.app.json --noEmit` komutunu ELLE çalıştırmalıdır.
- **Production runtime is nginx** (Dockerfile → `nginx.conf.template`), deployed via Docker (Coolify).
  `server.mjs` is the local/nixpacks path only — see the Deployment section.

> **Recent major changes:**
> 1. Catalog / flat-role / **AFS** rebuild (live 2026-06-09) — renamed 9 tables, dropped the old
>    item-type/role-family system. See `docs/catalog-role-afs-rebuild/` and the DB section below.
> 2. **Cadde 3.0 E2E rebuild (live 2026-06-11, Faz 0–9 + kuyruk TAMAM)** — social feed with CKS
>    band/score ranking, Cafe rooms, Çarşı marketplace, Tanıtım campaigns, notifications + moderation,
>    multi-diaspora. ~30 security-definer RPCs, migrations `cadde300_001–014`. **Read the Cadde rules
>    section below before touching cadde code.** Closing report: `docs/cadde-300/change-report.md`.
> 3. **Modernizasyon çalışması (2026-08-04)** — nginx güvenlik başlıkları + CSP, tek kaynaklı
>    yönlendirme tablosu (`src/lib/redirects.ts`), SEO canonical/404 düzeltmeleri, sitemap doğruluğu,
>    5 ölü sayfa silindi. **Yeni "Değişmez sözleşmeler" bölümünü okumadan bu alanlara dokunma.**
>    Plan: `docs/plans/2026-08-04-modernization-plan.md`.
>
> **Doküman düzeni (kök temizliği 2026-08-04):** kökte YALNIZ 2 `.md` kalır — `CLAUDE.md`
> (agent kuralları, Claude Code kökten okur) ve `README.md` (GitHub giriş sayfası). Diğer her
> şey `docs/` altında (`docs/README.md` indeksi):
> **`docs/ARCHITECTURE.md`** (tek ana mimari) · `docs/AGENT_CONTEXT.md` (hızlı bağlam) ·
> `docs/status/rapor.html` (durum panosu) · `docs/history/SONDURUM.md` (faz durumu — backlog
> B-10 böylece kapandı). Eski mimari dokümanlar `docs/archive/architecture/` içinde
> dondurulmuştur — güncellemeyi `docs/ARCHITECTURE.md`'ye yap.
>
> ⚠️ `docs/AGENT_CONTEXT.md` ve `docs/ARCHITECTURE.md` yollarını **iki script sabit yazar**:
> `scripts/check-drift.mjs` (preload listesi) ve `scripts/agent/drift-rules.mjs` (`docs` dizisi).
> İkisi birebir eşleşmezse `ctx.read()` boş string döner ve drift kuralı **sessizce hiç bulgu
> üretmez** — bu dosyaları taşırsan iki script de güncellenmelidir.

---

## Edge function sayı tarihçesi

_CLAUDE.md satır 883–915 (2026-11-07 öncesi)._

- **Edge Functions — repoda 12 · canlıda 12 · SAPMA YOK** (ölçüldü 2026-09-28 gece:
  `npm run check:functions` + Management API `/v1/projects/<ref>/functions`).

  ⚠️ **Buradaki eski "repoda 11 · canlıda 13 · kesişim 9" tablosu TAMAMEN ÇÜRÜDÜ.**
  Ayrışmanın iki yakası da kapandı; eski tabloya bakıp iş çıkarma:
  - `whatsapp-reply` ve `whatsapp-webhook` **canlıda YOK diye yazılmıştı — YANLIŞ.**
    İkisi de **22 Eylül'de deploy edildi**, bugün `v17 · ACTIVE`.
  - "Canlıda var, repoda yok" denen dördü (`chat-register` · `diaspora-search` ·
    `relocation-chat` · `whatsapp-bot-lookup`) **artık canlıda YOK.**
  - `directory-search` **artık repoda da var** (canlıda `v7`, 22 Eylül).

  Bugünkü 12 (ikisinde de): `directory-search` · `find-matches` ·
  `lansman-admin` (deprecated — handler HTTP 410) · `radar-news-scan` ·
  `relocation-assistant` · `relocation-notifications` · `send-notification-emails` ·
  `send-submission-email` · `site-assistant` · `submit-survey-response` ·
  `whatsapp-reply` · `whatsapp-webhook`.

  `_shared/` bir fonksiyon değil, paylaşılan modüllerdir.

  ⚠️ **WhatsApp fonksiyonları canlıda ama BAĞLANTI KAPALI.** Dört `WHATSAPP_*`
  secret'ının da sakladığı özet değeri **birebir aynıdır** (ölçüldü 28.09) — yani
  hepsi aynı yer tutucu. Gerçek Meta kimlik bilgileri girilmeden `whatsapp-webhook`
  gelen isteklerin HMAC-SHA256 imzasını doğrulayamaz. "Deploy edildi" ile "çalışıyor"
  aynı şey değil; **deploy durumuna bakıp entegrasyonu açık sanma.**

  ⚠️ **Sayıyı ezberleme, iki tarafı da say.** Bu satır DÖRT turdur bayatladı
  (9 → 11 → "canlıda 12" → 13 → gerçek 12). Sebep yapısal: **Coolify edge function
  deploy ETMEZ** (`Dockerfile` yalnız frontend'i kurar), yani commit'lemek canlıya
  çıkarmaz ve tersi de doğrudur — canlıya elle deploy edilen bir sürüm repoda
  görünmez. ✅ Kalıcı çözüm var: **`npm run check:functions`**
  (`scripts/check-functions.mjs`) iki tarafı karşılaştırır; rakam yazmadan önce onu
  çalıştır.

---

## Known Limitations (kapalı maddeler + tarihsel dökümler)

_CLAUDE.md satır 1022–1186 (2026-11-07 öncesi)._

## Known Limitations & Refactor Opportunities

> Consolidated, prioritized roadmap: `docs/refactor/2026-06-09-refactor-backlog.md` (items B1–B10).
> **Re-measured 2026-08-04** — several items below were already closed and are kept here only so
> nobody re-opens them from stale notes.

**CLOSED (do not re-open):**
- ~~B1 `supabase/types.ts` out of sync → ~164 tsc errors~~ → **RESOLVED.** `types.ts` is current
  (`cadde_posts`, `revision_request*` are defined). The 98 remaining `tsc` errors are a completely
  different class — see item 5 below.
- ~~B3 `AdminMembersPage.test.tsx` broken~~ → **OBSOLETE.** That file no longer exists.
- ~~B4 `AdminLayout.tsx` 741 lines, must be split~~ → **RESOLVED.**
  `src/components/admin/AdminLayout.tsx` is now a 6-line barrel.

> ⚠️ **Yeniden ölçüldü 2026-09-05.** Aşağıdaki rakamların ÇOĞU bayattı ve gelecek oturumları
> çoktan ödenmiş borcu yeniden ödemeye yönlendiriyordu. Her satır artık ölçülmüş değerdir;
> ezberleme, değiştirmeden önce komutu tekrar çalıştır.
>
> | İddia (eski) | Ölçüm (2026-09-05) |
> |---|---|
> | ESLint 1280 problem | **0** |
> | 89 `as any` | **9** |
> | 83 `from(` + 42 `rpc(` bileşende | **32** + **4** |
> | 21 auth shim import'u | **18** |
> | 98 `tsc` hatası | **22** |
> | ~78 MB video | **16,4 MB** |

**CLOSED (do not re-open):**
- ~~ESLint debt: 1280 problems~~ → **RESOLVED.** `npm run lint` **0 problem** (ölçüldü 2026-09-05).
- ~~`public/burak-stripe-rehberi.html` publicly served~~ → **OBSOLETE.** Dosya artık yok.
- ~~~78 MB video in `public/`~~ → **BÜYÜK ÖLÇÜDE KAPANDI.** Toplam video **16,4 MB**
  (`hero-network.mp4` 7,8 MB · `whatmaskot.mp4` 5,4 MB · `herovideo.mp4` 3,5 MB).
  `footer-community.mp4` (48 MB) ve `hero-people.mp4` (11 MB) silinmiş. `public/` toplamı 28 MB.

**Open:**
1. **Broken imports (B2) — partially fixed, claim was partly wrong.** `@/lib/radarNews` was never
   the real name: the module is `src/lib/radarNewsPipeline.ts` and it **exists**. The
   `@/lib/mapEntities` and `html-to-image` problems were real, and the 5 dead pages that caused
   them were deleted 2026-08-04 (`MapSearch`, `PostGenerator`, `CityNews`, `WhatsAppGroupLanding`,
   `WhatsAppGroups` — all had zero importers and no route).
2. ~~**Auth shim migration (B5)**~~ → **KAPANDI 2026-09-06.** 16 dosya kanonik
   `@/components/auth/useAuth` yoluna geçirildi, `src/contexts/AuthContext.tsx` silindi.
   Belgelenen `loading`→`isLoading` riski hiç gerçekleşmedi: alias'ı kullanan dosya yoktu.
   Ayrıntı ve test tuzağı için "Authentication & Roles" bölümüne bak.
3. ~~**Mixed data fetching (B6)**~~ → ✅ **KAPANDI 2026-09-27 (A04b).** AuthProvider'daki
   son iki doğrudan sorgu `src/lib/auth-api.ts`'e taşındı; bileşen ve sayfa katmanında
   doğrudan tablo sorgusu KALMADI (multiline arama ile doğrulandı). Aşağıdaki "2 çağrı
   kaldı" dökümü tarihsel kayıt olarak duruyor — **güncel durum değildir.**
   ⚠️ `src/components/InterestForm.tsx` aramada çıkar ama `supabase.storage.from(...)`
   kullanır; depolama kovasıdır, tablo değil, B6 kapsamında değildir.

   *(Tarihsel döküm — 2026-09-13 gece, düzeltilmiş ölçüm.)*
   Sabah ölçümü "8 `from(` + 3 `rpc(` kaldı" diyordu (83+42 → 32+4 → 8+3), ama S1-S10 göçü o
   listedeki 7 dosyayı zaten kapatmıştı — akşam yeniden ölçülünce yalnız `ProfilePage.tsx`'teki
   `individual_profile_details` tablosuna iki çağrı (select+upsert) kalmıştı. Commit `1285337`
   bunu `member-profile-api.ts`'e taşıdı (`upsertIndividualProfileDetailsPatch`); `ProfilePage.tsx`
   artık ince bir sarmalayıcı.

   ⚠️ **"0 kaldı" diye yazılmıştı, YANLIŞTI — aynı gece düzeltildi.** Gerçek sayı **2**, ikisi de
   `src/components/auth/AuthProvider.tsx`'te (satır 14-15 `user_profile_attributes`, satır 19-20
   `user_role_assignments`). Hata ölçüm yönteminde: `supabase\.from\(` deseni **tek satırda**
   arandı, ama bu iki çağrı çok satırlı zincir (`supabase` bir satırda, `.from(...)` altında)
   olduğu için görünmedi. **Bu deseni sayarken multiline arama kullan**
   (`supabase\s*\n?\s*\.from\(`), yoksa borcu sıfır sanırsın.

   Kalan 2 çağrı AuthProvider'da savunulabilir (oturum kurulumu, henüz API katmanı yok) ama
   madde **kapanmadı**. Yeni özellik eklerken `*-api.ts` + React Query kalıbını kullan.
4. ~~**TypeScript loose (B7)**~~ → ⚠️ **ÖLÇÜM 2026-09-28 GECE: gerçek `as any` cast SIFIR.**
   `as any` metni **12** satırda geçiyor ama **hepsi yorum** — şimin neden kaldırıldığını
   anlatıyorlar (`cadde-internal.ts` · `relocation-api.ts` · `relocation-tools-api.ts` ·
   `kadro-api.ts` · `command-center-items/queries.ts` ...). 27.09'daki S-serisi şimleri
   kaldırdı. **Metin geçişini cast sanma**; aşağıdaki eski döküm tarihsel kayıttır:

   ~~**10** satırda `as any` metni geçiyor (3 gerçek cast + 7~~
   yorum/açıklama satırı — 2026-09-13 ölçümü, önceki not "9 kaldı, 6 yorum" idi). Gerçek cast'ler
   bilinçli: `const db = supabase as any` (`cadde-internal.ts` · `relocation-api.ts` ·
   `relocation-tools-api.ts`) — kaldırmak tsc'yi yeniden artırır, hâlâ gerçek iş yapıyorlar.
5. ~~**`tsc -p tsconfig.app.json --noEmit` errors**~~ → **KAPANDI 2026-09-13, SIFIR hata**
   (109 → 22 → 16 → 12 → 9 → **0**). Eskiden burada üç sınıflık (A/B/C) bir döküm tablosu vardı —
   hepsi kapandı: B sınıfı (`Json` sütununa tipli nesne) 2026-09-06'da `src/lib/supabase-json.ts`
   (`toJson`/`fromJson`) ile; A sınıfı (Supabase insert/update payload tipleme, `resource-links.ts` ·
   `turkish-missions-admin.ts` · `LinkManager.tsx` · `MvpManager.tsx` · `submissions.test.ts` ·
   `marquee.test.ts`) ve C sınıfı (sorgu kurucusu özyinelemesi TS2589/TS2769,
   `command-center-items.ts` · `diasporaSearch.ts`) 2026-09-13'te kapandı — C sınıfının çözümü
   `let query: any` + `// eslint-disable-next-line @typescript-eslint/no-explicit-any` deseni
   (`cadde-internal.ts`'teki `const db = supabase as any` ile aynı tuzak). Yeni bir `tsc` hatası
   açılırsa önce bu iki sınıftan birine mi girdiğine bak.
6. **Test coverage spotty** → activate Playwright for critical flows.
7. **Large files** → **800 satırı aşan üretilmemiş dosya: 13 → 5** (ölçüldü 2026-09-13 gece).
   O gece iki dalgada **on bir** dev dosya ayrıştırıldı, **16.615 satır** tek dosyalık
   yığınlardan odaklı modüllere taşındı. Kalan 5'in ikisi test, biri veri, ikisi bilinçli
   ertelenen Cadde dosyası — yani **ertelenenler dışında 800'ü aşan üretim kaynak dosyası
   kalmadı.**

   **Dalga 2 (aynı gece, bağımsız gözden geçirici doğrulamasıyla):**

   | Dosya | Önce | Sonra |
   |---|---|---|
   | `commandcenter/CommandCenterManager.tsx` | 2127 | **25** |
   | `admin-shell/burak-share-tools.ts` | 1418 | **49** |
   | `dashboard/command-center-items.ts` | 1276 | **107** |
   | `admin-shell/social-test-tools.ts` | 1189 | **32** |
   | `dashboard/links/LinkManager.tsx` | 967 | **131** |

   ⚠️ **Dalga 2'nin öğrettiği üç şey** (gözden geçirici ajanlar buldu, ayrıştıran ajanlar
   kaçırmıştı — bu yüzden ayrıştırma ve inceleme AYRI ajanlara verilmelidir):
   1. **`npm run ingest:tools:check` bu refactor sınıfında MUTLAKA çalıştırılmalı.** `src/lib/**`
      altına yeni dosya ekleyen her değişiklik ajan araç kataloğunu (`docs/agent/tools.json` +
      `src/lib/agent/tools-catalog.generated.ts` + `docs/agent/openapi.yaml`) bayatlatır. Bu
      katalog `/admin/tool-registry` ve `/admin/agent-analytics` sayfalarına gider. **Ne lint ne
      test yakalar** — `prelint` yalnız `check:drift` çalıştırır, `ingest:tools:check` DEĞİL.
   2. **`npm run check:dead`** ayrıştırma sırasında geçici olarak kırmızı görünür (parçalar
      oluşturulmuş ama henüz bağlanmamışken). İş bitmeden ölçüp "ölü kod var" sonucuna varma;
      bitince tekrar çalıştır.
   3. **Regex'teki kaçış dizileri ham karaktere çevrilmemeli.** Bir ajan
      `command-center-items/date-groups.ts`'te `/[̀-ͯ]/` desenini gerçek görünmez
      birleştirici karakterlere dönüştürdü. İşlevsel olarak aynı, ama editörde görünmez ve
      kopyalanamaz. Geri alındı — Türkçe metin normalizasyonu yapan kodda bu ciddi bir tuzak.

   | Dosya | Önce | Sonra | Nereye |
   |---|---|---|---|
   | `admin-shell/social-diaspora-posts.ts` | 2934 | **37** | `social-diaspora-posts/posts-*.ts` + `theme-labels` + `types` |
   | `pages/ProfilePage.tsx` | 2782 | **795** | `components/profile/*` + `hooks/profile/*` + `lib/profile-*.ts` |
   | `admin-shell/admin-updates.ts` | 2210 | **31** | `admin-updates/2026-*.ts` (aylık) |
   | `pages/AddWhatsAppPage.tsx` | 1747 | **493** | `components/whatsapp/*` + `lib/whatsapp-landing-*.ts` |
   | `pages/admin/AdminCatalogPage.tsx` | 1249 | **393** | `components/admin/catalog/*` + `lib/admin-catalog-display.ts` |
   | `admin-shell/admin-navigation-registry.ts` | 849 | **40** | `admin-navigation-registry/<grup>.ts` (13 grup) |

   ⚠️ **300+ sayısı 92'den 97'ye ÇIKTI ve bu bir gerileme DEĞİL** — beklenen sonuç:
   2934 satırlık tek dosyayı ~400'erlik 8 parçaya bölmek, 300-500 bandındaki dosya sayısını
   artırır ama tek bir devi yok eder. Bu maddede takip edilecek metrik **800 üstü sayısı**dır,
   300 üstü değil. 300 üstünü sayıp "kötüleşmiş" sonucuna varma.

   ⚠️ **Yeniden ölçüldü 2026-09-28 gece — bu maddenin "kalan iş" kısmı ÇÜRÜDÜ.**
   **Hâlâ 800 üstünde (3):** `CaddePage.test.tsx` (**1845**, test) ·
   `ProfilePage.test.tsx` (**1281**, test) · `zgen-data.ts` (**980**, VERİ).
   Yani **800'ü aşan üretim kaynak dosyası KALMADI**; üçünün ikisi test, biri veri.

   ~~**Sıradaki gerçek iş = Cadde çifti**~~ → **KAPANDI.** `cadde-api.ts` **986 → 183**,
   `CaddePage.tsx` **1716 → 670**. İkisi de artık bölünmüş durumda; bu maddeyi
   "Cadde ikilisi ertelendi" diye yeniden açma.

   Kalan (isteğe bağlı) iş: 500–800 satır bandındaki **34** üretim dosyası
   (test ve üretilen dosyalar hariç, `git ls-files` ile sayıldı).

   ⚠️ Cadde dosyalarına dokunurken hâlâ geçerli olan kural: CLAUDE.md'nin Cadde bölümü
   bu alanın *sessizce* kırıldığı üç ayrı olayı belgeliyor (fold-insensitive eşleşme,
   `instanceof Error` hatası aylarca canlıda kaldı, hedef eşleşmesi).
   **Doğru sıra: önce karakterizasyon testi yaz, sonra ayrıştır.**

   ⚠️ **Satır sayarken Windows tuzağı:** PowerShell'in `Measure-Object -Line`'ı **boş satırları
   saymaz** — `burak-share-tools.ts` için 1091 der, gerçek 1418'dir. Doğru ölçüm
   `(Get-Content $f).Count` veya `wc -l`. Bu farkla ölçülen bir "iyileşme" sahtedir.

   `src/integrations/supabase/types.ts` (15.764) · `src/lib/agent/tools-catalog.generated.ts`
   (3242) · `src/data/geoCountries.generated.ts` (1013) ÜRETİLEN dosyalardır, sayıma dahil değil.
8. ~~**Duplicate images in `public/`**~~ → **YENİDEN ÖLÇÜLDÜ 2026-09-13, KAPANDI.**
   `sweet.png` gerçekten ölüydü, silindi (13 Eylül Q1) — `sweet.jpg` tek kalan, kullanılan
   dosya. `last.png`/`newbg.png` byte-birebir aynı dosya (763.198 bayt) ama **ikisi de
   kullanılıyor**: `May19CampaignPage.tsx` ikisini de ayrı katmanlar için ayrı ayrı
   çağırıyor (biri marquee/OG varsayılanı, öbürü "poetic layer"). `og-image.png`
   (`MarqueeItemCard.tsx` · `marquee.ts` · `AdminMarqueePage.tsx` · `DiasporaDetailPage.tsx`)
   ile `og-image-new.jpg` (`seo.ts`) de aynı şekilde — ikisi de canlı, farklı rolde. **Bu üç
   çift "duplicate" değil, benzer görünümlü ama ayrı amaçlı dosyalar — silme.**

---

## Already done (bayat rakamlarla)

_CLAUDE.md satır 1046–1050 (2026-11-07 öncesi)._

**Already done:** App.tsx modularized (61 `lazy()`), single Supabase client, legacy auth tables
dropped (single system), `admin.ts` split into `admin/` domain modules, `types.ts` regenerated,
`AdminLayout` reduced to a barrel, 0 `console.log` under `src`, nginx security headers + CSP,
single-source redirect table.
