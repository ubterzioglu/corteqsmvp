# Geçiş Runbook'u — Supabase Cloud → kendi altyapımız

> **Durum:** Faz 1–2 kodu yazıldı, HİÇBİRİ CANLIDA ÇALIŞTIRILMADI.
> Envanter: `docs/supabase-exit-plan.md` · İlerleme: `docs/migration-status.md`
> Coolify ayrıntıları: `docs/coolify-deployment.md`

Bu belge **çalıştırılmak üzere** yazıldı. Her adımın bir doğrulaması ve bir geri
dönüşü vardır. Doğrulaması geçmeyen adımdan sonraki adıma GEÇME.

---

## 0. Değişmez kurallar

1. **Supabase projesi kullanıcı onayı olmadan kapatılmaz, silinmez.**
2. **Yeni sistemde yazma başladıktan sonra "eski URL'e dön" GÜVENLİ ROLLBACK DEĞİLDİR.**
   Bölüm 9'daki geri dönüş yaklaşımını oku.
3. Her canlıya dokunan adım ayrı onay ister.
4. Sıfır kesinti sözü verilmiyor. Seçilen yol: **30–60 dk bakım penceresi**.

---

## 1. Bu geçişin SESSİZCE bozulabileceği yerler

Bunlar 2026-08-05 denemesinde gerçekten yaşandı ya da ölçümle tespit edildi.
Her biri "testler yeşil, site açılıyor" görünürken veri/yetki kaybettirir.

| # | Tuzak | Belirtisi | Kontrolü |
|---|---|---|---|
| 1 | `supabase db dump` kullanmak | `auth`/`storage`/`vault`/roller dökümlenmez | `scripts/migration/export-supabase.mjs` kullan, CLI'ı DEĞİL |
| 2 | Roller yüklenmemiş | RLS politikaları var ama hepsi anlamsız | `verify-parity.mjs` → `rol_anon_auth_service` = 4 |
| 3 | Grant'ler yok | 2026-08-05'te 0 idi, fark edilmedi | `verify-parity.mjs` → `grant_public` eşleşmeli |
| 4 | `auth.uid()` mock | Tüm RLS anonim davranır, veri sızar | Olumsuz erişim testi (Bölüm 7) |
| 5 | `--no-owner` ile restore | 274 SECURITY DEFINER fonksiyonun yetkisi değişir | Restore script'i `--no-owner` KULLANMAZ |
| 6 | Sequence'ler geride | Günler sonra PK çakışması | `verify-parity.mjs` → sequence bölümü |
| 7 | Storage dosyaları taşınmamış | DB tutarlı, her avatar/CV 404 | `export-storage.mjs` + dosya sayımı |
| 8 | Vault kök anahtarı taşınmamış | Bildirim mailleri sessizce durur | Bölüm 4.3 |
| 9 | JWT secret farklı | Tüm kullanıcılar anında çıkış yapar | Bölüm 3.2 |
| 10 | GoTrue sürümü canlıdan eski | Açılışta migration hatası | Compose'da v2.197.0+ sabit |
| 11 | CSP `connect-src` güncellenmemiş | Realtime + tüm API sessizce ölür | Bölüm 8.2 |
| 12 | Google OAuth redirect URI eklenmemiş | Google ile giriş `redirect_uri_mismatch` | Bölüm 4.2 |
| 13 | `cron.job` yeniden kurulmamış | `cadde-cafe-expiring` hiç çalışmaz | Bölüm 4.4 |
| 14 | Eski + yeni cron aynı anda | Çift işlem / çift mail | Bölüm 8.1 |
| 15 | DB portu dışa açık | 2026-08-05'te 46 gün açık kaldı | Compose portu yayınlamaz |

---

## 2. Faz 1 — Yerel yığını ayağa kaldır (canlıya dokunmaz)

**Ön koşul:** Docker Desktop çalışıyor olmalı.

