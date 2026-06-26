# Tool 04 — Hangi Şehir Sana Daha Uygun? — Şehir Eşleştirme Aracı E2E Dokümanı

> **Tool key:** `city_match`  
> **Slug:** `sehir-eslestirme`  
> **Route:** `/relocation/tools/sehir-eslestirme`  
> **Result kind:** `ranked_list`  
> **Öncelik:** Orta-Yüksek  
> **Tahmini efor:** 3-5 gün mevcut relocation_rank_locations genişletmesiyle; veri kalitesi için 2 hafta

## 1. Ürün amacı

Hedef ülke veya ülkeler içindeki şehirleri bütçe, iş alanı, yaşam tarzı, topluluk ve ulaşım kriterlerine göre sıralar.

Bu araç tek başına çalışmalı; ancak mümkün olduğunda mevcut `/relocation` planından, `relocation_moves` kaydından ve profil attribute'larından prefill almalıdır. Kullanıcı açık rıza vermeden hiçbir sonuç profil attribute'u olarak yazılmamalıdır.

## Repo bağlamı ve değişmez kurallar

Bu doküman `ubterzioglu/corteqsmvp` deposunun mevcut mimarisine göre yazıldı. Claude Code implementasyonu yaparken aşağıdaki repo gerçeklerini varsaymalıdır:

- Uygulama tek SPA: React 18 + Vite 5 + TypeScript + Tailwind/shadcn + Supabase/Postgres/RLS + security-definer RPC yapısı.
- Yeni feature katmanlaması şu deseni izlemeli: `src/lib/<modul>-api.ts`, `src/lib/<modul>-schemas.ts`, `src/lib/<modul>-types.ts`, `src/lib/<modul>-query-keys.ts`, `components/<modul>/`, `pages/<modul>/`.
- Yeni kodda component içinde doğrudan `supabase.from()` yazma; API modülü + React Query kullan.
- Tek Supabase client: `@/integrations/supabase/client`; bu dosyaya dokunma.
- Admin / role / profile tarafında legacy `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` tablolarına referans verme. Güncel model `user_role_assignments`, `user_profile_attributes`, `is_admin()` / `is_moderator()` RPC'leri ve AFS katmanıdır.
- Mutasyonlar mümkün olduğunca `security definer` RPC üzerinden yürümeli; frontend sadece Zod doğrulama ve UX sağlar. RLS okuma ve sahiplik sınırını korur.
- `src/components/ui/*` shadcn primitive dosyalarını manuel düzenleme.
- Kullanıcıya görünen Türkçe metinde `src/lib/text-normalization.ts` yardımcılarını kullan; çıplak `toUpperCase()/toLowerCase()` sadece teknik kodlarda kullanılmalı.
- Test ve teslim komutları: `npm run verify:text`, `npm run test`, `npm run build`, gerektiğinde `npm run test:e2e` ve `BASE_URL=https://corteqs.net npm run verify:release`.
- Mevcut `/relocation` route'u authenticated çalışıyor ve `RelocationHomePage` içinde wizard -> şehir önerileri -> servisler -> checklist -> emergency sekmeleri var. Bu 10 araç mevcut relocation omurgasının genişletmesi olarak tasarlanmalı.

## 2. E2E kullanıcı akışı

1. Kullanıcı hedef ülke veya ülke listesi seçer; ülke seçimi sonucundan prefill edilebilir.
2. Şehir büyüklüğü, bütçe, sektör, topluluk ve yaşam tarzı tercihleri alınır.
3. Mevcut `relocation_locations` satırları skorlanır.
4. Sonuçta top şehirler tablo + kart + ileride harita görünümüyle listelenir.
5. CTA kullanıcıyı `/directory`, `/cadde` ve mevcut relocation checklist sekmesine taşır.

## 3. Soru kapsamı

