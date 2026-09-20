# Supabase → Kendi Altyapı Geçişi — Durum

> Bu dosya **her oturumda güncellenir**. Yeni bir konuşma buradan devam edebilmeli.
> Envanter: `docs/supabase-exit-plan.md` · Runbook: `docs/migration-runbook.md`
> Coolify: `docs/coolify-deployment.md` · Kod: `infra/selfhost/`, `scripts/migration/`

**Son güncelleme:** 2026-09-20
**Genel durum:** 🟢 **TAM YEDEK ALINDI.** Geçiş kodu yazıldı ve test edildi;
plan **uykuda ama hemen uygulanabilir**. Plan kararı (Pro / Free / VPS) açık —
egress ölçümü bekleniyor → `docs/supabase-plan-decision.md`
**Canlıya yazıldı mı:** ❌ **HAYIR.** Deploy, DNS, şema veya veri değişikliği YOK.
Canlı erişimlerin tamamı **salt okunur**: katalog sorguları, sağlık uç noktaları,
`pg_dump` ve storage indirme.

## ✅ Yedek — 2026-09-20 11:46–11:50

`C:\corteqs-yedek\2026-09-20` (repo dışında, `.gitignore`'da)

| Dosya | Boyut | İçerik |
|---|---|---|
| `01-roles.sql` | 5,9 KB | roller |
| `02-schema-public.sql` | 1,6 MB | public+ops+ingest+afs_backup DDL |
| `03-data-auth.sql` | 218 KB | 170 kullanıcı, kimlikler, token'lar |
| `04-data-public.sql` | 19,2 MB | uygulama verisi |
| `05-data-storage.sql` | 128 KB | bucket + nesne metadata |
| `06-migrations.sql` | 8,9 MB | schema_migrations |
| `07-cron-jobs.sql` | 1,4 KB | 6 cron işi, yeniden kurulabilir |
| `storage/` | **242 dosya / 268 MB** | 0 başarısız |
| `manifest.json` + `storage-inventory.json` | | sha256 + bucket public bayrakları |

**Toplam 299 MB.** Free'ye geçilecekse bu yedek şarttır — plan değişikliği
mevcut 8 günlük yedeği siler.

---

## 🔴 ÖNCE BU — geçişten bağımsız açık güvenlik riski

`87.106.222.106:5432` **açık** (2026-09-20'de TCP ile doğrulandı). Üzerinde
2026-08-05'ten kalan üretim kopyası var: 237 tablo, **158 kullanıcı satırı**.
Superuser parolası bir süre düz metin dosyalarda durdu → "bilinen" sayılmalı.
Runbook 2026-08-06'da yazılmış ama **uygulanmamış: 46 gündür açık.**

Ajan kapatamaz (Coolify paneli işi). Adımlar:
`docs/coolify-deployment.md` §3.0.

---

## Tamamlananlar

| # | İş | Çıktı / kanıt |
|---|---|---|
| 1 | Taban ölçümü | `npm run test` **280 dosya / 1.990 test yeşil** · `tsc` **0 hata** · `lint` 0 problem |
| 2 | Supabase bağımlılık envanteri | `docs/supabase-exit-plan.md` §2 (19 bileşen) |
| 3 | Mimari kararı + gerekçe | §4 → **Seçenek C (yalın OSS bileşen seti)** |
| 4 | Lisans/maliyet doğrulaması | PostgREST MIT · GoTrue MIT · storage Apache-2.0 · realtime Apache-2.0 → **VPS dışı ücret yok** |
| 5 | **2026-08-05 çöküşünün kök nedeni bulundu** | `supabase db dump` `auth`/`storage`/roller/grant'leri dışarıda bırakıyor → §5b.1 |
| 6 | Canlı servis sürümleri ölçüldü | GoTrue **v2.197.0** · storage **1.73.1** → imaj sabitleri buna göre |
| 7 | Anahtar biçimi ölçüldü | 3 anahtar da legacy HS256 JWT → **oturumlar korunabilir** |
| 8 | docker-compose (yalın yığın) | `infra/selfhost/docker-compose.yml` — 6 servis, DB portu kapalı |
| 9 | nginx geçidi (Kong yerine) | `infra/selfhost/gateway/default.conf.template` |
| 10 | Ortam şablonu (sırsız) | `infra/selfhost/.env.example` |
| 11 | DB export script'i | `scripts/migration/export-supabase.mjs` — ham `pg_dump`, korumaları test edildi |
| 12 | Storage export script'i | `scripts/migration/export-storage.mjs` — sayfalamalı, devam ettirilebilir, sha256 |
| 13 | Restore script'i | `scripts/migration/restore-selfhost.mjs` — Supabase hedefini reddeder, rol doğrular |
| 14 | Denklik doğrulama script'i | `scripts/migration/verify-parity.mjs` — 18 ölçüm + tablo + sequence |
| 15 | Runbook (cutover + rollback) | `docs/migration-runbook.md` — 15 sessiz kırılma sınıfı |
| 16 | Coolify rehberi | `docs/coolify-deployment.md` — senin kontrol listen |
| 17 | `.gitignore` sertleştirildi | dump çıktıları + `infra/selfhost/.env` |

### Script korumaları — fiilen test edildi

| Test | Sonuç |
|---|---|
| `--out` repo içindeyse | ✅ reddediyor ("kişisel veri") |
| Var olan dizinin üzerine yazma | ✅ reddediyor |
| `--confirm` yoksa | ✅ yalnız plan, hiçbir şey çalışmıyor |
| Parola çıktıda görünüyor mu | ✅ **görünmüyor** (otomatik denetlendi) |
| Parola komut satırında mı | ✅ hayır — yalnız child process ortamında |
| Doğrudan `db.<ref>.supabase.co` | ✅ yakalanıp pooler'a çevriliyor |
| Restore hedefi Supabase Cloud | ✅ **koşulsuz reddediyor** |
| Restore hedefi boş değilse | ✅ reddediyor (`--allow-nonempty` gerekiyor) |
| `auth`/`storage` şeması yoksa | ✅ reddediyor (önce yığın kalkmalı) |
| Roller eksikse restore sonrası | ✅ durduruyor (2026-08-05'in çöküş noktası) |

### Repo sağlığı (değişikliklerimden sonra)

| Kontrol | Sonuç |
|---|---|
| `npm run test` | ✅ **280 dosya / 1.994 test yeşil** |
| `npx tsc -p tsconfig.app.json --noEmit` | ✅ **0 hata** |
| `npm run lint` | ✅ 0 problem |
| `npm run verify:text` | ✅ 1.569 dosya UTF-8 temiz |
| `npm run check:drift` | ✅ drift yok |
| 4 migration script'i `--help` | ✅ hepsi çalışıyor |

> Taban 1.990 idi, şimdi **1.994**. Fark benim değişikliğimden DEĞİL: oturum
> sırasında kullanıcının SEO commit'leri (`ab29c80`, `4d26433`, `9093a5e`)
> 4 test ekledi. Benim eklediğim dosyaların hiçbiri `src/` altında değil.

---

## Ölçülen anahtar sayılar

| Metrik | Değer |
|---|---|
| Tarayıcıdan erişilen tablo/view | **108** (457 `.from()`) |
| Tarayıcıdan çağrılan RPC | **134** (143 `.rpc()`) |
| RLS politikası | **481** · `auth.uid()` **540** |
| SECURITY DEFINER fonksiyon | **274** |
| `auth.users`'a foreign key | **56** |
| Storage bucket | **7** |
| Realtime aboneliği | **3** (yalnız `postgres_changes`) |
| Edge Function | **9** (~2.345 satır Deno) |
| Zorunlu Postgres eklentisi | **7** (`postgis` + **`vector`** dahil) |
| Canlı GoTrue / storage sürümü | **v2.197.0** / **1.73.1** |
| Canlı PostgreSQL | **17.6** (imaj birebir eşleşiyor) |
| `auth.users` | **170 satır** |
| Storage hacmi | **242 nesne / 268 MB** (küçük — transfer kolay) |
| pg_cron işi (CANLI) | **6** (repoda yalnız 1 belgeli) |
| Uygulama şeması | **4**: `public`, `ops`, `ingest`, `afs_backup` |

### ⚠️ Canlı ölçüm, dört tahminimi çürüttü

Ayrıntı: `docs/supabase-exit-plan.md` §5b.6. Özet: pgvector gerekli çıktı,
2 şema kaçmıştı, 5 cron işi kaçmıştı, eklenti şema yerleşimi tahminden farklıydı.
**Ders: 2026-08-04 tarihli baseline dump'ı güncel gerçeğin kanıtı değildir.**

---

## ✅ Plan kararı — ölçümle verildi (2026-09-20)

Panel kullanım okuması (fatura dönemi 10 Eyl – 10 Eki, ~10 gün geçmiş, ×3 projeksiyon):

| Ölçüm | Aylık projeksiyon | Free sınırı | Doluluk |
|---|---|---|---|
| Egress | ~0,93 GB | 5 GB | **~19%** 🟢 |
| Cached egress | ~0,57 GB | 5 GB | ~11% 🟢 |
| Storage | 0,281 GB | 1 GB | 28% 🟢 |
| Veritabanı | 103 MB | 500 MB | 21% 🟢 |
| Edge Function | ~2.800 | 500.000 | <1% 🟢 |
| MAU | 5 | 50.000 | <1% 🟢 |
| Realtime eşzamanlı | 1 | 200 | <1% 🟢 |

**KARAR: Supabase Free'ye geçilebilir** (~$25/ay tasarruf; compute zaten $10
kredi içinde). En dar eksen egress, %19 — yaklaşık 5 kat büyüme payı var.

**Geçiş planı VPS'e taşınmaz, UYKUDA bekler.** Tetikleyiciler:
`docs/supabase-plan-decision.md` §5. Tetiklenince yarım gün + 30–60 dk pencere.

### Free'nin iki koşulu
1. **Günlük yedek** — Free'de otomatik yedek YOK ve downgrade mevcut 8 yedeği
   **siler**. Araç hazır: `scripts/migration/backup-rotate.mjs` (rotasyonlu,
   kısmi başarıyı gizlemez, çıkış kodu izlenebilir). Zamanlayıcı komutları:
   `docs/supabase-plan-decision.md` §4.2.
2. **500 MB RAM'de ağır ad-hoc sorgu çalıştırmamak** — 2026-08-05'teki 50 dk'lık
   çöküş normal trafikten değil, `geo_cities` (76.990 satır) üzerinde satır
   başına fonksiyon çalıştıran bir keşif sorgusundan gelmişti.

## Kalan işler

### Senin yapacakların
1. **`87.106.222.106:5432` portunu kapat** — 46+ gündür açık, 158 kullanıcılık
   üretim kopyası üstünde (`docs/coolify-deployment.md` §3.0)
2. **`cv-files` bucket'ı public** — içinde 3 özgeçmiş var; `onepagers` de public
3. **Pro → Free downgrade** (yedek alındı, güvenli)
4. **Yedek zamanlayıcısını kur** — Task Scheduler ya da VPS cron

### Engel (yalnız geçiş tetiklenirse önemli)
- **Docker daemon çalışmıyor** → yerel yığın henüz ayağa kaldırılamadı.
  Geçiş uykuda olduğu için şu an engelleyici değil.

### Geçiş tetiklenirse yapılacaklar
| Faz | İş | Canlıya dokunur |
|---|---|---|
| 1 | Yerel yığını ayağa kaldır + sağlık doğrula | Hayır |
| 2 | Canlıdan export (DB + storage) | Salt okunur |
| 3 | Yerele restore + `verify-parity` | Hayır |
| 4 | Olumsuz erişim testleri (RLS gerçekten çalışıyor mu) | Hayır |
| 5 | Vitest'i yerel yığına karşı koştur | Hayır |
| 6 | Edge Functions kararı (kal / taşı) | Hayır |
| 7 | Coolify staging + smoke test | Yeni ortam |
| 8 | Cutover (30–60 dk pencere) | **EVET — ayrı onay** |
| 9 | Temizlik, kod sadeleştirme, yedek provası | Hayır |

---

## Karar günlüğü

| Tarih | Karar | Gerekçe |
|---|---|---|
| 2026-09-20 | Veri erişim protokolü (PostgREST + JWT + RLS) **korunacak** | 242 uç nokta + 481 politikayı yeniden yazmak geçiş değil yeniden yazımdır |
| 2026-09-20 | Kong / Studio / Logflare / Supavisor / imgproxy **kurulmayacak** | Uygulama hiçbirine bağlanmıyor; 0 görsel dönüşümü çağrısı ölçüldü |
| 2026-09-20 | ~~pgvector gerekmiyor~~ → **pgvector ZORUNLU** | İlk karar YANLIŞTI (baseline dump'ına dayanıyordu). Canlıda kurulu + 2 embedding kolonu var; kurulmazsa restore patlar |
| 2026-09-20 | Eklentiler **canlıdaki şema yerleşimiyle** kurulacak | `postgis` `public`'te; `extensions`'a kurulursa `public.geography` bulunamaz |
| 2026-09-20 | Export'a `ingest` + `afs_backup` şemaları eklendi | Canlı ölçüm: Supabase'e ait olmayan 4 uygulama şeması var, planım 2'sini kaçırıyordu |
| 2026-09-20 | cron işleri export'tan üretilecek, cutover'a kadar KAPALI | Canlıda 6 iş ölçüldü (repoda 1); eski+yeni aynı anda koşarsa çift mail |
| 2026-09-20 | **`supabase db dump` KULLANILMAYACAK** | `auth`/`storage`/roller/grant'leri dışarıda bırakıyor — 2026-08-05 çöküşünün nedeni |
| 2026-09-20 | Restore'da `--no-owner` **kullanılmayacak** | 274 SECURITY DEFINER fonksiyon sahibi olarak çalışır |
| 2026-09-20 | `auth`/`storage` şema DDL'i **taşınmayacak**, yalnız verisi | Hedefte GoTrue/storage-api kendi sürümüne göre kursun; sürüm çatışması olmasın |
| 2026-09-20 | Aynı `JWT_SECRET` kullanılacak | Mevcut anahtarlar ve kullanıcı oturumları korunur |
| 2026-09-20 | S3/MinIO **kurulmayacak** | `STORAGE_BACKEND=file` + 480 GB disk yeterli |
| 2026-09-20 | Kesinti: **30–60 dk bakım penceresi** | Kullanıcı kararı; çift yazma karmaşıklığına tercih edildi |