```bash
cd infra/selfhost
cp .env.example .env
# .env'i doldur — JWT_SECRET için Bölüm 3.2'yi oku
docker compose config          # sözdizimi + değişken doğrulaması
docker compose up -d
docker compose ps              # hepsi healthy olmalı
```

**Doğrulama:**
```bash
curl -s localhost:8000/health                       # -> ok
curl -s localhost:8000/auth/v1/health               # -> {"version":"v2.197.0",...}
curl -s localhost:8000/storage/v1/version           # -> 1.74.x
```

⚠️ **Bu adım atlanamaz:** yığın bir kez boş DB ile kalkmalı ki GoTrue ve storage-api
kendi `auth` / `storage` şemalarını KENDİ sürümlerine göre kursun. Restore script'i
bu şemalar yoksa çalışmayı reddeder.

**Geri dönüş:** `docker compose down -v` (yerel, etkisiz).

---

## 3. Faz 2 — Export (canlıdan SALT OKUMA)

### 3.1 Veritabanı

```bash
node scripts/migration/export-supabase.mjs --out C:\corteqs-yedek\2026-XX-XX
# planı oku, sonra:
node scripts/migration/export-supabase.mjs --out C:\corteqs-yedek\2026-XX-XX --confirm
```

⚠️ Canlı instance **904 MB RAM**. Düşük trafikli saatte çalıştır.
⚠️ Çıktı repo DIŞINDA olmalı (script zaten reddeder) — 158 kullanıcının kişisel verisi.

### 3.2 JWT secret — geçişin en kritik tek ayarı

Supabase Dashboard → **Project Settings → API → JWT Settings → JWT Secret**.

Bu değeri `infra/selfhost/.env` içindeki `JWT_SECRET`'a **birebir** yaz.

| Aynı yazarsan | Farklı yazarsan |
|---|---|
| Mevcut `anon` ve `service_role` anahtarları çalışmaya devam eder | Anahtarlar geçersizleşir |
| Kullanıcıların açık oturumları DÜŞMEZ | **Herkes anında çıkış yapar** |
| Frontend'de yalnız URL değişir | Frontend anahtarları da değişmeli |

Ölçüldü 2026-09-20: üç anahtar da legacy HS256 JWT (`eyJh…`) — yani bu yöntem geçerli.

`JWT_ISSUER` da eşleşmeli: `https://<PROJE_REF>.supabase.co/auth/v1`.

### 3.3 Storage dosyaları

```bash
node scripts/migration/export-storage.mjs --out C:\corteqs-yedek\2026-XX-XX
# envanteri oku (nesne sayısı + toplam boyut), sonra:
node scripts/migration/export-storage.mjs --out C:\corteqs-yedek\2026-XX-XX --confirm
```

Yarım kalırsa **aynı komutu tekrar çalıştır** — kaldığı yerden devam eder.
Her dosyanın sha256'sı `storage-inventory.json`'a yazılır.

⚠️ S3 ETag'i her zaman MD5 değildir (çok parçalı yüklemede farklıdır) — bu yüzden
ETag'e değil kendi sha256'mıza güveniyoruz.

---

## 4. Faz 3–4 — Restore ve elle taşınan parçalar

### 4.1 Veritabanı restore

```bash
node scripts/migration/restore-selfhost.mjs \
  --from C:\corteqs-yedek\2026-XX-XX \
  --target postgresql://postgres:<PAROLA>@127.0.0.1:54322/postgres
# planı oku, sonra --confirm ekle
```

Script kendiliğinden doğrular: roller, tablo/politika/fonksiyon sayıları,
`auth.users`, `storage.objects`, `schema_migrations`.

**Roller eksikse durur** — bu 2026-08-05'in tam çöküş noktasıydı.

### 4.2 Google OAuth

1. Google Cloud Console → Credentials → OAuth 2.0 Client
2. **Authorized redirect URIs**'e ekle: `https://api.corteqs.net/auth/v1/callback`
3. Eski Supabase URI'sini **HENÜZ SİLME** (rollback için lazım)
4. Client ID + Secret → `.env` içindeki `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_SECRET`

