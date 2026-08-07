# Oturum özeti — 2026-08-06 (3. oturum): komuta merkezi neden bayat görünüyor

> Kök dizine dosya eklenmiyor (CLAUDE.md kuralı), bu yüzden `docs/history/` altında.
> Bugün paralel çalışan diğer oturumlar: `session7.md` (Cadde erişim kuralı),
> `2session.md`. Bu dosya üçüncü oturumdur ve **onlarla hiç kesişmiyor** — konu
> `/admin/workspace/command-center`.

**İstek:** `https://corteqs.net/admin/workspace/command-center` tablolarındaki son 5 günlük
eklemeler yansımamış; uygulanmayan Supabase migration'lar olabilir mi?

**Sonuç:** **Kod değişikliği YOK, commit YOK.** Tamamen teşhis oturumu. Migration hipotezi
ölçülerek elendi. Kök neden bir gösterim kusuru değil: **veri hiç yazılmamış.**

**Devralan oturuma tek cümle:** menüler eksiksiz, eksik olan verinin kendisi — komuta
merkezine 4 Ağustos 08:00'den beri tek satır yazılmadı, toplantı notlarına da 19 Haziran'dan
beri; ikincisinin sebebi kodda sabit bir dropdown listesi.

---

## 1. Elenen hipotezler — bunları TEKRAR ARAŞTIRMA

Dördü de ölçülerek kapatıldı. Yeniden kovalamak zaman kaybı olur.

| Hipotez | Ölçüm | Sonuç |
|---|---|---|
| Uygulanmamış migration var | `npm run check:migrations:warn` → `358 dosya · 358 canlı kayıt · 2 çakışan zaman damgası (bilinen durum)` → **Sapma yok**. Canlı `schema_migrations` en yenisi `20260806100000`. | ❌ elendi |
| Coolify deploy bekliyor | Canlı `assets/main-CCSaDGyq.js` **Last-Modified: Thu, 06 Aug 2026 08:07:54 GMT**. `assets/admin-updates-DxjwJk4P.js` aynı damga ve içinde `20260805-bes-oturumun-kalani-tek-listede` + `20260805-workshop-panosu-isaretleme-bekliyor` **var**. | ❌ elendi |
| RLS yazmayı engelliyor | `command_center_items_all_open`: `ALL` / `{anon,authenticated}` / `using true` / `with_check true`. Yazma sonuna kadar açık. | ❌ elendi |
| Sayfa veriyi çekemiyor / kırpılıyor | 1592 satır okunuyor; `v_command_center_facets` **320 satır** (PostgREST 1000 tavanının altında). | ❌ elendi |

> ⚠️ **"Coolify deploy bekliyor" maddesi bu repoda ikinci kez çürütüldü.** Birincisi
> `session6.md`'de (5 Ağustos, canlı bundle'da CSS sınıfı aranarak). Bu oturumda aynı sonuç
> `Last-Modified` başlığı + bundle içinde kayıt id'si aranarak tekrar doğrulandı. Bir sonraki
> oturum bu maddeyi listeye geri koymadan önce **ölçsün**.

> ℹ️ Oturum sonunda çalışma ağacında `supabase/migrations/20260806140000_cadde_feed_reach_rpc.sql`
> **parent dizinde** duruyordu — bu paralel oturumun (bkz. `session7.md`) devam eden işi, bu
> oturumun bulgusu değil. CLAUDE.md kuralı gereği parent dizindeki dosya "yazıldı ama canlıya
> uygulanmadı" demektir; sahibi o oturumdur.

---

## 2. Kök neden: `command_center_items` tablosuna yazılmamış

Canlı ölçüm (2026-08-06):

```
toplam 1592 · panoda görünür 1477 · arşivli 15 · silinmiş 100
max(created_at)  = 2026-08-04 08:00:35+00
max(updated_at)  = 2026-08-04 08:00:35+00   ← aynı an
```

İki damganın aynı olması şu demek: **4 Ağustos 08:00'den beri ne INSERT ne UPDATE geldi.**
Panelden elle bir madde bile eklenmemiş, bir durum bile değiştirilmemiş.

### Panoda görünen en yeni başlık daha da eski

| Kaynak | Tarih etiketi | Adet | Yazılma anı |
|---|---|---|---|
| — | 2026-05-13 P1 | 13 | 2026-08-04 08:00 |
| — | 2026-05-13 P0 | 7 | 2026-08-04 08:00 |
| WA | **2 Ağustos 2026** | **329** | 2026-08-02 09:48 |
| WA | 7 Temmuz 2026 | 411 | 2026-08-02 09:48 |
| T16 | 19 Haziran 2026 | 30 | 2026-06-22 |
| T15 | 12 Haziran 2026 | 21 | 2026-06-22 |

4 Ağustos'ta eklenen 11 satır, şişman todo bölme migration'ının
(`20260804140000_command_center_split_fat_todos.sql`) ürünü ve `legacy_source_date_label`
olarak **eski `2026-05-13 P0/P1`** etiketini taşıyor. Pano bu etikete göre grupladığı için
o satırlar **yeni bir grup oluşturmuyor** — gözle görünen en yeni başlık hâlâ "2 Ağustos 2026".
Kullanıcının "yansımamış" dediği his buradan geliyor.

