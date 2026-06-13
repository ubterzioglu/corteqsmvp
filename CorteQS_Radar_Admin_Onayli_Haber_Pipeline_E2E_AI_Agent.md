# CorteQS Radar — Admin Onaylı Günlük Haber Pipeline
## AI Agent İçin Uçtan Uca Uygulama Dokümanı

**Doküman sürümü:** 1.0  
**Tarih:** 13 Haziran 2026  
**Hedef:** Ücretsiz kaynaklardan günde bir kez haber keşfi yapmak, aday haberleri otomatik olarak bir moderasyon kuyruğuna almak ve yalnızca admin onayından sonra CorteQS Radar sisteminde yayınlamak.

---

# 1. Yönetici Özeti

CorteQS içinde Radar altyapısının önemli parçaları zaten bulunmaktadır. Mevcut yapı tamamen kaldırılmamalı veya yeniden yazılmamalıdır. Yeni pipeline, mevcut sistemin önüne kontrollü bir **haber toplama ve moderasyon katmanı** eklemelidir.

İlk üretim sürümünde önerilen kaynak yaklaşımı:

1. **Birinci öncelik:** Kullanımı doğrulanmış doğrudan RSS / Atom akışları.
2. **İkinci öncelik:** GDELT DOC 2.0 API ile açık veri tabanlı haber keşfi.
3. **Opsiyonel ve varsayılan kapalı:** Ücretsiz haber API servisleri. Kullanım koşulları ayrıca doğrulanmadan production bağımlılığı yapılmamalıdır.
4. **Kesin kural:** Hiçbir haber otomatik yayınlanmayacaktır. Her haber önce admin moderasyon ekranına düşecektir.

MVP akışı:

```text
Günlük Cron
   ↓
radar-news-scan Edge Function
   ↓
RSS / Atom / GDELT adaptörleri
   ↓
Normalize et → Güvenlik filtresi → Relevance score → Duplicate kontrolü
   ↓
public.radar_news_candidates
   ↓
Admin Moderasyon Kuyruğu
   ↓
Admin: Onayla ve Yayınla
   ↓
public.news_posts
   ↓
Mevcut importNewsPostToMarquee(...)
   ↓
public.marquee_items
   ↓
CorteQS Radar public sayfası + hero altındaki Radar bandı
```

Bu yaklaşım mevcut kodu korur, geri alınabilir ilerler ve otomatik haber yayınlama riskini engeller.

---

# 2. Mevcut CorteQS Radar Yapısının Analizi

Uygulamaya başlamadan önce aşağıdaki mevcut dosyalar okunmalıdır:

```text
docs/modules/marquee/marquee-haber-akisi.md
src/lib/marquee.ts
src/pages/admin/AdminMarqueePage.tsx
src/pages/RadarPage.tsx
src/components/DiasporaMarqueeSection.tsx
src/components/MarqueeItemCard.tsx
supabase/migrations/20260424110000_add_marquee_items.sql
supabase/migrations/20260502120000_add_news_post_id_to_marquee_items.sql
supabase/migrations/20260506235500_add_external_url_to_marquee_items.sql
src/integrations/supabase/types.ts
CLAUDE.md
AGENT_CONTEXT.md
```

## 2.1. Mevcut public tablo

Mevcut Radar / marquee kayıtları:

```text
public.marquee_items
```

Önemli alanlar:

```text
id
type                 // news | stat | announcement
slug
title
summary
detail_content
image_url
image_alt
metric_value
news_post_id
external_url
link_enabled
sort_order
is_active
published_at
created_at
updated_at
```

## 2.2. Mevcut köprü mantığı

`src/lib/marquee.ts` içinde aşağıdaki akış bulunmaktadır:

```text
listImportableNewsPosts()
importNewsPostToMarquee(newsPostId)
```

`listImportableNewsPosts()` aktif `news_posts` kayıtlarını listeler.  
`importNewsPostToMarquee()` seçilen haber için `marquee_items` tablosunda bir `news` kaydı oluşturur.

Ayrıca `marquee_items.news_post_id` alanı unique constraint ile korunmaktadır. Aynı haberin Radar bandına iki defa aktarılması engellenmektedir.

## 2.3. Mevcut admin akışı

`src/pages/admin/AdminMarqueePage.tsx` içinde:

- Manuel marquee kartı ekleme
- Haber havuzundaki aktif `news_posts` kayıtlarını listeleme
- Haberi Radar bandına aktarma
- Görsel yükleme
- Aktif / pasif yönetimi
- Tip, slug, başlık, özet, tarih ve sıralama yönetimi

bulunmaktadır.

## 2.4. Kritik mimari karar

Yeni pipeline doğrudan `marquee_items` tablosuna yazmamalıdır.

Doğru yaklaşım:

```text
Harici kaynaklar
→ aday haber tablosu
→ admin onayı
→ news_posts
→ mevcut importNewsPostToMarquee()
→ marquee_items
```

Bu sayede:

- Mevcut manuel editoryal süreç korunur.
- Yanlış, ilgisiz veya manipülatif içerik otomatik yayınlanmaz.
- Kaynak ve moderasyon geçmişi saklanır.
- Pipeline kapatılsa bile manuel Radar yönetimi çalışmaya devam eder.

---

# 3. Kapsam

## 3.1. MVP kapsamında yapılacaklar

- Ücretsiz RSS / Atom ve GDELT kaynaklarından günde bir tarama
- Kaynak kayıt tablosu
- Tarama çalışma kayıtları
- Haber aday havuzu
- Exact URL ve hash bazlı duplicate engelleme
- Basit relevance score
- Admin moderasyon kuyruğu
- Admin onayı sonrası `news_posts` kaydı oluşturma
- İstenirse tek tıkla Radar bandına aktarma
- Audit log
- Manuel `Şimdi Tara` butonu
- Hata kayıtları
- Testler
- Teknik dokümantasyon

## 3.2. MVP dışında bırakılacaklar

Aşağıdaki maddeler ikinci faza bırakılmalıdır:

- LLM ile otomatik haber özeti üretme
- Otomatik çeviri
- Otomatik politik tarafsızlık analizi
- Otomatik görsel indirme
- Tam makale metni scraping
- Otomatik yayınlama
- Gerçek zamanlı dakikalık tarama
- Gelişmiş ML öneri motoru
- Kullanıcı bazlı kişiselleştirilmiş haber akışı

---

# 4. İçerik ve Yayın Politikası

## 4.1. Kesin yayın kuralı

Harici kaynaktan gelen hiçbir kayıt doğrudan public görünmemelidir.