### 4.3 Vault sırları — **İKİ tane var, ikisi de kritik**

Ölçüldü 2026-09-20: `vault.secrets` içinde **2 sır** var. İlk envanterim yalnız
birini biliyordu; ikincisi cron dump'ı alınırken ortaya çıktı.

| Sır | Kullanan | Taşınmazsa |
|---|---|---|
| `notification_dispatch_secret` | `poke_notification_dispatcher()` → `notification-email-drain` cron'u (`*/15`) | **Hiçbir bildirim maili gitmez** |
| `radar_news_cron_secret` | `corteqs-radar-daily-news-scan` cron'u (`0 5 * * *`), `net.http_post` Authorization header'ında | **Radar haber taraması durur** |

Vault sırları kök şifreleme anahtarına bağlıdır ve anahtar **taşınamaz**.
Kopyalamaya çalışma — çözülemez veri taşımış olursun.

**Doğru yol: hedefte YENİDEN OLUŞTUR.**

```sql
-- Hedefte, restore SONRASI:
select vault.create_secret('<YENİ_DEĞER>', 'notification_dispatch_secret', 'Bildirim dağıtıcı');
select vault.create_secret('<YENİ_DEĞER>', 'radar_news_cron_secret', 'Radar haber cron');
```

Sonra bağlı yerleri aynı değerlere getir:
- `notification_settings` tablosundaki `dispatch.secret`
- `.env` içindeki `NOTIFY_DISPATCH_SECRET`
- `RADAR_NEWS_CRON_SECRET` (radar-news-scan fonksiyonunun ortamı)

⚠️ `07-cron-jobs.sql` içindeki radar işi `vault.decrypted_secrets`'tan okuyor —
sır yoksa cron çalışır ama **401 alır ve sessizce başarısız olur**.

**Doğrulama:** `/admin/notifications` → "Şimdi gönder" → mail düşmeli.
Radar için: cron'u elle tetikle, `radar_news_scan_runs` tablosuna satır düşmeli.

### 4.4 pg_cron işleri — repo YANILTICI, canlıda 6 iş var

⚠️ Repo yalnız `cadde-cafe-expiring`'i belgeliyor. **Canlıda ölçüldü (2026-09-20): 6 iş.**
Beşini kaçırmak radar haber taramasını, bildirim maili drenajını ve saklama
temizliklerini **sessizce** durdururdu.

| İş | Zamanlama | Kaçarsa ne olur |
|---|---|---|
| `cadde-cafe-expiring` | `*/10 * * * *` | Süresi dolan cafe'ler kapanmaz |
| `notification-email-drain` | `*/15 * * * *` | **Hiçbir bildirim maili gitmez** |
| `relocation-tool-abandonment-reminders` | `17 * * * *` | Yarım kalan araç hatırlatmaları durur |
| `corteqs-radar-daily-news-scan` | `0 5 * * *` | Radar haber beslemesi durur |
| `client_error_reports_prune` | `17 3 * * *` | Hata tablosu sınırsız büyür |
| `whatsapp-webhook-retention` | `17 3 * * *` | WhatsApp kayıtları temizlenmez |

`export-supabase.mjs` bunları `07-cron-jobs.sql` olarak **canlıdan üretir** —
ezberden yazma, dosyayı kullan. Listeyi tekrar doğrulamak istersen:

```sql
select jobname, schedule, command from cron.job order by jobname;
```

🔴 **Bu dosya restore sırasında ÇALIŞTIRILMAZ** (`restore-selfhost.mjs` onu
bilerek yüklemez). Yalnız **cutover adımı 6'da**, Supabase tarafındaki cron'lar
durdurulduktan SONRA çalıştırılır. Aksi halde iki sistem aynı anda mail gönderir.

### 4.5 Storage dosyalarını yükle

Bucket'lar `05-data-storage.sql` ile metadata olarak geldi; dosyalar yerel diskte.
`storage-data` volume'una kopyala, sonra sayım + sha256 doğrula.