### Son 5 günün işi nereye yazılmış

Üç ayrı defter var; komuta merkezi bunlardan biri değil:

| Defter | Nerede görünür | Son yazma |
|---|---|---|
| `ADMIN_UPDATES` / `ADMIN_TODOS` (statik kod) | `/admin/durum-raporu`, `/admin/about`, üst çubuk zili | 5 Ağustos — **canlıda mevcut** |
| `workshop_items` (DB) | `/admin/workshop/cadde` | 2026-08-05 12:37 — WS1 49/54, WS2 32/79 |
| `command_center_items` (DB) | `/admin/workspace/command-center` | **2026-08-04 08:00 — dokunulmamış** |

> 5 Ağustos'ta kullanıcıya verilen `docs/operations/2026-08-05-workshop-ubt-isaretleme*.sql`
> dosyaları **çalıştırılmış** (workshop panosu güncel). `session6.md`'deki "SENDE" maddesi kapandı.

---

## 3. İkinci kusur: toplantı notu dropdown'u T16'da donmuş

**Semptom:** 19 Haziran 2026'dan sonraki hiçbir toplantı notu girilememiş.

**Kök neden:** [`src/lib/dashboard/meeting-notes-data.ts:57-77`](../../src/lib/dashboard/meeting-notes-data.ts)
içindeki `MEETING_SOURCES` **elle yazılmış statik dizi**; son toplantı kaydı
`{ key: 'T16', label: 'Toplantı 16', date: '19 Haziran 2026' }`.

Kullanıldığı iki yer:
- [`CommandCenterManager.tsx:722`](../../src/components/dashboard/commandcenter/CommandCenterManager.tsx) — yeni kayıt formu "Kaynak Kodu"
- [`CommandCenterManager.tsx:1600`](../../src/components/dashboard/commandcenter/CommandCenterManager.tsx) — satır içi düzenleme

**Önemli ayrım — bu dropdown veriyi GİZLEMİYOR, GİRİŞİNİ ENGELLİYOR.** Canlıda T16 sonrası
hiç kayıt yok; saklanan bir veri yok. Dropdown'ı düzeltmek geçmişi geri getirmez, bundan
sonrasını mümkün kılar.

**Yeni kaynak eklemek aynı dosyada ÜÇ yeri birlikte değiştirmeyi gerektiriyor** (biri
unutulursa TS hatası veya renksiz rozet):

1. `MeetingSource` union tipi (satır 4-23) → `| 'T17'`
2. `MEETING_SOURCES` dizisi (satır 57) → etiket + tarih
3. `SOURCE_COLORS` kaydı (satır 79) → `Record<MeetingSource, string>` olduğu için renk **zorunlu**

**Yan tutarsızlık:** dropdown `T10 — 6 Mayıs` seçeneğini sunuyor ama canlıda **tek bir T10
kaydı yok** — karşılığı olmayan bir seçenek duruyor.

### Diğer açılır listeler SAĞLAM — tekrar kontrol etme

| Bileşen | Kaynak | Durum |
|---|---|---|
| Kategori filtresi | `v_command_center_facets` | ✅ DB'deki 9 kategori statik 9 ile birebir |
| Tarih grubu filtresi | `v_command_center_facets` | ✅ T15, T16, "WA 2 Ağustos 2026" dahil |
| "Kayıt Kaynakları" kartı | `v_command_center_facets` | ✅ `getSourceByKey`'e hiç bakmıyor |
| **Kaynak Kodu (form)** | **statik dizi** | ❌ T16'da kesiliyor |

`/admin/workspace/command-center` sayfası `<CommandCenterManager />`'ı **propsuz** çağırıyor →
`lockedItemType === undefined` → `matchesFacetFilters` tip filtresi uygulamıyor → hem todo hem
toplantı notu görünüyor. (`AdminTodoWorkspacePage` / `AdminMeetingNotesWorkspacePage` tipi
kilitler; karıştırma.)

> Dürüstlük notu: menülerin eksiksizliği **kod yolu okunarak + DB ölçülerek** doğrulandı,
> tarayıcıda sayfa açılarak değil. Ekranda var olup menüde çıkmayan somut bir kayıt bulunursa
> bu tablo çürür ve ayrıca kovalanmalı.

---

## 4. Yan bulgular (ölçüldü, düzeltilmedi)

1. **⚠️ GÜVENLİK — `anon` rolünün admin tablosuna tam yazma yetkisi var.**
   `command_center_items_all_open` politikası `{anon,authenticated}` rolüne `ALL` veriyor
   (`using true`, `with_check true`). Giriş yapmamış biri anon anahtarla bu tabloya kayıt
   ekleyip silebilir. Yanındaki `command_center_items_write_admin` / `..._select_admin`
   politikaları (`is_admin(auth.uid())`) bu yüzden **fiilen ölü**. En acil madde bu.

