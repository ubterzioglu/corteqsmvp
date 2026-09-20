# Kadro Konsolu → `/admin/kadro` — tasarım

**Tarih:** 20 Eylül 2026
**Durum:** onaylandı, uygulamaya hazır
**Kaynak:** `https://claude.ai/artifact/S84nnpXoGob3Y9z7QM7QXi` (CorteQS Kadro Konsolu, tek dosya HTML, 2080 satır)

## 1. Amaç

CorteQS'in 52 pozisyonluk kadro planını — rol tanımları, dalga/öncelik sıralaması,
pazarlama matrisi, haftalık rutinler ve hazır ilan metinleri — artifact'tan çıkarıp
admin panelinde kalıcı, çok kullanıcılı ve geçmişi tutulan bir araca dönüştürmek.

Artifact bugün iki kurucunun ortak kullandığı bir pano; ama durum değişiklikleri
kim tarafından yapıldığı bilinmeden, son yazan kazanacak şekilde saklanıyor ve
aday takibi yok. Admin sürümü bu iki boşluğu kapatır.

## 2. Alınan kararlar

| Karar | Seçim | Gerekçe |
|---|---|---|
| Veri sahipliği | **Karma** — rol tanımları kodda, durum DB'de | Tanımlar versiyonlanır, review'lanır, testle kilitlenir. Migration küçük kalır. Bedeli: yeni rol/JD düzeltmesi deploy gerektirir; kabul edildi. |
| Görünürlük | **Sadece admin** | Tek risk yüzeyi. Public kariyer sayfası ve başvuru formu ayrı iş olarak ertelendi. |
| Ekstra 1 | Değişiklik geçmişi | İki kurucu aynı panoyu kullanıyor; "kim değiştirdi" bugün kayıp. |
| Ekstra 2 | Aday takibi | Artifact'ta tek `owner` metin alanı var, aday hunisi yok. |
| Ekstra 3 | CSV dışa aktarım | Ucuz; toplantıya tablo götürmek için. |
| Tip katmanı | `LooseQuery` shim (`workshop-items.ts` deseni) | `types.ts` bu tabloları bilmeyecek. `as any` değil, dar ve bilinçli arayüz; `tsc` 0'da kalır. |

**Ölçülen başlangıç durumu:** artifact'ın `roles` koleksiyonu **boş** (ArtifactData ile
okundu, 20.09.2026). Taşınacak canlı veri yok → seed/import adımı gerekmiyor.

## 3. Rol envanteri (dosyadan sayıldı)

52 rol. Bölüm × eksen dağılımı:

| Bölüm | Adet | Dosya |
|---|---|---|
| Kuruluş & Liderlik (`kurucu`) | 5 | `roles/liderlik.ts` |
| Finans, Hukuk & İdari (`kurumsal`) | 3 | `roles/kurumsal.ts` |
| Pazarlama — ürün hattı (`pazarlama`/`urun`) | 7 | `roles/pazarlama-urun.ts` |
| Pazarlama — işlev hattı (`pazarlama`/`islev`) | 11 | `roles/pazarlama-islev.ts` |
| Pazarlama — coğrafya hattı (`pazarlama`/`cografya`) | 9 | `roles/pazarlama-cografya.ts` |
| Ürün & Teknoloji (`urun`) | 9 | `roles/urun-teknoloji.ts` |
| Operasyon & Güven (`operasyon`) | 5 | `roles/operasyon.ts` |
| Gelir & Ortaklıklar (`gelir`) | 3 | `roles/gelir.ts` |

50 rolde ilan metni (`ad`) var, 2 kurucu rolünde `null`.

Tek dosyada 52 rol ~1300 satır eder; CLAUDE.md tavanı 800. Bölüm başına dosya
`admin-navigation-registry/<grup>.ts` desenini izler ve her dosya 100–350 satır bandında kalır.

## 4. Veri modeli

Tek migration: `supabase/migrations/applied/20260920100000_kadro_konsolu.sql`
(son uygulanan migration `20260919130000` — timestamp çakışması yok).

### 4.1 `kadro_role_states`

Rol başına **en fazla bir** satır. Satır yoksa koddaki varsayılan geçerlidir.

