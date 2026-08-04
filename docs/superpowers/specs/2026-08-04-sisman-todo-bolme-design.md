# Şişman Todoları Ayrı Todolara Bölme — Tasarım

**Tarih:** 2026-08-04
**Kapsam:** Komuta Merkezi (`/admin/workspace/command-center`) — `command_center_items` tablosu
**Tip:** Tek seferlik veri düzeltmesi (kod değişikliği yok)

## Problem

Komuta Merkezi listesinde, `detail` alanı onlarca `- [ ]` maddesi taşıyan "şişman" kayıtlar var.
Tek satırda 8–13 iş birimi olduğu için ne atanabiliyor, ne durumu takip edilebiliyor, ne de
tabloda okunabiliyor.

Canlı DB tespiti (2026-08-04):

- Aktif (silinmemiş + arşivlenmemiş) kayıt: **1469** (99 `todo`, 1370 `meeting_note`)
- `detail` içinde 2+ `- [ ]` maddesi olan: **13 kayıt** (12 `todo` + 1 `meeting_note`), ~130 alt madde
- Bu 13 kaydın **9'u zaten `Tamamlandi`** — sadece 4'ü açık
- Hepsi "13 Mayıs toplantı todo paketi" import'undan geliyor

## Kararlar

| Karar | Seçim | Gerekçe |
|---|---|---|
| Kapsam | Yalnızca açık 4 kayıt | Tamamlanmış 9 kaydı bölmek listeye ~90 adet `Tamamlandi` satırı ekler, hiçbir işe yaramaz |
| Yöntem | Kürasyonlu bölme | Mekanik `- [ ]` → todo dönüşümü "Dernekler.", "Cevapları net yaz." gibi todo olmayan satırlar üretir |
| Toplantı notu | Dokunulmaz | `13 Mayıs Toplantı Kararları` bir `meeting_note`; içeriği karar, todo değil. Kararların todo karşılıkları listede zaten ayrı kayıt ve `Tamamlandi` |
| Ebeveyn kayıt | Arşive kaldırılır (`archived_at`) | Aktif listeden çıkar, Arşiv görünümünde tam metniyle kalır. Çöp kutusu ("silindi") semantik olarak yanlış |

Sonuç: **3 kayıt bölünür → 11 yeni todo**, 3 ebeveyn arşivlenir, 1 `meeting_note` olduğu gibi kalır.

## Neden mekanik bölme reddedildi

`a72bf604` (`Contributor kaynak toplama sistemi taslağı hazırla`) kaydının 13 maddesinin 10'u,
ilk maddenin alt listesidir:

```
- [ ] Contributorların toplayacağı kaynak tiplerini listele.
- [ ] İşletmeler.          ← ayrı todo değil
- [ ] Danışmanlar.         ← üstteki maddenin listesi
- [ ] Dernekler.
...
```

Her satırı ayrı todoya çevirmek "Dernekler." adında bir iş kalemi üretirdi. Alt kırılım maddeleri
yeni todonun **detayında** liste olarak kalır.

## Bölme planı

### 1. `WhatsApp grubu ekleme politikasını netleştir`

`1c0dc021-2621-493d-8ae1-6eee93bf578c` · Burak · prio 9 · ACİL · `Topluluk, Referral & Onboarding` · 9 madde → **5 todo**

| # | Yeni başlık | Kaynak madde |
|---|---|---|
| 1 | WhatsApp grubu ekleme platform politikasını yaz | 1, 2, 8 |
| 2 | Grup onay akışlarını belirle (açık davet linkli / kapalı gruplar) | 3, 4, 5 |
| 3 | Grup ekleme formundaki alanları Barış ile netleştir | 7 |
| 4 | Contributorlardan kendi şehirlerindeki WhatsApp gruplarını toplamalarını iste | 6 |
| 5 | "Bildiğiniz faydalı WhatsApp gruplarını ekleyin" sosyal medya mesajını hazırla | 9 |

