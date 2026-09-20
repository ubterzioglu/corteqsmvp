# Supabase Çıkış Planı — Bağımlılık Envanteri ve Mimari Kararı

> **Durum:** Faz 0 (envanter) TAMAM · mimari kararı ONAY BEKLİYOR
> **Ölçüm tarihi:** 2026-09-20 · **Ölçen:** repo taraması (canlı DB'ye yazma YOK)
> **İlerleme takibi:** `docs/migration-status.md`
> **Runbook:** `docs/migration-runbook.md` (mimari onaylandıktan sonra yazılacak)

Bu belgedeki her sayı repodan **ölçülmüştür**, tahmin değildir. Ezberleme —
değiştirmeden önce ilgili komutu tekrar çalıştır.

---

## 0. Taban durum (geçiş öncesi, değişmemiş ağaçta)

| Kontrol | Komut | Sonuç |
|---|---|---|
| Test | `npm run test` | **280 dosya / 1.990 test YEŞİL** |
| Tip denetimi | `npx tsc -p tsconfig.app.json --noEmit` | **0 hata** |
| Lint | `npm run lint` | 0 problem (CLAUDE.md, 2026-09-05 ölçümü) |

Geçiş sırasında çıkan her hata bu tabana göre "yeni" sayılır.

⚠️ Ölçüm sırasında çalışma ağacında 10 commit'lenmemiş dosya vardı (kullanıcının kendi
işi). Hiçbirine dokunulmadı.

---

## 1. Mevcut stack

- **Frontend:** React 18 + Vite 8 + TypeScript + Tailwind + shadcn/ui. **Saf SPA.**
- **Yönlendirme:** `react-router-dom` 7, `src/App.tsx` (313 satır, 51 `lazy()`).
- **Veri katmanı:** `@supabase/supabase-js` **2.108.2** — tek istemci
  (`src/integrations/supabase/client.ts`). Kısmen `@tanstack/react-query`.
- **Üretim çalışma zamanı:** **nginx 1.27-alpine** (`Dockerfile` → `nginx.conf.template`).
  Statik dosya servisi + güvenlik başlıkları + CSP + 301'ler + `/api/chat` proxy.
- **`server.mjs`:** üretimde ÇALIŞMAZ. Yalnız `npm run start` ve nixpacks yolu.
- **Paket yöneticisi:** npm (`package-lock.json`), Node >= 22.
- **Ayrı Coolify uygulamaları:** `workers/service-finder`, `workers/relocation-ingestion`
  (ikisinin de kendi `Dockerfile`'ı var, ikisi de Supabase'e bağlanır).

### Kritik ve olumlu bulgu: yapılandırma ÇALIŞMA ZAMANINDA enjekte ediliyor

`docker-entrypoint-env.sh` konteyner açılışında `/usr/share/nginx/html/env-config.js`
dosyasını üretir; `index.html:364` bunu yükler; `client.ts` **önce**
`window.__APP_CONFIG__`'a bakar, ancak o yoksa `import.meta.env`'e düşer.

**Sonucu:** Uygulamayı başka bir backend'e yöneltmek = Coolify'da 3 ortam değişkenini
değiştirip konteyneri yeniden başlatmak. **Yeniden derleme gerekmez, geri dönüş
saniyeler sürer.** Bu, tüm geçiş risk hesabını değiştiren en önemli tek gerçektir.

---

## 2. Gerçekte kullanılan Supabase özellikleri