| Kolon | Tip | Not |
|---|---|---|
| `role_key` | `text primary key` | Koddaki rol id'si (`ld-cmo`, `pz-radar`…) |
| `status` | `text` | `dolu · destek · gorusme · aday · teklif · acik · beklemede` — CHECK kısıtı |
| `priority` | `text` | `kritik · yuksek · orta · dusuk` — CHECK kısıtı |
| `owner_name` | `text` | Serbest metin (artifact'taki `owner`) |
| `note` | `text` | Serbest not |
| `updated_at` | `timestamptz not null default now()` | |
| `updated_by` | `uuid references auth.users(id)` | |

`status` ve `priority` üzerinde CHECK kısıtı **zorunludur**. Gerekçe: bu projede
`events.type` üzerinde CHECK olmadığı için yanlış değer hatasız kaydedilmiş ve kayıt
kendi filtresine düşmemişti (CLAUDE.md, Türkçe Metin Kuralları md.6). Aynı sınıf hata
burada da mümkün.

### 4.2 `kadro_role_events`

Append-only. **Trigger ile yazılır**, API katmanından değil.

| Kolon | Tip |
|---|---|
| `id` | `uuid primary key default gen_random_uuid()` |
| `role_key` | `text not null` |
| `field` | `text not null` (`status` · `priority` · `owner_name` · `note`) |
| `old_value` | `text` |
| `new_value` | `text` |
| `changed_by` | `uuid references auth.users(id)` |
| `changed_at` | `timestamptz not null default now()` |

`kadro_role_states` üzerinde `AFTER INSERT OR UPDATE` trigger'ı, değişen her alan için
bir satır yazar. Trigger tercih edildi çünkü **atlanamaz**: ileride biri psql'den ya da
başka bir yoldan satırı güncellerse kayıt yine düşer. API'ye bırakılan geçmiş, ilk
unutulan çağrıda sessizce eksilir ve bunun testi yoktur.

Index: `(role_key, changed_at desc)`.

### 4.3 `kadro_candidates`

| Kolon | Tip |
|---|---|
| `id` | `uuid primary key default gen_random_uuid()` |
| `role_key` | `text not null` |
| `full_name` | `text not null` |
| `links` | `text` (LinkedIn / portfolyo / GitHub, serbest) |
| `stage` | `text not null default 'aday'` — `aday · gorusme · teklif · kapandi`, CHECK kısıtı |
| `note` | `text` |
| `created_by` | `uuid references auth.users(id)` |
| `created_at` / `updated_at` | `timestamptz not null default now()` |

Index: `(role_key, stage)`.

### 4.4 RLS

Üç tabloda da: yalnız `is_admin()` SELECT / INSERT / UPDATE / DELETE.
`kadro_role_events` için DELETE **verilmez** (append-only). `workshop_items`
(mig `20260730190000`) ile aynı kalıp.

### 4.5 role_key ↔ kod ilişkisi

`role_key` kodda yaşar, DB'de FK'sı **yoktur** (kod tarafı tek kaynak). Karma modelin
tek gerçek riski budur: kodda bir id değişirse DB satırı yetim kalır ve hiçbir yerde
hata vermez — durum sessizce kaybolur. Karşı önlemler §7'de.

### 4.6 Kayıt davranışı (artifact'tan bilinçli sapma)

Artifact 500 ms gecikmeli **otomatik kayıt** kullanıyor. Admin sürümünde çekmecedeki
düzenleme formu **açık "Kaydet" düğmesiyle** yazar.

Gerekçe: değişiklik geçmişi eklendiği anda otomatik kayıt bir kusura dönüşür — not
alanına yazılan her cümle arası duraklama ayrı bir `kadro_role_events` satırı üretir ve
geçmiş, gerçek kararları göstermek yerine tuş vuruşu kütüğüne döner. Açık kayıt, bir
niyet = bir olay kümesi verir.

Kaydedilmemiş değişiklik varken çekmece kapatılırsa uyarı gösterilir.

## 5. Kod düzeni

```
src/lib/kadro/
  roles/
    liderlik.ts            (5)
    kurumsal.ts            (3)
    pazarlama-urun.ts      (7)
    pazarlama-islev.ts     (11)
    pazarlama-cografya.ts  (9)
    urun-teknoloji.ts      (9)
    operasyon.ts           (5)
    gelir.ts               (3)
    index.ts               — birleştirir; id benzersizliği burada doğrulanır
  kadro-types.ts           — KadroRole, KadroRoleState, KadroCandidate, KadroRoleEvent
  kadro-taxonomy.ts        — bölümler, eksenler, dalgalar, çalışma tipleri,
                             durumlar, öncelikler + ortak ilan blokları (startup/model/apply)
  kadro-routines.ts        — 17 rutin (günlük/haftalık/aylık/yıllık, owner = role_key)
  kadro-schemas.ts         — Zod şemaları
  kadro-api.ts             — states + candidates + events okuma/yazma (LooseQuery shim)
  kadro-ad-text.ts         — ilan metni birleştirme (rol + ortak bloklar → düz metin)
  kadro-csv.ts             — CSV export, UTF-8 BOM'lu

src/components/admin/kadro/
  KadroSummary.tsx         — toplam / açık / dolu / kritik-açık sayaçları
  KadroFilters.tsx         — arama + bölüm/dalga/tip/durum + "sadece açık"
  KadroRoleTable.tsx       — bölüm ve eksen başlıklarıyla gruplu satır listesi
  KadroRoleDrawer.tsx      — rol detayı + düzenleme formu
  KadroCandidateList.tsx   — çekmece içinde aday hunisi
  KadroEventLog.tsx        — çekmece içinde değişiklik geçmişi
  KadroMatrix.tsx          — pazarlama matrisi (3 eksen sütunu)
  KadroRoutines.tsx        — rutinler, sıklığa göre gruplu
  KadroAdTexts.tsx         — ilan metinleri, kopyala düğmeli

src/pages/admin/kadro/
  AdminKadroPage.tsx       — Kadro sekmesi (ana liste)
  AdminKadroMatrisPage.tsx
  AdminKadroRutinlerPage.tsx
  AdminKadroIlanlarPage.tsx
  routes.tsx
```

Veri erişimi React Query (`useQuery` / `useMutation`) — CLAUDE.md'nin yeni özellikler
için önerdiği kalıp. `kadro-api.ts` dışında hiçbir bileşen `supabase.from(...)` çağırmaz.

## 6. Rotalar ve navigasyon

Artifact'taki 4 sekme, **4 ayrı route** olur (tab state değil) — derin link mümkün olsun
ve nav registry'ye girebilsin diye:

- `/admin/kadro` — Kadro (ana liste + çekmece)
- `/admin/kadro/matris` — Pazarlama Matrisi
- `/admin/kadro/rutinler` — Rutinler
- `/admin/kadro/ilanlar` — İlan Metinleri

Üç noktaya birlikte dokunulur (workshop `routes.tsx` başındaki notun aynısı):

1. `src/pages/admin/kadro/routes.tsx` — route ağacı
2. `src/lib/admin-shell/admin-route-meta.ts` → `ADMIN_ROUTE_PATTERNS`
3. `src/lib/admin-shell/admin-navigation-registry/kadro.ts` — yeni nav grubu +
   `admin-navigation-registry.ts` içinde gruba yer verilmesi

`admin-navigation-registry.test.ts` bu üçlü arasındaki sapmayı zaten yakalıyor.

## 7. Sessiz kusur kapatma

Bu projedeki hataların karakteri "test/build patlamaz, canlıda zarar verir" sınıfı.
Tasarım şu dört noktayı açıkça kapatır:

1. **Yetim DB satırı.** `role_key` kodda değişirse durum sessizce kaybolur.
   → `kadro-roles.test.ts` id'lerin benzersizliğini ve tüm zorunlu alanların dolu
   olduğunu kilitler. Ayrıca Kadro sayfası "kodda karşılığı olmayan DB satırı" sayacını
   gösterir — yetim varsa görünür olur.
2. **Geçersiz enum değeri.** `status`/`priority`/`stage` üzerinde CHECK kısıtı +
   `kadro-taxonomy.ts` ile SQL arasındaki değer listesini doğrulayan sözleşme testi.
   (`events.type` dersi: CHECK'siz kolon yanlış değeri hatasız kabul eder.)
3. **Türkçe metin.** Aramada `trIncludes`, sıralamada `trCompare`, CSV Blob'unda
   UTF-8 BOM. `npm run verify:text` kodlama denetler ama **eksik Türkçe harfi
   yakalamaz** — yeni yazılan arayüz metinleri gözle kontrol edilir.
4. **Araç kataloğu bayatlaması.** `src/lib/**` altına yeni dosya eklendiği için
   `npm run ingest:tools:check` çalıştırılmalıdır. Ne lint ne test bunu yakalar
   (`prelint` yalnız `check:drift` çalıştırır).

## 8. Testler

| Dosya | Neyi kilitler |
|---|---|
| `src/lib/kadro/roles/index.test.ts` | 52 rol, id benzersiz, zorunlu alanlar dolu, dept/axis/wave/type/status/pri geçerli küme içinde, bölüm başına beklenen adet |
| `src/lib/kadro/kadro-taxonomy.test.ts` | Taksonomi değerleri ile migration metnindeki CHECK listesi birebir aynı |
| `src/lib/kadro/kadro-api.test.ts` | states upsert, candidates CRUD, events okuma |
| `src/lib/kadro/kadro-csv.test.ts` | UTF-8 BOM var, Türkçe karakter bozulmuyor, kolon sırası sabit |
| `src/lib/kadro/kadro-ad-text.test.ts` | İlan metni = rol alanları + 3 ortak blok, `ad: null` olan rolde metin üretilmez |
| `src/lib/kadro/kadro-routines.test.ts` | Her rutinin `owner` alanı gerçek bir `role_key` |

Kapsam hedefi yeni kod için %80+ (CLAUDE.md).

## 9. Kapsam dışı (bilinçli)

- Public kariyer sayfası ve başvuru formu — ayrı iş olarak ertelendi
- Ücret / hisse (ESOP) rakamlarının panoda düzenlenebilir olması — artifact'ta da
  bilinçli olarak metin alanı; rakam erken aşamada konuşulmuyor
- `types.ts` regen — Management API + geçerli token gerektiriyor, her migration'da
  tekrar gerekiyor; `LooseQuery` shim yeterli
- Rol tanımlarının admin'den düzenlenmesi (tam DB modeli) — reddedildi, bkz. §2
- **Radar Editörü artifact'ı** (`2yBSLzFKtLVZZ4nBJ7VnoY`) — ayrı ve daha ağır bir iş;
  5 varlık (signals, issues, intros, stickers, ctas) ve projede **zaten bir Radar
  modülü var** (`radar-news-scan` edge function, `/admin/radar/queue|runs|sources`,
  `radarNewsPipeline.ts`). Artifact'taki Radar Instagram story küratörlüğü, projedeki
  Radar haber tarama hattı — aynı isim, farklı iş. Birleşecek mi yan yana mı duracak
  sorusu o işin başında sorulacak.

## 10. Uygulama ön koşulu

Artifact dosyasının **tamamı** okunmalıdır (2080 satır,
`artifact-cb71021c-1789664289-3afb.html`). Bu tasarım dosyanın ilk üçte biri + yapısal
tarama ile yazıldı; 52 rolün JD, KPI, ilan metni ve görev testi içerikleri birebir
aktarılacağı için transkripsiyon öncesi tam okuma zorunludur.

## 11. Kabul kriterleri

- [ ] `/admin/kadro` altındaki 4 sayfa açılıyor, admin olmayan erişemiyor
- [ ] Durum/öncelik/sahip/not değişikliği kaydediliyor ve sayfa yenilendiğinde duruyor
- [ ] Her değişiklik `kadro_role_events`'e kim/ne zaman/eski→yeni olarak düşüyor
- [ ] Rol çekmecesinde aday eklenip aşaması ilerletilebiliyor
- [ ] CSV indiriliyor, Excel'de Türkçe karakterler bozulmuyor
- [ ] Filtreler ve arama Türkçe karakterde doğru çalışıyor ("uskudar" → "Üsküdar")
- [ ] `npm run test` yeşil · `npm run lint` 0 problem ·
      `npx tsc -p tsconfig.app.json --noEmit` 0 hata
- [ ] `npm run check:migrations` sapma yok, migration dosyası `applied/` altında
      (parent dizinde **bırakılmaz** — CLAUDE.md uyarısı)
- [ ] `npm run ingest:tools:check` temiz