Her kayıt ilk etapta:

```text
review_status = 'pending'
```

olarak kaydedilmelidir.

Public yayın yalnızca admin aksiyonu sonrası yapılmalıdır.

## 4.2. Kaydedilecek içerik sınırı

İlk sürümde yalnızca şu alanlar saklanmalıdır:

```text
title
short summary / feed description
original URL
source name
source URL
published date
language
country
city (bulunabiliyorsa)
category
image source URL (yalnızca admin preview için)
keywords
raw source payload
```

Varsayılan olarak saklanmaması gerekenler:

```text
full article body
publisher HTML
publisher image binary
copyrighted long excerpts
tracking parameters
embedded scripts
```

## 4.3. Görsel politikası

Harici haber sitesindeki görsel URL doğrudan public kullanım için varsayılan kabul edilmemelidir.

MVP davranışı:

- Harici görsel yalnızca admin önizleme alanında gösterilebilir.
- Public kartta varsayılan CorteQS Radar placeholder görseli kullanılabilir.
- Admin isterse lisansı uygun veya kendi hazırladığı görseli mevcut `newsimage` bucket alanına yükleyebilir.
- Görsel hotlink kullanımı varsayılan olarak kapalı olmalıdır.
- İleride kaynak bazlı `allow_public_image_hotlink` ayarı eklenebilir.

---

# 5. Kaynak Stratejisi

## 5.1. Kaynak öncelikleri

| Öncelik | Kaynak tipi | Production durumu | Açıklama |
|---|---|---:|---|
| P1 | Doğrudan RSS / Atom | Açık | Kaynak bazında kullanım şartları kontrol edilerek |
| P1 | GDELT DOC 2.0 | Açık | Açık haber keşif katmanı; metadata ve orijinal link kullanımı |
| P2 | Kurumsal / kamu duyuru RSS | Açık | Almanya, AB ve diaspora ile ilgili resmi duyurular |
| P3 | TheNewsAPI | Varsayılan kapalı | Ücretsiz paket mevcut; production ve otomatik erişim şartları yazılı teyit edilmeden açılmamalı |
| P3 | NewsAPI.org | Development only | Ücretsiz plan production için kullanılmamalı |
| P3 | GNews ücretsiz plan | Development only | Ücretsiz plan yalnızca geliştirme / test amaçlı değerlendirilmelidir |
| Kaçınılacak | Google News RSS scraping yaklaşımı | Kapalı | Resmi production bağımlılığı yapılmamalı |
| Kaçınılacak | Site HTML scraping | Kapalı | Açık izin yoksa scraping yapılmamalı |

## 5.2. GDELT ilk entegrasyon örneği

GDELT DOC 2.0 endpoint formatı agent tarafından doğrulanarak kullanılmalıdır:

```text
https://api.gdeltproject.org/api/v2/doc/doc
```

Örnek sorgu:

```text
https://api.gdeltproject.org/api/v2/doc/doc?query=%22Turkish%20diaspora%22&mode=artlist&maxrecords=100&format=json&sort=datedesc&timespan=1d
```

İlk sürümde GDELT yalnızca keşif amaçlı kullanılmalıdır:

- Başlık
- URL
- Domain
- Tarih
- Dil
- Kaynak
- GDELT tarafından sağlanan ek metadata

saklanır.

Tam metin scraping yapılmaz.

## 5.3. Başlangıç keyword kümeleri

Sorgular bir tablo üzerinden yönetilmelidir. Kod içine gömülmemelidir.

### Türkçe

```text
Türk diasporası
yurt dışında yaşayan Türkler
Almanya Türkler
Avrupa Türkler
Türk toplumu Almanya
göçmenlik Almanya
oturum izni Almanya
vatandaşlık Almanya
çifte vatandaşlık
Almanya iş hayatı
Almanya eğitim
Türk girişimciler Avrupa
Türk dernekleri Avrupa
```

### Almanca

```text
türkische Diaspora
Türken in Deutschland
türkische Community
türkische Gemeinde
Einbürgerung Deutschland
doppelte Staatsbürgerschaft
Aufenthaltsrecht
Aufenthaltstitel
Fachkräfteeinwanderung
Integration Deutschland
türkische Unternehmer
```

### İngilizce

```text
Turkish diaspora
Turkish community Germany
Turkish community Europe
Turkish migrants Germany
German citizenship reform
residence permit Germany
Turkish entrepreneurs Europe
Turkish associations Europe
```

## 5.4. CorteQS kategori yapısı

İlk sürüm kategori değerleri:

```text
diaspora
almanya
turkiye
avrupa
dunya
gocmenlik_oturum
vatandaslik
is_kariyer
ekonomi_girisimcilik
egitim
topluluk_etkinlik
yasam
teknoloji
duyuru
diger
```

Bu değerler sonradan admin ekranından yönetilebilir hale getirilebilir. MVP için enum benzeri kontrollü text alan yeterlidir.

---

# 6. Hedef Veritabanı Tasarımı

Yeni tablolar mevcut şemayı bozmadan migration ile eklenmelidir.

## 6.1. `public.radar_news_sources`

Amaç: Tarama yapılacak RSS / API kaynaklarının merkezi yönetimi.

Önerilen migration iskeleti:

```sql
CREATE TABLE IF NOT EXISTS public.radar_news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('rss', 'atom', 'gdelt', 'json_api')),
  adapter_key TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  website_url TEXT,
  language TEXT,
  country TEXT,
  category_default TEXT,
  query_text TEXT,
  trust_level TEXT NOT NULL DEFAULT 'standard'
    CHECK (trust_level IN ('official', 'high', 'standard', 'discovery_only')),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  allow_public_image_hotlink BOOLEAN NOT NULL DEFAULT false,
  terms_checked BOOLEAN NOT NULL DEFAULT false,
  terms_checked_at TIMESTAMPTZ,
  terms_notes TEXT,
  max_items_per_scan INTEGER NOT NULL DEFAULT 100,
  timeout_ms INTEGER NOT NULL DEFAULT 12000,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_success_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Zorunlu iş kuralı

Kaynak yalnızca şu durumda taranmalıdır:

```text
is_enabled = true
AND terms_checked = true
```

GDELT için `terms_checked = true` seed edilebilir. Diğer kaynaklar manuel doğrulanmalıdır.

---

## 6.2. `public.radar_news_scan_runs`

Amaç: Günlük cron veya manuel tarama sonuçlarını izlemek.

```sql
CREATE TABLE IF NOT EXISTS public.radar_news_scan_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('cron', 'manual', 'retry')),
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  started_by UUID,
  source_count INTEGER NOT NULL DEFAULT 0,
  fetched_count INTEGER NOT NULL DEFAULT 0,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  filtered_count INTEGER NOT NULL DEFAULT 0,
  failed_source_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 6.3. `public.radar_news_candidates`

