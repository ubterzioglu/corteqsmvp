# Köklü değişiklik öncesi güvenlik noktası: veritabanı yedeği + git tag (plan)

Tarih: 2026-11-14 · Durum: **UYGULANDI 14.11 (yalnız geri yükleme provası açık — bkz. Uygulama sonucu)** · Önceki iş: repo düzen turu Faz 1–3
(devir: `docs/handover/2026-11-13-repo-duzen-faz1-2-durum-devri.md`)

## Amaç

Köklü değişikliğe başlamadan önce **kodun ve verinin birlikte geri dönülebilir bir noktası** olsun:
main'in belirli bir commit'ine tag, canlı veritabanının doğrulanmış tam yedeği, ikisi de tek kayıtta bağlı.

## Varsayımlar ve karar bekleyenler

| # | Konu | Varsayım | Neden önemli |
|---|---|---|---|
| 1 | "Köklü değişiklik" neyi kapsıyor? | **Belirtilmedi.** Plan değişikliğin kapsamından bağımsız yazıldı. | Yalnız kod ise (örn. Faz 4 `src/lib`) DB yedeği ek güvencedir. DB, auth, storage veya altyapıya dokunacaksa §3 adım 6'daki **geri yükleme provası zorunludur**. |
| 2 | Faz 1–3 main'e nasıl girecek? | Merge commit veya fast-forward (squash YOK). | Squash yapılırsa stacked dalların commit'leri main'de farklı hash alır; tag yalnız squash sonrası main ucuna atılabilir. |
| 3 | Yedeğin ikinci kopyası nerede? | Karar sizde (harici disk / şifreli bulut). | Tek kopya tek arıza noktasıdır; içinde kullanıcı kişisel verisi var. |
| 4 | Tag'i uzak depoya itme | Ayrı onay ister. | Uzak depoya yazmak dışa dönük bir eylemdir. |
| 5 | Kurulum izni | PostgreSQL 17 istemci araçları (`pg_dump`, `pg_dumpall`) kurulacak. | Bu makinede yok; yedek scripti PATH'te arıyor. |

## 1. Sıra

