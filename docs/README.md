# CorteQS Documentation Index

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
>
> **Güncelleme:** 2026-06-11 — kök dizin temizliği + dokümantasyon konsolidasyonu sonrası.
>
> **Bakımlı dokümanlar KÖKTE yaşar (yalnız 4 dosya):**
> `CLAUDE.md` (agent kuralları) · `AGENT_CONTEXT.md` (hızlı bağlam) ·
> `ARCHITECTURE.md` (tek ana mimari) · `rapor.html` (durum panosu + kullanım senaryoları).
> Bu klasördeki her şey ya **aktif yardımcı doküman** ya da **dondurulmuş arşivdir**.

## Klasör Sözlüğü

| Klasör | İçerik | Durum |
|--------|--------|-------|
| `cadde-300/` | Cadde 3.0 E2E rebuild: spec, envanter, devir notu, faz dokümanları (00–03), **change-report.md** (kapanış + kalan işler) | Tamamlandı (2026-06-11) — referans |
| `plans/` | Uygulama planları; `plans/admin-v2/` = Admin Panel v2 masterplan (md+html) + progress handoff | Aktif/yeni biten |
| `catalog-role-afs-rebuild/` | Catalog/flat-rol/AFS rebuild raporları (00–14, canlı 2026-06-09) | Referans |
| `refactor/` | Refactor backlog'u (B1–B10) | Aktif |
| `modules/` | Modül belgeleri (Türkçe domain adları) | Aktif |
| `operations/` | Deploy, database, security, release rehberleri | Aktif |
| `guides/` | Kullanım ve admin/developer rehberleri | Aktif |
| `decisions/` | Teknik kararlar / ADR alanı | Aktif |
| `database-audit/`, `audits/`, `cleanup/` | Audit ve cleanup çıktıları | Referans |
| `history/` | Tamamlanmış planlar, eski handoff'lar (public-profil v2.1 dahil), durum raporları | Arşiv |
| `archive/` | **Dondurulmuş içerik:** `architecture/` (eski 9 mimari doküman — bakım ARCHITECTURE.md'de), `root-2026-06-11/` (kök temizliği: audit/cleancode/dbcheck/peronevera notları, deployerror, meeting10.csv, import-resources.ts), `root-2026-08-03/` (üçüncü kök temizliği: `1readme.md`, `tab_of.json`), `backups/` (Supabase DB dump'ları), `cleanup-2026-05-15/`, `cleanup-2026-05-30/`, `turkish_missions_import_builder/` | Arşiv |
| `reference/` | Referans repo kopyaları (`global-network-bridge/`) | Arşiv |
| `docu/` | Eski kök `docu/` klasörü (info-* HTML kopyaları + referans görseller) | Arşiv |
| `assets/` | Arşiv görselleri (sweet.png, rapor ekran görüntüleri vb.) | Arşiv |
| `superpowers/`, `inbox-review/` | Agent planları / sınıflandırılmamış dosyalar | Arşiv |

> Not: `archive/`, `reference/`, `docu/` klasörleri `verify:text` encoding denetiminden muaftır
> (donmuş içerik) — canlı doküman buralara DEĞİL, ilgili aktif klasöre eklenir.

## Nereden başlamalı?

1. Yeni oturum/bağlam → kökteki **`AGENT_CONTEXT.md`**
2. Mimari soru → kökteki **`ARCHITECTURE.md`**
3. Proje durumu / ne bitti ne açık → kökteki **`rapor.html`**
4. Cadde 3.0 detayı → `cadde-300/change-report.md`