- Quick mode: 7 soru.
- Detailed mode: 16 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `target_countries` | Hangi ülkelerde şehir arıyorsun? | `country/multi` | max 5 |
| `city_size` | Şehir ölçeği tercihin? | `single` | metropolis, large_city, mid_size, small_city, no_preference |
| `rent_budget` | Aylık kira/konut bütçen? | `currency` | EUR |
| `industry_hub` | Meslek alanın için şehirde güçlü bir sektör ekosistemi ister misin? | `scale` | 1-5 |
| `commute_tolerance` | Günlük ulaşım toleransın? | `single` | 15m, 30m, 60m, flexible |
| `community_need` | Türk/diaspora topluluğu şehir seçiminde ne kadar önemli? | `scale` | 1-5 |
| `safety_family` | Güvenlik, okul ve aile dostu ortam önceliğin? | `scale` | 1-5 |
| `nightlife_culture` | Kültür, etkinlik, gece hayatı önceliğin? | `scale` | 1-5 |
| `quiet_preference` | Sessiz/sakin yaşam senin için önemli mi? | `scale` | 1-5 |
| `climate` | Şehir iklimi tercihin? | `single` | mild, cold, warm, coastal, no_preference |
| `airport_access` | Türkiye'ye uçuş erişimi önemli mi? | `scale` | 1-5 |
| `language_comfort` | Yerel dili bilmeden şehirde başlama konforu ne kadar önemli? | `scale` | 1-5 |
| `housing_priority` | Konut bulunabilirliği maliyetten daha önemli mi? | `scale` | 1-5 |
| `healthcare_priority` | Sağlık erişimi önceliğin? | `scale` | 1-5 |
| `deal_breakers` | Şehir için kırmızı çizgilerin? | `multi` | too_expensive, no_jobs, no_community, unsafe, poor_transport |
| `preferred_examples` | Sevdiğin şehir tiplerine örnek ver | `text` | opsiyonel |

## 4. Skor / karar modeli

Mevcut `relocation_rank_locations_v1` ağırlıkları şehir eşleştirme için genişletilir veya yeni RPC yazılır.

| Boyut | Ağırlık |
|---|---:|
| `budget_housing_fit` | 25 |
| `job_hub_fit` | 20 |
| `lifestyle_fit` | 15 |
| `community_fit` | 15 |
| `safety_healthcare_fit` | 15 |
| `mobility_flight_fit` | 10 |

İlk MVP'de `relocation_locations.cost_index`, `housing_availability`, `healthcare_access`, `community_density`, `flight_access`, `bureaucracy_complexity` alanları doğrudan kullanılabilir. Daha sonra `city_lifestyle_tags`, `industry_hub_tags`, `public_transport_index` eklenir.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ek kolonlar veya tablo:

```sql
alter table public.relocation_locations
  add column if not exists city_size text,
  add column if not exists lifestyle_tags text[] not null default '{}',
  add column if not exists industry_tags text[] not null default '{}',
  add column if not exists public_transport_index numeric(6,3);
```

