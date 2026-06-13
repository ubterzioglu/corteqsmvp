# Radar Haber Pipeline — Teknik Dokümantasyon

**Durum:** Faz 0–6 tamam (2026-06-13). Admin onaylı günlük haber keşif/moderasyon katmanı.

## Amaç

Ücretsiz kaynaklardan (GDELT, RSS, Atom) günde bir kez Türk diasporası ile ilgili
haberleri keşfetmek, normalize etmek, relevance skoru hesaplamak, duplicate'leri
elemek ve **admin onayı bekleyen** bir kuyruğa almak. Hiçbir haber otomatik yayınlanmaz.

## Akış

```
Günlük Cron (0 5 * * *)
   ↓
radar-news-scan Edge Function
   ↓
GDELT / RSS / Atom adaptörleri
   ↓
normalize → SSRF/timeout/boyut güvenliği → canonical URL → hash → relevance → dedupe
   ↓
public.radar_news_candidates (review_status='pending')
   ↓
Admin Moderasyon Kuyruğu (/admin/radar/queue)
   ↓
approve_to_pool | approve_and_publish | reject | mark_duplicate
   ↓
public.news_posts
   ↓
importNewsPostToMarquee(newsPostId)  ← mevcut helper reuse
   ↓
public.marquee_items → CorteQS Radar
```

## Veritabanı (migration `20260615100000_add_radar_news_pipeline.sql`)

| Tablo | Amaç |
|-------|------|
| `radar_news_sources` | RSS/API kaynak yönetimi. Tarama koşulu: `is_enabled AND terms_checked`. |
| `radar_news_scan_runs` | Cron/manuel tarama çalışma kayıtları + metrikler. |
| `radar_news_candidates` | Admin onayı bekleyen haber adayları. `canonical_url_hash` UNIQUE. |
| `radar_news_review_logs` | Moderasyon aksiyonları audit log'u. |
| `radar_news_keywords` | Relevance keyword seti (deploy'suz tuning). |

`news_posts` tablosuna eklenen sütunlar: `radar_candidate_id`, `approved_by`,
`approved_at`, `ingestion_source_type` (additive, `IF NOT EXISTS`).

### RLS
- anon + normal authenticated: **erişim yok**
- admin (`is_admin(auth.uid())` RPC): okuma + moderasyon
- ingestion INSERT: yalnızca `service_role` (Edge Function, RLS bypass)

> NOT: `admin_users` tablosu kaldırıldı (mig 20260609003000). Tüm policy'ler
> `is_admin(auth.uid())` RPC kullanır.

## Edge Function (`supabase/functions/radar-news-scan/`)

```
index.ts                  # Ana handler — yetki, lock, kaynak döngüsü, scan run kapatma
adapters/gdelt.ts         # GDELT DOC 2.0 JSON
adapters/rss.ts           # RSS 2.0 (fast-xml-parser)
adapters/atom.ts          # Atom feed
lib/canonicalize-url.ts   # utm/fbclid/gclid tracking param temizleme
lib/hash.ts               # sha256, normalizeTitle
lib/normalize-item.ts     # HTML sanitize + normalize + skor + hash
lib/relevance-score.ts    # Kural tabanlı skor motoru (0-100)
lib/dedupe.ts             # Seviye 1 (url) + Seviye 2 (content) duplicate
lib/scan-lock.ts          # Eş zamanlı tarama kilidi + scan run aç/kapat
lib/source-security.ts    # SSRF guard (localhost/private IP/protokol)
lib/types.ts              # Ortak tipler
```

### Yetki
- **Cron:** `Authorization: Bearer <RADAR_NEWS_CRON_SECRET>` (Vault'tan)
- **Manuel:** Admin JWT → `is_admin` RPC kontrolü server-side

### Güvenlik sınırları
| Kontrol | Değer |
|---------|-------|
| timeout | 12 sn (kaynak config'inden) |
| max response | 2 MB |
| max item / kaynak | 100 (config) |
| redirect | follow (RSS/Atom) |
| protokol | yalnızca http/https |
| SSRF | localhost, 127/10/172.16-31/192.168/169.254, ::1 engellenir |
| HTML | script/style/iframe/event-handler temizlenir; summary ≤ 600 char |

## Frontend

| Dosya | Açıklama |
|-------|----------|
| `src/lib/radarNewsPipeline.ts` | API katmanı (list/approve/reject/dupe/scan/sources/runs) |
| `src/pages/admin/AdminRadarQueuePage.tsx` | Moderasyon kuyruğu + Şimdi Tara |
| `src/pages/admin/AdminRadarSourcesPage.tsx` | Kaynak yönetimi + terms check |
| `src/pages/admin/AdminRadarRunsPage.tsx` | Tarama geçmişi + metrikler |
| `src/components/admin/radar/RadarCandidateCard.tsx` | Aday haber kartı + aksiyonlar |
| `src/components/admin/radar/RadarSourceForm.tsx` | Kaynak ayar formu |
| `src/components/admin/radar/RadarScanRunTable.tsx` | Tarama geçmiş tablosu |
| `src/pages/admin/radar/routes.tsx` | Route ağacı (`/admin/radar/{queue,sources,runs}`) |

> `radarNewsPipeline.ts` içindeki `db` cast'ı, radar tabloları generated
> `types.ts`'e yansımadığı için geçicidir (B1: types regen). Types üretildikten
> sonra `db` → `supabase` ile değiştirilip cast kaldırılabilir.

## Dedup mantığı
- **Seviye 1 (kesin):** `canonical_url_hash = sha256(canonical_url)` — UNIQUE index
- **Seviye 2 (güçlü):** `content_hash = sha256(normalized_title + "|" + source_name + "|" + gün)`
- Seviye 3 (yakın, `pg_trgm`): MVP dışı; ileride admin önerisi olarak.

## Relevance skoru
- Pozitif: title diaspora (+35), Almanya/Avrupa Türk toplumu (+25), göçmenlik/vatandaşlık (+20), iş (+15), güvenilir kaynak (+10), tazelik 24h (+10)
- Negatif: ilgisiz/clickbait (-40/-50)
- Eşik: `score ≥ 20` → pending kuyruğa; `< 20` → `archived` (2 hafta tuning)
- 0–100 aralığına clamp.

## Test
`src/lib/radar-pipeline.test.ts` — 25 test (canonicalize, hash/normalize, SSRF guard, relevance). `npx vitest run src/lib/radar-pipeline.test.ts`.
