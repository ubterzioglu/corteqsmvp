# Site Geneli AI Bot — Kalan İşler (MVP sonrası)

**Tarih:** 21 Eylül 2026
**Ön koşul:** `docs/plans/2026-09-20-site-geneli-ai-bot-plani.md` (MVP) tamamlanmış olmalı.

> Bu dosya MVP'den **bilinçle çıkarılan** işleri tutar. Hiçbiri unutulmadı; her biri
> "şimdi değil" kararıdır ve gerekçesi aşağıda yazılıdır. Sıra bağlayıcı değil —
> maddeler birbirinden büyük ölçüde bağımsız.

---

## K1 — `docs/` korpusunu bota ver (436 dosya)

**Neden ertelendi:** ölçüldüğünde 436 `.md` dosyasının yalnız ~52'si kamuya açık
içerikti (`docs/exports/blog-md/`, blog'un üretilmiş kopyası). Kalanı iç belge:
`plans` 58 · `reference-clones` 56 · `archive` 49 · `history` 36 · `superpowers` 30 ·
`operations` 15 · `handover` 10 · `database-audit` 3. Üyenin sorduğu soruya cevap
vermez; **sahibine** kendi proje geçmişini sorgulatmak için değerlidir.

**Şema değişikliği gerekmez** — `ai_knowledge_documents.audience` sütunu MVP'de
bilerek kondu.

### Yapılacaklar
1. `scripts/ai-knowledge/sources/docs.mjs` — `docs/**` gezintisi.
2. Kitle sınıflandırması: `docs/guides/` → `member`, **kalan her şey → `admin`**.
   Varsayılan `admin` olmalı; yeni bir klasör eklendiğinde sessizce üyeye açılmasın.
3. `docs/exports/blog-md/` **atlanır** — `blog` kaynağının birebir kopyasıdır, iki kez
   indekslemek hem maliyet hem de getirmede çift sonuç demektir.
4. HTML çıkarıcı: `docs/guides/` altında 6 `.html` dosya var (yetkilendirme, kategori-rol,
   claim sistemi rehberleri). `scripts/ai-knowledge/text-extract.mjs` içindeki
   `htmlToPlainText` bu iş için yazıldı, MVP'de kullanılmıyor.
5. `site-assistant` içinde kitle çözümü: `is_admin()` → `['public','member','admin']`,
   aksi halde `['public','member']`.

**⚠️ Tuzak:** kitle filtresi **RPC içinde** uygulanır, istemciden gelen parametreye
güvenilmez. `ai_knowledge_search` `service_role` dışına grant'lı DEĞİLDİR; fonksiyon
kullanıcının rolünü kendi doğrular.

**Doğrulama:** sıradan üye hesabıyla "relocation modülü planı neydi?" sorulduğunda
bot bilmemeli; admin hesabıyla bilmeli.

---

## K2 — Semantik dizin araması (`search_directory_catalog`)

**Neden ertelendi:** bu bot işi değil, **arama** işi. Ayrı bir ürün yüzeyi.

`catalog_search_documents.embedding` MVP sonunda hâlâ **boş**. Katalog metni
`ai_knowledge_documents`'a alındı; o sütunun asıl amacı `/directory` aramasını semantik
hale getirmekti.

### Yapılacaklar
1. `catalog_pending_embeddings` benzeri bir kuyruk + `set_catalog_search_embedding`
   (RPC zaten var, `20260604110000`) ile 647 satırı doldur.
2. **⚠️ ivfflat indeksini YENİDEN KUR.** Mevcut indeks 0 satır üzerinde kurulmuş;
   doldurduktan sonra `reindex` edilmezse isabet sessizce düşük kalır. Alternatif:
   HNSW'ye geçir (`ai_knowledge_documents` öyle yapıldı).
3. `search_directory_catalog`'u `catalog_search_documents` üzerine al:
   `catalog_search_normalize()` (= `lower(unaccent(...))`) ile Türkçe fold, katı AND
   yerine sıralamalı eşleşme.

**⚠️ `search_directory_catalog` canlıda `pg_get_functiondef` ile yamanmış durumda**
(migration `20260730220000`). Gövdeyi yeniden yazarken **B20 koşulunun kaybolmadığını
doğrula**, yoksa yönetici hesapları dizine geri sızar.

**Ön koşul (ürün kararı, kod değil):** dizini ziyaretçiye açmak isteniyorsa RPC'nin
`42501` koşulu gevşetilip `anon`'a sınırlı bir sürüm verilmelidir.

---

## K3 — Edge function ortak kodunun ayıklanması (`_shared/`)

**Neden ertelendi:** `relocation-assistant` canlı ve çalışıyor. Onu refactor etmek
kullanıcıya **sıfır değer**, gerçek regresyon riski. MVP'de ~80 satır güvenlik kodu
`site-assistant`'a kopyalandı; bu bilinçli bir kopyadır.

### Yapılacaklar
1. `supabase/functions/_shared/` altına taşı: CORS/origin allowlist, `edge_rate_limits`
   penceresi, gövde sınırı okuyucusu, `providers.ts`.
2. İki fonksiyonu da oraya bağla.
3. Testler: `supabase/functions/_shared/**/*.test.ts` **vitest kapsamında zaten var**
   (Deno API'si kullanmayan saf modüller Node/jsdom altında koşar).

**⚠️ Rate limit penceresi METİNLE karşılaştırılmaz.** `window_started_at` bir
`timestamptz`; PostgREST `2026-09-20T10:00:00+00:00`, `Date.toISOString()` ise
`...000Z` üretir. İki metin asla eşleşmezse her istek "yeni pencere" sayılır, sayaç
her seferinde 1'e döner ve **sınır hiçbir hata vermeden tamamen ölür**. İki taraf da
epoch'a çevrilip sayı olarak karşılaştırılmalıdır. (Bu ders `relocation-assistant`
içinde yorumla belgelenmiştir — taşırken kaybetme.)

---

## K4 — `/api/chat` ve `rag.corteqs.net` sökümü

**Neden ertelendi:** MVP'de `ChatBot.tsx` onu çağırmayı bırakır; proxy yerinde durur.
Çıkarmak **"Değişmez sözleşmeler"** alanına girer.

### Yapılacaklar
1. `src/lib/ragApi.ts` sil (MVP sonrası 0 importer kalmalı — önce ölç).
2. `nginx.conf.template`: `/api/chat` location'ı + rate limit zone'u kaldır.
   **⚠️ `add_header` KALITILMAZ** — o location'ın güvenlik başlıkları da onunla gider,
   başka location'ları bozmadığını doğrula.
3. `server.mjs`: `/api/chat` proxy'si + `RAG_API_SECRET` kullanımı kaldır.
4. `.env.local` / Coolify env: `RAG_API_SECRET` temizliği.
5. `docs/` ve `CLAUDE.md` içindeki `rag.corteqs.net` atıflarını güncelle.

**⚠️ Deploy sonrası `curl -I https://corteqs.net/` ile güvenlik başlıklarının hâlâ
geldiğini doğrula.** `src/lib/redirects.test.ts` yalnız template METNİNİ denetler,
çalışan nginx'i değil.

---

## K5 — Panel içi yardım altyapısı

**Neden ertelendi:** bota bağlı değil, ayrı bir UI işi.

20 Eylül ölçümü: `HelpTooltip` / `InfoTooltip` / HelpCenter araması **0 dosya** döndü.
Panel içi "i" ipuçları ve kılavuz altyapısı **sıfırdan** kurulacak.

Bot hazır olduğunda doğal bağlantı: ipucu kutusundan "bunu asistana sor" düğmesi.

---

## K6 — Diğer veri kaynakları

Bugün aramada ve botta **hiç olmayanlar:** etkinlikler, kaynaklar/rehberler, Cadde
gönderileri, anketler, şehir elçileri, işletmeler, konsolosluklar, `/tools` araçları,
relocation maliyet/belge tabloları (21 Eylül'de 192 maliyet + 204 belge canlıya girdi).

**İyi haber:** `catalog_sync_event` / `catalog_sync_job_listing` /
`catalog_sync_turkish_mission` / `catalog_sync_whatsapp_landing` /
`catalog_sync_independent_profile` köprüleri **zaten var**. Farklı kaynakları tek
kataloğa toplama mekanizması kurulu — tekerleği yeniden icat etme.

**Yeni kaynak eklemenin maliyeti:** `scripts/ai-knowledge/sources/` altına bir modül
+ `sources.mjs` kayıt defterine bir satır. Şema değişmez, ingest komutu aynı kalır.

---

## K7 — Taşınabilirlik

Supabase'den çıkış geçişi planlanıyor (`docs/plans/` + oturum notları).
`pgvector` standart bir Postgres eklentisi olduğu için OSS Postgres'e taşınır —
engel değil.

**Ama:** RAG'ı Supabase Edge Function'a gömdük. O katman taşınmak zorunda kalacak.
`site-assistant` bilinçli olarak ince tutuldu (getirme + model çağrısı); ağır iş
SQL tarafında. Taşıma maliyeti bu yüzden düşük, sıfır değil.

İlgili: `docs/plans/2026-09-20-supabase-exit-plan.md` (varsa) ve oturum notları.

---

## K8 — Maliyet ve kota izleme

**Neden ertelendi:** MVP'de kullanım fonksiyon loglarından okunuyor.

`relocation_cost_ledger` **kullanılamaz** — `job_id`'si `relocation_jobs`'a zorunlu FK,
o tablo ingestion hattına ait. Sohbet maliyeti oraya yazılamaz.

### Yapılacaklar
1. Kalıcı bir kullanım tablosu (`ai_assistant_usage`: kullanıcı, fonksiyon, token, tarih).
2. `/admin/agent-analytics` sayfasına bağla.
3. Gemini kota eşiği aşıldığında uyarı.

**Not:** Google AI Studio anahtarları, projeye faturalandırma BAĞLANMADIKÇA ücretsiz
katmanda çalışır. "Gemini = ücretli" varsayımı yanlıştır; sınır para değil **kotadır**.
Aşım 429 olarak görünür.
