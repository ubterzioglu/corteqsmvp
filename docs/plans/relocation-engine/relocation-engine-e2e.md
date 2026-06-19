# CorteQS Relocation Recommendation Engine — E2E Tasarım

> Bu doküman, kökteki taslak `relocation.md`'nin repo'ya yerleştirilmiş, citation gürültüsünden
> temizlenmiş ve uygulama planına bağlanmış halidir. Uygulama yol haritası ve faz dökümü için
> bkz. onaylı plan dosyası ve aşağıdaki "Uygulama Fazları" bölümü.

## 1. Yönetici Özeti

CorteQS halihazırda React + Vite SPA, Supabase Auth/Postgres/RLS omurgası, çok-modüllü route
yapısı, Docker/Coolify dağıtımı ve Postgres'ten iş claim edip aday + maliyet defteri yazan bir
`workers/service-finder` worker'ı içeriyor. Bu yüzden en düşük teslim riski, taşınma motorunu ayrı
bir mikro-ürün olarak değil; mevcut **modül kalıplarını** (`lib/<modül>-{api,schemas,types,query-keys}.ts`),
**RLS güvenlik modelini** ve **worker desenini** genişleterek bir "relocation" dikeyi olarak eklemektir.

Ürün üç katmanlıdır:
1. **Kullanıcıya dönük** planlama/keşif deneyimi (wizard → şehir karşılaştırma → servis paketleri →
   bürokrasi checklist → günlük-hayat/acil bilgiler).
2. **Kaynak-uyarlayıcı + normalizasyon** katmanı (resmi/lisanslı kaynaklardan veri; trust + freshness).
3. **Kural-tabanlı, veri geldikçe öğrenen hibrit sıralama**.

Dataset belirsiz olduğu için tasarımın omurgası **schema-first / source-registry-first / official-first**:
önce veri sözleşmeleri, kaynak güvenilirlik puanı, yenileme sıklığı ve lisans alanları tanımlanır;
gerçek veri geldiğinde yalnızca adapter'lar ve eşleme kuralları doldurulur.

## 2. Mimari ve Dağıtım

```
Web PWA (mevcut React+Vite SPA) ── Supabase Auth + JWT
        │
        ▼
Recommendation API Layer (lib/relocation-api.ts + relocation_* RPC + Edge Functions)
        │
        ├── Supabase Postgres (relocation_* tabloları + RLS)
        ├── (gelecekte) pgvector + FTS
        └── Notification Orchestrator (Edge Function)
        ▲
Relocation Ingestion Worker (workers/relocation-ingestion — service-finder kalıbı)
        └── Source Registry → adapters (resmi / lisanslı / doğrulanmış topluluk)
        └── Ingestion Jobs + Cost Ledger → relocation_services / relocation_bureaucratic_steps
```

**Dağıtım kararı:** Evrimsel monorepo. Uygulama zaten Docker/Coolify ile servis ediliyor; `server.mjs`
runtime env injection ve proxy yapıyor; nginx güvenlik başlıkları set ediyor. Yeni mimari dokümanlar
köke değil `docs/plans/relocation-engine/` altına eklenir (kökte yalnız 4 bakımlı doküman kuralı).

**Repo bulgusu (doğrulandı):** `package.json` `react-router-dom@^7.17.0` kullanıyor (ARCHITECTURE.md
"v6" diyor — dokümantasyon sürüklenmesi). Route guard / lazy-loading tasarımı **runtime v7'yi** hedefler.

