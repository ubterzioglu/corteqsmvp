# Site Geneli AI Bot — MVP Planı (sadeleştirilmiş)

**Tarih:** 21 Eylül 2026 (20 Eylül planının yerini alır)
**Kapsam:** Minimum içerikle çalışan bir bot. Genişletme ayrı dosyada:
`docs/kalanlar/2026-09-21-site-geneli-ai-bot-kalan-isler.md`

> **Karar (21 Eylül):** bot önce **minimum içerikle** yayına alınır, eklemeler sonra
> yapılır. Bu dosya yalnız o minimumu tarif eder. Çıkarılan her madde kaybedilmedi —
> kalan işler dosyasında gerekçesiyle duruyor.

---

## 0. Ölçülen başlangıç durumu

Canlı veritabanında ölçüldü (pooler üzerinden `psql`, 21 Eylül 2026). **Ezberleme,
değiştirmeden önce yeniden ölç.**

| Ölçüm | Değer |
|---|---|
| `catalog_search_documents` | **647** satır |
| Bunlardan `embedding is not null` | **0** |
| `blog_posts` | **50** |
| `ai_*` ile başlayan tablo | **0** (yoktu) |
| `vector` eklentisi | 0.8.0 kurulu |
| `GEMINI_API_KEY` (edge fonksiyon ortamı) | tanımlı (`find-matches` kullanıyor) |

Bugünkü "bot" yanılgısı: `src/components/chat/ChatBot.tsx` kendini *"CorteQS bilgi
asistanıyım"* diye tanıtır ama `askRag` → `/api/chat` → **`rag.corteqs.net`**, bu repoda
OLMAYAN harici servis. Tek soruluk, geçmiş tutmaz, sistem promptu alanı yok.

---

## 1. MVP'nin sınırı

**Bot yalnız iki kaynağı bilir:**

| Kaynak | Adet | Neye cevap verir |
|---|---|---|
| Katalog | 647 | "Dortmund'da Türkçe bilen doktor var mı?" |
| Blog | 50 | "Almanya'da oturum izni nasıl alınır?" |

**Erişim:** yalnız giriş yapmış üye. `relocation-assistant` bugün böyle çalışıyor
(Bearer token zorunlu, anonim 401); para harcayan bir uç noktayı ziyaretçiye açmamak
için aynı sözleşme korunur.

---

## 2. Beş adım

### Adım 1 — Tablo ve kuyruk
`ai_knowledge_documents` + 6 RPC (upsert · prune · kuyruk · embedding yaz · hata işaretle · ara).
Migration: `20260921100000_ai_knowledge_base.sql`.

**Çıkış:** tablo canlıda, RPC'ler `service_role`'a grant'lı.

### Adım 2 — İçe aktarma
`scripts/ai-knowledge/ingest.mjs` + iki kaynak modülü (katalog, blog).
İdempotent: içerik değişmediyse embedding korunur, yeniden ücretlendirme olmaz.

**Çıkış:** korpus tabloda, tekrarlanabilir, hata raporu okunabilir.

### Adım 3 — Embedding üretimi
`scripts/ai-knowledge/embed.mjs` — Gemini `gemini-embedding-001`,
`outputDimensionality: 1536`.

**Çıkış:** `embedding is null` sayısı 0, Türkçe örnek sorgular anlamlı sonuç veriyor.

### Adım 4 — Bot fonksiyonu
`supabase/functions/site-assistant/` — `relocation-assistant`'ın güvenlik deseni
kopyalanır, üzerine RAG getirme eklenir.

**Çıkış:** fonksiyon canlıda, duman testi geçiyor.

### Adım 5 — ChatBot bağlantısı
`ChatBot.tsx` yeni fonksiyona bağlanır, çok turlu olur, `hasContext` kusuru düzeltilir.

**Çıkış:** ana sayfadaki bot gerçekten site verisiyle konuşuyor.

---

## 3. Bilinçli olarak YAPILMAYANLAR

Bunlar eksik değil, **ertelenmiş karardır**. Gerekçeleri kalan işler dosyasında.

1. **`docs/` korpusu (436 dosya) girmez.** İçeriğin ~%88'i iç belgedir (plan, arşiv,
   devir notu, operasyon runbook'u); üyenin sorduğu soruya cevap vermez.
2. **`catalog_search_documents.embedding` boş kalır.** Katalog metni yeni tabloya
   alınır; o sütunun asıl amacı semantik DİZİN araması, ayrı bir iş.
3. **`relocation-assistant`'a dokunulmaz.** Canlı ve çalışıyor; `_shared/` ayıklaması
   kullanıcıya sıfır değer, gerçek regresyon riski.
4. **`/api/chat` sökülmez.** `ChatBot.tsx` çağırmayı bırakır, yeter. Proxy'yi
   `nginx.conf.template` ve `server.mjs`'ten çıkarmak "Değişmez sözleşmeler" alanı.

---

## 4. Mimari kararlar ve tuzaklar

### 4.1 Neden yeni bir tablo — `catalog_search_documents` kullanılamaz
`catalog_search_documents.item_id` → `catalog_items(id)` üzerine **zorunlu FK**dir
(`on delete cascade`). Blog yazısı bir `catalog_items` satırı DEĞİLDİR, dolayısıyla o
tabloya **yazılamaz**. 20 Eylül planı bunu varsayıyordu; ölçülünce çürüdü.

