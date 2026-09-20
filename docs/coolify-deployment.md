# Coolify Dağıtımı — kendi veri katmanımız

> Runbook: `docs/migration-runbook.md` · Envanter: `docs/supabase-exit-plan.md`
> Compose: `infra/selfhost/docker-compose.yml`

VPS: **8 çekirdek / 32 GB RAM / 480 GB disk** (kullanıcı bildirdi, 2026-09-20).
Bu kapasite seçilen yalın yığın için fazlasıyla yeterli; staging'i de aynı makinede
çalıştırmaya imkân verir.

---

## 1. Kaynak yerleşimi

Coolify'da **iki ayrı kaynak** olur:

| Kaynak | Ne | Nereden |
|---|---|---|
| `corteqs-web` (mevcut) | React SPA + nginx | kök `Dockerfile` |
| `corteqs-data` (YENİ) | Postgres + PostgREST + GoTrue + storage + gateway | `infra/selfhost/docker-compose.yml` |

`corteqs-data` bir **Docker Compose** kaynağı olarak eklenir.
`workers/service-finder` ve `workers/relocation-ingestion` zaten ayrı uygulamalar —
onların `SUPABASE_URL` değişkenleri de cutover'da güncellenmelidir. **Unutulursa
sessizce eski Supabase'e yazmaya devam ederler.**

---

## 2. Ağ ve erişim — en önemli bölüm

```
internet
   │
   ├── corteqs.net         → corteqs-web  (nginx, SPA)
   └── api.corteqs.net     → corteqs-data (gateway :8000)
                                  │
                                  ├── rest     :3000  ─┐
                                  ├── auth     :9999   │  YALNIZ iç ağ
                                  ├── storage  :5000   │  DIŞA AÇIK DEĞİL
                                  ├── realtime :4000   │
                                  └── db       :5432  ─┘
```