Amaç: Admin onayı bekleyen haber adaylarını saklamak.

```sql
CREATE TABLE IF NOT EXISTS public.radar_news_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.radar_news_sources(id) ON DELETE RESTRICT,
  scan_run_id UUID REFERENCES public.radar_news_scan_runs(id) ON DELETE SET NULL,

  source_external_id TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT,
  original_url TEXT NOT NULL,
  canonical_url TEXT NOT NULL,

  title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  summary TEXT,
  image_source_url TEXT,

  category TEXT,
  language TEXT,
  country TEXT,
  city TEXT,
  published_at TIMESTAMPTZ,

  relevance_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  relevance_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,

  canonical_url_hash TEXT NOT NULL,
  content_hash TEXT NOT NULL,

  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected', 'duplicate', 'archived')),

  approved_news_post_id BIGINT,
  duplicate_of_candidate_id UUID REFERENCES public.radar_news_candidates(id) ON DELETE SET NULL,

  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,

  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

İndeksler:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS radar_news_candidates_canonical_url_hash_idx
  ON public.radar_news_candidates (canonical_url_hash);

CREATE INDEX IF NOT EXISTS radar_news_candidates_review_queue_idx
  ON public.radar_news_candidates (review_status, relevance_score DESC, published_at DESC);

CREATE INDEX IF NOT EXISTS radar_news_candidates_source_idx
  ON public.radar_news_candidates (source_id, published_at DESC);

CREATE INDEX IF NOT EXISTS radar_news_candidates_content_hash_idx
  ON public.radar_news_candidates (content_hash);
```

### Not

İlk sürümde `canonical_url_hash` unique tutulabilir. İleride aynı haberin farklı kaynaklardaki versiyonlarını cluster etmek için `radar_news_candidate_sources` tablosu eklenebilir.

---

## 6.4. `public.radar_news_review_logs`

Amaç: Moderasyon aksiyonlarını denetlenebilir hale getirmek.

```sql
CREATE TABLE IF NOT EXISTS public.radar_news_review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.radar_news_candidates(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (
    action IN (
      'approve_to_pool',
      'approve_and_publish',
      'reject',
      'mark_duplicate',
      'archive',
      'restore',
      'edit_before_publish'
    )
  ),
  actor_user_id UUID,
  note TEXT,
  before_value JSONB,
  after_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 6.5. Opsiyonel: keyword yönetim tablosu

```sql
CREATE TABLE IF NOT EXISTS public.radar_news_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  language TEXT NOT NULL,
  category TEXT,
  weight NUMERIC(5,2) NOT NULL DEFAULT 1,
  is_negative BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Bu tablo sayesinde relevancy sistemi deploy olmadan güncellenebilir.

---

# 7. RLS ve Yetkilendirme

## 7.1. Temel prensip

Aday haber tabloları public okunmamalıdır.

```text
anon: erişim yok
authenticated normal user: erişim yok
admin user: okuma ve moderasyon
service_role: ingestion yazma
```

## 7.2. RLS iskeleti

```sql
ALTER TABLE public.radar_news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_news_scan_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_news_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_news_review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_news_keywords ENABLE ROW LEVEL SECURITY;
```

Admin kontrolü mevcut `public.admin_users` yaklaşımı ile uyumlu tutulmalıdır.

Örnek admin select policy:

```sql
CREATE POLICY "Admin users can read radar candidates"
ON public.radar_news_candidates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users admin
    WHERE admin.user_id = auth.uid()
  )
);
```

Moderasyon update policy de aynı admin kontrolünü kullanmalıdır.

## 7.3. Service role kuralı

`SUPABASE_SERVICE_ROLE_KEY` yalnızca server-side Edge Function içinde kullanılmalıdır.

Aşağıdaki yerlere kesinlikle yazılmamalıdır:

```text
frontend env
VITE_* değişkenleri
browser bundle
public repo
migration dosyası
client-side Supabase initialization
```

---

# 8. Edge Function Tasarımı

## 8.1. Dosya yapısı

```text
supabase/functions/radar-news-scan/
  index.ts
  adapters/
    rss.ts
    atom.ts
    gdelt.ts
    json-api.ts
  lib/
    canonicalize-url.ts
    hash.ts
    normalize-item.ts
    relevance-score.ts
    dedupe.ts
    source-security.ts
    scan-lock.ts
    types.ts
```

Opsiyonel manuel tarama endpointi aynı fonksiyonu kullanabilir:

```text
POST /functions/v1/radar-news-scan
```

Body:

```json
{
  "triggerType": "manual",
  "sourceIds": [],
  "dryRun": false
}
```

## 8.2. Fonksiyon adımları

```text
1. Request kimliğini doğrula.
2. Cron secret veya admin JWT kontrolünü yap.
3. Aynı anda ikinci taramayı engelleyen lock oluştur.
4. scan_runs tablosuna running kaydı aç.
5. is_enabled=true ve terms_checked=true kaynakları yükle.
6. Her kaynak için uygun adapter çalıştır.
7. Timeout, response size ve protocol kontrolü yap.
8. Gelen her item için normalize işlemi yap.
9. URL canonicalization yap.
10. canonical_url_hash ve content_hash üret.
11. Relevance score hesapla.
12. Negatif filtreleri uygula.
13. Duplicate kontrolü yap.
14. Uygun adayları pending olarak insert et.
15. Kaynak bazlı hata ve metrikleri kaydet.
16. scan_runs kaydını completed / partial / failed olarak kapat.
17. Lock kaldır.
18. Özet JSON response dön.
```

## 8.3. Kaynak adaptör arayüzü

```ts
export type RawNewsItem = {
  externalId?: string;
  title: string;
  summary?: string;
  url: string;
  imageUrl?: string;
  publishedAt?: string;
  language?: string;
  country?: string;
  city?: string;
  category?: string;
  rawPayload: unknown;
};

export interface RadarNewsAdapter {
  fetchItems(source: RadarNewsSource): Promise<RawNewsItem[]>;
}
```

## 8.4. RSS / Atom parser

RSS ve Atom için:

