# Arama + Site Geneli AI Bot — Denetim Bulguları ve Uygulama Planı

**Tarih:** 20 Eylül 2026
**Kapsam:** Ana sayfa aramasının boş dönmesi + site içi veri & Claude/Gemini hibrit AI bot
**Durum:** Faz 1 UYGULANDI (bu commit) · Faz 2–5 planlandı, başlanmadı

> Bütün rakamlar canlı veritabanında **ölçülmüştür** (pooler üzerinden `psql`,
> 20 Eylül 2026). Ezberleme — değiştirmeden önce yeniden ölç. Bu dosyadaki
> sorguların tamamı hafiftir; CLAUDE.md'deki "1 GB RAM" uyarısına uygun olarak
> `geo_cities` (76.990 satır) üzerinde satır-başına fonksiyon çalıştıran hiçbir
> sorgu kullanılmamıştır.

---

## 1. Ölçülen değerler

### 1.1 Dizin verisi

| Ölçüm | Değer | Sorgu kaynağı |
|---|---|---|
| `catalog_items` toplam | 645 | `count(*)` |
| `status='published'` | 282 | |
| **Dizinde görünür** (`published` + `visibility in (public,unlisted)`) | **248** | RPC Branch 1 filtresiyle birebir |
| Bunlardan **şehri dolu** olan | **21** | `catalog_item_locations` primary |
| **Berlin**'de kayıt | **0** | en çok: Dortmund 11, "Genel" 10 |
| `individual_profile_details` `visibility_status='open'` | **1** | RPC Branch 2'nin tüm evreni |
| `roles` aktif + dizinde görünür | 68 | |
| `blog_posts` | 50 | aramada YOK |
| `events` | 0 | aramada YOK |

### 1.2 Ana sayfa örneklerinin gerçek sonuçları (düzeltme ÖNCESİ)

Placeholder listesi (`EXAMPLE_QUERIES`) — altı örneğin **altısı da 0**:

| Örnek | Sonuç | Neden |
|---|---|---|
| Berlin'de yazılımcı | **0** | `Berlin'de` hiçbir alanda öyle yazmaz + `yazılımcı` 0 |
| Londra'da avukat | **0** | aynı ek tuzağı + `avukat` 0 |
| Dubai'de doktor | **0** | ek tuzağı (`doktor` tek başına 11 verirdi) |
| Toronto'da girişimci | **0** | |
| Paris'te tasarımcı | **0** | |
| Münih'te mühendis | **0** | |

Hızlı çipler (`QUICK_CHIPS`) — beş çipin **dördü 0**:

| Çip | Sonuç |
|---|---|
| yazılımcı | **0** |
| avukat | **0** |
| doktor | 11 |
| girişimci | **0** |
| akademisyen | **0** |

### 1.3 Gerçekten sonuç veren aramalar (düzeltme SONRASI kullanılanlar)

| Arama | Sonuç |
|---|---|
| Dortmund doktor (iki kelime, AND) | **10** |
| Doktor | 11 |
| Danışman | 22 |
| Şehir Elçisi (iki kelime, AND) | 10 |
| Topluluk | 12 |
| Dernek | 4 |
| Eczane | 2 |
| Psikolog | 2 |

Rol etiketi dağılımı (dizinde görünür 248 kayıt):
Diaspora Üyesi 127 · Doktor 11 · Dijital Topluluk 11 · Pratik Hayat Danışmanı 10 ·
Şehir Elçisi 10 · Dernek/Vakıf 4 · Marka & Patent Danışmanı 2 · Eczane 2 · kalanı tekil.

### 1.4 `/landingtrial` (eski ana sayfa, `Index.tsx`) çipleri

| Çip | Sonuç |
|---|---|
| Konsolosluk | 1 |
| Vize & Göçmenlik (`Vize danışmanı`) | 1 |
| İş İlanları | **0** |
| Şehir Elçine Ulaş (`role=User_CityAmbassador`) | 10 |

> Bu sayfaya bu fazda **dokunulmadı** — ürün kararı gerektiriyor (bkz. §4).

### 1.5 AI bot altyapısı — canlıda hazır olanlar

| Varlık | Durum |
|---|---|
| `vector` eklentisi | **0.8.0 kurulu** |
| `pg_trgm` | **1.6 kurulu** |
| `unaccent` | **1.1 kurulu** |
| `catalog_search_documents` | **645 satır dolu**, `search_vector` + 8 indeks |
| `catalog_search_documents.embedding vector(1536)` | kolon + ivfflat indeks VAR, **dolu satır 0** |
| `set_catalog_search_embedding` RPC | var, `service_role`'a grant'lı |
| `catalog_search_normalize()` | `lower(unaccent(...))` — Türkçe fold için hazır |
| `GEMINI_API_KEY` (edge fonksiyon ortamı) | tanımlı (`find-matches` kullanıyor) |
| Bota verilecek içerik | 418 `.md` doküman + 50 blog yazısı |

**Kritik tespit:** `search_directory_catalog` bu altyapının **hiçbirini kullanmıyor**;
ham `ilike` ile `catalog_items` üzerinde çalışıyor. Semantik arama iskeleti kurulmuş,
fişi takılmamış.

### 1.6 Mevcut "bot" yanılgısı

`src/components/chat/ChatBot.tsx` kendini *"CorteQS bilgi asistanıyım"* diye tanıtır,
ama `askRag` → `/api/chat` → **`rag.corteqs.net`**: bu repoda OLMAYAN harici servis.
Tek soruluk, sohbet geçmişi tutmaz, sistem promptu alanı yok.

Aynı gün açılan `supabase/functions/relocation-assistant/index.ts` (henüz commit'siz)
doğru şablonu kurmuş: Gemini 2.5 Flash, çok turlu, bağlam enjeksiyonlu, origin
allowlist + `edge_rate_limits` + 32 KB gövde sınırı. Bağlam kurucusu
`src/lib/relocation-chat-context.ts` PII göndermeme ilkesini de tanımlamış.

---

## 2. Aramanın boş dönmesinin dört kök nedeni

Her biri **tek başına** aramayı sıfırlamaya yeter. Dördü birden açıktı.

1. **Ziyaretçi için `/directory` hiç sorgu atmaz.**
   `src/pages/DirectoryPage.tsx` → `if (isAuthLoading || !user) { setRows([]); return; }`
   Ana sayfa hero'su (`DiasporaSearchSection`) login kontrolü yapmadan
   `/directory?q=`'ya yolluyordu. Eski bileşen (`DiasporaSearchBar`) doğru davranıyordu —
   **iki bileşen iki farklı sözleşmedeydi.**
   ⚠️ Rotalar takas edilmiş durumda: `/` → `LandingTrialPage` (yeni hero),
   `/landingtrial` → `Index` (eski hero).

2. **RPC anonim çağrıda hata fırlatır.**
   `raise exception 'authentication required' using errcode = '42501'`,
   `grant execute ... to authenticated` (yalnız).

3. **Çok kelimeli AND + ham `ilike` + Türkçe fold yok.**
   Arama boşluktan bölünür, **her** kelime en az bir alanda geçmek zorundadır.
   `"Berlin'de yazılımcı"` → `Berlin'de` + `yazılımcı`. Birincisi hiçbir yerde
   öyle yazmaz → garantili 0. Ayrıca `yazilimci` ≠ `yazılımcı`
   (CLAUDE.md'deki `trIncludes` kuralı SQL tarafında uygulanmamış).

4. **Veri yok.** 248 kaydın 227'sinde şehir boş, Berlin'de kayıt yok, açık bireysel
   profil sayısı 1. Sistem kusursuz çalışsa bile "Berlin'de yazılımcı" 0 dönerdi.

**Ek kusur:** `getTotalDirectoryCount()` filtresiz sayıyordu → ana sayfa
"645+ kayıtlı profil" derken dizinde en fazla 249 kayıt görünüyordu.

---

## 3. Faz 1 — UYGULANDI (bu commit)

Amaç: "boş dönüyor" şikayetinin **görünen yüzünü** bugün kapatmak. Veri ve RPC
işlerine dokunulmadı.

| # | Değişiklik | Dosya |
|---|---|---|
| 1.1 | Ziyaretçi artık `/login?next=`'e yönlendiriliyor, arama `next` içinde korunuyor | `src/components/home-trial/DiasporaSearchSection.tsx` |
| 1.2 | Ziyaretçiye giriş gerektiği **aramadan önce** söyleniyor (`Info` ipucu) | aynı |
| 1.3 | Placeholder örnekleri ek'siz + canlıda ölçülmüş değerlerle değiştirildi | aynı |
| 1.4 | Hızlı çipler gerçekten sonuç veren kategorilere çevrildi | aynı |
| 1.5 | Sayaç `published` + `public/unlisted` ile filtrelendi; etiket "dizinde görünen kayıt" oldu | `src/lib/catalog-directory.ts` |
| 1.6 | 7 sözleşme testi eklendi | `src/components/home-trial/DiasporaSearchSection.test.tsx` |

**Testlerden biri kaynak metni denetler:** örnek listelerine apostrof/ek girerse test
düşer. Bu kusur çalışma zamanında hiçbir hata vermez, bu yüzden metinden yakalanır.

### Faz 1'in yapmadıkları (bilinçli)
- RPC'ye dokunulmadı — Türkçe fold ve AND semantiği hâlâ eski.
- Veri boşluğu kapatılmadı — 227 kayıtta şehir hâlâ yok.
- `/landingtrial` (eski `Index`) çipleri düzeltilmedi ("İş İlanları" hâlâ 0 döner) —
  bu bir ürün kararı: katalogda iş ilanı verisi yok, çipi kaldırmak mı yoksa
  veriyi mi eklemek gerektiği sahibinin kararı.
- Sayaç `roles.is_directory_visible` ve yönetici elemesini içermiyor; gerçek sonuç
  bu sayıdan **biraz düşük** olabilir. Fazla göstermek az göstermekten zararlı
  olduğu için yukarı değil aşağı yuvarlanıyor.

---

## 4. Faz 2 — Aramayı hazır altyapıya taşı (sıradaki iş)

`search_directory_catalog`'u `catalog_search_documents` üzerine al:

1. `catalog_search_normalize()` (= `lower(unaccent(...))`) ile hem sorguyu hem
   belgeyi katla → `yazilimci` ↔ `yazılımcı` sorunu kökten biter.
2. Katı AND yerine **sıralamalı eşleşme**: tüm kelimeler eşleşirse en üstte,
   kısmi eşleşme altta. Ek/apostrof tuzağı böylece ölümcül olmaktan çıkar
   (trigram `similarity()` zaten indeksli).
3. `is_directory_visible` + yönetici elemesi korunur (B20 koşulu — silme).
4. Sayaç fonksiyonu RPC ile aynı filtreyi paylaşacak şekilde tek kaynağa alınır.

⚠️ `search_directory_catalog` canlıda **`pg_get_functiondef` ile yamanmış** durumda
(migration `20260730220000`). Gövdeyi yeniden yazarken B20 koşulunun kaybolmadığını
doğrula, yoksa yönetici hesapları dizine geri sızar.

**Anonim erişim kararı:** dizini ziyaretçiye açmak isteniyorsa RPC'nin
`42501` koşulu gevşetilip `anon`'a sınırlı bir sürüm (ör. iletişim bilgisi olmadan,
sayfalanmış) verilmelidir. Bu bir ürün/gizlilik kararıdır — Faz 2'nin kod işi değil,
ön koşulu.

