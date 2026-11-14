# Devir: Repo düzenleme turu (Faz 1–4 tamam; Faz 1–3 main'de, Faz 4 `refactor/duzen-faz4-lib` dalında) — 13–14.11.2026

> **Kaynak plan:** `C:/Users/baris-terzioglu/.claude/plans/repoda-klas-r-ve-dosya-enchanted-treasure.md`
> **Çalışma şekli (kullanıcı onaylı):** stacked dallar — her faz bir öncekinin üstünde; merge'leri kullanıcı sırayla yapacak.
> **Güncelleme 13.11 gece (Claude devraldı):** Dalga 4 commit'lendi (`76a793eb`), hook yeni yoldan koştu ("304 kayıt tarandı"). Faz 2 kapanış kapıları ve grep kanıtı §1.2–1.3'te sonuçlarıyla. Faz 3 (admin sayfaları) aynı gece tamamlandı — bkz §2b. Faz 4 (src/lib) BAŞLAMADI — §7'den devam.

---

## 0. ÖZET (30 saniyelik durum)

| Faz | Dal | Durum |
| --- | --- | --- |
| Faz 0 (hazırlık) | — | ✅ Taban yeşil ölçüldü: **test 526 dosya / 4686** · lint ✅ · verify:quality ✅ · check:dead (0 yeni/5 borç/1064) · knip ✅ · format ✅ · docs:strict 0 hata/10 uyarı |
| Faz 1 (kök + docs) | `refactor/duzen-faz1-docs` | ✅ **Tamam, commit `0434a9ec`** (43 dosya). Tüm kapanış kapıları yeşil. |
| Faz 2 (scripts/) | `refactor/duzen-faz2-scripts` (faz1 üstünde) | ✅ Dalga 1–4 **commit'li** (`72196ccd`, `7748b25b`, `a3fbd390`, `76a793eb`). Kapanış kapıları: bkz §1.2 (sonuçlar işlendi). |
| Faz 3 (admin pages) | `refactor/duzen-faz3-admin-pages` (faz2 üstünde) | ✅ 9 modül dalgası + docs commit'li; kapanış kapıları §2b |
| Faz 4 (src/lib) | `refactor/duzen-faz4-lib` (main üstünde) | ✅ 5 dalga commit'li (12 domain klasörü, 263 dosya); kapanış kapıları §2c. Push/merge YAPILMADI |

**Faz 4 (14.11, sonradan):** `refactor/duzen-faz4-lib` dalında 5 dalga commit'li, main'e ALINMADI, push edilmedi — bkz §2c. Aşağıdaki paragraf Faz 1–3 anına aittir. ⚠️ `repo-duzen-bitti-2026-11-14` tag'ı Faz 3 sonunu gösterir (Faz 4 o gün bitmemişti); Faz 4 merge edilince yeni bir tag (örn. `repo-duzen-faz4-bitti-<tarih>`) atılması önerilir, eski tag silinmedi.