- XML response boyutu sınırlandırılmalı
- `Content-Type` kontrol edilmeli
- Redirect sayısı sınırlandırılmalı
- HTML description sanitize edilmeli
- Script ve iframe içeriği atılmalı
- Feed içinde gelen link normalize edilmeli
- Maksimum item sayısı source config ile sınırlandırılmalı

Önerilen parser:

```ts
import { XMLParser } from "npm:fast-xml-parser";
```

## 8.5. URL canonicalization

Aşağıdaki tracking parametreleri kaldırılmalıdır:

```text
utm_source
utm_medium
utm_campaign
utm_term
utm_content
fbclid
gclid
mc_cid
mc_eid
ref
source
```

Temel kural:

```text
protocol + hostname + normalized pathname + gerekli query params
```

Sadece:

```text
https:
http:
```

kabul edilmelidir.

Tercihen public linklerde `https:` zorlanmalıdır.

## 8.6. Hash üretimi

```text
canonical_url_hash = sha256(canonical_url)
content_hash = sha256(normalized_title + "|" + source_name + "|" + published_date_day)
```

`normalized_title`:

- lowercase
- trim
- çoklu boşluk temizliği
- temel punctuation temizliği
- Unicode normalize
- Türkçe karakterler korunabilir veya ikinci bir ASCII karşılaştırma alanı üretilebilir

## 8.7. Duplicate seviyeleri

### Seviye 1 — Kesin duplicate

```text
canonical_url_hash aynı
```

### Seviye 2 — Güçlü duplicate

```text
content_hash aynı
```

### Seviye 3 — Yakın duplicate

MVP sonrasında:

```text
pg_trgm similarity(normalized_title, existing.normalized_title) >= 0.86
AND published_at farkı <= 72 saat
```

Yakın duplicate otomatik silinmemeli, admin ekranında öneri olarak gösterilmelidir.

---

# 9. Relevance Score

## 9.1. Amaç

Relevance score yalnızca admin sıralamasını kolaylaştırır. Otomatik yayın yetkisi vermez.

## 9.2. Basit kural motoru

Örnek:

```text
+35 : title içinde güçlü diaspora keyword
+25 : title içinde Almanya / Avrupa Türk toplumu keyword
+15 : summary içinde güçlü keyword
+10 : resmi veya yüksek güvenli kaynak
+10 : son 24 saat içinde yayınlandı
+05 : şehir veya ülke metadata mevcut

-40 : spor magazin veya ilgisiz eğlence keyword
-50 : clickbait paterni
-60 : yetişkin / şiddet odaklı ilgisiz içerik
-100: blocked source
```

Skor sınırı:

```text
0 - 100
```

İlk MVP davranışı:

```text
score >= 20  → pending kuyruğuna al
score < 20   → filtered_count olarak logla, aday tabloya yazma veya archived olarak yaz
```

Tercih: İlk iki hafta tuning amacıyla düşük skorlu kayıtları `archived` olarak tutmak.

## 9.3. Reason kaydı

Admin skoru açıklayabilmelidir:

```json
[
  { "rule": "keyword_title", "value": "Türk diasporası", "score": 35 },
  { "rule": "freshness_24h", "score": 10 },
  { "rule": "trusted_source", "score": 10 }
]
```

---

# 10. Admin Panel Tasarımı

## 10.1. Yeni sayfalar

Önerilen route yapısı:

```text
/admin/radar
/admin/radar/queue
/admin/radar/sources
/admin/radar/runs
/admin/marquee
```

Alternatif olarak mevcut `/admin/marquee` sayfasına tab sistemi eklenebilir.

## 10.2. Tab yapısı

```text
Bekleyenler
Onaylananlar
Reddedilenler
Duplicate
Kaynaklar
Tarama Geçmişi
Radar Bandı
```

## 10.3. Bekleyen haber kartı

Kartta gösterilecek bilgiler:

```text
Başlık
Kısa özet
Kaynak adı
Kaynak domain
Orijinal habere git butonu
Yayın tarihi
Sisteme giriş tarihi
Dil
Ülke
Şehir
Kategori
Relevance score
Score sebepleri
Duplicate uyarısı
Görsel preview
```

Butonlar:

```text
Onayla ve Radar'a Yayınla
Sadece Haber Havuzuna Onayla
Düzenle ve Yayınla
Reddet
Duplicate Olarak İşaretle
Kaynağı Pasife Al
```

## 10.4. Onay akışları

### A. Sadece Haber Havuzuna Onayla

```text
candidate.review_status = approved
→ news_posts insert / upsert
→ candidate.approved_news_post_id = news_posts.id
→ review log insert
```

### B. Onayla ve Radar'a Yayınla

```text
candidate.review_status = approved
→ news_posts insert / upsert
→ importNewsPostToMarquee(newsPostId)
→ marquee_items insert
→ review log insert
```

### C. Düzenle ve Yayınla

Admin aşağıdaki alanları düzenleyebilir:

```text
title
summary
category
country
city
image selection
published_at
Radar bandında görünsün mü
sort_order
```

Orijinal kaynak bilgisi değiştirilemez veya ayrıca audit log ile tutulmalıdır.

## 10.5. Public mimari için iki fazlı yaklaşım

### Faz 1 — Minimum risk

Mevcut yapı korunur:

```text
news_posts
→ marquee_items
→ Radar page ve marquee
```

### Faz 2 — Tavsiye edilen iyileştirme

Radar sayfası `news_posts` tablosundan tüm onaylı haberleri okuyabilir.  
`marquee_items` yalnızca hero altında öne çıkarılan haberleri tutar.

```text
news_posts = Radar arşivi
marquee_items = featured subset
```

Bu refactor MVP yayınından sonra yapılmalıdır.

---

# 11. `news_posts` Entegrasyonu

Canlı veritabanındaki gerçek `news_posts` şeması migration öncesi kontrol edilmelidir.

Mevcut frontend testlerinde aşağıdaki alanlar kullanılmaktadır:

```text
id
title
summary
source_name
source_url
original_url
image_url
category
city
country
language
published_at
unique_hash
status
created_at
```

## 11.1. Candidate → news_posts mapping

```ts
{
  title: candidate.title,
  summary: candidate.summary,
  source_name: candidate.source_name,
  source_url: candidate.source_url,
  original_url: candidate.original_url,
  image_url: approvedPublicImageUrlOrNull,
  category: candidate.category,
  city: candidate.city,
  country: candidate.country,
  language: candidate.language,
  published_at: candidate.published_at,
  unique_hash: candidate.content_hash,
  status: "active"
}
```

Eklenmesi önerilen alanlar:

