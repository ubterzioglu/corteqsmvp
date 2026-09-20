# Supabase plan kararı — Pro / Free / kendi VPS

> **Durum:** karar açık — egress ölçümü bekleniyor.
> Geçiş planı yazıldı ve test edildi, **uykuda ama hemen uygulanabilir**:
> `docs/migration-runbook.md`. Envanter: `docs/supabase-exit-plan.md`.

---

## 1. Ölçülen mevcut durum (2026-09-20)

| | Değer | Kaynak |
|---|---|---|
| Plan | **Pro** | Management API → `"plan":"pro"` |
| PostgreSQL | 17.6 | `select version()` |
| RAM | ~1 GB (Micro) | `/customer/v1/privileged/metrics` (904 MB, 2026-08-05) |
| Veritabanı boyutu | **103 MB** | `pg_database_size()` |
| Storage | **242 nesne / 268 MB** | `storage.objects` |
| Kayıtlı kullanıcı | **170** | `auth.users` |
| Günlük yedek | **8 adet, en yenisi bugün 01:24** | Management API `/database/backups` |
| PITR | kapalı | aynı |
| Egress kullanımı | **BİLİNMİYOR** | API 404 → yalnız panelden |

---

## 2. Üç seçenek — aynı tabloda

| | Pro (bugün) | Free | Kendi VPS |
|---|---|---|---|
| **Ek aylık maliyet** | ~$25 | **€0** | **€0** (VPS zaten ödenmiş) |
| RAM | ~1 GB | **500 MB** | **32 GB** |
| DB sınırı | 8 GB | **500 MB** (şu an 103 MB) | 480 GB disk |
| Storage sınırı | 100 GB | 1 GB (şu an 268 MB) | 480 GB disk |
| **Egress/ay** | 250 GB | **5 GB** | VPS bant genişliği |
| **Günlük yedek** | ✅ 7 gün | ❌ **yok** | bizde (kurulmalı) |
| Proje duraklatma | asla | 1 hafta hareketsizlikte | yok |
| Edge Function çağrısı | 2M/ay | 500k/ay | sınırsız |
| Bakım emeği | yok | yok | **~1 saat/ay** (güvenlik güncellemeleri) |
| Tek hata noktası | Supabase'de | Supabase'de | **bizde** |

### Bu tablodan çıkan üç gerçek

1. **Free ve VPS ikisi de €0 ek maliyet.** Ama VPS her teknik eksende üstün.
   Maliyet gerekçesiyle Free'yi seçmek, aynı parayla çok daha iyisi dururken
   güvenilirlikten ödün vermek olur.
2. **Free'ye düşmek bir tasarruf değil, üç şeyin birden kaybı:** yedekler silinir,
   RAM yarıya iner, egress 50 kat azalır. O instance zaten ~1 GB'ta 2026-08-05'te
   tek bir sorguyla **50 dakika** çöktü — 500 MB'ta bu daha olası.
3. **VPS'in gerçek bedeli para değil, emek.** Aylık güvenlik güncellemesi ve
   yedek takibi. Bunu üstlenmeyeceksen Pro'da kalmak dürüst seçimdir.

---

## 3. ✅ Gerçek kullanım ÖLÇÜLDÜ — Free rahat yetiyor

Panel okuması, fatura dönemi **10 Eyl – 10 Eki 2026**, ölçüm **20 Eyl** (≈10 gün
geçmiş). Aylık projeksiyon ×3 ile:

| Ölçüm | 10 günde | Aylık projeksiyon | Free sınırı | Doluluk |
|---|---|---|---|---|
| **Egress** | 0,31 GB | **~0,93 GB** | 5 GB | **~19%** 🟢 |
| Cached egress | 0,189 GB | ~0,57 GB | 5 GB | ~11% 🟢 |
| Storage boyutu | 0,281 GB | — | 1 GB | 28% 🟢 |
| Veritabanı | 103 MB | — | 500 MB | 21% 🟢 |
| Edge Function çağrısı | 928 | ~2.800 | 500.000 | <1% 🟢 |
| Aylık aktif kullanıcı | 5 | — | 50.000 | <1% 🟢 |
| Realtime eşzamanlı (tepe) | 1 | — | 200 | <1% 🟢 |
| Realtime mesajı | 0 | — | 2.000.000 | 0% 🟢 |

