# Tool 10 — Yurt Dışında İş Bulma Şansınız? — Job-Finding Probability E2E Dokümanı

> **Tool key:** `job_finding_probability`  
> **Slug:** `is-bulma-olasiligi`  
> **Route:** `/relocation/tools/is-bulma-olasiligi`  
> **Result kind:** `score`  
> **Öncelik:** Orta-Yüksek  
> **Tahmini efor:** 4-6 gün skor/UI; iş piyasası adapter'larıyla 2-4 hafta

## 1. Ürün amacı

Meslek, hedef ülke, dil, deneyim, credential ve network sinyallerine göre iş bulma olasılığı için açıklanabilir bir skor üretir.

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

1. Kullanıcı meslek/rol, hedef ülke, deneyim, dil, eğitim ve iş arama durumunu girer.
2. Meslek ESCO koduna ve ülke job market signal tablolarına map edilir.
3. RPC 0-100 arası olasılık skoru ve zayıf noktaları hesaplar.
4. Sonuç “garanti değil, karar destek skoru” uyarısıyla gösterilir.
5. Kullanıcı maaş karşılaştırma, kariyer yolu veya diaspora matchmaker'a yönlenir.

## 3. Soru kapsamı

- Quick mode: 7 soru.
- Detailed mode: 16 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `profession_title` | Hedeflediğin iş/rol nedir? | `profession` | ESCO mapping |
| `target_country` | Hangi ülkede iş arıyorsun? | `country` | tek ülke MVP |
| `years_experience` | İlgili deneyim yılın? | `number` | 0-40 |
| `seniority` | Kıdem seviyen? | `single` | junior, mid, senior, lead, manager |
| `education_level` | Eğitim seviyen? | `single` | vocational, bachelor, master, phd, other |
| `language_level` | İş dilindeki seviyen? | `scale` | 0-5 |
| `english_level` | İngilizce seviyen? | `scale` | 0-5 |
| `regulated_profession` | Mesleğin denklik/lisans gerektiriyor mu? | `single` | yes, no, not_sure |
| `credential_status` | Denklik/sertifika durumun? | `single` | recognized, in_progress, none, not_needed |
| `portfolio_cv` | CV/LinkedIn/portföyün hedef ülkeye uygun mu? | `single` | ready, partial, no |
| `applications` | Son 30 günde kaç başvuru yaptın? | `number` | 0-200 |
| `interviews` | Son 90 günde mülakat aldın mı? | `single` | multiple, one, none |
| `network` | Hedef ülkede profesyonel bağlantın var mı? | `single` | strong, weak, none |
| `work_authorization` | Çalışma izni/vize açısından durumun? | `single` | authorized, eligible, needs_sponsor, unknown |
| `salary_flexibility` | Maaş/rol esnekliğin? | `scale` | 1-5 |
| `remote_option` | Remote/hybrid veya relocation sponsor seçeneklerine açıksın? | `multi` | remote, hybrid, sponsor, local_only |

## 4. Skor / karar modeli

| Boyut | Ağırlık | Açıklama |
|---|---:|---|
| `demand_fit` | 30 | Meslek + ülke shortage/vacancy/employment sinyali. |
| `language_fit` | 20 | İş dili + İngilizce seviyesi. |
| `experience_signal` | 15 | Deneyim, kıdem, portföy ve mülakat sinyali. |
| `credential_fit` | 15 | Denklik/lisans gerekliliği ve kullanıcının hazır oluşu. |
| `work_authorization_fit` | 10 | Çalışma hakkı, sponsor ihtiyacı, vize uygunluğu. |
| `network_activity_fit` | 10 | Profesyonel network, başvuru aktivitesi, mülakat geçmişi. |

Bucket: `>=75 high`, `55-74 medium_high`, `40-54 challenging`, `<40 low`. Result text kesin olasılık gibi değil, karar destek skoru olarak yazılmalı.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ek tablolar:

```sql
create table public.relocation_job_market_signals (
  id uuid primary key default gen_random_uuid(),
  profession_code text not null,
  country_code text not null,
  vacancy_index numeric(6,3),
  shortage_index numeric(6,3),
  unemployment_inverse_index numeric(6,3),
  language_requirement jsonb not null default '{}',
  regulated_profession boolean,
  source_id uuid references public.relocation_source_registry(id),
  freshness_at timestamptz,
  confidence numeric(4,3) not null default 0.50,
  unique(profession_code, country_code, source_id)
);
```

RPC: `relocation_score_job_probability_v1(p_session_id uuid)`.

Bu araç #2 maaş benchmark ve #6 kariyer path tablolarıyla aynı `relocation_professions` temelini paylaşır.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "job_finding_probability",
  "slug": "is-bulma-olasiligi",
  "title_tr": "Yurt Dışında İş Bulma Şansınız? — Job-Finding Probability",
  "category": "relocation_assessment",
  "quick_question_count": 7,
  "detailed_question_count": 16,
  "result_kind": "score",
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

> İş bulma skorun 72/100: orta-yüksek. Talep ve deneyim sinyalin güçlü; yerel dil ve çalışma izni netliği skoru sınırlıyor. En hızlı kazanım: CV/LinkedIn'i hedef ülke formatına çekmek ve diaspora network üzerinden 3 bilgi görüşmesi yapmak.

CTA'lar:

- Maaş karşılaştırmasını aç
- Diaspora mentor eşleşmesi başlat
- Kariyer yolu roadmap'i oluştur
- Profiline iş arama hedefi ekle

## 8. Veri kaynakları ve ingestion notu

- ESCO occupation/skills
- EURES labour market and vacancies
- OECD employment indicators
- Ulusal shortage occupation listeleri
- Resmi göçmenlik/çalışma izni sayfaları

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
login -> /relocation/tools/is-bulma-olasiligi -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
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