```sql
ALTER TABLE public.news_posts
  ADD COLUMN IF NOT EXISTS radar_candidate_id UUID,
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ingestion_source_type TEXT;
```

Gerçek tablo yapısı kontrol edilmeden migration uygulanmamalıdır.

---

# 12. Cron Kurulumu

## 12.1. Tavsiye edilen zaman

Tarama günde bir kez yapılmalıdır.

Berlin saatine göre sabah çalışması hedeflenebilir. Supabase Cron UTC kullandığı için yaz / kış saati farkı göz önünde tutulmalıdır.

Basit MVP seçeneği:

```text
Her gün 05:00 UTC
```

Cron ifadesi:

```text
0 5 * * *
```

Bu saat:

- yaz döneminde Almanya saatiyle 07:00
- kış döneminde Almanya saatiyle 06:00

olur.

## 12.2. Supabase Cron örneği

Agent, Supabase dokümantasyonundaki güncel yöntemi doğrulamalıdır. Genel yapı:

```sql
SELECT cron.schedule(
  'corteqs-radar-daily-news-scan',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/radar-news-scan',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'radar_news_cron_secret'
      )
    ),
    body := '{"triggerType":"cron","dryRun":false}'::jsonb
  );
  $$
);
```

Notlar:

- Gerçek secret Supabase Vault içine konulmalıdır.
- SQL dosyasına açık secret yazılmamalıdır.
- Manuel admin taraması ayrı authorization akışı kullanmalıdır.
- Self-hosted ortamda `pg_cron`, `pg_net` ve Vault desteği doğrulanmalıdır.
- Alternatif olarak Coolify cron veya GitHub Actions kullanılabilir; ancak mevcut Supabase merkezli yapı için önce Supabase Cron tercih edilmelidir.

---

# 13. Manuel Tarama

Admin panelinde:

```text
Şimdi Tara
```

butonu bulunmalıdır.

Buton davranışı:

```text
POST /functions/v1/radar-news-scan
Authorization: admin session JWT
Body: { "triggerType": "manual", "dryRun": false }
```

Admin kullanıcı doğrulaması server-side yapılmalıdır.

Butona basılınca:

- ikinci kez basmayı önlemek için loading state
- sonuç özeti
- taranan kaynak sayısı
- yeni aday sayısı
- duplicate sayısı
- hata alan kaynak sayısı

gösterilmelidir.

---

# 14. Güvenlik Kontrolleri

## 14.1. SSRF engelleme

Edge Function herhangi bir kullanıcı URL'sini fetch etmemelidir.

Yalnızca:

```text
radar_news_sources
```

tablosunda önceden kaydedilmiş ve aktif olan endpointler fetch edilmelidir.

Ek kontroller:

```text
localhost engelle
127.0.0.0/8 engelle
10.0.0.0/8 engelle
172.16.0.0/12 engelle
192.168.0.0/16 engelle
169.254.0.0/16 engelle
::1 engelle
file:// engelle
ftp:// engelle
data:// engelle
```

## 14.2. Timeout ve response sınırı

Önerilen varsayılanlar:

```text
timeout: 12 saniye
maksimum response: 2 MB
maksimum item / kaynak / tarama: 100
maksimum redirect: 3
```

## 14.3. HTML sanitize

Feed description alanı HTML içerebilir.

Kural:

```text
HTML → text
script kaldır
style kaldır
iframe kaldır
event handler kaldır
maksimum summary uzunluğu: 600 karakter
```

## 14.4. XSS engelleme

Admin panelinde raw HTML render edilmemelidir.

Aşağıdaki yaklaşım kullanılmamalıdır:

```tsx
dangerouslySetInnerHTML
```

İlk sürümde summary plain text gösterilmelidir.

## 14.5. Secret yönetimi

Secrets:

```text
RADAR_NEWS_CRON_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OPTIONAL_THENEWSAPI_TOKEN
```

Kurallar:

- `.env.example` içinde yalnızca değişken isimleri
- gerçek değerler Supabase secrets / Vault
- loglarda secret maskeleme
- frontend bundle içinde service role kesinlikle yok

---

# 15. Telif, Kaynak Gösterimi ve Hukuki Risk Kontrolü

## 15.1. Varsayılan davranış

CorteQS bir haber sitesinin tam içeriğini kopyalamamalıdır.

Public kartta:

```text
başlık
çok kısa özet
kaynak adı
yayın tarihi
orijinal kaynak linki
```

gösterilmelidir.

Detay sayfasında tam makale yerine:

```text
CorteQS editoryal özeti
kaynak bilgisi
orijinal habere git butonu
```

kullanılmalıdır.

## 15.2. Kaynak açma kontrol listesi

Her RSS / API kaynağı için admin kaynak tablosunda şu bilgiler kayıt altına alınmalıdır:

```text
terms_checked
terms_checked_at
terms_notes
website_url
allowed_usage_notes
```

Bir kaynak production'da açılmadan önce:

- RSS akışı gerçekten resmi mi?
- Syndication veya yeniden kullanım şartı var mı?
- Ticari kullanım kısıtı var mı?
- Attribution gerekli mi?
- Görsel kullanımı izinli mi?
- API otomatik erişime izin veriyor mu?
- Rate limit nedir?

kontrol edilmelidir.

## 15.3. Ücretsiz API uyarıları

- NewsAPI.org Developer plan yalnızca geliştirme ve test içindir; production için kullanılmamalıdır.
- TheNewsAPI ücretsiz planda günlük 100 request ve request başına 3 haber sunmaktadır; ancak genel kullanım koşullarında ticari kullanım ve otomatik erişim konusunda belirsiz ifadeler bulunmaktadır. Yazılı teyit olmadan production kritik bağımlılığı yapılmamalıdır.
- GDELT verisi açık ve ücretsiz olduğu için ilk API keşif katmanında daha uygundur.
- Doğrudan RSS kaynakları kaynak bazında ayrıca değerlendirilmelidir.

---

# 16. Loglama ve İzlenebilirlik

Her tarama sonucunda şu metrikler tutulmalıdır:

```text
run_id
trigger_type
started_at
completed_at
duration_ms
sources_total
sources_success
sources_failed
items_fetched
items_normalized
items_filtered
items_duplicate
items_inserted
```

Kaynak bazında:

```text
source_id
source_name
last_success_at
last_error_at
last_error_message
last_fetched_count
last_inserted_count
```

Admin panelinde tarama geçmişi:

```text
Tarih
Tetikleme tipi
Durum
Süre
Kaynak sayısı
Yeni aday
Duplicate
Filtrelenen
Hatalı kaynak
Detay
```

