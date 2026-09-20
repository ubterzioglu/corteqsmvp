-- Eklentileri CANLIDAKİ ŞEMA YERLEŞİMİYLE BİREBİR kurar.
--
-- ⚠️ ŞEMA YERİ ÖNEMLİDİR, TAHMİN EDİLEMEZ. Ölçüldü 2026-09-20, canlı Supabase
--    (PostgreSQL 17.6) üzerinde `pg_extension ⋈ pg_namespace` sorgusuyla.
--
--    Yanlış şemaya kurmak restore'u sessizce ya da gürültülü şekilde bozar:
--    örneğin `postgis` `extensions` şemasına kurulursa, restore edilen DDL'deki
--    `public.geography(Point,4326)` tipi BULUNAMAZ ve tablo oluşturulamaz.
--    Canlıda ölçülen 4 geography/geometry kolonu bu tipe bağlıdır:
--      public.catalog_item_locations.geo   ← canlı veri
--      public.valid_detail.location
--      public.geometry_dump.geom
--      public._bak_org_catalog_item_locations_20260609.geo
--
-- Bu dosya SALT İLK AÇILIŞTA çalışır (docker-entrypoint-initdb.d).
-- Hepsi IF NOT EXISTS — tekrar çalıştırılması zararsızdır.

-- ── public şemasındakiler ────────────────────────────────────────────────────
-- Canlıda ölçülen sürümler yorumda; imaj daha yeni verebilir, bu normaldir.

create extension if not exists postgis   with schema public;  -- canlı: 3.3.7
create extension if not exists pg_trgm   with schema public;  -- canlı: 1.6
create extension if not exists unaccent  with schema public;  -- canlı: 1.1

-- ⚠️ pgvector ZORUNLUDUR. "Gerekmiyor" sanılmasın diye yazıyorum:
--    2026-08-04 tarihli baseline dump'ında vektör kolonu YOKTU, ama canlıda VAR.
--    Ölçüldü 2026-09-20 — iki gerçek kolon:
--      public.rag_documents.embedding
--      public.catalog_search_documents.embedding
--    Bu eklenti olmadan şema restore'u BAŞARISIZ OLUR.
create extension if not exists vector    with schema public;  -- canlı: 0.8.0

-- ── extensions şemasındakiler ────────────────────────────────────────────────
create schema if not exists extensions;

create extension if not exists pgcrypto            with schema extensions;  -- 1.3
create extension if not exists "uuid-ossp"         with schema extensions;  -- 1.1
create extension if not exists pg_stat_statements  with schema extensions;  -- 1.11

-- pg_net: bildirim dağıtıcısı (poke_notification_dispatcher) net.http_post çağırır.
-- Kendi `net` şemasını yaratır; `extensions` içine kurulur (canlıdaki gibi).
create extension if not exists pg_net with schema extensions;                -- 0.20.0

-- ── pg_catalog'daki ──────────────────────────────────────────────────────────
-- pg_cron yalnız shared_preload_libraries'te olduğunda kurulabilir
-- (compose'da ayarlı). Kendi `cron` şemasını yaratır.
create extension if not exists pg_cron;                                      -- 1.6.4

-- ── uygulama şemaları ────────────────────────────────────────────────────────
-- Restore bunları zaten yaratır; burada önceden açmak grant sırası sorunlarını
-- önler. Canlıda ölçülen, Supabase'e ait OLMAYAN şemalar:
create schema if not exists ops;         -- ajan analitiği (0 satır)
create schema if not exists ingest;      -- ajan araç kataloğu ingest (0 satır)
create schema if not exists afs_backup;  -- 2026-06-11 rol yedeği (0 satır)

-- ⚠️ supabase_vault (canlı: 0.3.1, `vault` şemasında) BİLEREK burada kurulmuyor.
--    Vault sırları kök şifreleme anahtarına bağlıdır ve anahtar taşınamaz.
--    Doğru yol: hedefte sırrı YENİDEN OLUŞTURMAK.
--    Bkz. docs/migration-runbook.md §4.3 — atlanırsa bildirim mailleri sessizce durur.