## 5. Faz 3 — Veri boşluğunu kapat

Kod işi değil, içerik işi. 248 kaydın 227'sinde şehir yok. Arama ne kadar iyi
olursa olsun bu doldurulmadan sonuç gelmez. Öncelik: şehir + kategori alanları.

## 6. Faz 4 — Kapsamı genişlet ("tüm site verisi")

Bugün arama yalnız `catalog_items` + açık bireysel profilleri tarıyor.
Aramada **hiç olmayanlar**: blog (50), etkinlikler, kaynaklar/rehberler, Cadde
gönderileri, anketler, şehir elçileri, işletmeler, konsolosluklar, `/tools` araçları.

İyi haber: `catalog_sync_event` / `catalog_sync_job_listing` /
`catalog_sync_turkish_mission` / `catalog_sync_whatsapp_landing` /
`catalog_sync_independent_profile` köprüleri **zaten var** — farklı kaynakları tek
kataloğa toplama mekanizması kurulu. Tekerleği yeniden icat etmeye gerek yok.

## 7. Faz 5 — AI bot (site içi veri + model hibrit)

Faz 2 ve 4'ün üstüne kurulur; aynı `catalog_search_documents` tablosunu paylaşır.

1. `embedding` kolonunu doldur (bugün 0 satır). Kaynak: katalog + 418 doküman + 50 blog.
2. `relocation-assistant` fonksiyonunu **genelleştir** — site geneli asistan olsun.
   Güvenlik deseni (origin allowlist, `edge_rate_limits`, gövde sınırı, PII göndermeme)
   aynen korunur.
3. `ChatBot.tsx`'i bu yeni fonksiyona bağla; `rag.corteqs.net` bağımlılığını kaldır.
   **Bugünkü hâli yanıltıcı:** kendini bilgi asistanı ilan ediyor ama repoda olmayan,
   bakımı belirsiz bir servise gidiyor.
4. Panel içi eğitim: "i" ipuçları ve kılavuz altyapısı **sıfırdan** kurulacak —
   `HelpTooltip` / `InfoTooltip` / HelpCenter araması 0 dosya döndü.

### Taşınabilirlik uyarısı
Supabase'den çıkış geçişi planlanıyor (bkz. `docs/plans/` ve oturum notları).
`pgvector` standart bir Postgres eklentisi olduğu için OSS Postgres'e taşınır —
engel değil. Ancak RAG'ı Supabase Edge Function'a gömersen **o katman taşınmak
zorunda kalır**. Bot'u taşınabilir bir servis olarak kurgula.

---

## 8. Doğrulama (Faz 1)

```bash
npm run test -- src/components/home-trial/DiasporaSearchSection.test.tsx \
                src/components/DiasporaSearchBar.test.tsx \
                src/lib/catalog-directory.test.ts
npx tsc -p tsconfig.app.json --noEmit
npm run lint
```

Faz 1 sonucu: **3 dosya / 17 test yeşil.**

⚠️ Bu değişiklik `src/lib/**` altına yeni dosya EKLEMEDİĞİ için
`npm run ingest:tools:check` gerekmez; ileride Faz 2–5'te yeni `*-api.ts`
eklenirse o kontrol zorunludur (ne lint ne test yakalar).