şeklinde listelenmelidir.

---

# 17. Seed Kaynak Yaklaşımı

İlk migration gerçek yayıncı feed URL'lerini doğrudan aktif etmemelidir.

Güvenli başlangıç:

```sql
INSERT INTO public.radar_news_sources (
  name,
  source_type,
  adapter_key,
  endpoint_url,
  language,
  trust_level,
  is_enabled,
  terms_checked,
  terms_notes,
  config
)
VALUES (
  'GDELT - Turkish Diaspora EN',
  'gdelt',
  'gdelt_doc_v2',
  'https://api.gdeltproject.org/api/v2/doc/doc',
  'en',
  'discovery_only',
  true,
  true,
  'GDELT açık keşif katmanı. Metadata ve kaynak linki kullanılır; tam metin scraping yapılmaz.',
  jsonb_build_object(
    'query', '"Turkish diaspora" OR "Turkish community Germany"',
    'timespan', '1d',
    'maxrecords', 100,
    'format', 'json',
    'mode', 'artlist',
    'sort', 'datedesc'
  )
);
```

Ardından RSS kaynakları admin ekranından:

```text
Pasif kayıt oluştur
→ terms kontrolü yap
→ endpoint test et
→ preview gör
→ aktif et
```

akışıyla eklenmelidir.

---

# 18. Test Planı

## 18.1. Unit testler

### URL canonicalization

```text
utm parametreleri temizleniyor mu?
aynı haber farklı tracking URL ile tekilleşiyor mu?
invalid protocol reddediliyor mu?
```

### Hash

```text
aynı canonical URL aynı hash üretiyor mu?
başlık normalize işlemi deterministic mi?
```

### Relevance score

```text
güçlü diaspora keyword skor getiriyor mu?
negative keyword skoru düşürüyor mu?
score 0-100 arasında mı?
reason listesi doğru mu?
```

### RSS parser

```text
RSS 2.0 parse
Atom parse
bozuk XML
description HTML sanitize
eksik title
eksik URL
çok büyük response
timeout
```

### GDELT adapter

```text
doğru request parametreleri
boş response
rate limit
invalid JSON
duplicate haber
```

## 18.2. Integration testler

```text
manual scan → candidate insert
aynı scan ikinci kez → duplicate
pending candidate public görünmüyor
admin approve_to_pool → news_posts insert
admin approve_and_publish → marquee_items insert
aynı news_post ikinci kez marquee'ye aktarılmıyor
rejected candidate tekrar pending olmuyor
disabled source taranmıyor
terms_checked=false source taranmıyor
```

## 18.3. Security testler

```text
normal user candidate okuyamıyor
anon candidate okuyamıyor
normal user source düzenleyemiyor
admin queue okuyabiliyor
service role insert yapabiliyor
localhost endpoint engelleniyor
private IP endpoint engelleniyor
script içeren summary text'e dönüyor
```

## 18.4. Regression testler

Mevcut özellikler bozulmamalıdır:

```text
manuel marquee kart ekleme
manuel marquee kart düzenleme
manuel marquee silme
görsel yükleme
public marquee listeleme
fallback kartlar
sort_order
is_active
slug
external_url
news_post_id unique davranışı
```

---

# 19. Uygulama Fazları

## Faz 0 — Discovery ve güvenli başlangıç

- `CLAUDE.md` ve `AGENT_CONTEXT.md` oku.
- Mevcut Radar dosyalarını oku.
- Canlı migration sırasını kontrol et.
- `news_posts` gerçek şemasını kontrol et.
- Aktif admin route yapısını kontrol et.
- Yeni branch oluştur.
- Mevcut testleri çalıştır.
- Değişiklik öncesi kısa teknik rapor üret.

## Faz 1 — Veritabanı

- Yeni migration oluştur.
- Yeni tabloları ekle.
- Trigger ve index ekle.
- RLS ekle.
- GDELT seed kaynağını ekle.
- Types dosyasını Supabase CLI ile yeniden üret.
- Migration rollback notu hazırla.

## Faz 2 — Edge Function

- Adapter arayüzünü oluştur.
- GDELT adapter ekle.
- RSS / Atom adapter ekle.
- Normalize, hash, canonicalization, relevance ve duplicate katmanlarını ekle.
- Lock mekanizması ekle.
- Scan log ekle.
- Dry-run modu ekle.
- Secret kontrolü ekle.

## Faz 3 — Admin UI

- `/admin/radar/queue`
- `/admin/radar/sources`
- `/admin/radar/runs`

sayfalarını ekle.

- Pending queue
- Approve
- Approve and publish
- Reject
- Duplicate
- Run now
- Source enable / disable
- Terms check alanları
- Scan details

ekle.

## Faz 4 — Mevcut Radar köprüsü

- Mevcut `importNewsPostToMarquee()` fonksiyonunu reuse et.
- Yeni fonksiyon yazmadan önce mevcut helper'ı kullan.
- `approve_and_publish` işleminden sonra mevcut import helper çağrılmalı.
- Manuel `/admin/marquee` akışı korunmalı.

## Faz 5 — Cron

- Vault secret ekleme dokümantasyonu hazırla.
- Cron migration veya manuel kurulum SQL'i hazırla.
- Günlük 05:00 UTC tarama ekle.
- İlk cron öncesi dry-run çalıştır.
- Sonuçları admin panelinden doğrula.

## Faz 6 — Test ve dokümantasyon

- Unit
- Integration
- Security
- Regression
- Build
- Typecheck
- Lint

çalıştır.

- Uygulanan dosyaları listele.
- Kalan riskleri listele.
- Kaynak açma rehberi ekle.
- Manuel operasyon rehberi ekle.

---

# 20. Beklenen Dosya Listesi

Agent mevcut yapıyı kontrol ettikten sonra benzer bir dosya seti üretmelidir:

```text
supabase/migrations/YYYYMMDDHHMMSS_add_radar_news_pipeline.sql

supabase/functions/radar-news-scan/index.ts
supabase/functions/radar-news-scan/adapters/rss.ts
supabase/functions/radar-news-scan/adapters/atom.ts
supabase/functions/radar-news-scan/adapters/gdelt.ts
supabase/functions/radar-news-scan/lib/canonicalize-url.ts
supabase/functions/radar-news-scan/lib/hash.ts
supabase/functions/radar-news-scan/lib/normalize-item.ts
supabase/functions/radar-news-scan/lib/relevance-score.ts
supabase/functions/radar-news-scan/lib/dedupe.ts
supabase/functions/radar-news-scan/lib/source-security.ts
supabase/functions/radar-news-scan/lib/scan-lock.ts
supabase/functions/radar-news-scan/lib/types.ts

src/lib/radarNewsPipeline.ts
src/pages/admin/AdminRadarQueuePage.tsx
src/pages/admin/AdminRadarSourcesPage.tsx
src/pages/admin/AdminRadarRunsPage.tsx
src/components/admin/radar/RadarCandidateCard.tsx
src/components/admin/radar/RadarSourceForm.tsx
src/components/admin/radar/RadarScanRunTable.tsx

docs/modules/radar/radar-news-pipeline.md
docs/modules/radar/radar-news-operations.md
```

