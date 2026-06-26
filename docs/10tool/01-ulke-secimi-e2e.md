# Tool 01 — Hangi Ülke Sana Uygun? — Ülke Seçimi Aracı E2E Dokümanı

> **Tool key:** `country_match`  
> **Slug:** `ulke-secimi`  
> **Route:** `/relocation/tools/ulke-secimi`  
> **Result kind:** `ranked_list`  
> **Öncelik:** Yüksek  
> **Tahmini efor:** 5-7 gün ortak engine sonrası; veri adapter'larıyla 2-3 hafta

## 1. Ürün amacı

Kullanıcının bütçe, meslek, dil, vize, yaşam tarzı ve topluluk önceliklerine göre taşınabileceği ülkeleri sıralar.

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

1. Kullanıcı `/relocation/tools/ulke-secimi` sayfasına gelir.
2. Quick veya Detailed mod seçer.
3. Varsa son `relocation_moves` kaydı üzerinden hedef ülkeler, bütçe ve hane bilgisi prefill edilir.
4. Soru adımları tamamlanır; her cevap `relocation_tool_save_answer` ile kaydedilir.
5. `relocation_score_country_match_v1` ülke adaylarını skorlar.
6. Sonuç sayfasında top 5 ülke, skor kırılımı, nedenler, riskler ve CTA'lar gösterilir.
7. Kullanıcı sonucu profiline kaydedebilir veya şehir eşleştirme aracına geçebilir.

## 3. Soru kapsamı

- Quick mode: 7 soru.
- Detailed mode: 18 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `motivation` | Tek taşınma motivasyonun ne? | `single` | career, education, family, safety, lifestyle, community, remote_work |
| `target_region` | Hangi bölgelere açıksın? | `multi` | EU/EEA, UK, North America, Gulf, APAC, any |
| `monthly_budget` | Aylık yaşam bütçen nedir? | `currency` | EUR veya seçilen para birimi |
| `setup_budget` | İlk kurulum için ayırabileceğin maksimum bütçe? | `currency` | depozito, uçuş, evrak, geçici konaklama |
| `profession_field` | Mesleğin veya ana uzmanlık alanın? | `profession` | ESCO mapping hedeflenir |
| `work_mode` | Yurt dışında çalışma planın nasıl? | `single` | local_job, remote, study_then_work, entrepreneur, undecided |
| `language_profile` | Hangi dillerde hangi seviyedesin? | `multi/scale` | TR/EN/DE/FR/NL/ES etc. CEFR |
| `visa_assets` | Vize/oturum açısından güçlü varlıkların var mı? | `multi` | EU passport, ancestry, student admission, job offer, none |
| `bureaucracy_tolerance` | Bürokrasi ve bekleme süresine toleransın? | `scale` | 1 düşük - 5 yüksek |
| `family_needs` | Aile, çocuk, okul veya evcil hayvan ihtiyaçların var mı? | `multi` | children, school, spouse_job, pets, none |
| `community_importance` | Türk/diaspora topluluğu senin için ne kadar önemli? | `scale` | 1-5 |
| `healthcare_priority` | Sağlık sistemine erişim önceliğin? | `scale` | 1-5 |
| `safety_priority` | Güvenlik ve siyasi istikrar önceliğin? | `scale` | 1-5 |
| `inclusion_priority` | Kapsayıcılık / haklar / sosyal özgürlükler ne kadar önemli? | `scale` | 1-5 |
| `climate_preference` | İklim tercihin? | `single` | mild, cold, warm, mediterranean, no_preference |
| `move_window` | Ne zaman taşınmak istiyorsun? | `date/range` | 0-3 ay, 3-6 ay, 6-12 ay, later |
| `risk_tolerance` | Belirsizlik ve yeniden başlama riskine toleransın? | `scale` | 1-5 |
| `deal_breakers` | Kesin istemediğin koşullar? | `multi` | high_cost, no_english, weak_healthcare, low_safety, no_community, hard_visa |

## 4. Skor / karar modeli