### 2. `Contributor kaynak toplama sistemi taslağı hazırla`

`a72bf604-11bd-471f-a101-73a32c85b93b` · Burak · prio 6 · `Topluluk, Referral & Onboarding` · 13 madde → **2 todo**

| # | Yeni başlık | Kaynak madde |
|---|---|---|
| 1 | Contributorların toplayacağı kaynak tiplerini listele | 1 + 10 kaynak tipi (detayda liste) |
| 2 | Kaynakların dashboard'a giriş sürecini yaz | 12, 13 |

### 3. `Contributor soru-cevap dokümanı oluştur`

`0991dab8-5683-4d15-afbe-6b886ec5fac4` · Burak · prio 6 · `Dokümantasyon, Drive & Operasyon` · 8 madde → **4 todo**

| # | Yeni başlık | Kaynak madde |
|---|---|---|
| 1 | Contributor sorularını topla (toplantı + WhatsApp) | 1, 2 |
| 2 | Soruları konu başlıklarına göre tasnif et | 3 |
| 3 | FAQ dokümanını yaz | 5, 6, 7, 8 |
| 4 | FAQ'yı tüm contributorlara yazılı olarak paylaş | 4 |

**Kayıp madde yok:** 30 kaynak maddenin tamamı ya yeni bir todonun başlığına ya da detayına taşınır.

## Veri modeli

`command_center_items` düz bir tablodur — parent/child kolonu yoktur. Bölme = yeni satır üretmek.

### Çocuk kayıtların alan devri

| Alan | Değer |
|---|---|
| `item_type` | `'todo'` |
| `category_label`, `assignee`, `priority`, `urgent`, `sort_order` | Ebeveynden aynen |
| `status` | `'Baslanmadi'` |
| `due_date` | Ebeveynden aynen |
| `legacy_source_type` | `'todo_items'` |
| `legacy_source_code`, `legacy_source_date_label`, `legacy_source_category` | Ebeveynden aynen |
| `legacy_source_title` | `cc-split-2026-08-04-<slug>-NN` |

**`due_date` notu:** 3 ebeveynin ikisinde `due_date` boştur; `WhatsApp grubu ekleme politikasını
netleştir` kaydında ise **2026-05-19** yazar — yani tarih çoktan geçmiştir. Devralınması bu 5
çocuğu da gecikmiş gösterir. Bu, işin gerçek durumunun doğru yansımasıdır (19 Mayıs hedefiydi,
yapılmadı); yanlış görünüyorsa bölme sırasında boşaltılabilir.

`legacy_source_title` üzerinde **UNIQUE index** vardır
(`idx_command_center_items_legacy_source_title_unique`). Deterministik slug üretmek migration'ı
idempotent yapar: yeniden çalıştırılırsa `ON CONFLICT DO NOTHING` çift kayıt üretmez.

### İz sürülebilirlik

Her çocuğun `detail` alanı şu satırla biter:

```
Bölündü: "<ebeveyn başlığı>" · Import Kaynağı: 13 Mayıs toplantı todo paketi
```

Ebeveynin `detail` alanının sonuna, hangi todolara bölündüğünü listeleyen bir not eklenir;
sonra `archived_at = now()` set edilir.

### Gruplama üzerindeki etki

`item_type = 'todo'` kayıtlarda tarih grubu her zaman sabit `TODO`
(`getCommandCenterDateGroupInfo`), üst kategori ise `category_label`
(`getCommandCenterTopCategoryLabel`). Yani `legacy_source_*` alanları todolar için gruplamayı
etkilemez — yeni kayıtlar ebeveynleriyle aynı kategori kutusunda görünür.

`sort_order` yalnızca `meeting_note` için istemci tarafı sıralamada kullanılır
(`sortCommandCenterItems`); todolar `created_at DESC` ile sıralanır, dolayısıyla yeni kayıtlar
kendi prio grubunun üstünde çıkar.