**Şu an (14.11, Faz 3 sonu):** Faz 1–3 **main'e fast-forward alındı ve push edildi** (`1485b2ce`, CI Quality yeşil). Tag'ler: `kokten-degisiklik-oncesi-2026-11-14`, `repo-duzen-bitti-2026-11-14` (ikisi de `1485b2ce`, origin'de). DB + storage yedeği alındı: `C:\temp_private\corteqs\yedekler\2026-11-14-kokten-oncesi` (ayrıntı: `docs/plans/2026-11-14-kokten-degisiklik-oncesi-yedek-ve-tag-plani.md` → Uygulama sonucu). **Canlı deploy YAPILMADI** (Coolify elle). Geri yükleme provası + ikinci kopya açık: KALANLAR BK01. Üç refactor dalı main'de birleşik; yerelde duruyor, silinmedi.

---

## 1. HEMEN YAPILACAKLAR (sırayla)

### 1.1 Dalga 4'ü commit'le — ✅ YAPILDI (`76a793eb`, hook çıktısı: `[sync-admin-updates] 304 kayıt tarandı, 0 yeni`)
Aşağıdaki talimat tarihsel; mesaj §6'daki taslakla atıldı.
```bash
git commit -F <mesaj-dosyası>   # veya §6 taslağıyla
```
⚠️ **Commit çıktısında `[sync-admin-updates] NNN kayıt tarandı` satırını GÖR.** Görmüyorsan
`.git/hooks/post-commit` sessiz kırılmıştır (hook `|| true` ile hep 0 döner). Hook bu turda
`scripts/ops/sync-admin-updates.mjs`'e güncellendi ve **ilk gerçek koşusu bu commit'te olacak**
(`../..` REPO_ROOT ve `../../src/.../admin-updates.ts` düzeltmelerinin canlı kanıtı).

### 1.2 Faz 2 kapanış kapıları (plan §2.4) — KOŞULDU (13.11 gece)
| Kapı | Sonuç |
| --- | --- |
| verify:quality | ✅ |
| lint (prelint: verify:text + drift + docs:strict) | ✅ 0 hata / 10 uyarı |
| check:dead | ✅ |
| check:knip | ✅ |
| ingest:tools:check | ✅ "Katalog güncel" |
| format:check | ❌→✅ tek dosya (`scripts/generate/generate-ai-faq.test.mjs`, Dalga 3'te uzayan satır) — düzeltildi, commit `3c08857e` |
| build | ✅ (vite, 28.5 s) — ⚠️ prebuild + `vite-plugin-image-optimizer` **`public/` altındaki 49 izlenen dosyayı yerinde değiştirdi** (48 görsel yeniden sıkıştırma + sitemap.xml canlı veri). Hepsi `git restore -- public` ile geri alındı, commit'e girmedi. Bu davranış Faz 2'den bağımsız, main'de de böyle; build sonrası `git status -- public` ZORUNLU. |
| npm run test | ✅ **526 dosya / 4686 test** (263 s) — tabanla birebir |

⚠️ **Vitest tuzağı (hafıza kaydı doğrulandı):** bash `cd /c/...` ile başlatılan koşuda 522/526 dosya suite düzeyinde düştü; aynı dosya PowerShell'de `C:\...` (büyük harf) ile yeşil. Tam koşuyu DAİMA büyük harfli sürücüden başlat.
```bash
npm run verify:quality && npm run lint && npm run test && npm run check:dead && npm run check:knip && npm run ingest:tools:check && npm run format:check && npm run build
```
Beklenen: test **4686 / 526** (tabanla birebir) · dead 0 yeni · docs:strict 0 hata · build ✓.
Not: `npm run test` öncesi/sonrası `git status` temiz kalmalı (pretest verify:text dosya değiştirmez).

### 1.3 Faz 2 grep kanıtı — ✅ ÖLÇÜLDÜ: `scripts` kökü 0 düz dosya; istisnalar dışında kalan 4 eşleşme SİLİNMİŞ scriptlere tarihsel atıf (`extract-commercial-docs.mjs` CLAUDE.md:721, `notify-admin-updates.mjs` ×3) — taşınan dosya değil, dokunulmadı.
```bash
git ls-files scripts | awk -F/ 'NF==2'        # BOŞ olmalı (scripts kökü düz dosya 0 — şu an zaten 0)
git grep -n -I -E "scripts/[a-z-]+\.mjs" -- ':!docs/archive' ':!docs/history'
```
İkinci grep'te **bilinen istisnalar** (dokunulmaz, bkz §3.4): `supabase/migrations/**` (9 atıf) ·
`supabase/manual/2026-07-29_seed_notification_outbox_backfill.sql:17` ·
`src/lib/admin-shell/admin-updates/2026-07.ts:390` ·
`docs/audits/2026-09-20-orphan-sayfa-denetimi.md:237` (`check-orphan-routes.mjs` ÖNERİ adı, dosya yok).
Bunlar dışında eşleşme çıkarsa Dalga 4 bulk-replace'i bir şey kaçırmıştır → düzelt.

### 1.4 Faz 2 ölçüm tablosu (PR açıklaması için)
```powershell
foreach ($d in 'src/lib','src/pages/admin','src/components','src/hooks','scripts','docs') { $files = @(git ls-files -- $d); $depth = ($d -split '/').Count; $root = @($files | Where-Object { ($_ -split '/').Count -eq $depth + 1 }).Count; "{0,-18} kök:{1,4} toplam:{2,4}" -f $d, $root, $files.Count }
```
Faz 0 tabanı: src/lib 423/466 · pages/admin 73/105 · components 78/446 · hooks 49/49 · **scripts 74/148 → hedef 0/148** · docs 10/408 (Faz 1 sonrası 3).
**Faz 2 sonu ölçümü (13.11 gece, komut yukarıdaki):** src/lib 423/631 · pages/admin 73/131 · components 47/552 · hooks 29/69 · **scripts 0/114** · docs 3/1150. (Faz 0 satırındaki "toplam" sayıları farklı yöntemle alınmış görünüyor; karşılaştırma için bu komutun çıktısını kullan.)

### 1.5 Sonra
Faz 3 (`refactor/duzen-faz3-admin`, faz2 üstünde stack) → Faz 4 (`refactor/duzen-faz4-lib`). Plan §3/§4'e bak. Faz 4 notları bu dosyanın §7'sinde.

---

## 2. NE YAPILDI (faz faz)

### Faz 1 — commit `0434a9ec` (dal `refactor/duzen-faz1-docs`)
- **§1.1** Kökteki 6 izlenmeyen dosya → `docs/notes/` (5) + `docs/plans/` (1). CTO PDF tarihi plan notuna göre DOSYADAN alındı: `2026-10-09-corteqs-teknik-mimari-cto.pdf` (tablodaki 2026-11-10 ön-doldurmaydı). `plan-ozet.md` → `docs/plans/2026-11-07-ocak-lansmani-plan-ozeti.md`; içindeki `sharded-bubbling-tower.md` atfı `(repoda yok)` işaretlendi (dosya repoda gerçekten yok, doğrulandı).
- **§1.2** `CorteQS_Rol_Tablosu_v2.xlsx` → `docs/assets/` (git mv). Generator satır 5 yorum + satır 18 yol, `seed-role-structure-from-excel.py:22` güncellendi. **RT02 bulundu** (bkz §3.1) → role-structure.ts KORUNDU, doğrulama koşulamadı.
- **§1.3** docs kökü 7 dosya → `operations/` (coolify-deployment, migration-runbook, migration-status, supabase-exit-plan, supabase-plan-decision) + `guides/` (as-any-policy, project-overview — plan tablosu lowercase'e rename öngörüyor, uygulandı). 43 atıf güncellendi (docs içi çaprazlar, infra/selfhost README+sql+compose, scripts/migration 2 yorum, docs/README tablosu yeniden yazıldı, KALANLAR `../guides/as-any-policy.md`). KALANLAR üçlüsü (README/AGENT_CONTEXT/ARCHITECTURE) kökte kaldı ✓.
- **§1.4** 12 boşluklu/Türkçe/NFD yol → ASCII slug (Node script `git ls-files -z` + `git mv` — NFD BROŞÜR png'ler dahil hepsi %100 rename). 2 HTML'in `_files/css2` href'i yeni dizin adıyla düzeltildi. Kanıt: `git ls-files | grep '^"'` = 0, `grep ' '` = 0.
- **§1.5** public/ kök görselleri YALNIZ RAPOR → KALANLAR **PUB01** satırı (kullanım sayılarıyla).
- `.gitattributes`: `*.docx binary`, `*.xlsx binary` eklendi.

### Faz 2 Dalga 1 — commit `72196ccd` (vite-plugins, 9 dosya)
`strip-html-comments`, `route-modulepreload`, `env-config-order` (.mjs+.d.mts+.test.mjs) → `scripts/vite-plugins/`.
`vite.config.ts:6-8` · `index.html:9` yorumu · `verify-release.mjs:5` (ara adım `./vite-plugins/…`, Dalga 2'de `../vite-plugins/…` oldu) · satır-1 yorumları.
Kapılar: typecheck:node ✅ · vitest 3/18 ✅ · **vite build ✅ (4926 modül, 15.79s)**.

### Faz 2 Dalga 2 — commit `7748b25b` (check/ 11 + verify/ 3)
- `..`→`../..`: check-dead-code:5, check-functions:12, check-migrations:31, verify-release:9. (check-bundle-size/check-docs/check-drift/verify-text-encoding **cwd tabanlı — değişiklik gerekmedi**.)
- Cross-folder: `check-drift.mjs:13` → `../agent/drift-rules.mjs`; `verify-release.mjs:5` → `../vite-plugins/env-config-order.mjs`.
- `check-drift.mjs:91` generated_by → `scripts/check/check-drift.mjs`; **drift-report.json regenerate edildi** (diff yalnız generated_by satırı, total:0 aynı).
- `config-paths-exist.test.mjs:53` (check-drift'i cwd'den okur) → yeni yol. package.json 11 yol. 41 atıf/21 dosya (CLAUDE.md 3, docs/README, kullanim-kilavuzu.html, audits/plans/operations/handover/kalanlar/cleanup).
- drift-rules.mjs **değişmedi** (agent/ yerinde; preload/docs dizisi coupling'i yol taşınmasından etkilenmiyor — ikisi de docs yolu, script yolu değil).
- Kapılar: lint ✅ (prelint = verify:text 2230 + drift 0 + docs:strict 0/10 + eslint 0) · check:dead ✅ · **vitest scripts 42 dosya/345 test ✅** · check:bundle ✅ (250.6 KB gzip / bütçe 271 KB) · verify:release ✅ ("dist release looks consistent") · check:migrations:warn çalıştı (psql yok — canlı bacak çevresel, exit 0) · check:functions çalıştı (repo 19/canlı 16; eksik 3 = bilinen U14/G05b deploy kuyruğu; **çıkışta libuv assertion crash — Windows/Node çevresel, çıktı tamamlandıktan sonra, kapı zincirinde değil**).

### Faz 2 Dalga 3 — commit `a3fbd390` (generate/ 13 dosya)
- `..`→`../..`: 6 üreteç (ai-faq:19, investor-stats:19, llms-full:23, role-structure:17, rss:23, sitemap:16). Testlerde `../src`→`../../src`: rss.test:8 (redirects.ts), sitemap.test:17 (source-slice), investor-pass-hash.test:4.
- Aynı-klasör importlar değişmedi: `generate-rss.mjs → ./generate-sitemap.mjs` ✓.
- 87 atıf/42 dosya: package.json 9 · `investor-route-contract.test.ts:37,82` · `generate-sitemap.test.mjs:239` (cwd'den kendi kaynağını okur) · `supabase-chunked.ts`/`lansman-regression`/`route-seo` yorumları · CLAUDE.md, ARCHITECTURE.md, audits/plans/operations/security/investor · `scripts/ai-knowledge/client.mjs`.
- **role-structure.ts: YALNIZ 2 yorum satırı** yeni üreteç yolu (kural 6: yol satırları; veri değişmedi) + generator şablonu (satır 8/67/70) senkron — gelecekteki regenerate tutarlı üretecek. **Generator ÇALIŞTIRILMADI** (RT02 — boşaltırdı), yalnız `node --check` ✅.
- Kapılar: vitest 11 dosya/203 ✅ · `ai:faq:check` ✅ "faq.json güncel" · `ai:full:check` ✅ · **generate:sitemap + generate:rss yeni yoldan KOŞTU**: rss.xml bayt-birebir aynı; sitemap.xml'de YALNIZ canlı katalog verisi farkı (lastmod tarihleri +2 silinen kayıt; statik/ticari/blog birebir aynı) → **canlı-veri drifti commit'e karıştırılmadı, `public/` geri alındı** (kural 4).
- **INV01 bulundu** (bkz §3.2) → KALANLAR'a işlendi.

### Faz 2 Dalga 4 — **STAGED, COMMIT'SİZ** (ops/ 11 + seed/ 17 + guards/ 10 = 38 dosya)
Dosya haritası §5'te. Yapılan düzeltmeler:
- `..`→`../..` (16): ops → ai-visibility-track:23, apply-migration:11, preview-emails:17 (`new URL`), sync-admin-updates:31 (`new URL`), warm-prerender:21; seed → download-pexels:15, export-blog-md:22, export-command-center-md:16 (`join`), import-command-center-may13:8, import-profiles-csv:18, onboarding-import:9, onboarding-report:9, reseed-social-share:27, seed-burak-share:12, seed-fallback-image-pool:14; guards → notification-dispatch-secret-migration.test:7.
- `ingest-tools.mjs`: statik `./agent/walk|extract` → `../agent/` **VE planın atladığı dinamik importlar** `await import("./agent/openapi.mjs")`:152 + `("./agent/push.mjs")`:180 → `../agent/` (ERR_MODULE_NOT_FOUND ile yakalandı, düzeltildi).
- `preview-emails.mjs:19` TEMPLATE_MODULE `../supabase/...` → `../../supabase/...` · `sync-admin-updates.mjs:32` ADMIN_UPDATES_MODULE `../src/...` → `../../src/...`.
- `import-profiles-csv.mjs:19` `path.join(__dirname, "catalog-role-import-map.json")` → **değişiklik gerekmedi** (json da seed/'e taşındı, aynı klasör).
- `seed-role-structure-from-excel.py`: `.parent.parent` → `.parent.parent.parent` (excel_path:22 + output_path:23) + kullanım yorumu (2 yer). **py_compile ✅**.
- `setup-notification-dispatch.ps1`: `$repoRoot = Split-Path -Parent $PSScriptRoot` → **çift Split-Path** (bir seviye derin) + 4 backslash kullanım yorumu `.\scripts\ops\...`.
- guards: `lovable-forbidden-strings.test.mjs:149,194` **self-exclusion** kendi yeni yoluna güncellendi (güncellenmese dosya kendini tarayıp kırmızıya düşerdi) · `notification-dispatch-secret-migration.test:29` .ps1 yolu → `scripts/ops/...`.
- **`.git/hooks/post-commit` GÜNCELLENDİ** (local, izlenmiyor): `scripts/sync-admin-updates.mjs` → `scripts/ops/sync-admin-updates.mjs`. Plan bunu ÖNGÖRMEMİŞTİ; hook `|| true` ile sessiz kırılırdı.
- Bulk replace: **114 atıf / ~50 dosya** (package.json 14 yol · .gitignore+.env.example yorumları · CLAUDE.md · docs (agent kataloğu, operations, plans, kalanlar, handover, cleanup, superpowers) · scripts/agent/openapi.mjs+push.mjs · check-drift.mjs:10 (ingest-tools yorumu) · src yorumları: admin-updates.ts başlığı, catalog-import-api/schemas, AdminToolRegistryPage, html.ts).
- **HATA + GERİ ALMA (bkz §3.4):** bulk replace 7 migration + 1 manual seed + `2026-07.ts`'e dokundu → **hepsi `git checkout --` ile geri alındı** (migration değiştirilemez; 2026-07.ts yayınlanmış bildirim kaydı içeriği).
- **`npm run ingest:tools` KOŞTU ✅** (94 tool) → tools.json/openapi.yaml/tools-catalog.generated.ts regenerate (diff yalnız generated_by satırları — katalog tool yolları scripts'i içermiyormuş) · `ingest:tools:check` ✅ "Katalog güncel".
- **`npm run preview:emails` KOŞTU ✅** — `../../supabase/.../member-welcome.ts` yeni yerden çözüldü, 2 şablon yazıldı (.preview-emails gitignore'da).
- Doğrulamalar: **node --check 35/35 ✅ · vitest scripts 42 dosya/345 test ✅ · py_compile ✅**. DB-yazan seed/import'lar ve ağ scriptleri (warm-prerender, ai-visibility-track, apply-migration, sync-admin-updates) plan gereği ÇALIŞTIRILMADI.
- `.pyc` kazası: py_compile `__pycache__` üretti, `git add scripts` ile stage'lendi → **index'ten çıkarıldı** (`git reset -- scripts/seed/__pycache__`), diskten silindi. Staged durumda YOK.


### Faz 3 — `refactor/duzen-faz3-admin-pages` (13.11 gece, Claude) — §2b

Dalga sırası planla aynı; her modül bir commit, her commit öncesi tsc + hedefli vitest (App.admin-route + regresyon sözleşmesi + modül testleri) + eslint + prettier yeşil:

| Dalga | Commit | Klasör | Taşınan | Not |
| --- | --- | --- | --- | --- |
| 1 | `d41f8436` | `cadde/` | 6 sayfa + 2 test | mevcut routes.tsx import yolları; vi.mock + 2 readFileSync literal'i |
| 2 | `c7849792` | `radar/` | 4 sayfa | routes.tsx `../AdminRadarX` → `./AdminRadarX` |
| 3 | `2b845d06` | `referral/` | 4 sayfa | YENİ routes (fragment); `lansman-regression-contract.test.ts:410` artık referral/routes.tsx okur |
| 4 | `e34cb25b` | `gruplar/` | 4 sayfa + 1 test | YENİ routes; `AdminGruplarPage.test` G24 üçlüsü gruplar/routes.tsx + kökte mount iddiası |
| 5 | `fca94f57` | `roles/` | 4 sayfa + 1 test | YENİ routes; new-member/* Navigate satırları KÖKTE (sözleşme testi orada arar) |
| 6 | `022a2b1c` | `may19/` | 2 sayfa | YENİ routes |
| 7 | `bce43402` | `social/` | 5 sayfa | YENİ routes; `advisors` iç içe bloğu (index Navigate + :profile) aynen taşındı; AdminResourceLinksPage route'suz ortak bileşen |
| 8 | `ba093f25` | `rehber/` | 4 sayfa + 3 test | YENİ routes (whatsapp-landings/guide dahil) |
| 9 | `4597f2d2` | `sistem/` | 8 sayfa + 3 test | YENİ routes; AdminToolRegistryPage buraya (plan tablosu) |
| docs | `fd290042` | — | 25 doküman + check-docs.test | `src/pages/admin/AdminX` atıfları yeni yola (archive/history hariç) |

- **Mekanizma:** iki geçici script (`move-admin-pages.mjs`: git mv + `@/pages/admin/X` ve `src/pages/admin/X.tsx` literal yeniden yazma src/e2e/scripts/eslint-suppressions.json'da; `extract-routes.py`: kök routes.tsx'ten lazy + tek satırlı `<Route>`'ları modül dosyasına çıkarıp yerine `{adminXRoutes}` koyar). ⚠️ İlk sürümde taşınan dosyanın KENDİ importu atlanıyordu (liste taşıma öncesinden alınmıştı) — düzeltildi; iki kez kontrol: `git grep "pages/admin/AdminX"` her dalgada 0.
- **URL'ler değişmedi:** tüm modül routes'ları düz path'lerde fragment döner; yalnız cadde/radar (zaten sarmalı) ve advisors (zaten iç içe) sarmalı. `admin-route-meta.ts` / navigasyon kaydına dokunulmadı.
- **eslint-suppressions.json:** 8 anahtar yeniden yazıldı (prune değil); kökte kalan 2 anahtar (AdminCustomerRequestsPage, AdminEventsPage) kökte kalan sayfalara ait. `npx eslint . --prune-suppressions` koşulmadı — lint zaten yeşil, "kullanılmayan bastırma" uyarısı yok.
- **Kök sayım:** 73 → **22** (14 sayfa + 7 test + routes.tsx) — plan §3.1 "kökte KALIR" listesiyle birebir. `git grep -o "pages/admin/Admin[A-Za-z]+" src | sort -u` → tam o 14 sayfa.
- **Kapsam dışı bırakılan:** tarayıcı kontrolü (`npm run dev` 8080 çakışması — B09) YAPILMADI; kök `routes.tsx` render eden `App.admin-route.test` + `App.admin-cadde-route.test` ve regresyon sözleşmesi (101 test) her dalgada yeşildi.
- **Faz 3 kapanış kapıları (plan §3.3):** verify:quality ✅ · lint ✅ (0 hata/10 uyarı) · check:dead ✅ · check:knip ✅ · ingest:tools:check ✅ "Katalog güncel" · format:check ✅ · build ✅ (1 dk 2 sn; `public/` drifti 1 dosya, geri alındı) · npm run test: ✅ **526 dosya / 4686 test** (445 s, tek başına koşuda) — tabanla birebir
  ⚠️ İlk tam koşu üç ağır işle (zincir + test + build) PARALEL yapıldı: 4 dosya `Failed to start forks worker` (kaynak), `lovable-forbidden-strings` "untracked taranır" testi 83 sn'de düştü — beşi izole koşuda 52/52 ✅. Ders: tam testi build ile aynı anda koşturma.


### Faz 4 — `refactor/duzen-faz4-lib` (14.11, Claude) — §2c

Plan §4 birebir izlendi: küçükten büyüğe, cadde en son. Her dalga: git mv → AST tabanlı yeniden yazma → tsc → `ingest:tools` → test → statik kapılar → commit.

| Dalga | Commit | Klasörler | Dosya | AST specifier / dosya |
| --- | --- | --- | --- | --- |
| 1 | `1ad598b3` | surveys (3) · radar (4) · service-finder (4) · referral (5) | 16 | 60 / 57 |
| 2 | `a48a748c` | germany (10) · muhasebe (14) · catalog (15) · events (17) | 56 | 170 / 146 |
| 3 | `53d78d5a` | profile (23) · group (34: group-* + whatsapp-landing*) | 57 | 144 / 117 |
| 4 | `e4dccecb` | relocation (58, relocation-tools-* dahil) | 58 | 159 / 113 |
| 5 | `5b9c83be` | cadde (76, cadde.ts barrel dahil) | 76 | 253 / 141 |

`src/lib` kök dosya sayısı **423 → 160**. Dosya sayıları plan §4.1 tablosuyla birebir (16/56/57/58/76 = 263).

**Mekanizma (geçici, commit'lenmedi):** `move-lib.mjs` — TypeScript derleyici API'siyle her import/export/dinamik import/`vi.mock`/`import()` tipini çözer; taşınan hedefe giden alias'ı `@/lib/<klasör>/<ad>` yapar, taşınan importer'ın göreli yollarını yeniden hesaplar (`../x` → `@/x`), ardından `src/lib/<ad>.ts` ve `@/lib/<ad>` sabit literal'lerini metin geçişiyle düzeltir (eslint-suppressions.json, tsconfig.strict-pilot.json, eslint.config.js, dokümanlar dahil). Plan §4.2'nin regex'li tarifinden bilerek sapıldı: göreli importlar, `vi.mock` ve dinamik importlar regex'le güvenilir çözülmez. Shim BIRAKILMADI.

**AST'nin göremediği, test/uyarıyla yakalanıp ELLE düzeltilenler (sonraki taşımalar için ders):**
1. **Konumdan repo kökü hesaplayan testler** (`resolve(__dirname, "../..")`): bir seviye derine inince `src/src/...` oluşur → 3 grup testi `"../../.."` yapıldı. Araç artık taşınan dosyalarda `__dirname`/`import.meta` kullanımını uyarı olarak basar (Dalga 4–5'te 0).
2. **Parçalı yol kuran test** (`path.join(SRC_ROOT, "lib", "profile-phone.ts")`): `phone-country-derivation.test.ts` → `"lib", "profile", ...`. Araç artık `"lib", "<taşınan ad>"` kalıbını da uyarır.
3. **`src/lib` kökünü düz tarayan test:** `cadde-write-diagnostics.test.ts` → `src/lib/cadde`. Testin kendi "bayat/sabit liste kapanı" (`>= 11 dosya`) bunu YAKALADI — korumalar çalışıyor.
4. **Regex literal içinde kaçışlı yol:** `@\/lib\/cadde-carsi-api` (`cadde-carsi-admin-api.test.ts`) — metin geçişi `@/lib/...` arar, kaçışlıyı görmez. Tüm repoda `@\/lib\/` arandı: başka taşınan-ad hit'i yok.
5. **Planın uyardığı ama sorunsuz çıkanlar:** `group-settings.test.ts` (özyinelemeli, `allowed` listesi metin geçişiyle güncellendi), `profile-text-health.test.ts` (`src/lib`'i taramıyor), `walk.mjs` cadde/muhasebe öneki (alt klasörde de eşleşir), `ingest-tools` seçicisi (zaten özyinelemeli; 72 modül aracı sabit, `tool_key` dosya adından türer).
6. **commit'e girmeyen kalıntı:** `supabase/functions/relocation-assistant/index.ts` yorum satırı yol güncellemesi ilk `git add` kapsamının dışında kaldı → Dalga 4 commit'ine amend. Sonraki `git add` kapsamına `supabase e2e` eklendi.

**Cadde karakterizasyonu (plan §4 kuralı):** `vitest run cadde` taşımadan önce **75 dosya / 645 test**, sonra **75 dosya / 645 test**.

**Faz 4 kapanış kapıları:** tam test: ✅ **526 dosya / 4686 test** (346 s, tek başına koşuda — tabanla birebir) · build: ✅ vite 14,5 sn + `verify:release` tutarlı (`public/` driftı 1 dosya, geri alındı) · verify:quality ✅ · lint ✅ · check:dead ✅ · knip ✅ · ingest:tools:check ✅ · format:check ✅ · `git grep "@/lib/cadde-" src` → 0.
**Dokunulmayanlar (bilinçli):** tarihli devir/denetim/durum dokümanlarındaki `src/lib/cadde-*.ts` glob atıfları (o günün kaydı); `docs/archive|history|reference`; migration içindeki yol yorumları.

---

## 3. KARARLAR / BULGULAR (devralan mutlaka okusun)

### 3.1 RT02 — generate-role-structure.mjs ÇALIŞTIRILMAZ (KALANLAR'da kayıtlı)
- Bug **önceden var**: satır 22 `read(excelPath)` yol string'ini binary içerik gibi parse ediyor → çöp "Sheet1", 0 satır → dosyayı 13 satıra BOŞALTIR. Doğrusu `read(readFileSync(excelPath))` (xlsx CommonJS; `readFile` named export YOK — denendi).
- Committed `src/lib/role-structure.ts` (2116 satır) güncel xlsx'e göre **bayat + Prettier-biçimli** (49→52 alt rol, Bireysel eskiKod ""→"—", tırnaksız anahtar). Plan "üretilen çıktı değişmemeli" dediği için dosya KORUNDU; bug zorlanmadı (plan kural 6/9).
- Geçici scriptle kanıtlandı: `read(readFileSync)` ile 259 satır/7 ana rol/19 ÖNERİ üretiliyor, committed'den ~1585 satır farklı.
- **Ayrı iş (RT02):** bug'ı düzelt + template yorumlarını (satır 67/70 Dalga 3'te yeni yola güncellendi) koru + regenerate + Prettier + drift'i uzlaştır + RT01 rol seçiciyle ilişkilendir.

### 3.2 INV01 — investor stats main'de BAYAT (KALANLAR'da kayıtlı)
`npm run investor:stats:check` **Faz 2'den önce de kırmızıydı** (main'de): sourceFiles 1067→1073 · productionLines 159045→158683 · testFiles 506→528 · e2eSpecs 11→12 · components 416→417 · migrations 532→534. Sebep: 8–9 Kasım commit'leri (L3 testleri, L10 migration'ları) stats'ı üretmemiş; son üretim `f5683512`. CI'da koşmuyor. **Düzeltme: ayrı commit'te `npm run investor:stats`** — refactor commit'ine karıştırılmadı (kural 4). Bu turda generated_by yorumu şablonla tutarlı güncellendi.

### 3.3 PUB01 — public/ kök görselleri (KALANLAR'da kayıtlı)
Yalnız rapor (plan §1.5): kullanım sayılarıyla KALANLAR §1.9'da. Taşıma YOK (runtime URL + `public-asset-boundary.test.mjs` + B-13 "silme onayla").

### 3.4 Dokunulmaz dosyalarda eski yol atıfları — BİLİNÇLİ İSTİSNA
Dalga 4 bulk-replace'i yanlışlıkla migration'lara da dokundu; **tümü geri alındı**. Eski `scripts/<eski-yol>` atıfları şu dosyalarda **bilerek** duruyor (tarihsel kayıt / değiştirilemez):
- `supabase/migrations/applied/` 5 dosya (9 atıf) + `archive/` 2 dosya — **migration değiştirilemez** (check-docs KIRIK-MIG kuralı).
- `supabase/manual/2026-07-29_seed_notification_outbox_backfill.sql:17` — ÇALIŞTIRILMIŞ tarihsel seed içeriği.
- `src/lib/admin-shell/admin-updates/2026-07.ts:390` — **yayınlanmış bildirim kaydı**; içerik değişirse sync-admin-updates/outbox taraf etkisi riski + gönderilmiş e-posta metninin repo kopyası değişmiş olur.
- `docs/audits/2026-09-20-orphan-sayfa-denetimi.md:237` — `check-orphan-routes.mjs` ÖNERİ adı (hiç var olmadı).
- `docs/archive/**`, `docs/history/**` — plan §2.4 grep'inden zaten muaf.
§1.3'teki grep kanıtı bu istisnalarla birlikte değerlendirilecek.

### 3.5 Canlı-veri drift'i commit'e karıştırılmaz
Dalga 3'te generate:sitemap canlı kataloğu çekti → `public/sitemap.xml`'de lastmod/URL farkları oluştu (statik bölümler birebir aynıydı = taşıma doğru). `git checkout -- public/sitemap.xml` ile geri alındı. **Aynı durum Faz 2 kapanışındaki `npm run build`'de tekrar olur** (prebuild → generate:sitemap/rss/ai:faq/ai:full): build sonrası `git status`'ta public/ diff'i görürsen ve diff yalnız canlı katalog verisiyse geri al, commit'e katma. (ai:faq/ai:full/rss deterministik — fark beklenmez; INV01 yüzünden investor:stats prebuild'de YOK, sorun değil.)

### 3.6 Planın atladığı, bu turda bulunanlar
1. `.git/hooks/post-commit` → sync-admin-updates yolu (güncellendi, ilk koşu Dalga 4 commit'inde — §1.1 uyarısı).
2. `ingest-tools.mjs` **dinamik** importları (`./agent/openapi|push`) — statik grep yetmez, `import(` de taranmalı.
3. `verify-release.mjs → env-config-order.mjs` cross-folder import (Dalga 1'de ara, Dalga 2'de kesin düzeltme).
4. Faz 1: CTO PDF tarihi (plan notu > plan tablosu).

### 3.7 Çevresel notlar (bug değil)
- `check:functions` Windows'ta çıktıyı tamamladıktan SONRA libuv assertion ile crash edebiliyor (`UV_HANDLE_CLOSING`, exit -1073740791). Sonuç satırları geçerli.
- `psql` bu makinede yok → check:migrations/apply-migration canlı bacakları test edilemedi (warn modu exit 0).
- Python mevcut (py_compile çalıştı). `npm run test` ~5 dk (307s), `vite build` ~16 sn + prebuild'li `npm run build` daha uzun.
- PowerShell 7 + git grep regex tırnaklaması kırılgan — toplu işlerde Node temp script'leri kullanıldı (§8).

---

## 4. KAPI KANIT TABLOSU (koşulan her şey)

| Aşama | Kapı | Sonuç |
| --- | --- | --- |
| Faz 0 | verify:quality / lint / test / dead / knip / format | ✅ / ✅ / ✅ 526-4686 / ✅ 0+5+1064 / ✅ / ✅ |
| Faz 1 | docs:strict · ls-files tırnak+boşluk · test · lint · dead · knip · format · verify:quality | 0 hata · 0+0 · 4686 · ✅ · ✅ · ✅ · ✅ · ✅ |
| F2 D1 | typecheck:node · vitest vite-plugins · vite build | ✅ · 3/18 ✅ · ✅ 4926 modül |
| F2 D2 | lint(prelint) · dead · vitest scripts · bundle · verify:release · migrations:warn · functions | ✅ · ✅ · 42/345 ✅ · ✅ 250.6KB · ✅ · çalıştı(psql yok) · çalıştı(19/16, exit-crash çevresel) |
| F2 D3 | vitest hedefli · ai:faq:check · ai:full:check · sitemap+rss koşusu · node --check role-struct | 11/203 ✅ · ✅ güncel · ✅ güncel · rss aynı/sitemap drift ayrıştırıldı · ✅ |
| F2 D4 | node --check 35 · vitest scripts · ingest:tools+:check · preview:emails · py_compile | ✅ · 42/345 ✅ · ✅ 94 tool "güncel" · ✅ 2 şablon · ✅ |
| **F2 kapanış** | **§2.4 seti** | ✅ hepsi yeşil (format:check tek dosya düzeltmesiyle `3c08857e`) — ayrıntı §1.2 |
| F3 D1–D9 | tsc · hedefli vitest · eslint · prettier | her dalga ✅ (§2b tablosu) |
| **F3 kapanış** | **§3.3 seti** | ✅ verify:quality · lint · dead · knip · ingest:check · format · build · test 526/4686 (ayrıntı §2b) |

---

## 5. DALGA 4 STAGED DOSYA HARİTASI (38 R)

**ops/ (11):** admin-update-outbox.mjs · ai-visibility-track.mjs+test · apply-migration.mjs+test · ingest-tools.mjs · preview-emails.mjs · setup-notification-dispatch.ps1 · sync-admin-updates.mjs+test · warm-prerender.mjs
**seed/ (17):** burak-share-image-filename.mjs+test · catalog-role-import-map.json · catalog-role-importer.mjs+test · download-pexels-fallback-images.mjs · export-blog-md.mjs · export-command-center-md.mjs · import-command-center-may13.mjs · import-profiles-csv.mjs · onboarding-import.mjs · onboarding-report.mjs · replace-resource-entries-from-csv.mjs · reseed-social-share-outputs.mjs · seed-burak-share-images.mjs · seed-fallback-image-pool.mjs · seed-role-structure-from-excel.py
**guards/ (10, hepsi .test.mjs):** catalog-vector-index-migration · config-paths-exist · directory-placeholder-filter-migration · directory-semantic-search-migration · lovable-forbidden-strings · no-backups-tracked · notification-dispatch-secret-migration · public-asset-boundary · public-profile-provenance-migration · vip-invitations-migration

**31 M (özet):** package.json (14 yol) · .gitignore · .env.example · CLAUDE.md · docs/agent/{tools.json, openapi.yaml, kullanim-kilavuzu.html} · docs/{cleanup×2, handover, kalanlar×2, operations×5, plans×3, superpowers×2} · src/lib/agent/tools-catalog.generated.ts · src/lib/{admin-shell/admin-updates.ts, catalog-import-api.ts, catalog-import-schemas.ts} · src/pages/admin/sistem/AdminToolRegistryPage.tsx · supabase/functions/_shared/emails/html.ts · scripts/agent/{openapi.mjs, push.mjs} · scripts/check/check-drift.mjs · scripts/ops/{ingest-tools, ai-visibility-track×2, sync-admin-updates, warm-prerender} · scripts/seed/{download-pexels, export-blog-md, export-command-center-md, reseed-social, seed-burak, seed-fallback, seed-role-structure-from-excel.py} · scripts/guards/{lovable-forbidden-strings.test, notification-dispatch-secret-migration.test}
(31 M'in bir kısmı rename+modify birleşik — `git status` RM'leri sayıya dahil.)

---

## 6. DALGA 4 COMMIT MESAJ TASLAĞI

```
refactor(scripts): operasyon/tohum/bekçi scriptleri alt klasörlerde (Faz 2 Dalga 4)

- 38 dosya git mv ile: ops/ (11 — apply-migration, sync-admin-updates, ingest-tools, preview-emails, warm-prerender, ai-visibility-track, admin-update-outbox, setup-notification-dispatch.ps1) · seed/ (17 — import/seed/export ailesi + seed-role-structure-from-excel.py + catalog-role-import-map.json) · guards/ (10 sözleşme/bekçi testi). scripts/ kökünde düz dosya KALMADI (74→0).
- Bir seviye derine inen 16 script'te ".." → "../.." (2'si new URL biçimi); .py'de .parent zinciri ×3; .ps1'de $repoRoot çift Split-Path.
- ingest-tools.mjs: ../agent/ statik + DİNAMİK importlar (openapi, push — plan envanterinde yoktu). preview-emails TEMPLATE_MODULE ve sync-admin-updates ADMIN_UPDATES_MODULE ../../ oldu.
- lovable-forbidden-strings.test.mjs self-exclusion (:149,:194) ve notification-dispatch .ps1 yolu (:29) yeni konuma güncellendi.
- .git/hooks/post-commit → scripts/ops/sync-admin-updates.mjs (hook || true ile sessiz kırılırdı; plan öngörmemişti).
- 114 atıf güncellendi (package.json 14, docs, CLAUDE.md, .gitignore/.env.example, src yorumları). npm run ingest:tools ile katalog yeniden üretildi (94 tool, :check güncel).
- DOKUNULMAYANLAR (bilinçli): supabase/migrations + manual seed + admin-updates/2026-07.ts içindeki eski yol atıfları — değiştirilemez/yayınlanmış tarihsel içerik (istisna listesi devir notunda).

Kapılar (Dalga 4): node --check 35/35 · vitest scripts 42 dosya/345 test · ingest:tools+:check · preview:emails (2 şablon) · py_compile ✅. DB/ağ scriptleri plan gereği yalnız söz dizimiyle doğrulandı.
```

---

## 7. FAZ 3–4 İÇİN NOTLAR

**Faz 3** (`refactor/duzen-faz3-admin`, faz2 üstünden): plan §3. Kök dosya sayısı **73** (Faz 0 ölçümü, plan 58 demişti — farkı ilk `git ls-files src/pages/admin | awk -F/ 'NF==4'` ile doğrula). Dokunulmazlar: `components/`, `data/`, `_archive/`, `Admin.tsx`. Her modülde yeni `routes.tsx` (preload string'leri + App.tsx importları birebir korunur), `generate-sitemap.mjs` içindeki admin yolları **string değişmez** (routes.tsx'ler karşılar), modül sonu tam suite + en sonda build. `AdminToolRegistryPage.tsx` commandcenter'da kalır.
- **Faz 3 ek tuzaklar (13.11 gece ölçümü):** (a) `AdminGruplarPage.test.tsx:182-183` kök `routes.tsx`'i okuyup `import("@/pages/admin/gruplar/AdminGruplarPage")` dizesini arar — gruplar dalgasında test `gruplar/routes.tsx` ve yeni import dizesine çevrilir. (b) `radar/routes.tsx` sayfaları `../AdminRadarX` ile alır → `./AdminRadarX`; `cadde/routes.tsx` `@/pages/admin/AdminCaddeX` → `@/pages/admin/cadde/AdminCaddeX`. (c) `vi.mock("@/pages/admin/cadde/AdminCaddePage")` (`App.admin-cadde-route.test.tsx:7`) ve `App.data-route.test.tsx:7` (AdminCatalogPage, kökte kalır) — mock yolu gerçek yolla birebir olmalı. (d) Beş test `./AdminX` göreli import kullanır (CaddeGuide, Guide, OrgVerification, Traction, YenilikRehberi) — sayfayla birlikte taşındığı için bozulmaz. (e) `eslint-suppressions.json`'da 10 admin-kök anahtar (Cadde, CustomerRequests, DatabaseTables, DurumRaporu, Events, Gruplar, NotificationSettings, RoleManagement, ToolRegistry, Traction) — taşınanlar için anahtar yeniden yazılır (prune DEĞİL). Kök sayfa sayısı ölçüldü: **73** (routes.tsx dahil).

**Faz 4** (`refactor/duzen-faz4-lib`, faz3 üstünden): plan §4.
- **eslint-suppressions.json: 88 anahtarın TAMAMI src/** — §4.5'teki yeniden yazma scripti ŞART (taşınan dosyaların bastırmaları düşerse lint "kullanılmayan bastırma" + geri gelen ihlalle patlar; şu an `node -e "Object.keys(require('./eslint-suppressions.json'))[0]"` ile doğrulanabilir).
- `scripts/agent/walk.mjs:55-56` (`src/lib/cadde`, `src/lib/muhasebe` prefix) — `cadde/` klasörüne taşınınca aile sınıflandırması AYNI kalır (prefix her iki biçimi yakalar), ama Faz 4 sonunda `ingest:tools` yeniden üret (katalogdaki lib modül yolları değişir — Dalga 4'te tools.json script yolları İÇERMİYORDU, lib modülleri İÇERİYOR: 72 modül tool'u).
- `role-structure.ts` kökte KALIR (RT02 + check-dead-code KNOWN_DEAD_FILES + eslint.config.js:111 veri-dosya listesi).
- Import yeniden yazmada `.test` içeren specifier'lara DİKKAT (plan §4.2 regex notu) + `import type` + çok satırlı importlar.
- check-dead-code `KNOWN_DEAD_FILES` içindeki `src/lib/plans.ts` vb. yollar taşınırsa güncelle (plans.ts cadde/ değil, yerinde).

---

## 8. GEÇİCİ YARDIMCI SCRIPT'LER (yeniden kullanılabilir)

`C:\Users\BARIS-~1\AppData\Local\Temp\kilo\` altında (repo DIŞI, commit'lenmez):
`rewrite-docs-refs.mjs` (F1.3) · `rename-ascii.mjs` (F1.4 — git ls-files -z + git mv, NFD güvenli) · `fix-html-refs.mjs` (F1.4) · `fix-w2-paths.mjs` · `rewrite-w2-refs.mjs` · `fix-w3-paths.mjs` · `rewrite-w3-refs.mjs` · `fix-w4-paths.mjs` · `rewrite-w4-refs.mjs` · `fix-ingest-dyn.mjs`.
Hepsi tam-dize (split/join) değiştirici — idempotent, count!=1'de atlar ve raporlar. Faz 4 için `rewrite-w*-refs.mjs` kalıbı + §4.5 suppression scripti aynı teknikle yazılabilir.
Log'lar: `faz1-test.log`, `faz2-w1-build.log` (aynı klasörde).

## 9. TABAN SAYILAR (karşılaştırma için)

test: **526 dosya / 4686 test** · verify:text: 2230 dosya · check:dead: 0 yeni / 5 bilinen borç / 1064 erişilebilir · docs:strict: 0 hata / 10 uyarı (5 KIRIK-MIG + 5 AD — bilgisel) · knip: exit 0 · bundle: 250.6 KB gzip (bütçe 271 KB) · katalog: 94 tool · scripts kök: **0** (74'ten) · docs kök: 3 (10'dan) · repo kökü `??`: 0.