**Sonuç: Free her ölçülebilir eksende rahat sığıyor.** En dar olan egress bile
%19'da — yaklaşık **5 kat büyüme payı** var.

Not: 19 Eylül'deki ~70 MB'lık egress sıçraması o günkü SEO çalışmasından;
normal günler 10–20 MB bandında.

**Gerçek tasarruf:** Pro tabanı ~$25/ay. Compute (249 saat / $3,35) zaten $10
Compute Credit içinde kalıyor, yani ek kalem değil.

---

## 4. Free'ye geçilirse — zorunlu önlemler

Free'yi seçersen bunlar **opsiyonel değil**:

### 4.1 Plan değişikliğinden ÖNCE
- [x] **Tam yedek al** — Free'ye düşmek mevcut 8 günlük yedeği siler
      (`node scripts/migration/export-supabase.mjs --out <DIZIN> --confirm`)
- [ ] Storage dosyalarını da al
      (`node scripts/migration/export-storage.mjs --out <DIZIN> --confirm`)
- [ ] Egress rakamını gör (bölüm 3)

### 4.2 Geçtikten sonra — yedek artık BİZİM sorumluluğumuz

Free'de otomatik yedek **yoktur** ve downgrade mevcut 8 günlük yedeği **siler**.
170 kullanıcılı canlı bir üründe yedeksiz gün geçirmek kabul edilemez.

Hazır araç: **`scripts/migration/backup-rotate.mjs`** — veritabanı + storage'ı
tarihli dizine alır, 14 gün saklar, eskiyi siler.

```bash
node scripts/migration/backup-rotate.mjs --root <YEDEK_KOKU> --keep 14 --confirm
```

⚠️ `npm run` ile çağırma — npm Windows'ta `--out`/`--confirm` bayraklarını
yutuyor ("Unknown cli config"). Daima `node` ile çağır.

**Davranışı:**
- Bir adım bile düşerse yedek **BAŞARISIZ** sayılır, çıkış kodu **1** olur ve
  dizine `BACKUP-FAILED.json` yazılır. Yarım yedeğin sağlam sanılması, hiç
  yedek olmamasından tehlikelidir.
- Rotasyon **yalnız başarılı** yedekleri sayar ve siler; başarısızlar incelensin
  diye durur.
- En az bir başarılı yedek her zaman korunur.

**Windows Task Scheduler (günlük 03:00):**
```powershell
$a = New-ScheduledTaskAction -Execute "node" `
  -Argument "scripts\migration\backup-rotate.mjs --root D:\corteqs-yedek --keep 14 --confirm" `
  -WorkingDirectory "C:\temp_private\corteqs\corteqs_fin"
$t = New-ScheduledTaskTrigger -Daily -At 03:00
Register-ScheduledTask -TaskName "CorteQS-Supabase-Yedek" -Action $a -Trigger $t
```

**VPS'te cron (tercih edilen — makine sürekli açık):**
```cron
0 3 * * * cd /srv/corteqs && /usr/bin/node scripts/migration/backup-rotate.mjs \
  --root /srv/yedek --keep 14 --confirm >> /var/log/corteqs-yedek.log 2>&1
```

⚠️ **Çıkış kodunu izle.** Sessizce başarısız olan bir yedek işi, yedek olmamasının
en kötü hâlidir — var sanırsın. Cron çıktısını maile bağla ya da bir izleme
servisine ping at.

⚠️ **Yedek, geri yüklenebildiği kanıtlanana kadar yedek DEĞİLDİR.**
Ayda bir izole bir Postgres'e restore provası yap:
`node scripts/migration/restore-selfhost.mjs --from <DIZIN> --target <URL>`

