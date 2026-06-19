# ADR-001: Relocation Engine Stack

- **Durum:** Kabul edildi (2026-06-19)
- **Bağlam:** CorteQS'e taşınma öneri motoru dikeyi eklenecek. Repo React+Vite SPA, Supabase Auth/
  Postgres/RLS, Docker/Coolify ve mevcut `workers/service-finder` worker'ı içeriyor.

## Karar

1. **Frontend:** Mevcut React+Vite SPA içine `relocation` modülü olarak yerleşir; PWA'ya evrilir.
   Ayrı React Native/Expo uygulaması **reddedildi** (yeniden kullanım kaybı, daha yavaş teslim).
2. **Auth & veri:** Supabase Auth + Postgres + RLS. Mutasyonlar security-definer RPC üzerinden
   (cadde/service-finder kuralı). Ayrı auth sunucusu **reddedildi**.
3. **API orkestrasyonu:** Supabase Edge Functions + gerektiğinde küçük Node gateway. Baştan
   NestJS/Fastify mikroservisi **reddedildi** (erken operasyonel karmaşıklık).
4. **Arama:** Faz 1-2 Postgres (gerekirse FTS). pgvector/OpenSearch **ertelendi** (dataset hacmi belirsiz).
5. **ML:** Faz 1 kural-tabanlı açıklanabilir skor (SQL↔TS ayna kontratı). Öğrenilmiş sıralama (LambdaMART/
   BPR) **Faz 3'e ertelendi** — dataset yokken kural motoru daha güvenli ve denetlenebilir.
6. **Ingestion:** **Ayrı `workers/relocation-ingestion` worker'ı** kurulur; `workers/service-finder`
   birebir kalıp olarak alınır (job claim, cost ledger, candidate review, publish).
   - **Reddedilen alternatif:** service-finder worker'ını genişletmek. Gerekçe: relocation kaynakları
     (resmi portal/lisanslı API) service-finder'ın AI-arama/extract/classify hattından farklı bir veri
     modeline sahip; karışık tek worker bakımı zorlaştırır. Ayrı worker temiz sınır verir. Bedeli:
     claim/cost/retry iskeleti tekrar yazılır — ama service-finder'dan port edildiği için maliyet düşük.

## Sonuçlar
- (+) Mevcut repo pratikleriyle maksimum uyum, en düşük entegrasyon riski.
- (+) Veri belirsizliği altında dayanıklı (schema-first, kural-önce).
- (−) İki worker bakımı (service-finder + relocation-ingestion) — ortak kod ileride paylaşılan pakete çıkarılabilir.
- (−) `supabase/types.ts` senkron değilse yeni RPC dönüşleri geçici `as any` gerektirebilir (B1 backlog).