### 4.2 Boyut 1536 zorunludur
`catalog_search_documents.embedding` zaten `vector(1536)` (migration `20260604110000`).
İki yüzeyin ileride aynı vektör uzayında buluşabilmesi için yeni tablo da 1536'dır.
Gemini `gemini-embedding-001` bunu `outputDimensionality: 1536` ile üretir — varsayılanı
3072'dir, **parametre verilmezse boyut tutmaz ve yazma anında patlar.**

### 4.3 HNSW, ivfflat DEĞİL
ivfflat küme merkezlerini **var olan satırlardan** öğrenir. Boş tabloda kurulursa
merkezler anlamsız kalır ve tablo dolduktan sonra YENİDEN KURULMADIKÇA isabet düşük
olur — üstelik hiçbir hata vermeden. `catalog_search_documents` üzerindeki mevcut
ivfflat indeksi (lists=100) tam olarak bu durumda: 0 satır üzerinde kurulmuş.
HNSW eğitim verisi istemez.

### 4.4 `audience` sütunu şimdiden var, bilinçli
MVP'de her satır `public` ya da `member`. Sütun şimdi konuldu ki `docs/` korpusu
eklendiğinde **şema değişikliği gerekmesin** — o iş tek modül + tek ingest çalıştırması
olsun.

### 4.5 İçerik değişmediyse embedding korunur
`ai_knowledge_upsert_document` `md5(content)` karşılaştırır. Bu olmadan her ingest
çalışması bütün korpusu yeniden ücretlendirirdi.

### 4.6 `prune` boş listeyi reddeder
Kaynak okunamadığında boş kimlik listesi gelirse bütün kaynağı silmek yerine **hata
verir**. Veri kaybı ile ingest hatasını ayırt eden tek fren budur.

### 4.7 Korpus filtresi dizinin filtresini AYNEN yansıtmak zorunda
Uygulama sırasında ölçülen üç kusur — üçü de "çalışıyor gibi görünüp yanlış cevap
veren" sınıftan:

1. **`[PLACEHOLDER]` kayıtları (76 / 249, %31).** Semantik arama bunları
   gerçeklerden **daha iyi** eşleştiriyordu çünkü başlıkları kategorinin tam adı:
   "şehir elçisi kim?" sorgusunun en iyi eşleşmesi 0.202 ile
   `[PLACEHOLDER] Şehir Elçisi` idi. Bot sahte bir kişiyi gerçekmiş gibi önerirdi.
   `isPlaceholderTitle()` ile elenir.
2. **B20 sızması — 5 kayıt.** Yalnız `status` + `visibility` ile filtrelendiğinde
   `roles.is_directory_visible=false` olan kayıtlar korpusa giriyordu: **2 Süper
   Admin + 3 Experimental test hesabı**. Dizin bunları gizlerken bot servis
   edecekti. `catalog_search_documents` rol bilgisi TAŞIMAZ; `catalog_items` +
   `roles` ayrıca okunup birleştirilir.
3. **Rol etiketi korpusta hiç yoktu.** `search_text` rol etiketini içermez, bu
   yüzden "şehir elçisi kim?" sorgusu o ifadeyi taşıyan tek bir kayıt bulamıyordu
   (en iyi eşleşme 0.391 ile alakasız bir kişi). Rol etiketi kullanıcıların
   aradığı ASIL kelimedir; metne `Rol: <etiket>` olarak eklenir. Düzeltme sonrası
   aynı sorgu **gerçek** Şehir Elçilerini 0.215 mesafeyle getiriyor.

**Kural:** korpusa yeni bir kaynak eklerken "bu kayıt ilgili sayfada görünüyor mu"
sorusunu filtreye birebir çevir. Bot, kendi arayüzünden daha cömert olmamalıdır.

### 4.8 Alaka eşiği 0.35 — tahmin değil, ölçüm
İlk sürümde 0.65'ti ve alakasız sorgulara da bağlam veriyordu, yani `hasContext`
pratikte hep `true` oluyordu — düzeltmeye çalıştığımız kusurun aynısı.
Ölçülen dağılım (340 parçalık canlı korpus): doğru eşleşmeler **0.20–0.32**,
gürültü **0.36+**. "muz fiyatları nasıl hesaplanır" 0.384 ile sonuç döndürüyordu;
0.35 ile artık hiç dönmüyor. **Eşiği gevşetmeden önce yeniden ölç.**

### 4.9 Canlı sunucu 1 GB RAM altında
İçe aktarma ve embedding yazımı **sayfalanarak** yapılır. `geo_cities` (76.990 satır)
üzerinde satır-başına fonksiyon çalıştıran sorgu YAZMA — 5 Ağustos'ta site 50 dakika
bu yüzden düştü.

---

## 5. Doğrulama

```bash
npx tsc -p tsconfig.app.json --noEmit     # 0 hata
npm run lint                               # 0 problem
npm run test                               # yeşil
npm run ingest:tools:check                 # src/lib/** altına dosya eklenirse ZORUNLU
```

⚠️ `ingest:tools:check` ne lint ne test tarafından çağrılır; `prelint` yalnız
`check:drift` çalıştırır. `src/lib/**` altına dosya ekleyen her değişiklik ajan araç
kataloğunu bayatlatır.

Canlı doğrulama:
```sql
select source_key, count(*), count(embedding) from ai_knowledge_documents group by 1;
```