### 4.3 Sınır izleme — sürprizi önler
```bash
npm run selfhost:limits
```
Veritabanı, storage ve aylık aktif kullanıcıyı Free sınırlarına karşı ölçer;
%70'te uyarır, %85'te kritik der ve çıkış kodu 1 döner (cron'a bağlanabilir).

⚠️ **Egress ve Edge Function çağrısı bu script'ten ölçülemez** — onlar yalnız
panelde görünür. Ayda bir elle bak.

---

## 5. Geçişi TETİKLEYECEK eşikler

Plan hazır ve test edilmiş. Aşağıdakilerden **herhangi biri** olursa
`docs/migration-runbook.md` Faz 1'den başlatılır:

| # | Tetikleyici | Nasıl fark edilir |
|---|---|---|
| 1 | Veritabanı > **350 MB** (%70) | `npm run selfhost:limits` sarı |
| 2 | Storage > **700 MB** (%70) | aynı |
| 3 | Egress > **4 GB/ay** (%80) | panel → Usage |
| 4 | Ayda 2+ kez RAM kaynaklı kesinti | site 5xx / Cloudflare 521 |
| 5 | Free'de bir özellik engellendi | ör. eklenti, cron, kota |
| 6 | Supabase fiyat/sınır değişikliği | duyuru |
| 7 | Bir yedek geri yüklenemedi | aylık restore provası |

**Tetiklendiğinde ne kadar sürer:** Faz 1–5 (yerel kurulum, export, restore,
doğrulama) yaklaşık yarım gün. Cutover 30–60 dk bakım penceresi.
Kodun tamamı yazılmış ve korumaları test edilmiş durumda.

---

## 6. Karar: Free'ye geçilebilir — iki koşulla

Ölçümler (bölüm 3) Free'yi destekliyor. Geriye tek gerçek risk kalıyor:
**RAM 1 GB → 500 MB.**

Bu riski küçük kılan şey ölçülen yükün düşüklüğü: **5 MAU, 1 eşzamanlı realtime
bağlantı, günde 10–20 MB egress.** 2026-08-05'teki 50 dakikalık çöküş normal
trafikten DEĞİL, `geo_cities` (76.990 satır) üzerinde satır başına fonksiyon
çalıştıran **kötü bir ad-hoc sorgudan** geldi. O kural zaten belgeli
(`CLAUDE.md` + `docs/supabase-exit-plan.md` §6).

### Koşul 1 — yedek (pazarlık konusu değil)
Free'de otomatik yedek **yoktur**; Pro'daki 8 günlük yedek downgrade ile silinir.
`scripts/migration/backup-rotate.mjs` günlük tam yedek + rotasyon yapar.
Kurulum: bölüm 4.2.

### Koşul 2 — 500 MB'ta ağır sorgu çalıştırma
Keşif sorgularında büyük tabloya satır başına fonksiyon uygulama. Normalize
etmen gerekiyorsa önce `select distinct` ile küçült, sonra join'le.

**Ne zaman VPS'e geçilir:** bölüm 5'teki 7 tetikleyiciden biri olduğunda.
Plan hazır ve test edilmiş; tetiklendikten sonra yarım gün + 30–60 dk pencere.

---

## Karar günlüğü

| Tarih | Karar / bulgu |
|---|---|
| 2026-09-20 | Geçiş motivasyonu **maliyet** olarak belirlendi (kullanıcı) |
| 2026-09-20 | Ölçüm: proje **Pro**'da, 8 günlük yedek mevcut — "zaten Free'deyiz" varsayımı yanlıştı |
| 2026-09-20 | Free'ye düşmenin bedeli ölçüldü: yedek yok + RAM yarı + egress 50× az |
| 2026-09-20 | Karar ertelendi: önce **egress kullanımı** panelden görülecek |
| 2026-09-20 | Plan değişikliğinden önce **tam yedek alınması** kararlaştırıldı |
