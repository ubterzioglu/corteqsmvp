# CorteQS kendi veri katmanı

Supabase Cloud'un yerine geçen, **yalnız gerçekten kullandığımız** açık kaynak
bileşenlerden oluşan yığın.

- Neden bu mimari: `docs/supabase-exit-plan.md` §4
- Nasıl geçilir: `docs/migration-runbook.md`
- Coolify tarafı: `docs/coolify-deployment.md`
- Nerede kaldık: `docs/migration-status.md`

---

## Bu bir "Supabase self-host" kurulumu DEĞİLDİR

Supabase'in resmî compose'u 12+ konteyner çalıştırır. Biz **6** çalıştırıyoruz.
Fark, kurulmayanlarda:

| Kurulmadı | Neden (ölçüm) |
|---|---|
| kong / envoy | Yol yönlendirmeyi kendi nginx geçidimiz yapıyor |
| studio | Uygulama bağlanmıyor; ek saldırı yüzeyi |
| analytics (logflare) | Uygulama bağlanmıyor; en çok RAM yiyen servis |
| supavisor | Tek uygulama; PostgREST kendi havuzunu tutuyor |
| postgres-meta | Yalnız Studio için gerekli |
| imgproxy | Kodda **0** görsel dönüşümü çağrısı ölçüldü |

Bileşen lisansları (doğrulandı 2026-09-20): PostgREST **MIT** (bağımsız proje),
GoTrue **MIT**, storage-api **Apache-2.0**, realtime **Apache-2.0**.
VPS dışında hiçbir ücret yok.

---

## Servisler

```
gateway (nginx :8000)
  ├── /auth/v1/     → auth      (GoTrue   v2.197.0)
  ├── /rest/v1/     → rest      (PostgREST v14.17)
  ├── /storage/v1/  → storage   (storage-api v1.74.0)
  ├── /realtime/v1/ → realtime  (v2.134.10, opsiyonel profil)
  └── /functions/v1/→ (Faz 6)
            │
         db (supabase/postgres:17.6.1.136)
```

Sürümler **canlıdan ölçülerek** sabitlendi:
`/auth/v1/health` → v2.197.0 · `/storage/v1/version` → 1.73.1 · `select version()` → 17.6.

⚠️ **GoTrue sürümü canlıdan geri olamaz.** Daha eski bir GoTrue, restore edilmiş
auth şemasını "gelecekten gelmiş" görür ve açılışta migration hatası verir.

---

## Hızlı başlangıç (yerel)

```bash
cd infra/selfhost
cp .env.example .env          # doldur — JWT_SECRET en kritik alan
docker compose config          # sözdizimi + değişken doğrulaması
docker compose up -d
docker compose ps              # hepsi healthy olmalı

curl -s localhost:8000/health
curl -s localhost:8000/auth/v1/health
```

Realtime'ı da açmak için: `docker compose --profile realtime up -d`

⚠️ **Yığın BİR KEZ boş veritabanıyla kalkmalıdır.** GoTrue ve storage-api kendi
`auth` / `storage` şemalarını kendi sürümlerine göre kurar. Restore script'i bu
şemalar yoksa çalışmayı reddeder.

---

## Güvenlik kararları — zayıflatma

1. **Postgres portu yayınlanmaz.** Compose'da `ports:` yok.
   2026-08-05'te bırakılan bir kopyada 5432 açık kaldı ve üretim verisi
   (158 kullanıcı) **46 gün** internete açık durdu. Tekrarlamıyoruz.
   Yerel hata ayıklama gerekirse yalnız loopback'e bağla: `127.0.0.1:54322:5432`.
2. **Gateway yalnız loopback'e bağlanır** (`GATEWAY_BIND=127.0.0.1`);
   dışarıya Coolify'ın ters proxy'si açar ve TLS'i o sonlandırır.
3. **`.env` git'e girmez** (`.gitignore`'da açıkça yazılı).
4. **Hiçbir sır `VITE_` ile başlamaz** — o önek frontend paketine gömülür.
5. **CORS wildcard yok** — geçit yalnız bilinen origin'lere izin verir.

---

## nginx geçidinde dikkat

⚠️ **`add_header` KALITILMAZ.** Kendi `add_header`'ı olan bir `location`, üst
bloktaki TÜM `add_header`'ları iptal eder. Bu yüzden CORS başlıkları her
location'da **tekrarlanır**. Yeni location eklersen başlıkları oraya da kopyala —
yoksa o yolda CORS sessizce düşer. (Aynı tuzak `nginx.conf.template`'te de
belgeli; projede bir kez yaşandı.)

⚠️ `/rest/v1/` için `Access-Control-Expose-Headers: content-range` **şarttır**.
Yoksa tarayıcı o başlığı JS'ten gizler ve PostgREST'in `count` değeri sessizce
`null` döner — sayfalama her yerde bozulur.

---

## Dosya yerleşimi

```
infra/selfhost/
├── docker-compose.yml          6 servis
├── .env.example                anahtar adları (değer YOK)
├── gateway/
│   └── default.conf.template   Kong yerine yol yönlendirme + CORS + rate limit
└── postgres/
    ├── README.md               imaj seçimi + kendi imajımıza geçiş yolu
    └── init/
        └── 01-extensions.sql   eklentiler, CANLIDAKİ şema yerleşimiyle
```

İlgili script'ler `scripts/migration/` altında:
`export-supabase.mjs` · `export-storage.mjs` · `restore-selfhost.mjs` · `verify-parity.mjs`
