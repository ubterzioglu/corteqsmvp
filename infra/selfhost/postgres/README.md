# Postgres imajı — neden `supabase/postgres` ve nasıl çıkarız

## Şu anki seçim

`supabase/postgres:17.6.1.136`

**Ölçüldü 2026-09-20:** canlı Supabase `PostgreSQL 17.6 on aarch64` çalıştırıyor.
Bu etiket birebir aynı ana sürümdür.

## Neden çıplak `postgres:17` kullanılmıyor

Bu veritabanı **6 eklenti + 2 farklı şema yerleşimi + 7 özel rol** gerektiriyor.
Çıplak imaj bunların hiçbirini vermez.

| İhtiyaç | Çıplak `postgres:17` | `supabase/postgres` |
|---|---|---|
| `postgis` (4 geography/geometry kolonu) | ❌ | ✅ |
| `vector` (2 embedding kolonu) | ❌ | ✅ |
| `pg_cron` (canlıda **6** iş) | ❌ | ✅ |
| `pg_net` (bildirim dağıtıcı) | ❌ | ✅ |
| `pg_trgm`, `unaccent` (Türkçe arama) | contrib, elle | ✅ |
| `anon` / `authenticated` / `service_role` / `authenticator` rolleri | ❌ | ✅ |
| `supabase_auth_admin`, `supabase_storage_admin` | ❌ | ✅ |
| `wal_level=logical` (realtime için) | elle | ✅ |

**2026-08-05'teki başarısız geçiş tam olarak burada çöktü:** veri `postgres:18-alpine`
üzerine kondu, roller ve eklentiler olmadığı için 481 RLS politikasından 102'si
taşınabildi, grant sayısı 0 kaldı ve `auth.uid()` sabit NULL döndüren bir mock'a
dönüştürüldü. Yani veritabanı "ayakta" ama yetkilendirmesi tamamen ölüydü.

## Bu bir Supabase bağımlılığı mı?

Kısmen — ama **en zararsız türden**. Bu imaj bir servis değil, **Postgres dağıtımıdır**:
üstünde çalışan şey standart PostgreSQL. Veri formatı standart, dump'lar taşınabilir,
istediğimiz an başka bir imaja geçebiliriz. Kontrol düzleminde (Supabase Cloud) hiçbir
bağımlılık kalmaz.

## Faz 9 — kendi imajımıza geçiş (opsiyonel)

Aceleye gerek yok; geçiş yeşile döndükten sonra yapılır. İskelet:

```dockerfile
FROM postgis/postgis:17-3.5        # postgis + postgres 17

RUN apt-get update && apt-get install -y --no-install-recommends \
      postgresql-17-cron \
      postgresql-17-pgvector \
    && rm -rf /var/lib/apt/lists/*

# pg_net PGDG'de yok — kaynaktan derlenir:
#   git clone --branch v0.20.0 https://github.com/supabase/pg_net && make && make install

COPY init/ /docker-entrypoint-initdb.d/
```

Ayrıca elle kurulması gerekenler (imaj bunları vermez):
- `anon`, `authenticated`, `service_role`, `authenticator` rolleri ve GRANT'leri
- `supabase_auth_admin`, `supabase_storage_admin` (GoTrue ve storage-api bu adlarla bağlanır)
- `auth.uid()` / `auth.role()` fonksiyonları — **GoTrue'nun kendi migration'ları
  bunları kurar**, elle yazma. Elle yazılan bir `auth.uid()` 2026-08-05'te tüm
  RLS'i sessizce devre dışı bıraktı.

⚠️ Bu geçişi yapmadan önce `scripts/migration/verify-parity.mjs` ile eski ve yeni
imaj arasında denklik doğrula. Eklenti sürümü değişirse `postgis` ve `vector`
davranışını ayrıca sına.

## init/

`01-extensions.sql` eklentileri **canlıdaki şema yerleşimiyle birebir** kurar.
Şema yeri tahmin edilemez — `postgis` `public`'te, `pgcrypto` `extensions`'ta.
Yanlış yere kurmak restore'u bozar. Ayrıntı dosyanın kendi yorumlarında.
