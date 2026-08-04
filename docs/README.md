# CorteQS Documentation Index

> **Güncelleme:** 2026-08-04 — modernizasyon çalışması: 3 denetim raporu (`audits/`),
> uygulama planı + backlog (`plans/`) ve kapanış raporu (`history/`) eklendi.
> Listeleri aşağıdaki **2026-08-04 Modernizasyon Çalışması** bölümünde.
> Bu çalışmada ölçülen gerçek envanter: **989** kaynak dosya (`src` altında `.ts`/`.tsx`),
> **352** migration (100 `supabase/migrations/applied/` + 252 `supabase/migrations/archive/`,
> 2026-08-04 taban çizgisi ayrımı), **7** Edge Function,
> `App.tsx` 283 satır / 51 `lazy()`. `CLAUDE.md`'deki eski sayılar (221 migration,
> 5 Edge Function, 150 sayfa) **bayattır** — düzeltmeler denetim raporlarında.
>
> **Güncelleme:** 2026-08-03 — üçüncü kök temizliği: `1readme.md` (anlamsız test içeriği) ve
> `tab_of.json` (koddan referans edilmeyen eski taslak veri) `docs/archive/root-2026-08-03/`'e
> taşındı (`git mv`, geçmiş korundu). `.secretdb` ve `walast.txt` **bilinçli olarak taşınmadı** —
> ilki canlı sırlar (Supabase service role key, API anahtarları), ikincisi ham WhatsApp sohbet
> dökümü (telefon numaraları dahil) içeriyor; ikisi de zaten `.gitignore`'da, git'e hiç girmemeli.
>
> **Güncelleme:** 2026-06-18 — ikinci kök temizliği: köke birikmiş AI-agent prompt/plan ve
> blog/araştırma dokümanları `docs/` altına taşındı (`git mv`, geçmiş korundu):
> `13062026_cadde.html`→`cadde-300/`; `CorteQS_MVP_Duzeltmeler_AI_Agent_Prompt.md`,
> `CorteQS_Radar_..._E2E_AI_Agent.md`, `corteqs-premium-profile-experimental-2-claude-code-prompt.md`,
> `landing_page_denemesi.md`→`plans/`; `scrapper_plan.md`→`plans/service-finder/`;
> `Corteqs_Blog_20_Makale.md`, `cortqs-blog-deep-research-report.md`→`modules/`.
> Kökte yalnız 4 bakımlı doküman + `README.md` + `index.html` + `info-*.html` (ticari doküman
> içerik kaynağı, taşınamaz) kalır.
> **Düzeltme (2026-08-04):** kök `info-*.html` dosyaları 2026-07-13'te kaldırıldı; ticari doküman
> içeriğinin tek kaynağı artık `src/content/commercial/*.html`.
>
> **Kök temizliği (2026-08-04) — bu bölümün geçerli hâli:** kökte artık YALNIZ 2 `.md` var:
> `CLAUDE.md` (agent kuralları — Claude Code kökten okur) ve `README.md` (depo girişi).
> Diğer bakımlı dokümanların hepsi buraya taşındı; backlog **B-10 kapandı**:
>
> | Doküman | Yeni yer |
> |---------|----------|
> | Tek ana mimari | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
> | Hızlı bağlam (yeni oturum) | [`AGENT_CONTEXT.md`](AGENT_CONTEXT.md) |
> | Durum panosu + kullanım senaryoları | [`status/rapor.html`](status/rapor.html) |
> | Faz/devir durumu | [`history/SONDURUM.md`](history/SONDURUM.md) |
>
> ⚠️ `AGENT_CONTEXT.md` ve `ARCHITECTURE.md` yollarını `scripts/check-drift.mjs` ile
> `scripts/agent/drift-rules.mjs` sabit yazar; bu iki dosyayı taşırsan ikisini de güncelle,
> yoksa drift kuralı sessizce hiç bulgu üretmez.
>
> **Kök dizine yeni doküman eklenmez.** Bu klasördeki her şey ya **aktif yardımcı doküman**
> ya da **dondurulmuş arşivdir**.

## Klasör Sözlüğü