⚠️ Özel bir bucket'ı kolaylık olsun diye public YAPMA — `storage-inventory.json`
her bucket'ın `public` değerini kaydetti, aynısını kur.

---

## 5. Faz 5 — Denklik doğrulaması

```bash
node scripts/migration/verify-parity.mjs \
  --target postgresql://postgres:<PAROLA>@127.0.0.1:54322/postgres \
  --json C:\corteqs-yedek\parity.json
```

Kritik uyuşmazlık varsa **cutover yok**. Satır sayısı farkları için önce hedefte
`ANALYZE;` çalıştır (istatistik yaklaşıktır), fark sürüyorsa gerçektir.

---

## 6. Faz 6 — Edge Functions

9 fonksiyon (~2.345 satır Deno). Geçici olarak Supabase'de BIRAKILABİLİR —
`functions.invoke` yalnız 4 yerde kullanılıyor ve ayrı bir host'a yönlendirilebilir.

⚠️ `whatsapp-webhook` Meta tarafından çağrılıyor. URL değişirse **Meta panelinde
webhook adresi güncellenmelidir**, yoksa gelen mesajlar sessizce kaybolur.
HMAC-SHA256 imza doğrulaması ve verify token aynen korunmalı.

---

## 7. Faz 7 — Testler

| Test | Nasıl | Geçme ölçütü |
|---|---|---|
| Taban | `npm run test` | 280 dosya / 1.990 test yeşil |
| Tip | `npx tsc -p tsconfig.app.json --noEmit` | 0 hata |
| Lint | `npm run lint` | 0 problem |
| Migration | `npm run check:migrations` | sapma yok |
| **Olumsuz erişim** | Aşağıya bak | A, B'nin verisini görememeli |
| Giriş akışları | Elle | kayıt / giriş / çıkış / sıfırlama / Google |
| Dosya erişimi | Elle | özel dosya imzasız açılmamalı |
| Realtime | Elle | DB'ye INSERT → istemci olay almalı |
| Kalıcılık | `docker compose restart` | veri durmalı |
| Restore provası | İzole ortam | yedekten geri dönülebilmeli |

### Olumsuz erişim testi — bu atlanamaz

RLS'in gerçekten çalıştığını kanıtlayan tek şey budur. `auth.uid()` mock olsaydı
diğer tüm testler yine yeşil olurdu.

```bash
# Kullanıcı A'nın token'ıyla, kullanıcı B'nin satırını iste:
curl -s "http://localhost:8000/rest/v1/user_profile_attributes?user_id=eq.<B_ID>" \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <A_ACCESS_TOKEN>"
# BEKLENEN: [] (boş dizi)
# [] DEĞİLSE: RLS ölü. Cutover YOK.

# Anonim olarak aynı istek:
curl -s "http://localhost:8000/rest/v1/user_profile_attributes?user_id=eq.<B_ID>" \
  -H "apikey: <ANON_KEY>"
# BEKLENEN: [] veya 401
```

---

## 8. Faz 8 — Cutover (30–60 dk bakım penceresi)

**Bu adım ayrı onay ister.**

### 8.1 Sıra

