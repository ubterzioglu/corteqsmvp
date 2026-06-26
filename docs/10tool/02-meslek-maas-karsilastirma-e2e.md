# Tool 02 — Mesleğiniz Dünyada Ne Kazandırıyor? — Maaş Karşılaştırma Aracı E2E Dokümanı

> **Tool key:** `profession_salary`  
> **Slug:** `meslek-maas-karsilastirma`  
> **Route:** `/relocation/tools/meslek-maas-karsilastirma`  
> **Result kind:** `comparison`  
> **Öncelik:** Yüksek  
> **Tahmini efor:** 4-6 gün UI/RPC; güvenilir veri entegrasyonu ile 2-4 hafta

## 1. Ürün amacı

Kullanıcının meslek, deneyim ve hedef ülkesine göre brüt/net maaş bandı, maliyet ayarlı alım gücü ve pazar talebini gösterir.

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

1. Kullanıcı mesleğini autocomplete ile seçer; arka planda ESCO koduna map edilir.
2. Deneyim, eğitim, hedef ülke/şehir ve çalışma tipi alınır.
3. Sistem maaş benchmark tablolarını ve ülke/city cost index değerlerini okur.
4. Sonuçta ülke bazlı brüt band, tahmini net band, maliyet ayarlı gelir ve talep sinyali listelenir.
5. Kullanıcı sonucu profile “kariyer hedefi” olarak kaydedebilir veya Job-Finding Probability aracına geçebilir.

## 3. Soru kapsamı

- Quick mode: 5 soru.
- Detailed mode: 12 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `profession_title` | Mesleğin / rolün nedir? | `profession` | autocomplete + ESCO mapping |
| `seniority` | Kıdem seviyen? | `single` | junior, mid, senior, lead, manager |
| `years_experience` | Kaç yıl ilgili deneyimin var? | `number` | 0-40 |
| `education_level` | En yüksek eğitim seviyen? | `single` | high_school, bachelor, master, phd, vocational |
| `specialization` | Uzmanlık/teknoloji/branş alanların? | `multi` | serbest etiket + öneriler |
| `certifications` | Uluslararası geçerli sertifikan var mı? | `multi` | AWS, PMP, medical_license, none |
| `regulated_profession` | Mesleğin hedef ülkede lisans/denkliğe tabi mi? | `single` | yes, no, not_sure |
| `target_countries` | Hangi ülkeleri karşılaştırmak istiyorsun? | `country/multi` | en fazla 8 |
| `target_cities` | Belirli şehirleri dahil edelim mi? | `city/multi` | opsiyonel |
| `salary_preference` | Maaşı nasıl görmek istersin? | `single` | gross_yearly, net_monthly, both |
| `current_salary_optional` | Mevcut net maaşını karşılaştırmaya dahil edelim mi? | `currency` | opsiyonel |
| `household_cost_context` | Alım gücü hesabı için hane tipin? | `single` | single, couple, family_with_children |

## 4. Skor / karar modeli

Bu araç tek bir “başarı skoru” yerine karşılaştırmalı çıktı üretir. Ancak sıralama için `salary_power_index` hesaplanır.

| Boyut | Ağırlık | Hesap |
|---|---:|---|
| `salary_level` | 25 | Meslek + kıdem benchmark maaş bandının global/target içindeki konumu. |
| `cost_adjusted_income` | 30 | Tahmini net gelir / yaşam maliyeti endeksi. |
| `demand_fit` | 20 | Meslek için iş ilanı, shortage veya istihdam sinyali. |
| `tax_social_fit` | 15 | Net tahmin, sosyal haklar ve hane maliyeti etkisi. MVP'de basitleştirilmiş. |
| `credential_transferability` | 10 | Lisans/denklik bariyeri düşükse yüksek skor. |

Sonuç bucket'ı: `high_value`, `balanced`, `expensive_but_high_salary`, `low_salary_or_high_barrier`.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ek tablolar:

```sql
create table public.relocation_professions (
  id uuid primary key default gen_random_uuid(),
  esco_code text unique,
  label_tr text not null,
  label_en text,
  normalized_family text,
  is_regulated_default boolean not null default false
);

create table public.relocation_salary_benchmarks (
  id uuid primary key default gen_random_uuid(),
  profession_id uuid references public.relocation_professions(id),
  country_code text not null,
  city_code text,
  seniority text,
  salary_min numeric(14,2),
  salary_median numeric(14,2),
  salary_max numeric(14,2),
  salary_period text not null default 'yearly',
  salary_type text not null default 'gross',
  currency text not null,
  sample_size integer,
  source_id uuid references public.relocation_source_registry(id),
  freshness_at timestamptz,
  confidence numeric(4,3) not null default 0.50
);
```

RPC: `relocation_score_profession_salary_v1(p_session_id uuid)`.

MVP fallback: önce 20 meslek x 10 ülke seed. Sonradan `workers/relocation-ingestion` maaş adapter'ları eklenir.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "profession_salary",
  "slug": "meslek-maas-karsilastirma",
  "title_tr": "Mesleğiniz Dünyada Ne Kazandırıyor? — Maaş Karşılaştırma Aracı",
  "category": "relocation_assessment",
  "quick_question_count": 5,
  "detailed_question_count": 12,
  "result_kind": "comparison",
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

> Senior Software Engineer için Almanya ve Hollanda dengeli; İsviçre brüt maaşta yüksek ama maliyet ve rekabet riski var. Türkiye mevcut maaşına göre maliyet ayarlı fark Almanya'da yaklaşık +%X bandında görünüyor.

Tablo alanları: ülke, şehir, brüt yıllık band, net aylık tahmini band, cost-adjusted index, demand index, credential risk, source confidence.

CTA'lar:

- İş bulma olasılığını hesapla
- Bu meslekte mentor bul
- Kariyer yol haritası aracına geç
- Sonucu profilde kariyer hedefi olarak sakla

## 8. Veri kaynakları ve ingestion notu

- ESCO Occupation/Skill API
- OECD wages/labour datasets
- Eurostat/national statistics offices
- EURES job vacancies and labour market information
- Lisanslı maaş API'leri; crowd-sourced kaynaklar sadece confidence düşük

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
login -> /relocation/tools/meslek-maas-karsilastirma -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
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
