# SEO/GEO + Clean Code — KALAN PLAN (6 Ekim 2026)

> Ana plan: `C:\Users\baris-terzioglu\.claude\plans\reactive-spinning-castle.md` (onaylı). Bu dosya yalnız **kalanı** sıralar.
> Kural: her batch ayrı commit, `git commit -- <dosyalar>`, push yok, Türkçe mesaj. Kapı: `tsc` · `vitest --maxWorkers=2` · `check:dead` · `verify:text`.
> Rakamları komutla ölç.

## Bitti
- ✅ **S1** `redirects.test.ts` drift kilidi onarıldı · ✅ **S2** `/kurulus/<olmayan>` soft-404 noindex + test (commit `2247e5fc`, push'lanmadı).

## Önce: tsc borcu (planda yoktu, bugün bulundu)
CLAUDE.md "tsc 0 hata" diyor; bugün **4 hata** var (A-batch / B8 işlerinden). Kapı kırmızı kaldıkça sonraki her batch'in `tsc` kanıtı bulanır.

| # | Hata | Düzeltme |
|---|---|---|
| T0.1 | `AdminNotificationSettingsPage.test.tsx:34` ve `AdminNotificationMenu.test.tsx`: fixture'da `weeklyCityDigestEnabled` yok (tipte zorunlu) | Fixture'lara alanı ekle (tipi gevşetme) |
| T0.2 | `ProfileDocumentsSection.tsx:9`: `ProfileDocumentRecord` `profile-attribute-drafts`'tan export edilmemiş | Önce kim tanımlamış/kim kullanıyor bak; `export` ekle ya da doğru modülden import et |
| T0.3 | `ProfilePage.tsx:193`: 2 argüman verilmiş, fonksiyon 1 bekliyor | Çağrı ile imzayı karşılaştır; hangisi güncel ise ona uydur |
- ⚠️ `ProfilePage.tsx` 843 satır ve A-batch'in ürünü; dokunmadan önce `git log -3 -- src/pages/ProfilePage.tsx`.
- Kabul: `npx tsc -p tsconfig.app.json --noEmit` → 0 hata. Tek commit.

## SEO/GEO

| Sıra | Batch | İş | Kabul |
|---|---|---|---|
| 1 | **S3** [M] | Üç sözleşme testi: (a) sitemap rotalarının sayfası `useSeo`/`applySeo` + `canonicalPath` çağırır (b) auth dışı her `App.tsx` rotası `useSeo` çağırır ya da noindex'tir (allowlist: `JobListingDetailPage`, `DirectoryProfilePage` → karar §Sorular-1) (c) `add_header` içeren her nginx location güvenlik başlığı setini tam taşır | Üçü yeşil; ilgili `useSeo` silinince / başlık çıkarılınca kırmızı (mutasyon ≥ 3). `src/test/source-slice` yardımcıları, çıplak `indexOf+slice` yok |
| 2 | **S4** [M] | `generate-sitemap.mjs`: env yoksa veya URL sayısı mevcut dosyanın %70'inin altına düşerse dosyaya dokunma + uyarı; statik `lastmod` build günü olmasın | Test: env yok → çıktı değişmez; küçülme → korunur. **`public/sitemap.xml`'e dokunma** (başkasının diff'i) |
| 3 | **S6** [S] | `docs/operations/prerender-setup.md` → gerçek akış (nginx `$is_bot`); `se1-a10-dogrulama.md`'deki tehlikeli `location /ai/ { add_header … }` önerisine uyarı notu | Yalnız doküman |
| 4 | **S5** [S] | `scripts/generate-ai-faq.mjs`: `index.html` FAQPage'i okur, `public/ai/faq.json` yazar (3 → 12 soru) | Soru sayısı/metin eşitliği testi · **diff'i önce göster** (mevcut dosyayı ezme kuralı) · Premium cevabı `/pricing` ile çelişirse raporla, `index.html`'e dokunma |
| 5 | **S7** [M] | `BlogPostPage`: `BreadcrumbList` JSON-LD (`applySeo` ile), görünür yayın/güncelleme tarihi, 3 ilgili yazı, excerpt'i cevap-ilk blok · `PublicProfileShell`: şema tipini profil türüne göre seç | `BlogPostPage.test.tsx` + şema-tipi testi (mutasyon ≥ 4). Önce `public-catalog-profile-view-model.ts`'te tür alanı var mı oku; yoksa dur |
| 6 | **S8** [S–M] | **Deploy gerektirir, ayrı onay:** nginx `charset utf-8` (server bloğunda, `add_header` değil) · `public/ai/service.json` · `llms-full.txt` (build'de blog'dan üretilir) · `index.html` `<noscript>` içerik bloğu | Deploy sonrası `curl -sI /llms.txt` → `text/plain; charset=utf-8`; güvenlik başlıkları `/`'te duruyor; `PYTHONUTF8=1 geo audit` önce/sonra; yasaklı iddia taraması |

Beklenti (dürüst): `geo audit` 61 → ≈ 64–71. Kırılım kaynağı tahmin; **önce `geo audit`'i yeniden üretip gerçek kırılımı al** (ham rapor repoda yok).

## Clean Code

| Sıra | Batch | İş | Kabul / risk |
|---|---|---|---|
| 1 | **C1** [S] | `.gitignore`: `.agents/`, `.superpowers/`, `.claude/worktrees/`, `exports/`, `artifacts/` (**`corteqs-ekstre-motoru/` hariç**, §Sorular-3) | `git status` gürültüsü azalır |
| 2 | **C2** [S] | `find-matches` ve `send-submission-email` yerel `enforceRateLimit` (select+update, yarış durumuna açık) → `_shared/rate-limit.ts` atomik sürüm | **En yüksek güvenlik değeri.** Önce KIRMIZI test; SG sözleşme testlerini oku; `supabase/functions` altında başka oturum olabilir (`git status`). Deploy yok |
| 3 | **C3** [M] | 11 edge function'daki `jsonResponse` → `_shared/http.ts` | C2'den sonra, fonksiyon başına küçük commit |
| 4 | **C4** [S] | Ölü kod: `src/lib/plans.ts`, `src/lib/role-structure.ts` (importer yoksa sil); `CaddeReactionActorsPopover.tsx` (§Sorular-2) | `rg` ile test dahil importer ara; `check:dead` 3 → ≤1 |
| 5 | **C6** [S–M] | `AdminCaddeCarsiPage.tsx:34` doğrudan `db.from(...)` → `cadde-*-api.ts`; `useProfileAvatar` storage → lib; 5 boolean-bayraklı `set…AsAdmin` fonksiyonu → açık adlar (**RPC parametre adlarına dokunma**) | `rg -U 'supabase\s*\n?\s*\.(from\|rpc)\('` bileşen/sayfa katmanı 0 |
| 6 | **C7** [M] | `formatDate`/`formatDateTime` (15 kopya → önce çıktıları karşılaştır) · `scripts/lib/env.mjs` (`parseEnvFile` ×12) · `import-command-center-may13.mjs` arşive | Biçim farkı olan kopya ayrı yardımcı olur, zorla birleştirme |
| 7 | **C6b** [S] | `types.ts` yeniden üret → 135 `as never` temizliği | **`SUPABASE_ACCESS_TOKEN` gerekir; yoksa atla.** Büyük diff → ayrı commit |
| 8 | **C5** [L, ayrı oturumlar] | Dev fonksiyon ayrıştırma: `send-notification-emails` `Deno.serve` (446 satır, derinlik 6) → `CaddeFeedView` (483/463 satırlık iç bloklar) → `ProfilePage` (755) → `AdminGruplarPage`/`AddWhatsAppPage` | **Önce karakterizasyon testi, sonra ayrıştır; ayrıştırma ve inceleme AYRI ajanlara.** Kaynak okuyan testler (`CaddeFeedView.edit-wiring`, `send-notification-emails`'e referanslı 6 test) güncellenir, gevşetilmez. Her adımda `ingest:tools:check` + `check:dead` |
| — | **C1b** [S] | CLAUDE.md bayat satırlar (`as any` "9/3 kaldı", `providers.ts` "aynıdır", tsc "0 hata", 800+ sayıları) | **CLAUDE.md'yi doğrudan düzenleme; öneriyi** `docs/plans/2026-10-05-tur1-claude-md-onerileri.md`'ye ekle, asıl dosya yalnız onayla |

## Önerilen sıra
`T0 (tsc 0)` → `S3` → `S4` → `S6` → `C1` → `C2` → `C3` → `C4` → `S5` → `S7` → `C6` → `C7` → `C6b` → **deploy kapısı `S8`** → `C5` (en uzun, ayrı oturumlar).
Mantık: önce kapıyı yeşil yap (T0), sonra sessiz regresyon ağını kur (S3/S4), sonra güvenlik tutarsızlığını kapat (C2), içerik/GEO ve büyük ayrıştırma en sona.

## Sorular (cevap gelmeden ilgili batch'in o kolu atlanır)
1. `/ilanlar/:id` ve `/directory/profile/:userId`: noindex mi, canonical mı? (S3-b allowlist'i)
2. `CaddeReactionActorsPopover` (dünkü "kimler beğendi" işi) bağlanacak mı, silinecek mi? (C4)
3. `corteqs-ekstre-motoru/` repoya mı alınsın, ignore mu? (C1)
4. `index.html`'e `<noscript>` içerik bloğu eklenebilir mi? (S8)
5. `faq.json` 3 → 12 soru diff onayı (S5) · ek prerender botları (`duckassistbot|mistralai-user|meta-externalfetcher|bingpreview|google-inspectiontool|petalbot`) stratejisi (S8 sonrası)

## Bilinçli kapsam dışı
`index.html` JSON-LD · robots.txt AI politikası · `geo fix --apply` · sabit canonical · "164 ülke / 8,8 milyon" · `/addcom /tavsiye /liderlik` sitemap · migration/edge deploy/canlı DB · secret rotasyonu · Türkçe domain adlarının yeniden adlandırılması · başkasının commit'siz dosyaları (`package.json`, `package-lock.json`, `public/sitemap.xml`, 6 migration, `delete-account/`).