| # | Adım | Geri dönüş |
|---|---|---|
| 1 | Doğrulanmış yedek al (Supabase + hedef) | — |
| 2 | Bakım modunu aç (nginx'te 503 sayfası) | kapat |
| 3 | Supabase'de yazmayı durdur / kullanıcıları kilitle | aç |
| 4 | **Son delta export** (3.1 + 3.3 tekrar) | — |
| 5 | Hedefe yükle + `verify-parity` | hedefi sıfırla |
| 6 | **Supabase'de cron'ları durdur**, hedefte başlat | ters çevir |
| 7 | Meta webhook URL'ini güncelle | eski URL'e dön |
| 8 | Coolify'da `VITE_SUPABASE_URL` değiştir + restart | env'i geri al |
| 9 | Bakım modunu kapat | — |
| 10 | Smoke test (8.3) | Bölüm 9 |

⚠️ Adım 6 kritik: eski ve yeni cron aynı anda çalışırsa **çift mail** gider.

### 8.2 CSP — atlanırsa her şey sessizce ölür

`nginx.conf.template` içindeki `$corteqs_csp` `connect-src`'ine yeni host eklenmeli:

```
connect-src 'self' https://api.corteqs.net wss://api.corteqs.net ...
```

⚠️ `wss://` **AYRI YAZILMALI** — tarayıcılar ws/wss şemasını https'ten ayrı
değerlendirir (bu kural zaten `nginx.conf.template`'te yazılı). Yazılmazsa
Realtime bağlanamaz ve hata konsola "CSP violation" olarak düşer.

⚠️ `img-src`'de de `https://*.supabase.co` var — storage görselleri yeni host'tan
gelecekse oraya da eklenmeli, yoksa **her avatar kırık görünür**.

### 8.3 Smoke testleri (kabul ölçütü)

- [ ] Ana sayfa açılıyor, konsolda CSP ihlali yok
- [ ] Mevcut kullanıcı **çıkış yapmadan** devam ediyor (JWT secret doğruysa)
- [ ] Yeni kayıt + doğrulama maili
- [ ] Parola sıfırlama maili geliyor ve çalışıyor
- [ ] Google ile giriş
- [ ] `/cadde` akışı yükleniyor, paylaşım yapılabiliyor
- [ ] Avatar ve medya görselleri görünüyor
- [ ] Özel dosya (CV) indirilebiliyor, imzasız URL çalışmıyor
- [ ] `/admin` açılıyor, admin kontrolü çalışıyor
- [ ] Mesaj gönder → karşı tarafta Realtime ile anında görünüyor
- [ ] `curl -I https://corteqs.net/` → güvenlik başlıkları geliyor

### 8.4 İzleme

İlk **48 saat**: `client_error_reports` tablosunu günde 2 kez kontrol et
(`/admin/client-errors`). Başarısızlık eşiği: saatte 10'dan fazla yeni hata →
Bölüm 9.

---

## 9. Geri dönüş

### 9.1 Yazma BAŞLAMADAN önce (bakım penceresi içinde)
Coolify'da `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` eski değerlere
alınır, konteyner yeniden başlatılır. **Yeniden derleme gerekmez** — yapılandırma
`docker-entrypoint-env.sh` ile çalışma zamanında enjekte edilir. Süre: dakikalar.

### 9.2 Yazma BAŞLADIKTAN sonra
🔴 **Sadece eski URL'e dönmek veri kaybettirir** — yeni sistemde oluşan kayıtlar
Supabase'de yoktur.

Seçenekler:
1. **İleri düzeltme (tercih edilen):** sorunu yeni sistemde çöz. Bakım penceresi
   kısa olduğu için genelde en hızlı yol budur.
2. **Ters senkronizasyon:** bakım moduna al, yeni sistemden `--data-only` dump al,
   Supabase'e delta olarak yükle, sonra URL'i geri çevir. **Bu prova edilmeden
   güvenilir sayılmaz** — Faz 7'de bir kez dene.
3. **Yazmayı durdur:** siteyi salt okunur moda al, kararı sonra ver.

**Kural: cutover'dan sonraki ilk 48 saat içinde Supabase projesi silinmez,
duraklatılmaz, anahtarları döndürülmez.**

---

## 10. Cutover sonrası temizlik (ayrı oturum)

- [ ] Supabase'i salt okunur bırak, 30 gün sakla
- [ ] `87.106.222.106:5432` eski kopyayı kapat/sil (bkz. güvenlik notu)
- [ ] Kullanılmayan env değişkenlerini kaldır
- [ ] `CLAUDE.md`'yi güncelle (üretim veri katmanı artık kendi altyapımız)
- [ ] **VPS dışı yedek** kur + restore provası yap
- [ ] GoTrue/PostgREST/storage güvenlik güncellemeleri için takip kur