RPC: `relocation_score_city_match_v1(p_session_id uuid)`; mevcut `relocation_rank_locations_v1` ile aynı source_quality formatını döndürmeli.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "city_match",
  "slug": "sehir-eslestirme",
  "title_tr": "Hangi Şehir Sana Daha Uygun? — Şehir Eşleştirme Aracı",
  "category": "relocation_assessment",
  "quick_question_count": 7,
  "detailed_question_count": 16,
  "result_kind": "ranked_list",
  "requires_auth": true,
  "is_active": true
}
```

## 6. Frontend uygulama planı

Eklenecek/güncellenecek ana parçalar:

```text
src/lib/relocation-tools-config.ts          # Bu aracın config ve soru seed'i
src/lib/relocation-tools-api.ts             # generic RPC wrapper'ları
src/lib/relocation-tools-schemas.ts         # Zod sınırları
src/lib/relocation-tools-query-keys.ts      # React Query key factory
src/components/relocation/tools/*           # ortak tool UI
src/pages/relocation/tools/RelocationToolPage.tsx
src/pages/relocation/tools/RelocationToolResultPage.tsx
```

UI gereksinimleri:

- Progress bar: `answered / total`.
- Geri/ileri navigasyon.
- Her soru için “emin değilim” veya opsiyonel skip sadece skor modeli izin veriyorsa.
- Sonuç ekranında kısa özet, detay kırılımı, kaynak kalitesi/freshness ve CTA paneli.
- Sonuç metinleri Türkçe, sade ve garanti iddiası içermeyecek şekilde yazılmalı.

## 7. Çıktı şablonu

Kısa sonuç:

> Senin için ilk 3 şehir: Berlin 82/100, Hamburg 76/100, Köln 74/100. Berlin iş ve topluluk tarafında güçlü; Hamburg yaşam kalitesi ve ulaşımda dengeli; Köln topluluk ve aile dostu yapı açısından iyi.

Detay: şehir kartı, sub-score barları, “neden uydu”, “dikkat et”, source freshness.

CTA'lar:

- Bu şehirdeki üyeleri gör
- Cadde şehir akışını aç
- İlk 90 Gün Planlayıcı'yı şehirle başlat
- Servis önerilerini görüntüle

## 8. Veri kaynakları ve ingestion notu

- relocation_locations seed/ingestion
- Resmi şehir veri portalları
- OECD/Eurostat bölgesel istihdam
- EURES
- Numbeo şehir endeksleri fallback

Kaynak stratejisi: önce resmi kaynak ve regülatör; sonra lisanslı ticari API; en sonda crowd-sourced fallback. Her veri satırı `source_id`, `freshness_at`, `confidence` veya `source_quality` taşımalıdır. API anahtarları DB'de tutulmaz; sadece `secret_ref` env değişken adı tutulur.

## 9. Privacy, KVKK/GDPR ve saklama

- Varsayılan: sonuç üretmek için gerekli minimum cevap toplanır.
- Ham cevaplar `relocation_tool_sessions.expires_at` ile 30 gün sonra temizlenebilir.
- Kullanıcı “profile kaydet” demedikçe `user_profile_attributes` güncellenmez.
- Partner/referral CTA'ları için ayrı açık rıza gerekir.
- Hassas veri isteme: pasaport numarası, kimlik numarası, sağlık teşhisi, tam adres, işveren iç bilgisi alınmaz.
- Analytics event'leri sadece ürün iyileştirme için; result metni içinde kişisel veriyi gereksiz tekrar etme.

## 10. QA, test ve kabul kriterleri

### Unit test

- Skor ağırlıkları toplamı 1.0 / 100 olmalı.
- Eksik cevaplarda güvenli fallback.
- Uç değerler: 0 bütçe, çok yüksek bütçe, dil bilinmiyor, hedef ülke boş, consent false.
- Bucket sınırları: eşik değerleri birebir test edilir.

### Component test

- Tool landing render.
- Quick mode soru sayısı doğru.
- Required soru boşken submit engellenir.
- Result sayfasında CTA'lar görünür.

### Playwright happy path

```text
login -> /relocation/tools/sehir-eslestirme -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
```

### Security test

- Kullanıcı A, kullanıcı B'nin `sessionId` / `resultId` değerini URL ile açamamalı.
- Consent false ise profile write gerçekleşmemeli.
- RPC auth yoksa `rl_auth_required` veya ortak hata kodu dönmeli.

### Definition of Done

- Migration + seed dosyaları eklendi.
- `npm run verify:text`, `npm run test`, `npm run build` yeşil.
- Tool hub'da kart görünüyor.
- Quick ve detailed mode çalışıyor.
- Sonuç ekranı açıklanabilir skor ve CTA üretiyor.
- Privacy metni görünür.

## 11. Claude Code görev listesi

1. Ortak engine yoksa önce `00-ortak-mimari-ve-agent-talimatlari.md` dosyasındaki core migration/API/UI iskeletini uygula.
2. Bu aracın `relocation_tools` seed kaydını ekle.
3. Bu aracın soru seed'lerini `relocation_tool_questions` içine ekle.
4. Tool-specific scoring RPC'sini yaz.
5. TS mirror gerekiyorsa `relocation-tools-ranking.ts` içine saf skor fonksiyonunu ekle.
6. Result copy ve CTA mapping'i `relocation-tools-copy.ts` içine ekle.
7. Vitest fixture'larını yaz.
8. Playwright happy-path senaryosuna bu slug'ı ekle.
9. Build ve text doğrulamasını çalıştır.