2. **Yeni eklenen madde zaten tepede görünmez.**
   [`command-center-items.ts:676-679`](../../src/lib/dashboard/command-center-items.ts) sıralaması
   `priority DESC → item_type ASC → sort_order ASC → created_at DESC`. Tarih **en son** kriter.
   1477 görünür satır arasında düşük öncelikli yeni bir kayıt sayfa 1'de asla çıkmaz — madde
   eklense bile "yansımadı" hissi devam eder.

3. **Hatalar sessizce boş tabloya dönüşüyor.**
   [`command-center-items.ts:685-692`](../../src/lib/dashboard/command-center-items.ts):
   `if (error || !data) return { items: [], totalCount: 0 }`. Sorgu patlarsa kullanıcı hata
   değil **boş pano** görür. CLAUDE.md'de cadde için yazılı olan sessiz-hata sınıfının aynısı.

4. **Bayat sabit sayı.** [`AdminDatabaseTablesPage.tsx:142`](../../src/pages/admin/AdminDatabaseTablesPage.tsx)
   `command_center_items` için `rowCount: 647` diyor; gerçek **1592**. (Aynı dosyadaki
   `meeting_notes: 470` doğrulanmadı.)

5. **`meeting_notes` tablosu ayrı ve çok daha bayat.** `/admin/workspace/meeting-notes`
   sayfasını besleyen bu tablonun en yeni kaydı **2026-05-08**. Komuta merkezindeki toplantı
   notlarıyla (`command_center_items.item_type='meeting_note'`) karıştırma — iki ayrı yer.

---

## 5. Karar bekleyen işler (hiçbiri başlanmadı)

| # | İş | Not |
|---|---|---|
| **C** | `anon` yazma açığını kapatan RLS migration'ı | **En acil** — güvenlik |
| **A** | 3–6 Ağustos işlerini komuta merkezine madde olarak yazan migration | Yeni tarih etiketiyle grup oluşsun |
| **D** | Toplantı dropdown'u | *Kalıcı:* facets'ten türet + serbest kaynak girişi (`MeetingSource`'u `string`'e açmak gerekir, orta boy iş) · *Hızlı yama:* eksik toplantıları elle ekle — **19 Haziran sonrası toplantı numaraları/tarihleri kodda da DB'de de YOK, sadece kullanıcıda** |
| **B** | Sıralama (bulgu 2) + sessiz hata (bulgu 3) düzeltmesi | Panonun bir daha "bayat" görünmemesi için |

---

## 6. Ölçüm komutları (tekrar kullanmak için)

Canlı DB — session pooler, `.env.local` içinde `SUPABASE_DB_PASSWORD` gerekli.
Bash sandbox dış ağa çıkmaz → `dangerouslyDisableSandbox` şart.

```bash
PGPASSWORD=$(grep -m1 '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2-) \
psql "host=aws-1-eu-west-2.pooler.supabase.com port=5432 dbname=postgres \
      user=postgres.injprdrsklkxgnaiixzh sslmode=require" -c "<sorgu>"
```

```sql
-- pano tazeliği
select count(*) toplam,
       count(*) filter (where archived_at is null and deleted_at is null) gorunur,
       max(created_at) en_son_ekleme, max(updated_at) en_son_guncelleme
from command_center_items;

-- kaynak grupları
select legacy_source_code, legacy_source_date_label, count(*), max(created_at)
from command_center_items where deleted_at is null and archived_at is null
group by 1,2 order by max(created_at) desc limit 10;

-- RLS
select policyname, cmd, roles::text, qual, with_check
from pg_policies where tablename='command_center_items';

-- workshop panosu  (⚠️ sütun adı ubt_done, is_done DEĞİL)
select session_key, count(*) toplam, count(*) filter (where ubt_done) isaretli,
       max(updated_at) from workshop_items group by 1;
```

Deploy tazeliği (PowerShell):

```powershell
$r = Invoke-WebRequest "https://corteqs.net/" -UseBasicParsing
($r.Content | Select-String 'assets/[A-Za-z0-9_\-\.]+\.js' -AllMatches).Matches.Value
$m = Invoke-WebRequest "https://corteqs.net/assets/main-<hash>.js" -UseBasicParsing
$m.Headers['Last-Modified']                  # yayın anı
$m.Content.Contains('<bilinen-kayit-id>')    # içerik gerçekten canlı mı
```

Migration sapması: `npm run check:migrations:warn` (sapma → `check:migrations` exit 1).

> ⚠️ Canlı instance **904 MB RAM** ile çalışıyor (CLAUDE.md). `geo_cities` **76.990 satır**;
> satır başına fonksiyon uygulayan keşif sorgusu siteyi düşürür — 5 Ağustos'ta düşürdü.
> Yukarıdaki sorgular küçük tablolara dokunuyor, güvenli.

---

## 7. Bu oturumda değişen dosya

**Yok.** Tek çıktı bu özet dosyası. Oturum başında repo `main` / HEAD `7d3ab86` / çalışma
ağacı temizdi; oturum sonunda HEAD `ec7f34e` idi — aradaki commit **paralel oturumun** işidir.