**Güvenlik:** Mevcut nginx CSP/HSTS/Referrer-Policy/Permissions-Policy temeli korunur. Relocation
eklendiğinde ek olarak: kaynak-adapter servisleri için gizli anahtar ayrımı (`secret_ref` = env adı,
ham anahtar DB'de yok — service-finder kuralı), kullanıcı vs partner istekleri için ayrı rate-limit
katmanları, idempotency anahtarları, signed webhook doğrulama ve audit trail.

**Mahremiyet (GDPR/KVKK):** Relocation için gerekli olmayan PII toplanmaz; belgeler/hassas notlar ile
öneri özellikleri teknik olarak ayrıştırılır. Sağlık/aile alanları **coarse-grained etiket** olarak
tutulur ("aile hekimi erişimi önemli" gibi), teşhis/sağlık verisi saklanmaz. GDPR Madde 5 (minimizasyon,
amaç sınırlaması, saklama süresi) ve Madde 25 (tasarımda mahremiyet) + KVKK 6698 bağlayıcıdır.

## 3. Veri Modeli (özet)

| Varlık | Çekirdek alanlar | Not |
|---|---|---|
| `relocation_moves` | move_id, user_id, origin/target geo, move_window, budget, household(jsonb), status | Aggregate root |
| `relocation_locations` | location_id, country_code, city_code, lat/lon, cost_index, safety_index, language_availability | geo_countries/geo_cities'e bağlanır |
| `relocation_services` | service_id, category(housing/airline/gsm/doctor/community), source_id, trust_score, freshness_at, price_min/max | Tek tabloda normalize |
| `relocation_bureaucratic_steps` | step_id, country/city, trigger, deadline_rule, required_docs, source_id | Görev üretiminin omurgası |
| `relocation_emergency_contacts` | id, country/city, type, phone, source_id | 112, polis, konsolosluk vb. |
| `relocation_source_registry` | source_id, provider_name, authority_level, license_type, refresh_sla_hours | Kaynak güvenilirliği merkezi |
| `relocation_interactions` | event_id, user_id(anonimize), move_id, entity_type/id, event_type, rank_position, context | Eğitim veri havuzu |
| `relocation_recommendations` | rec_id, move_id, entity_type/id, hard_filter_pass, rule_score, ml_score, final_score, explanations | Açıklanabilirlik |

JSON Schema veri sözleşmeleri `schemas/` alt klasöründe (user_profile, move, service, bureaucratic_step).

## 4. Kaynak Stratejisi

Öncelik: **resmi kaynak > regülatör/veri portalı > lisanslı ticari API > doğrulanmış topluluk > kullanıcı üretimi**.
Detay tablo ve lisans/cache/redistribution kısıtları → `source-registry.md`.

## 5. API ve Öneri Motoru

REST + async job. Kullanıcı-facing senkron uçlar; ingestion için job-tabanlı async. Kontrat OpenAPI 3.1,
gövde doğrulama JSON Schema, repo içinde Zod + React Query query-key aynalanır. Mutasyonlar
**security-definer RPC** üzerinden (cadde/service-finder kuralı), `SUPABASE_SERVICE_ROLE_KEY` frontend'e sızmaz.

Öneri motoru katmanlı:
1. **Sert filtreler** — hukuki uygunluk, bütçe, move window, evcil hayvan, hane büyüklüğü, erişilebilirlik,
   servis mevcudiyeti, veri tazeliği eşiği.
2. **Kural-tabanlı açıklanabilir skor** (Faz 1) — `0.30 budget + 0.20 bureaucracy_ease + 0.15 healthcare +
   0.15 gsm + 0.10 community + 0.10 flight`. SQL (`relocation_rank_locations_v1`) ↔ TS (`relocation-ranking.ts`)
   **ayna kontratı**; bir test iki tarafı kilitler (cadde deseni).
3. **Aday üretim + öğrenilmiş sıralama** (Faz 3) — LambdaMART/BPR; cold-start için knowledge-based bootstrap.

Skor cevabında her zaman `score_breakdown`, `why[]` (Türkçe) ve `source_quality` döner — aksi halde
kullanıcı güveni düşer ve model denetlenemez.

## 6. Deneyim, Operasyon, Uyum

- **PWA-first:** service worker ile uygulama kabuğu + aktif plan + checklist + emergency contacts offline cache
  (belgeler yalnız metadata düzeyinde — GDPR minimizasyon).
- **Bildirimler:** olaysal ("varıştan sonra 14 gün içinde adres kaydı", "5G kapsaması daha güçlü operatör").
  Faz 1: e-posta + in-app (mevcut Edge Function kalıbı); push sonraki faz.
- **Gözlemlenebilirlik:** ingestion latency, source freshness SLA, dedup oranı, p50/p95 latency, cache hit,
  click-out conversion. Loglar `request_id`/`move_id`/`source_id`/`model_version`/`policy_version` ile etiketlenir.
- **Lokalizasyon/Erişilebilirlik:** en az `tr-TR` + `en-US`, CLDR formatlama, WCAG 2.2 AA, tüm Türkçe metin
  `src/lib/text-normalization.ts` helper'larıyla (trIncludes/trUpper/trCompare), CSV export'a UTF-8 BOM.

## 7. Uygulama Fazları (özet)

- **Faz 0** — Discovery & veri sözleşmesi (bu klasör: e2e doc, source-registry, dataset-acceptance-contract, ADR, JSON Schema).
- **Faz 1** — Çekirdek şema + RLS + seed; `lib/relocation-*` modülü; kural-tabanlı öneri RPC'leri; PWA UI akışları.
- **Faz 2** — Ayrı `workers/relocation-ingestion` worker'ı (service-finder kalıbı) + ingestion migration + admin UI.
- **Faz 3** — Event instrumentation + hibrit LTR alpha (dataset yoğunlaştığında).

Tam adım dökümü onaylı plan dosyasındadır.

## 8. Reddedilen / Ertelenen Alternatifler
- Service-finder worker'ını **genişletmek** yerine ayrı worker (karar: temiz sınır; bkz. ADR-001).
- Baştan NestJS/Fastify mikroservisi — erken karmaşıklık; Edge Functions + küçük gateway yeterli.
- Baştan pgvector/OpenSearch/ML — dataset yokken açıklanabilir kural motoru daha güvenli ve denetlenebilir.