## Uygulama

Kod değişikliği yoktur — panel bu satırları mevcut haliyle okur.

1. `supabase/migrations/applied/20260804140000_command_center_split_fat_todos.sql` yazılır
   - `INSERT ... ON CONFLICT (legacy_source_title) DO NOTHING` ile 11 çocuk
   - 3 ebeveyn için `UPDATE ... SET archived_at = now(), detail = detail || <bölünme notu>`
     (`WHERE archived_at IS NULL` koşuluyla — tekrar çalıştırmada nota ikinci kez eklemez)
2. Pooler üzerinden uygulanır (Türkçe içerik için UTF-8 dosya + `-f` zorunlu, komut satırından
   geçirilmez):
   ```bash
   PGPASSWORD="$SUPABASE_DB_PASSWORD" PGCLIENTENCODING=UTF8 psql \
     "host=aws-1-eu-west-2.pooler.supabase.com port=5432 dbname=postgres \
      user=postgres.injprdrsklkxgnaiixzh sslmode=require" \
     -v ON_ERROR_STOP=1 --single-transaction \
     -f supabase/migrations/applied/20260804140000_command_center_split_fat_todos.sql
   ```
3. `supabase_migrations.schema_migrations` kaydı eklenir
4. Doğrulama sorguları çalıştırılır (aşağıya bakınız)
5. Commit

## Doğrulama

Migration sonrası, kanıt olarak:

| Kontrol | Beklenen | Sonuç (2026-08-04) |
|---|---|---|
| `legacy_source_title LIKE 'cc-split-2026-08-04-%'` sayısı | 11 | ✅ 11 |
| 3 ebeveynin `archived_at` değeri | dolu | ✅ 3/3 |
| Aktif `todo` sayısı | 99 + 11 − 3 = 107 | ✅ 107 |
| Aktif listede 2+ `- [ ]` içeren kayıt | 14 (aşağıya bakınız) | ✅ 14, "beklenmeyen" grup yok |
| Yeni kayıtlarda mojibake | yok | ✅ 0; `ş`/`ı`/`ğ`/`·` sağlam |
| `schema_migrations` kaydı | var | ✅ 1 |
| Migration'ı ikinci kez çalıştırma | 0 yeni satır, ebeveyn notu tek kez | ✅ `INSERT 0 0` ×3, `UPDATE 0` ×3 |

**"2+ madde" metriği neden 10 değil 14:** bu metrik "şişman kayıt" için kaba bir vekildir, hedef
değildir. Kalan 14 kaydın kırılımı:

| Grup | Adet | Madde aralığı | Durum |
|---|---|---|---|
| `Tamamlandi` şişman todolar | 9 | 8–11 | Bilinçli kapsam dışı |
| `13 Mayıs Toplantı Kararları` | 1 | 11 | Bilinçli dokunulmadı |
| Bu bölmeden çıkan yeni todolar | 4 | 2–4 | **Kasıtlı** |

Son satır kürasyonlu bölmenin tanımı gereğidir: "FAQ dokümanını yaz" tek bir iştir, 4 maddesi
(FAQ formatı, kapsanacak konular, üslup, kesinleşmemiş konular) o işin adımlarıdır — ayrı todo
olmaları listeyi yine şişirirdi. Hedef "her satırda tek `- [ ]`" değil, **her satırda tek iş**.

Ayrıca panelde gözle: 11 kayıt doğru kategori/atama/prio ile görünüyor, 3 ebeveyn aktif listede
yok ama Arşiv görünümünde duruyor.

## Kapsam dışı

- Kalıcı "Böl" UI özelliği (dialog ile madde seçimi) — 3 kayıt için gereksiz
- Tamamlanmış 9 şişman kaydın bölünmesi veya arşivlenmesi
- `13 Mayıs Toplantı Kararları` kaydına herhangi bir müdahale
- `command_center_items` tablosuna parent/child kolonu eklenmesi