Mevcut route ve klasör standardı farklıysa agent proje standardına uymalıdır.

---

# 21. PowerShell Komutları

Kullanılabilecek temel komutlar PowerShell formatında yazılmalıdır.

```powershell
git checkout -b feature/radar-news-pipeline

npm install
npm run test
npm run lint
npm run build

supabase migration new add_radar_news_pipeline
supabase functions new radar-news-scan

supabase gen types typescript --project-id YOUR_PROJECT_REF | Out-File -Encoding utf8 src/integrations/supabase/types.ts

supabase functions serve radar-news-scan --env-file .env.local
supabase functions deploy radar-news-scan

supabase db push
```

Not: Agent mevcut `package.json` scriptlerini kontrol etmeli ve bulunmayan scriptleri körlemesine çalıştırmamalıdır.

---

# 22. Definition of Done

Pipeline tamamlanmış sayılmak için aşağıdaki koşulların tümü sağlanmalıdır:

- [ ] Mevcut Radar manuel yönetimi çalışıyor.
- [ ] Mevcut marquee kartları bozulmadı.
- [ ] GDELT üzerinden dry-run yapılabiliyor.
- [ ] En az bir RSS test kaynağı parse edilebiliyor.
- [ ] Cron günde bir kez çalışacak şekilde tanımlandı.
- [ ] Cron secret açık metin olarak repo içinde bulunmuyor.
- [ ] Yeni aday haberler `pending` olarak kaydediliyor.
- [ ] Pending haberler public tarafta görünmüyor.
- [ ] Admin pending haberleri görebiliyor.
- [ ] Admin reddedebiliyor.
- [ ] Admin duplicate işaretleyebiliyor.
- [ ] Admin sadece havuza onaylayabiliyor.
- [ ] Admin tek tıkla Radar'a yayınlayabiliyor.
- [ ] Yayınlanan haber `news_posts` içine giriyor.
- [ ] Yayınlanan haber mevcut köprüyle `marquee_items` içine aktarılabiliyor.
- [ ] Aynı haber ikinci kez eklenmiyor.
- [ ] Tarama geçmişi admin panelinde izlenebiliyor.
- [ ] Source enable / disable yapılabiliyor.
- [ ] Terms checked olmayan kaynak çalışmıyor.
- [ ] SSRF kontrolleri mevcut.
- [ ] HTML sanitize mevcut.
- [ ] Unit testler geçiyor.
- [ ] Regression testler geçiyor.
- [ ] Build başarılı.
- [ ] Teknik dokümantasyon eklendi.
- [ ] Operasyon rehberi eklendi.

---

# 23. AI Agent İçin Master Prompt

Aşağıdaki prompt doğrudan Claude Code, Codex veya benzeri coding agent içine verilebilir.