| Klasör | İçerik | Durum |
|--------|--------|-------|
| `cadde-300/` | Cadde 3.0 E2E rebuild: spec, envanter, devir notu, faz dokümanları (00–03), **change-report.md** (kapanış + kalan işler) | Tamamlandı (2026-06-11) — referans |
| `plans/` | Uygulama planları; `plans/admin-v2/` = Admin Panel v2 masterplan (md+html) + progress handoff; **2026-08-04 modernizasyon planı + backlog'u** burada | Aktif/yeni biten |
| `catalog-role-afs-rebuild/` | Catalog/flat-rol/AFS rebuild raporları (00–14, canlı 2026-06-09) | Referans |
| `refactor/` | Refactor backlog'u (B1–B10) | Aktif |
| `modules/` | Modül belgeleri (Türkçe domain adları) | Aktif |
| `operations/` | Deploy, database, security, release rehberleri | Aktif |
| `guides/` | Kullanım ve admin/developer rehberleri | Aktif |
| `decisions/` | Teknik kararlar / ADR alanı | Aktif |
| `audits/` | **Denetim raporları** (kanıta dayalı, ölçülmüş): 2026-08-04 depo sağlığı / SEO-GEO / dokümantasyon denetimleri, `2026-07-28-tools-noindex-karari.md`, `2026-06-08` kapsamlı denetim (html) | Aktif |
| `database-audit/`, `cleanup/` | Veritabanı audit ve cleanup çıktıları | Referans |
| `status/` | Durum panoları: `rapor.html` (ana pano + kullanım senaryoları), `burakubtstatus.html` | Aktif |
| `history/` | Tamamlanmış planlar, eski handoff'lar (public-profil v2.1 dahil), durum ve **değişiklik kapanış raporları**, `SONDURUM.md` (faz/devir durumu) | Arşiv |
| `exports/` | Üretilen dışa aktarımlar: `blog-md/` = `scripts/export-blog-md.mjs` varsayılan çıktısı | Üretilen |
| `archive/` | **Dondurulmuş içerik:** `architecture/` (eski 9 mimari doküman — bakım ARCHITECTURE.md'de), `root-2026-06-11/` (kök temizliği: audit/cleancode/dbcheck/peronevera notları, deployerror, meeting10.csv, import-resources.ts), `root-2026-08-03/` (üçüncü kök temizliği: `1readme.md`, `tab_of.json`), `backups/` (Supabase DB dump'ları), `cleanup-2026-05-15/`, `cleanup-2026-05-30/`, `turkish_missions_import_builder/` | Arşiv |
| `reference/` | Referans repo kopyaları (`global-network-bridge/`) | Arşiv |
| `docu/` | Eski kök `docu/` klasörü (info-* HTML kopyaları + referans görseller) | Arşiv |
| `assets/` | Arşiv görselleri (sweet.png, rapor ekran görüntüleri vb.) | Arşiv |
| `superpowers/`, `inbox-review/` | Agent planları / sınıflandırılmamış dosyalar | Arşiv |

> Not: `archive/`, `reference/`, `docu/` klasörleri `verify:text` encoding denetiminden muaftır
> (donmuş içerik) — canlı doküman buralara DEĞİL, ilgili aktif klasöre eklenir.

## 2026-08-04 Modernizasyon Çalışması

Denetim → plan → uygulama → kapanış zinciri. Sıra bu; okumaya denetimlerden başla.

| Doküman | İçerik |
|---------|--------|
| [`audits/2026-08-04-repository-health-audit.md`](audits/2026-08-04-repository-health-audit.md) | Depo sağlık denetimi: ölçülmüş envanter (989 kaynak dosya, 352 migration, 7 Edge Function, 202 test) ve `CLAUDE.md`'deki bayat iddiaların kanıtla çürütülmesi. |
| [`audits/2026-08-04-seo-geo-audit.md`](audits/2026-08-04-seo-geo-audit.md) | SEO/GEO denetimi: nginx güvenlik başlıklarının ve CSP'nin ana sayfada düşmesi (P0), canonical'a query/host sızması, soft-404, sitemap ve `llms.txt` doğruluk bulguları. |
| [`audits/2026-08-04-documentation-audit.md`](audits/2026-08-04-documentation-audit.md) | Dokümantasyon denetimi: kök ve `docs/` altındaki dokümanların gerçek koda karşı doğrulanması, bayat/yanlış iddiaların dosya bazında listesi. |
| [`plans/2026-08-04-modernization-plan.md`](plans/2026-08-04-modernization-plan.md) | **Uygulama planı:** denetim bulgularının kabul kriterli 5 batch'e bölünmüş hâli (nginx başlıkları/CSP, tek yönlendirme kaynağı, SEO helper + 404 noindex, sitemap/llms.txt, ölü kod + script hijyeni). |
| [`plans/2026-08-04-modernization-backlog.md`](plans/2026-08-04-modernization-backlog.md) | Bilinçli olarak **uygulanmayan/ertelenen** maddeler (B-1…B-13): JSON-LD kapsamı, doğrulanamayan pazarlama iddiaları, gerçek HTTP 404, bundle analizi, 300+ satırlık dosyalar, `public/` içindeki ~78 MB video, lint borcu. |
| [`history/2026-08-04-modernization-change-report.md`](history/2026-08-04-modernization-change-report.md) | **Kapanış raporu:** gerçekten yapılan değişiklikler, ölçülen sonuçlar (sitemap 107→108 URL, tsc hatası 21→16, 5 ölü sayfa silindi) ve doğrulanamayanlar (Docker daemon kapalı olduğu için konteyner doğrulaması yapılmadı). |

> **Deploy notu:** Batch 1–2 nginx davranışını değiştirir ve konteyner üzerinde doğrulanamadı.
> Deploy sonrası tarayıcı konsolunda CSP ihlali kontrolü **zorunludur** — ayrıntı kapanış raporunda.

## Nereden başlamalı?

1. Yeni oturum/bağlam → **[`AGENT_CONTEXT.md`](AGENT_CONTEXT.md)**
2. Mimari soru → **[`ARCHITECTURE.md`](ARCHITECTURE.md)**
3. Proje durumu / ne bitti ne açık → **[`status/rapor.html`](status/rapor.html)**
4. Cadde 3.0 detayı → `cadde-300/change-report.md`
5. Depo/SEO'nun ölçülmüş gerçek durumu → `audits/2026-08-04-*.md`
   (kökteki `CLAUDE.md` sayıları bayat; çelişki hâlinde denetim raporu geçerlidir)
6. Son değişiklikler ve açık kalan işler → `history/2026-08-04-modernization-change-report.md`
   + `plans/2026-08-04-modernization-backlog.md`