🔴 **Postgres portu dışa AÇILMAZ.** Compose bilerek `ports:` tanımlamaz.
2026-08-05'te bırakılan bir kopyada 5432 açık kaldı ve üretim verisi **46 gün**
internete açık durdu (2026-09-20'de hâlâ açıktı). Bunu tekrarlamıyoruz.

⚠️ **Konteyner içindeki `localhost` başka bir servis DEĞİLDİR.** Servisler
birbirine compose servis adıyla ulaşır (`db`, `rest`, `auth`, `storage`).
`localhost:5432` yazarsan konteynerin kendisine bakar ve bağlantı reddedilir.

`api.corteqs.net` için Coolify'da TLS'i (Let's Encrypt) aç. Gateway'de TLS yok —
sonlandırma Coolify'ın ters proxy'sinde yapılır, bu yüzden gateway
`X-Forwarded-Proto` başlığına güvenir.

---

## 3. Senin yapman gerekenler — kontrol listesi

Panelde yapılacaklar. Ben panele erişemiyorum.

### 3.0 ÖNCE: eski kopyayı kapat (geçişten bağımsız, acil)
- [ ] Coolify → eski PostgreSQL kaynağı → **Ports/Network** → `5432:5432` eşlemesini kaldır
- [ ] **Redeploy** et (panelde değiştirmek yetmez)
- [ ] Doğrula: `Test-NetConnection -ComputerName 87.106.222.106 -Port 5432` → `False`
- [ ] Superuser parolasını döndür
- [ ] Karar: o kırık kopya silinsin mi? (0 grant, 0 rol — geçişte işe yaramaz)

### 3.1 Sırları üret
```bash
openssl rand -base64 36   # POSTGRES_PASSWORD
openssl rand -base64 48   # SECRET_KEY_BASE  (en az 64 karakter olmalı)
openssl rand -base64 24   # REALTIME_DB_ENC_KEY
```

### 3.2 Supabase Dashboard'dan al
- [ ] **Project Settings → API → JWT Settings → JWT Secret** → `JWT_SECRET`
      🔑 Yanlış olursa tüm kullanıcılar anında çıkış yapar.
- [ ] Mevcut `anon` ve `service_role` anahtarları → `ANON_KEY`, `SERVICE_ROLE_KEY`
      (aynısı — değiştirme, frontend onları kullanmaya devam edecek)
- [ ] **Authentication → Providers → Google** → Client ID + Secret
- [ ] **Authentication → URL Configuration** → mevcut redirect URL listesi
- [ ] **Authentication → Email Templates** → varsa özelleştirilmiş şablonlar
      (GoTrue'da karşılıkları elle kurulur; aksi halde İngilizce varsayılanlar gelir)

### 3.3 Coolify'da `corteqs-data` ortam değişkenleri
`infra/selfhost/.env.example` içindeki adların **hepsi** doldurulmalı:

```
POSTGRES_PASSWORD, JWT_SECRET, JWT_ISSUER, ANON_KEY, SERVICE_ROLE_KEY,
API_EXTERNAL_URL, SITE_URL, ADDITIONAL_REDIRECT_URLS,
GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_SECRET,
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_ADMIN_EMAIL,
SECRET_KEY_BASE, REALTIME_DB_ENC_KEY
```

⚠️ Bunların hiçbiri `VITE_` ile BAŞLAMAZ. `VITE_` öneki taşıyan her değişken
frontend paketine gömülür ve herkese görünür.

### 3.4 Google Cloud Console
- [ ] OAuth Client → **Authorized redirect URIs**'e `https://api.corteqs.net/auth/v1/callback` ekle
- [ ] Eski Supabase URI'sini **henüz silme** (rollback için)

### 3.5 Cutover anında `corteqs-web` değişkenleri
- [ ] `VITE_SUPABASE_URL` → `https://api.corteqs.net`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` → aynı kalır (JWT secret aynıysa)
- [ ] Redeploy **gerekmez** — restart yeter (`docker-entrypoint-env.sh` çalışma
      zamanında `env-config.js` üretir). Geri dönüş de aynı hızda.
- [ ] `workers/*` uygulamalarının `SUPABASE_URL` değişkenleri de güncellensin

---

## 4. Migration'ların çalıştırılması

⚠️ **Birden fazla uygulama kopyası aynı migration'ı eşzamanlı çalıştırmamalı.**

Bu yığında migration'lar konteyner açılışında ÇALIŞTIRILMAZ. Şema `applied/`
altındaki dosyalarla ve `scripts/apply-migration.mjs` ile **elle** uygulanır —
mevcut iş akışı zaten böyle ve bu, eşzamanlılık sorununu baştan ortadan kaldırır.

GoTrue ve storage-api kendi iç migration'larını açılışta çalıştırır; ikisi de tek
kopya olarak koşuyor (`replicas: 1`), çakışma yok. Ölçeklendirirsen bu varsayım bozulur.

---

## 5. Yedekleme — tek hata noktası uyarısı

🔴 Uygulama, veritabanı ve dosyalar **aynı VPS'te**. Bu tek hata noktasıdır:
disk arızası, yanlış bir `docker compose down -v`, ya da sağlayıcı kaynaklı bir
kesinti her şeyi birden götürür. Supabase Cloud'da bu risk sağlayıcıdaydı;
artık bizde.

Zorunlu asgari:
- [ ] Günlük `pg_dump` → **VPS DIŞINDA** bir hedefe (object storage / ikinci sunucu)
- [ ] `storage-data` volume'unun günlük yedeği (dosyalar DB'de değil)
- [ ] **Restore provası** — yedekten dönülebildiği kanıtlanmadan yedek sayılmaz
- [ ] Saklama: en az 30 gün, haftalıklar 3 ay

⚠️ Yedeğin aynı VPS'te durması yedek değildir.

---

## 6. Kaynak kullanımı (tahmin, ölçümle doğrula)

| Servis | RAM (yaklaşık) |
|---|---|
| Postgres | 1–2 GB |
| PostgREST | 100–200 MB |
| GoTrue | 50–100 MB |
| storage-api | 150–300 MB |
| realtime | 200–400 MB |
| gateway | 20 MB |
| **Toplam** | **~2–3 GB** |

32 GB'ta çok rahat. Karşılaştırma: Supabase Cloud instance'ı **904 MB** idi ve
2026-08-05'te tek bir kötü sorgu onu düşürüp siteyi ~50 dk kapattı. Bu geçiş
performans açısından net bir iyileşme.

Postgres'e `shared_buffers` / `work_mem` ayarı yapılabilir — ama **önce ölç**,
varsayılanlarla başla.

---

## 7. Sağlık kontrolleri

Compose her servise healthcheck tanımlar. Coolify bunları okur.

```bash
curl -s https://api.corteqs.net/health              # gateway
curl -s https://api.corteqs.net/auth/v1/health      # GoTrue sürümü
curl -s https://api.corteqs.net/storage/v1/version  # storage sürümü
```

⚠️ `/rest/v1/` anon anahtarla **401** döner — bu NORMALDİR, o uç nokta yalnız
`service_role` kabul eder. Sağlık göstergesi olarak kullanma.

---

## 8. Güvenlik güncellemeleri

GoTrue'nun kendi dokümanı uyarıyor: *"Running an authentication server in
production is not an easy feat."* Supabase Cloud'da güvenlik yamalarını onlar
yapıyordu; artık biz yapacağız.

- [ ] Ayda bir: `supabase/gotrue`, `postgrest/postgrest`, `supabase/storage-api`,
      `supabase/postgres` için yeni sürüm kontrolü
- [ ] Yükseltmeden önce staging'de dene (aynı VPS'te ikinci compose projesi)
- [ ] Sürüm etiketlerini **sabit tut** — `latest` kullanma