1. **Faz 1 → 2 → 3 sırayla main'e merge** (kullanıcı). Her merge sonrası CI yeşil kontrolü.
2. **Main'in deploy'unu doğrula** (Coolify frontend'i yeniden kurar): `BASE_URL=https://corteqs.net npm run verify:release`,
   `curl -I https://corteqs.net/` ile güvenlik başlıkları, tarayıcıda `/admin` ve `/admin/cadde` açılışı. Admin sayfaları
   taşındığı için lazy parça adları değişti; açılmayan sayfa varsa tag atılmadan önce yakalanır.
3. **Veritabanı yedeği** (§3), doğrulama dahil.
4. **Tag** (§2) — yedek doğrulandıktan sonra, çünkü tag "kod + veri birlikte güvenli" demek.
5. **Kayıt** (§5).
6. Köklü değişikliğe başla.

## 2. Git tag

- **Hedef commit:** merge sonrası `main` ucu (squash kullanıldıysa squash commit'i). Faz 3 dalı değil: dal ucu main'e eşit olmayabilir.
- **Ad:** mevcut konvansiyon `<konu>-oncesi-<YYYY-MM-DD>` (örnek: `lansman-l3-oncesi-2026-11-08`) →
  `kokten-degisiklik-oncesi-2026-11-14`. Tarih tag'in atıldığı gün olur.
- **Tür:** açıklamalı (annotated) tag; mevcut tag'lerin hepsi böyle. Mesajda: kapsam, yedek dizin adı,
  yedek manifest özeti (sha256), `schema_migrations` son sürümü.
- **Ek (isteğe bağlı):** repo düzeninin bittiği ayrı bir nokta için `repo-duzen-bitti-2026-11-14` — köklü değişiklik
  geri alınsa bile düzenlenmiş repoya dönülebilsin. Aynı commit'e iki tag zararsız.
- **Komutlar (çalıştırılmadı):**

```bash
git switch main && git pull --ff-only
git tag -a kokten-degisiklik-oncesi-2026-11-14 -m "<kapsam · yedek dizini · manifest sha256 · son migration>"
git show kokten-degisiklik-oncesi-2026-11-14 --stat | head   # doğrula
git push origin kokten-degisiklik-oncesi-2026-11-14          # ayrı onay
```

## 3. Veritabanı yedeği

**Araç:** `scripts/migration/export-supabase.mjs` (ham `pg_dump`) + `scripts/migration/export-storage.mjs`.
`supabase db dump` KULLANILMAZ: `auth`, `storage`, `vault`, `cron` şemalarını ve rol/grant satırlarını dışarıda bırakır
(`docs/operations/supabase-exit-plan.md` §5b; 2026-08-05 başarısız geçişin kök nedeni). Tek komutlu paket ve rotasyon
için `scripts/migration/backup-rotate.mjs` var; köklü değişiklik öncesi **elle, adım adım** alınması önerilir.

**Ön koşullar (ölçüldü 2026-11-14):**

| Koşul | Durum |
|---|---|
| `.env.local`: proje kimliği, DB parolası, erişim belirteci, DB URL | ✅ dolu (değerler okunmadı) |
| `pg_dump` / `pg_dumpall` | ❌ yok → PostgreSQL **17.x** istemcisi kurulmalı; sunucu 17.6, **daha eski istemci dump'ı reddeder**. Sürümü `pg_dump --version` ile doğrula. |
| Docker | ⚠️ kurulu, **servis kapalı** (Rancher Desktop başlatılmalı) — yalnız adım 6'daki prova için gerekir |
| Bağlantı | Session pooler. Sandbox dış ağa çıkamaz; komut sandbox dışı çalıştırılır (kullanıcı onayı) |

**Adımlar:**

1. **Çıktı dizini:** repo DIŞINDA, yeni ve boş (`C:\temp_private\corteqs\yedekler\2026-11-14-kokten-oncesi`).
   Script repo içine yazmayı ve var olan dizinin üzerine yazmayı reddeder.
2. **Plan (yazma yok):** `node scripts/migration/export-supabase.mjs --out <DIZIN>` — çıktıyı gözle kontrol et.
3. **Gerçek yedek:** aynı komut + `--confirm`. Veritabanı küçük (ölçüm 20.09: 103 MB), dakikalar sürer. Tek bağlantı,
   paralel iş yok: canlı örnek 1 GB'ın altında RAM'e sahip. Kullanıcı trafiğinin düşük olduğu saatte al.
4. **Storage:** `node scripts/migration/export-storage.mjs --out <DIZIN>` (20.09 ölçümü: 22 bucket, 242 nesne / 268 MB).
   Bucket listesi `/storage/v1/bucket`'tan alınır; boş bucket'lar dizin oluşturmaz.
5. **Doğrulama:**
   - manifest: her dosya boyutu > 0, sha256 kayıtlı;
   - sayı karşılaştırması: tablo/politika/fonksiyon/trigger (baseline 20.09: 237 tablo, 481 RLS politikası), `auth.users`
     (20.09: 170), bucket ve nesne sayısı. **Bu sayılar 20.09 tarihlidir**; bugünkü canlı değerle kıyasla, birebir eşit
     çıkması beklenmez;
   - `supabase_migrations.schema_migrations` son sürümünü not et. `check:migrations` bugün temiz değil (yol haritası B03:
     `20260920100000` ledger satırı eksik); bu durum yedeğe değil, kayda geçer.
6. **Geri yükleme provası** (köklü değişiklik DB/altyapıya dokunuyorsa ZORUNLU, aksi halde önerilir): boş yerel Postgres'e
   `scripts/migration/restore-selfhost.mjs --from <DIZIN> --target <PG_URL>`, ardından
   `scripts/migration/verify-parity.mjs --target <PG_URL>` (rol, grant, RLS, `auth.uid()` denkliği dahil; satır sayısı
   eşitliği tek başına yetmez). `restore-selfhost.mjs` Supabase Cloud hedefini koşulsuz reddeder; canlıya karşı YIKICI işlem yok.
7. **Saklama:** dizin kişisel veri taşır (kullanıcı e-postaları, auth hash'leri) → repoya girmez (`corteqs-yedek/` ve
   `*.dump` zaten `.gitignore`'da, yine de dizin repo dışında), şifreli sürücüde tut, ikinci kopya kararı Varsayımlar #3.
8. **Supabase tarafının kendi yedeği:** Dashboard → Database → Backups'ta planın günlük yedek/PITR durumunu ve son yedek
   tarihini kontrol edip kayda yaz (plan düzeyi bu oturumda doğrulanmadı).

**Yedeğe girmeyenler:** Vault'taki 2 sır (`notification_dispatch_secret`, `radar_news_cron_secret`) kök anahtarla
şifrelidir, taşınamaz; başka bir yere geri yüklenirse yeniden oluşturulur. Edge function sürümleri depoda yaşar ve ayrı
deploy edilir (`npm run check:functions` ile ayrıca not et).

## 4. Geri dönüş (yazılı, çalıştırılmadı)

- **Kod:** `git switch -c geri-donus kokten-degisiklik-oncesi-2026-11-14`; main'i geri sarmak yerine bu dalı deploy et veya
  `git revert -m 1 <merge>`. `git reset --hard` ve `git push --force` kullanılmaz.
- **Veri:** yedek **yeni bir örneğe** yüklenir (`restore-selfhost.mjs`), `verify-parity` yeşil olunca karar verilir. Canlı
  Supabase örneğinin üzerine geri yükleme **geri alınamaz**; ayrı, açık bir karar ve ayrı bir plan ister.

## 5. Kayıt (tag atıldıktan sonra)

Devir notuna ve `docs/kalanlar/KALANLAR.md`'ye tek satır: tag adı, tag'in gösterdiği commit, yedek dizini (yol + boyut),
manifest sha256, ikinci kopya konumu, `schema_migrations` son sürümü, geri yükleme provası sonucu (yapıldıysa).
Hafızaya aynı özet.

## 6. Süre tahmini

| Adım | Süre |
|---|---|
| Merge + CI + deploy doğrulaması | kullanıcıya bağlı, ~30 dk |
| PostgreSQL 17 istemcisi kurulumu | ~5 dk |
| DB yedeği + storage | ~10–15 dk |
| Doğrulama | ~10 dk |
| Geri yükleme provası (Docker + restore + parity) | ~30–45 dk |
| Tag + kayıt | ~5 dk |

## 7. Riskler

- **PG istemci sürümü sunucudan eski** → dump hata verir; kurulumdan sonra `--version` kontrolü.
- **Düşük RAM'li örnek:** tek bağlantı, düşük trafik saati; yedek sırasında başka ağır sorgu çalıştırma (05.08 olayında tek
  bir keşif sorgusu siteyi yaklaşık 50 dk düşürdü).
- **Yarım yedek:** script kısmi başarıyı gizlemez, ilk hatada durur ve dizini `.FAILED` ile işaretler; işaretli dizin yedek sayılmaz.
- **Yedek ile tag arasında canlı veri değişir:** yedek anı ile köklü değişiklik başlangıcı arasındaki yazmalar yedekte
  yoktur; bu aralığı kısa tut, gerekirse değişiklikten hemen önce ikinci bir hafif yedek (yalnız `public` verisi) al.

## Uygulama sonucu (14.11.2026, gece)

| Adım | Sonuç |
|---|---|
| Faz 1–3 → main | ✅ fast-forward, 20 commit, push edildi: main `1485b2ce`. CI Quality: success. |
| Deploy doğrulaması | ⚠️ **Canlı deploy yapılmadı**: Coolify deploy elle, `git push` canlıya çıkarmaz. Yerel `dist` için `npm run verify:release` ✅. Canlı kontrol (`curl -I`, `/admin`, `/admin/cadde`) deploy sonrasına kaldı. |
| İstemci araçları | ✅ kurulum gerekmedi: scoop ile PostgreSQL 18.3 zaten kuruluydu (PATH'te değil; yalnız çalışan işlem için PATH'e eklendi). 18 istemcisi 17.x sunucuyu dump'layabilir. |
| DB yedeği | ✅ 7 adım ~75 sn, 0 hata. Dosyalar: roller 6 KB · şema 2,1 MB (531 RLS politikası) · auth verisi 0,25 MB (~181 kullanıcı) · public verisi 126 MB · storage metadata 0,13 MB · migrations 8,9 MB (528 kayıt, son sürüm `20261109100000`) · cron 15 iş. |
| Storage | ✅ 27 bucket, 248 nesne, 267,5 MB, 248/248 indirildi, 0 hata. |
| Bütünlük | ✅ `manifest.json` her DB dosyası için sha256; `.FAILED` işareti yok; storage dosya sayısı/boyutu envanterle eşit. |
| Tag | ✅ `kokten-degisiklik-oncesi-2026-11-14` (ve aynı commit'e `repo-duzen-bitti-2026-11-14`), ikisi açıklamalı, ikisi origin'e itildi, ikisi `1485b2ce`'yi gösterir. |
| Geri yükleme provası | ❌ **Hâlâ yapılmadı**: Rancher Desktop açıldı ama sanal makinesi başlamıyor; neden WSL servisinin takılması (`wsl -l -q` 11.11'den beri yanıtsız). `wsl --shutdown` denendi, o da takıldı (servis kilitli, yönetici yetkisi gerek). Düzeltme: yönetici PowerShell'de `Restart-Service WslService -Force` ya da bilgisayarı yeniden başlatma. Kayıt: KALANLAR **BK01**. |
| İkinci kopya | ✅ 14.11: `D:\corteqs-yedek\2026-11-14-kokten-oncesi` (harici WD My Passport USB diski). 257/257 dosya, boyut toplamı eşit, 7 DB dosyası için sha256+boyut manifestle eşleşti. Uzak (bulut) kopya yapılmadı. |
| **Son hal yedeği** (kapanış, 14.11 ~02:40 yerel) | ✅ `C:\temp_private\corteqs\yedekler\2026-11-14-son-hal` + ikinci kopya `D:\corteqs-yedek\2026-11-14-son-hal`. DB 7 dosya + storage 27 bucket/248 nesne/267,5 MB, 0 hata; manifest sha256 7/7, D: kopyası 257/257 dosya ve bayt toplamı eşit. **Önceki yedekle çapraz kontrol:** iki bağımsız döküm yalnız pg_dump'ın rastgele `\restrict` belirteçlerinde ayrışıyor, bu satırlar çıkarılınca 7/7 dosyanın içeriği birebir aynı (3 saatte veritabanı değişmemiş). |

**20.09 ölçümleriyle fark (beklenen büyüme):** cron işi 6 → 15, bucket 22 → 27, nesne 242 → 248, `auth.users` 170 → ~181.
**Yedek konumu:** `C:\temp_private\corteqs\yedekler\2026-11-14-kokten-oncesi` (repo dışı, kişisel veri içerir).

## Devam planı (köklü değişikliğin başlangıcı ERTELENDİ — 14.11)

Güvenlik noktası hazır: kod tag'i `repo-duzen-faz4-bitti-2026-11-14` (cc3001f2), DB + storage yedeği iki kopyada
(`2026-11-14-son-hal`, birincil C:, ikinci D:). Dönüldüğünde sırayla:

1. **Kapsamı yaz.** Köklü değişiklik tam olarak neyi değiştiriyor: yalnız kod mu, veritabanı/auth/storage/altyapı da mı?
   Bu cevap 3. adımın zorunlu olup olmadığını belirler.
2. **WSL'i düzelt** (yönetici PowerShell: `Restart-Service WslService -Force`, olmazsa bilgisayarı yeniden başlat), sonra
   Rancher Desktop'ın dockerd'si ayağa kalksın (`docker info` sunucu sürümü dönmeli). Rancher VM'ine şu an 2 GB ayrılı;
   prova için 4 GB önerilir (makinede 63,7 GB var).
3. **Geri yükleme provası** (DB/auth/storage'a dokunuluyorsa ZORUNLU): `infra/selfhost` yığını BOŞ veritabanıyla bir kez
   kaldırılır (`.env.example` → `.env`, `docker compose up -d`, hepsi healthy); sonra
   `node scripts/migration/restore-selfhost.mjs --from <son-hal dizini> --target <PG_URL>` (+ `--confirm`) ve
   `node scripts/migration/verify-parity.mjs --target <PG_URL>`. Rol, grant, RLS ve `auth.uid()` denkliği yeşil olmadan
   köklü değişiklik başlamaz. Sonuç KALANLAR **BK01**'e yazılır, BK01 kapanır. Canlı Supabase'e karşı yıkıcı işlem YOK.
4. **Başlamadan hemen önce taze yedek:** aynı iki komut (`export-supabase.mjs`, `export-storage.mjs`; pg_dump için scoop
   PostgreSQL 18.3 yolu o işlemin PATH'ine eklenir), yeni dizin (`...-baslangic-<tarih>`), manifest sha256 doğrulaması,
   D: kopyası. Tag'den sonra main'e giren commit'ler varsa (`git log repo-duzen-faz4-bitti-2026-11-14..main`) yeni tag at.
5. **Dalda çalış:** `git switch -c <ad>` main'den; push/PR; main'e doğrudan değil.
6. **Geri dönüş:** `git switch -c geri-donus repo-duzen-faz4-bitti-2026-11-14` + yedek (yeni örneğe restore). Canlı
   Supabase'in üzerine geri yükleme ayrı, açık bir karar ister.

**Bu başlangıçtan bağımsız açık işler:**
- Canlı deploy (Coolify elle): Faz 1–4 canlıda değil. Deploy sonrası `BASE_URL=https://corteqs.net npm run verify:release`,
  `curl -I https://corteqs.net/` güvenlik başlıkları, `/admin` ve `/admin/cadde`.
- Supabase Dashboard → Backups: planın kendi yedek/PITR durumu doğrulanmadı.
- Uzak (bulut) kopya: kişisel veri içerdiği için karar kullanıcıda; yapılacaksa önce şifrelenir.
- Repo kökündeki izlenmeyen `00 - LANSMAN PLANI - tek dosya (13.11.2026).md`: kökte yalnız CLAUDE.md ve README.md olur;
  `docs/plans/` veya `docs/notes/` altına taşınmalı (kullanıcının dosyası, dokunulmadı).
- Main'e birleşmiş 4 yerel refactor dalı (faz1..faz4) silinmedi; silinecekse `git branch -d`.
- INV01 (yatırımcı istatistikleri bayat) ve RT02 (rol yapısı üreticisi bozuk): KALANLAR'da, düzen turundan bağımsız.