```text
CorteQS projesinde mevcut Radar / marquee haber yapısına admin onaylı günlük haber pipeline ekleyeceksin.

ÖNEMLİ:
- Mevcut sistemi yeniden yazma.
- Mevcut manuel Radar ve marquee yönetimini bozma.
- Harici haberleri doğrudan public tabloya yazma.
- Hiçbir haberi otomatik yayınlama.
- Secrets değerlerini repo içine yazma.
- Full article scraping yapma.
- Harici görselleri otomatik public hotlink yapma.
- Önce discovery yap, sonra migration ve implementation yap.
- Her kritik adımdan sonra kısa durum özeti ver.
- Dosya değiştirmeden önce ilgili mevcut dosyaları oku.
- Mevcut helper fonksiyonları reuse et.
- Gereksiz duplicate yapı üretme.
- Windows PowerShell uyumlu komutlar kullan.
- Destructive migration yazma.
- Canlı tabloyu drop etme.
- Var olan fallback içerikleri kaldırma.

PROJEDE ÖNCE OKUNACAK DOSYALAR:
- CLAUDE.md
- AGENT_CONTEXT.md
- docs/modules/marquee/marquee-haber-akisi.md
- src/lib/marquee.ts
- src/pages/admin/AdminMarqueePage.tsx
- src/pages/RadarPage.tsx
- src/components/DiasporaMarqueeSection.tsx
- src/components/MarqueeItemCard.tsx
- supabase/migrations/20260424110000_add_marquee_items.sql
- supabase/migrations/20260502120000_add_news_post_id_to_marquee_items.sql
- supabase/migrations/20260506235500_add_external_url_to_marquee_items.sql
- src/integrations/supabase/types.ts
- package.json

MEVCUT YAPI:
- public.marquee_items tablosu mevcut.
- public.marquee_items.news_post_id alanı unique.
- src/lib/marquee.ts içinde listImportableNewsPosts() mevcut.
- src/lib/marquee.ts içinde importNewsPostToMarquee(newsPostId) mevcut.
- src/pages/admin/AdminMarqueePage.tsx aktif news_posts kayıtlarını marquee'ye aktarma yeteneğine sahip.
- Bu yapıyı koru ve yeni pipeline'ı bunun önüne ekle.

HEDEF AKIŞ:
Daily Cron
→ radar-news-scan Edge Function
→ RSS / Atom / GDELT adapters
→ normalize
→ SSRF + response size + timeout güvenlik kontrolleri
→ canonical URL
→ hash
→ relevance score
→ duplicate kontrolü
→ public.radar_news_candidates pending kayıtları
→ Admin moderation queue
→ Admin approve_to_pool veya approve_and_publish
→ public.news_posts
→ mevcut importNewsPostToMarquee(newsPostId)
→ public.marquee_items
→ public Radar

MVP KAYNAKLARI:
1. GDELT DOC 2.0 adapter production aktif.
2. RSS adapter üret.
3. Atom adapter üret.
4. JSON API adapter arayüzünü üret ama üçüncü taraf ücretli / belirsiz API entegrasyonlarını varsayılan kapalı tut.
5. Kaynaklar public.radar_news_sources tablosundan yönetilsin.
6. terms_checked=false veya is_enabled=false kaynakları tarama.

YENİ TABLOLAR:
- public.radar_news_sources
- public.radar_news_scan_runs
- public.radar_news_candidates
- public.radar_news_review_logs
- opsiyonel public.radar_news_keywords

RLS:
- staging tablolarını public gösterme.
- anon erişimi kapalı.
- normal authenticated user erişimi kapalı.
- sadece public.admin_users içindeki admin kullanıcılar okuyup moderasyon yapabilsin.
- ingestion write işlemleri service_role ile server-side yürüsün.

SECURITY:
- service_role frontend bundle içine girmesin.
- Edge Function sadece önceden kayıtlı source endpointlerini fetch etsin.
- localhost ve private IP aralıklarını engelle.
- sadece http / https protokolleri kabul et.
- timeout varsayılan 12 saniye.
- response sınırı varsayılan 2 MB.
- redirect maksimum 3.
- item sayısı kaynak başına maksimum 100.
- feed HTML açıklamasını plain text sanitize et.
- dangerouslySetInnerHTML kullanma.
- full article body scraping yapma.
- raw_payload admin ve debug amacıyla JSONB saklanabilir.
- loglarda secret gösterme.

ADMIN UI:
- /admin/radar/queue
- /admin/radar/sources
- /admin/radar/runs
- mevcut /admin/marquee sayfasını koru.
- Bekleyenler, Onaylananlar, Reddedilenler, Duplicate, Kaynaklar, Tarama Geçmişi sekmeleri ekle.
- Şimdi Tara butonu ekle.
- Candidate card içinde title, summary, source, original URL, published date, created date, category, language, country, city, score, score reasons, duplicate warning ve image preview göster.
- Aksiyonlar: Onayla ve Radar'a Yayınla, Sadece Haber Havuzuna Onayla, Düzenle ve Yayınla, Reddet, Duplicate İşaretle, Kaynağı Pasife Al.
- Audit log yaz.

CRON:
- Supabase Cron + pg_net + Vault kullan.
- Varsayılan schedule: 0 5 * * *
- Secret açık metin migration içine yazılmayacak.
- Manuel tarama admin JWT ile yapılacak.
- Cron taraması cron secret ile yapılacak.
- Scan lock ekle; eş zamanlı ikinci taramayı engelle.

DEDUP:
- canonical_url_hash = sha256(canonical_url)
- content_hash = sha256(normalized_title + "|" + source_name + "|" + published_date_day)
- Önce canonical URL exact match.
- Sonra content hash.
- Yakın başlık similarity ikinci faz olabilir.
- Duplicate haberler public yayınlanmasın.

PUBLISH:
- approve_to_pool candidate kaydından news_posts insert / upsert yapsın.
- approve_and_publish önce news_posts insert / upsert yapsın, sonra mevcut importNewsPostToMarquee(newsPostId) helper'ını reuse etsin.
- Aynı news_post ikinci kez marquee'ye eklenmesin.
- Kaynak attribution korunsun.
- Harici görsel varsayılan olarak yalnızca preview olsun. Public görsel admin onayı veya placeholder ile gelsin.

TEST:
- Unit: canonicalization, hash, RSS, Atom, GDELT, score, sanitize.
- Integration: manual scan, daily scan core handler, candidate insert, duplicate, approve, reject, approve_and_publish.
- Security: RLS, SSRF, private IP, invalid protocol, raw HTML.
- Regression: mevcut marquee manuel CRUD, image upload, fallback, sort_order, is_active, slug, external_url, news_post_id unique.
- package.json içindeki mevcut scriptleri incele ve uygun test, lint, typecheck, build komutlarını çalıştır.

ÇIKTILAR:
1. Uygulanan dosyaların listesi
2. Migration dosyaları
3. Edge Function
4. Admin UI
5. Tests
6. docs/modules/radar/radar-news-pipeline.md
7. docs/modules/radar/radar-news-operations.md
8. Vault secret kurulum notları
9. Cron kurulum SQL'i
10. Dry-run sonucu
11. Test sonucu
12. Build sonucu
13. Açık kalan riskler
14. İkinci faz önerileri

ÇALIŞMA ŞEKLİ:
- Önce mevcut yapıyı analiz et ve kısa rapor ver.
- Sonra fazlar halinde uygula.
- Her faz sonunda değişen dosyaları listele.
- Karşılaştığın şema uyumsuzluğunda canlı veri modelini incele ve additive migration yaz.
- Destructive işlem yapma.
- Uygulama sonunda Definition of Done checklistini tek tek işaretle.
```

---

# 24. Agent İçin Referans Bağlantıları

Bu bağlantılar implementation sırasında yeniden kontrol edilmelidir.

```text
Supabase Cron:
https://supabase.com/docs/guides/cron

Supabase Scheduled Edge Functions:
https://supabase.com/docs/guides/functions/schedule-functions

Supabase pg_net:
https://supabase.com/docs/guides/database/extensions/pg_net

GDELT Data:
https://www.gdeltproject.org/data.html

GDELT DOC 2.0 API tanıtımı:
https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

NewsAPI.org pricing:
https://newsapi.org/pricing

NewsAPI.org terms:
https://newsapi.org/terms

TheNewsAPI pricing:
https://www.thenewsapi.com/pricing

TheNewsAPI documentation:
https://www.thenewsapi.com/documentation

TheNewsAPI terms:
https://www.thenewsapi.com/tos
```

---

# 25. Son Mimari Karar Özeti

İlk sürümde:

```text
RSS / Atom + GDELT
→ günlük tek tarama
→ candidate queue
→ zorunlu admin onayı
→ news_posts
→ mevcut marquee import köprüsü
→ CorteQS Radar
```

uygulanmalıdır.

En önemli kararlar:

1. **Otomatik yayın yok.**
2. **Mevcut Radar yapısı korunacak.**
3. **Yeni staging tabloları public olmayacak.**
4. **GDELT ilk ücretsiz API keşif kaynağı olacak.**
5. **RSS kaynakları terms kontrolünden sonra aktif edilecek.**
6. **Üçüncü taraf ücretsiz API'ler yazılı kullanım teyidi olmadan production bağımlılığı olmayacak.**
7. **Tam metin scraping yapılmayacak.**
8. **Harici görseller otomatik public hotlink yapılmayacak.**
9. **Admin aksiyonları audit log ile izlenecek.**
10. **MVP sonrasında Radar arşivi ile marquee featured subset ayrıştırılacak.**
