# Relocation Ingestion Worker

Postgres'ten `relocation_jobs` claim eder, kaynak adapter'larını çalıştırır, aday kayıtları
normalize + dedupe eder ve maliyet defteri yazar. Adaylar `relocation_candidates`'a `review`
durumunda düşer; admin onayından sonra `relocation_services` / `relocation_bureaucratic_steps` /
`relocation_emergency_contacts`'a publish edilir.

**Desen:** `workers/service-finder` ile aynı (queue-in-table + `worker_*` RPC + cost ledger).
**Migration:** `supabase/migrations/20260619104000_relocation_ingestion.sql`.

## Çalıştırma
```bash
cd workers/relocation-ingestion
npm install
npm run typecheck   # tsc --noEmit
npm run build       # dist/
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm start
```

## Env
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (zorunlu — service_role, RLS bypass).
- `RELOCATION_WORKER_ID`, `RELOCATION_POLL_MS`, `RELOCATION_CLAIM_LIMIT` (opsiyonel).
- Kaynak anahtarları `source_registry.secret_ref`'teki env adlarıyla okunur (ham anahtar DB'de yok).

## Adapter ekleme (ADR-001 / docs/plans/relocation-engine/source-registry.md)
1. `src/providers/<kaynak>.ts` içinde `SourceProvider` arayüzünü uygula (`key`, `supports`, `fetch`).
2. `src/worker-loop.ts` `PROVIDERS` listesine ekle.
3. **HTML scraping varsayılan değildir** — yalnız hukuki onay + resmi/lisanslı alternatif
   yokluğunda `robots.txt`'e saygıyla fallback. Lisans/cache/redistribution kısıtı source-registry.md'de.

Şu an yalnız `fixture` adapter mevcut (uçtan uca akış doğrulaması için).