Toplam skor 0-100 aralığına normalize edilir. Her ülke için aday ülke metriği oluşturulur.

| Boyut | Ağırlık | Hesap |
|---|---:|---|
| `budget_fit` | 20 | Kullanıcı bütçesi ile ülke maliyet endeksi karşılaştırılır. Bütçe yoksa nötr 0.50. |
| `career_market_fit` | 20 | Meslek alanı + ülke istihdam/veri sinyali + EURES/OECD iş gücü göstergesi. |
| `visa_path_fit` | 15 | Kullanıcının vize varlıkları ve ülkenin vize/bürokrasi zorluğu. |
| `language_fit` | 15 | Kullanıcının dil profili ile ülkede çalışma/yaşam için gerekli dilin örtüşmesi. |
| `quality_of_life_fit` | 15 | Sağlık, güvenlik, eğitim/aile ve kapsayıcılık önceliklerinin ülke metrikleriyle uyumu. |
| `community_fit` | 10 | Türk/diaspora yoğunluğu ve kullanıcının community önem puanı. |
| `climate_fit` | 5 | İklim tercih vektörü ile ülke iklim kategorisi eşleşmesi. |

Bucket: `>=80 excellent`, `65-79 strong`, `50-64 moderate`, `<50 risky`. Deal-breaker seçilen alanlarda ilgili boyut maksimum 40/100 ile sınırlandırılır.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ek tablo önerisi:

```sql
create table public.relocation_country_metrics (
  country_code text primary key,
  cost_index numeric(6,3),
  employment_index numeric(6,3),
  visa_complexity numeric(6,3),
  english_workability numeric(6,3),
  healthcare_index numeric(6,3),
  safety_index numeric(6,3),
  inclusion_index numeric(6,3),
  community_density numeric(6,3),
  climate_tags text[] not null default '{}',
  source_id uuid references public.relocation_source_registry(id),
  freshness_at timestamptz,
  is_active boolean not null default true
);
```

RPC: `relocation_score_country_match_v1(p_session_id uuid)`.

Mevcut `relocation_locations` ülke bazında aggregate edilerek de başlanabilir. MVP'de 10-15 ülke seed yeterlidir; sonradan ingestion worker günceller.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "country_match",
  "slug": "ulke-secimi",
  "title_tr": "Hangi Ülke Sana Uygun? — Ülke Seçimi Aracı",
  "category": "relocation_assessment",
  "quick_question_count": 7,
  "detailed_question_count": 18,
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

> İlk 3 ülken: Almanya 84/100, Hollanda 79/100, Kanada 73/100. Almanya kariyer ve topluluk açısından güçlü; Hollanda dil/iş dengesi iyi; Kanada vize ve mesafe nedeniyle orta riskli.

Detay result JSON:

```json
{
  "ranked_countries": [
    {
      "country_code": "DE",
      "score": 84.2,
      "bucket": "excellent",
      "sub_scores": {"budget_fit": 0.72, "career_market_fit": 0.91},
      "why": ["Meslek alanın Almanya'daki talep sinyalleriyle uyumlu", "Türk topluluğu yoğunluğu yüksek"],
      "risks": ["Almanca seviyesi B1 altındaysa iş arama süresi uzayabilir"],
      "next_actions": ["Şehir eşleştirme aracını çalıştır", "Almanya mentorlarını görüntüle"]
    }
  ]
}
```

CTA'lar:

- Şehir eşleştirme aracını başlat
- Sonucu profiline kaydet
- Bu ülkedeki CorteQS üyelerini/dizin kayıtlarını gör
- İlk 90 Gün Planlayıcı'ya geç

## 8. Veri kaynakları ve ingestion notu

- World Bank Indicators API
- OECD employment/labour datasets
- WHO Global Health Observatory
- EURES labour market information
- ESCO occupation/skills API
- Resmi göçmenlik ve konsolosluk siteleri
- Numbeo sadece fallback/crowd-sourced uyarısıyla

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
login -> /relocation/tools/ulke-secimi -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
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