| Bileşen | Kanıt / dosya yolu | Mevcut kullanım | Önerilen karşılık | Risk | Doğrulama yöntemi |
|---|---|---|---|---|---|
| **PostgreSQL** | `supabase/baseline/2026-08-04-public-schema.sql` | **237 tablo**, 5 view, 342 index, 115 trigger | Kendi Postgres'imiz (eklenti uyumlu imaj) | Orta | `pg_dump`/`pg_restore` + satır/ilişki/sequence karşılaştırması |
| **PostgREST (`.from()`)** | `src` geneli | **457 çağrı**, **108 farklı tablo/view** tarayıcıdan doğrudan | PostgREST (bağımsız OSS) veya kendi API katmanı | **Yüksek** | Tablo bazlı CRUD + yetki testleri |
| **RPC (`.rpc()`)** | `src` geneli | **143 çağrı**, **134 farklı fonksiyon** | Aynı SQL fonksiyonları (taşınabilir) | Orta | RPC bazlı sözleşme testleri |
| **RLS** | baseline | **481 politika**, **540 `auth.uid()`**, 3 `auth.role()` | GoTrue JWT + `auth.uid()` shim **veya** backend authz | **ÇOK YÜKSEK** | Olumsuz erişim testleri (A, B'nin verisini görmemeli) |
| **SECURITY DEFINER fn** | baseline | **274 adet** (312 fonksiyonun içinde) | Taşınabilir — ama `auth.uid()` bağlamı şart | **Yüksek** | Her RPC için yetkili/yetkisiz çağrı testi |
| **GoTrue / Auth** | `src/components/auth/*`, `LoginPage`, `ResetPasswordPage` | `signInWithPassword`, `signInWithOAuth(google)`, `signUp`, `signInWithOtp`, `resetPasswordForEmail`, `updateUser`, `resend`, `onAuthStateChange`, `getUser` (16), `getSession` (4) | GoTrue (self-host) — kullanıcı ID'leri ve bcrypt hash'ler korunur | **ÇOK YÜKSEK** | Kayıt/giriş/çıkış/sıfırlama/OAuth uçtan uca |
| **`auth.users` FK** | baseline | **56 foreign key** uygulama tablolarından `auth.users`'a | `auth` şeması aynen taşınır | **ÇOK YÜKSEK** | Orphan kayıt taraması |
| **Storage** | canlı `/storage/v1/bucket` (ölçüldü 2026-09-20) | **22 bucket** (11'i boş), **242 nesne / 268 MB**. Repo taraması yalnız **7** sabit görüyordu — kodda adı geçmeyen 15 bucket var. **71 RLS politikası**, 28'i `public` şemasına bakıyor | `storage-api` + yerel disk (`STORAGE_BACKEND=file`) | **Yüksek** | Dosya sayısı + boyut + sha256 |
| **Signed URL** | 7 dosya `createSignedUrl`, 6 dosya `getPublicUrl` | Özel dosyalar imzalı URL ile; avatar/medya public | Aynı API korunmalı | Orta | Özel dosyanın imzasız erişilemediği testi |
| **Realtime** | 3 abonelik | `direct_messages`, `service_proposals`, cadde bildirimleri — hepsi `postgres_changes`. Publication'da 4 tablo. **Broadcast/presence KULLANILMIYOR** | `realtime` servisi veya `LISTEN/NOTIFY` köprüsü | Düşük-Orta | Canlı INSERT → istemci olay aldı mı |
| **Edge Functions** | `supabase/functions/` | **9 fonksiyon**, ~2.345 satır Deno. `esm.sh` üzerinden supabase-js 2.108.2, `zod`, `fast-xml-parser` | Node/Hono servisi veya Deno konteyneri | Orta | Fonksiyon bazlı entegrasyon testi |
| **`functions.invoke`** | 4 çağrı | `send-notification-emails`, `whatsapp-reply`, `submit-survey-response` | Aynı yol (`/functions/v1/...`) korunmalı | Düşük | Çağrı testi |
| **pg_cron** | `applied/` | **1 iş**: `cadde-cafe-expiring` | pg_cron (taşınabilir) veya harici zamanlayıcı | Düşük | Tek çalıştırma + çift-çalışma önleme |
| **pg_net** | 2 migration | `net.http_post` → bildirim dağıtıcı (`poke_notification_dispatcher`) | pg_net veya DB trigger → kuyruk | Orta | Bildirim maili uçtan uca |
| **Supabase Vault** | canlı `vault.secrets` (ölçüldü 2026-09-20) | **2 sır**: `notification_dispatch_secret` (bildirim maili) + `radar_news_cron_secret` (radar taraması). İkincisi repo taramasında GÖRÜNMÜYORDU, cron dump'ında çıktı | Hedefte ikisini de YENİDEN OLUŞTUR (kök anahtar taşınamaz) | **Yüksek** | Bildirim maili + `radar_news_scan_runs` satırı |
| **Eklentiler** | migration'lar + baseline | `pgcrypto`, **`postgis`** (2 tabloda `geography(Point,4326)` — CANLI), `pg_trgm`, `unaccent`, `pg_cron`, `pg_net` | **Çıplak `postgres:17` YETMEZ** — özel imaj şart | **Yüksek** | `\dx` karşılaştırması |
| **Webhook (gelen)** | `whatsapp-webhook` | Meta WhatsApp Cloud API → HMAC-SHA256 doğrulaması | Yeni URL + Meta panelinde güncelleme | Orta | İmza doğrulama testi |
| **Dış proxy** | `nginx.conf.template:178` | `/api/chat` → `rag.corteqs.net` | Değişmez | Yok | — |

### Kullanılmadığı doğrulananlar (yeni altyapı EKLEME)

- Realtime **broadcast** ve **presence**: 0 kullanım.
- Supabase **Studio / Kong / Logflare / Supavisor**: uygulama hiçbirine bağlanmıyor.
- **imgproxy**: kodda 0 görsel dönüşümü çağrısı.

> 🔴 **DÜZELTME (aynı gün, canlı ölçümle):** burada önce *"pgvector gerekmiyor"*
> yazıyordu. **YANLIŞTI.** O iddia 2026-08-04 tarihli baseline dump'ına dayanıyordu;
> canlıda ölçünce `vector` eklentisi **kurulu (v0.8.0, `public` şemasında)** ve
> **iki gerçek kolon** var: `public.rag_documents.embedding` ve
> `public.catalog_search_documents.embedding`. Eklenti kurulmazsa **şema restore'u
> başarısız olur.** Ders: baseline dump'ı güncel gerçeğin kanıtı değildir.

### Repodan doğrulanamadı — canlıdan teyit gerekiyor

Bunlar "kullanılmıyor" DEĞİL, "repoda görünmüyor":

1. **`auth` şemasının gerçek içeriği** — baseline yalnız `public` şemasını içerir
   (`CREATE SCHEMA` sayısı: 1). Kullanıcılar, kimlikler, oturumlar, OAuth bağlantıları,
   MFA faktörleri hiç dökümlenmemiş.
2. **`storage` şeması ve nesne metadata'sı** — aynı şekilde baseline'da yok.
3. **`ops` şeması** — `SET search_path TO 'ops', 'public'` ile bir fonksiyon var
   (`applied/20260624100000_agent_ingest_schema.sql`), ama şema baseline'da **yok**.
4. **Storage nesne sayısı ve toplam boyut** — repoda hiçbir yerde yazmıyor.
5. **Supabase Dashboard ayarları** — SMTP, OAuth client ID/secret, redirect URL'leri,
   JWT süresi, rate limit, e-posta şablonları. Hiçbiri repoda değil.
6. **Gerçek `cron.job` listesi** — repoda 1 iş var; canlıda daha fazlası elle
   eklenmiş olabilir.

> ⚠️ **Baseline dump'ı tek başına yeniden kurulum kaynağı DEĞİLDİR.** `public` şema
> dökümü + `applied/` sırası, `auth`/`storage`/`ops` şemalarını ve tüm kullanıcı
> verisini KAPSAMAZ. Geçiş, bunlardan bağımsız yeni ve tam bir `pg_dump` gerektirir.

---

## 3. Ölçeğin anlamı — neden "sadece backend'e taşıyalım" işe yaramaz

Tarayıcı bugün **108 tablo/view** ve **134 RPC** ile doğrudan konuşuyor. Bunları
kendi API katmanımıza taşımak demek:

- ~**242 uç nokta** yazmak,
- **481 RLS politikasını** uygulama seviyesinde yetkilendirmeye çevirmek,
- **540 `auth.uid()`** kullanımının her birine eşdeğer bağlam sağlamak,
- **274 SECURITY DEFINER** fonksiyonun güven sınırını yeniden tanımlamak.

Bu bir *geçiş* değil, **yeniden yazımdır** — ve kullanıcının açık talimatı bunun
tersidir. Üstelik RLS'yi uygulama koduna çevirmek, yetkilendirmeyi veritabanının
garantili katmanından çıkarıp insan hatasına açık bir katmana taşır. CorteQS'te
profil görünürlüğü, diaspora izolasyonu ve moderasyon kuralları buna bağlı.

**Sonuç: veri erişim protokolü (PostgREST + JWT + RLS) korunmalıdır.** Çıkış,
protokolden değil **satıcıdan** (Supabase Cloud) olmalıdır.

---

## 4. Değerlendirilen mimariler

### A) Resmî Supabase self-host (docker-compose)
12+ konteyner: kong, studio, auth, rest, realtime, storage, imgproxy, meta,
edge-runtime, analytics(logflare), vector, supavisor.
**Artı:** Tek komutla kurulum, tam eşdeğerlik.
**Eksi:** Uygulamanın kullanmadığı 6 servis; Logflare/Supavisor ciddi RAM yer;
Studio ek saldırı yüzeyi; Coolify'da 12 servisi yönetmek ağır; "Supabase self-host"
kullanıcının nihai hedefi değil.

### B) Tam yeniden yazım (Postgres + kendi API + Better Auth + MinIO)
**Artı:** Supabase OSS'ten tam bağımsızlık.
**Eksi:** Bölüm 3'teki 242 uç nokta + 481 politika. Aylar sürer, canlı üründe
yetkilendirme regresyonu riski çok yüksek. Kullanıcının açık kapsam dışı beyanı.

### C) Yalın OSS bileşen seti — **ÖNERİLEN**
Yalnız gerçekten kullanılan bileşenler, Supabase dağıtımı olarak değil, **tek tek
açık kaynak servisler** olarak, **kendi nginx/Caddy geçidimizin** arkasında:

| Servis | Proje | Lisans | Neden |
|---|---|---|---|
| Postgres (+postgis, pg_cron, pg_net, pg_trgm, unaccent, pgcrypto) | PostgreSQL | PostgreSQL | Zorunlu |
| PostgREST | **bağımsız proje** (Supabase'e ait değil) | MIT | 457 `.from()` + 143 `.rpc()` |
| GoTrue (auth) | Supabase OSS | MIT | 56 FK + 540 `auth.uid()` |
| storage-api | Supabase OSS | Apache-2.0 | 7 bucket |
| realtime | Supabase OSS | Apache-2.0 | 3 abonelik (opsiyonel, sonra) |
| nginx/Caddy | — | — | Kong yerine yol yönlendirme |

**Kong, Studio, Logflare, Supavisor, imgproxy, meta KURULMAZ.** ~5-6 konteyner.

**Artı:**
- Uygulama kodunda **sıfıra yakın değişiklik** — `supabase-js` bu protokolleri konuşur.
- Geri dönüş = 3 ortam değişkeni.
- Supabase **Cloud** bağımlılığı tamamen biter; veri ve kullanıcılar bizde.
- Her bileşen bağımsız sürümlenir; sırayla değiştirilebilir (önce storage → S3/MinIO,
  sonra auth, en son PostgREST) — bu, kullanıcının "sonraki altyapı değişikliklerini
  kolaylaştır" hedefini karşılar.

**Eksi / dürüst uyarı:**
- GoTrue, storage-api ve realtime **Supabase tarafından bakılan** OSS projelerdir.
  Yani *satıcı barındırma* bağımlılığı biter, *OSS bileşen* bağımlılığı kısmen sürer.
  PostgREST bağımsızdır.
- Kong'un yaptığı JWT doğrulama + rate limit işini nginx'te biz kuracağız.
- Supabase Cloud'un otomatik yedek, PITR ve izlemesi artık **bizim sorumluluğumuz**.

---

## 5. Aşamalı plan (mimari onaylandıktan sonra)

| Faz | İş | Canlıya dokunur mu |
|---|---|---|
| **0** | Envanter (bu belge), taban ölçümü | Hayır — **TAMAM** |
| **1** | Yerel docker-compose, özel Postgres imajı, nginx geçidi | Hayır |
| **2** | Güvenli export/import scriptleri (dry-run varsayılan) | Salt okunur |
| **3** | Yerel ortama tam restore provası + doğrulama | Hayır |
| **4** | Auth göçü (kullanıcılar, hash'ler, OAuth kimlikleri) + olumsuz erişim testleri | Hayır |
| **5** | Storage göçü (7 bucket, checksum'lı, devam ettirilebilir) | Salt okunur |
| **6** | Edge Functions → kendi servisimiz; cron/webhook devri | Hayır |
| **7** | Coolify staging'de prova + smoke test | Yeni ortam |
| **8** | Cutover (bakım penceresi) + izleme + geri dönüş | **EVET — ayrı onay** |
| **9** | Kod temizliği, kullanılmayan env/paket kaldırma | Hayır |

---

## 5b. Uygulama sırasında ÖLÇÜLEN ek bulgular (2026-09-20)

Bunlar envanter yazıldıktan sonra, kod yazarken ortaya çıktı. Hepsi ölçümdür.

### 🔴 1. `supabase db dump` bu geçiş için YANLIŞ araçtır
`supabase db dump --dry-run` çıktısı ölçüldü. CLI'ın dump'ı **Supabase → Supabase**
göçü içindir ve şunları **dışarıda bırakır**:
`auth`, `storage`, `supabase_migrations`, `vault`, `cron`, `net`, `extensions`,
`graphql_public`. Ayrıca `--role-only` çıktısında
`anon|authenticated|authenticator|service_role|supabase_*` için **CREATE ROLE
satırlarını yoruma çevirir** (hedefte var sayar) ve `--no-role-passwords` kullanır.

Düz Postgres'e restore edilince sonuç: *public şeması + 0 rol + 0 grant + auth
şeması yok → `auth.uid()` yok.* **2026-08-05'teki başarısız geçişin hasar raporu
bununla birebir aynıdır** (102/481 politika, 0 grant, roller yok, `auth.uid()` mock).

→ `scripts/migration/export-supabase.mjs` bu yüzden **ham `pg_dump`** kullanır.

### 2. GoTrue sürümü canlıdan geri olamaz
Ölçüldü: canlı `/auth/v1/health` → **v2.197.0**, `/storage/v1/version` → **1.73.1**.
Compose `supabase/gotrue:v2.197.0` ve `storage-api:v1.74.0` sabitler. Daha eski bir
GoTrue, restore edilmiş auth şemasını "gelecekten" görür ve açılışta migration
hatası verir.

### 3. Anahtarlar legacy HS256 JWT → oturumlar KORUNABİLİR
Üç anahtar da `eyJh…` biçiminde (proje JWT secret'ı ile imzalı HS256).
Kendi GoTrue/PostgREST'imize **aynı JWT secret** verilirse mevcut anon key
değişmeden çalışır ve **kullanıcı oturumları düşmez**. Bu, "herkes yeniden giriş
yapsın" riskini tamamen kaldırır.

### 4. Yapılandırma çalışma zamanında enjekte ediliyor
`docker-entrypoint-env.sh` → `env-config.js` → `window.__APP_CONFIG__`.
Backend değiştirmek = **3 env değişkeni + restart**. Yeniden derleme yok,
geri dönüş dakikalar.

### 5. `--no-owner` KULLANILMAMALI
274 SECURITY DEFINER fonksiyon **sahibi olarak** çalışır. Restore'da sahipliği
düzleştirmek yetki semantiğini sessizce değiştirir.

### 6. Canlı katalog ölçümü — dört tahminimi çürüttü

Eklenti/şema/cron yerleşimi **tahmin edilemez**. Canlıdan salt-okunur katalog
sorgusuyla ölçüldü (2026-09-20, PostgreSQL **17.6**):

| Tahminim | Gerçek |
|---|---|
| pgvector gerekmiyor | **Gerekli** — kurulu + 2 canlı embedding kolonu |
| Uygulama şemaları: public + ops | **+ `ingest` + `afs_backup`** (bugün 0 satır, yapı yine de taşınmalı) |
| pg_cron işi: 1 | **6** — `cadde-cafe-expiring`, `client_error_reports_prune`, `corteqs-radar-daily-news-scan`, `notification-email-drain`, `relocation-tool-abandonment-reminders`, `whatsapp-webhook-retention` |
| Eklentiler `extensions` şemasında | **Karışık**: `postgis`/`pg_trgm`/`unaccent`/`vector` → **`public`**; `pgcrypto`/`pg_net`/`uuid-ossp`/`pg_stat_statements` → `extensions`; `pg_cron` → `pg_catalog`; `supabase_vault` → `vault` |

⚠️ Son satır kritik: `postgis` yanlış şemaya kurulursa restore edilen DDL'deki
`public.geography(Point,4326)` tipi bulunamaz ve tablolar oluşturulamaz.
Ölçülen 4 geography/geometry kolonu buna bağlı (`catalog_item_locations.geo` canlı).

**5 cron işinin kaçırılması** radar haber taramasını, bildirim maili drenajını ve
saklama temizliklerini sessizce durdururdu — repo yalnız 1'ini belgeliyordu.

### 6b. Taşınacak hacim (ölçüldü — yedek fiilen alındı)

| | |
|---|---|
| Veritabanı | **103 MB** |
| `auth.users` | **170 satır** (hafızadaki 158 bayatlamış) · son 30 günde giriş: **13** |
| Storage | **22 bucket** (11 boş) · **242 nesne / 268 MB** |
| PostgreSQL | **17.6** → `supabase/postgres:17.6.1.136` birebir eşleşiyor |
| Vault sırrı | **2** (`notification_dispatch_secret`, `radar_news_cron_secret`) |
| pg_cron işi | **6** |

⚠️ **Bucket sayarken dizin listesine bakma.** Boş bir bucket indirme sırasında
dizin OLUŞTURMAZ; dizin sayısı (12) gerçek bucket sayısından (22) azdır.
Tek doğru kaynak `/storage/v1/bucket` listesidir — `storage-inventory.json`
boş olanları da kaydeder.

### 6c. 🔴 Gizlilik bulgusu — geçişten bağımsız

Bucket envanteri çıkarılırken görüldü: **`cv-files` bucket'ı `public=True`
ve içinde 3 özgeçmiş var.** Public bucket'ta imzalı URL gerekmez — adresi bilen
herkes indirir. `onepagers` (2 dosya) da public.

Daha yeni tasarım olan `profile-cv-files` doğru şekilde **private** — yani kurgu
sonradan düzeltilmiş ama eski bucket'taki dosyalar public kalmış.

Karar kullanıcıya ait; ajan canlı veriyi değiştirmedi. Geçişte bu bayraklar
**aynen** taşınır (`storage-inventory.json` her bucket'ın `public` değerini
kaydeder) — yani düzeltilmezse yeni sistemde de public olurlar.

### 🔴 7. AÇIK GÜVENLİK RİSKİ — geçişten bağımsız
`87.106.222.106:5432` **2026-09-20'de hâlâ açık** (TCP doğrulandı). Üzerinde
2026-08-05'ten kalan üretim kopyası var: 237 tablo, 152 dolu tablo,
**158 kullanıcı satırı**. Superuser parolası bir süre düz metin dosyalarda durdu.
`docs/operations/2026-08-06-coolify-db-portu-kapatma.md` runbook'u yazılmış ama
**uygulanmamış — 46 gündür açık.** Panel işi olduğu için ajan kapatamaz.

## 6. Bilinen tuzaklar (bu repoya özgü, CLAUDE.md'den)

1. **Üretim çalışma zamanı nginx'tir, `server.mjs` değil.** Başlık/CSP/301 düzeltmesi
   `nginx.conf.template`'e yazılır.
2. **nginx'te `add_header` KALITILMAZ** — yeni `location` eklersen güvenlik
   başlıklarını kopyala.
3. **`server_name _` joker DEĞİL** — catch-all blok `default_server` olmalı; sıra
   anlam taşır (2026-08-04'te apex'i düşürdü).
4. **PostgREST 1000 satırda sessizce keser** — toplu veri çeken her script `Range`
   ile sayfalamalı.
5. **Canlı Supabase instance'ı 904 MB RAM** — tek kötü sorgu siteyi düşürür
   (2026-08-05, ~50 dk kesinti). Export sırasında bu sınır geçerlidir.
6. **Migration dosyaları `applied/` altında yaşar**, parent dizinde bırakılmaz.
7. **Türkçe metin:** DB'ye yazılan `value`/`key` alanlarından Türkçe karakter silinmez.
8. **CSP'de `wss://*.supabase.co` var** — yeni host'a geçerken `connect-src`
   güncellenmezse Realtime sessizce ölür.
