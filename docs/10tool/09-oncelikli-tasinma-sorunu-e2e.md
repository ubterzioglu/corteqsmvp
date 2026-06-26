# Tool 09 — Hangi Soruna Önce Odaklanmalısın? — Öncelikli Engel Aracı E2E Dokümanı

> **Tool key:** `top_relocation_challenge`  
> **Slug:** `oncelikli-tasinma-sorunu`  
> **Route:** `/relocation/tools/oncelikli-tasinma-sorunu`  
> **Result kind:** `score`  
> **Öncelik:** Düşük ama hızlı  
> **Tahmini efor:** 1-2 gün ortak engine sonrası

## 1. Ürün amacı

Kullanıcının taşınma sürecindeki ana darboğazını bulur: vize, iş, dil, konut, finans, evrak, topluluk veya sağlık.

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

1. Kullanıcı en stresli alanları ve mevcut ilerleme durumunu işaretler.
2. Sistem sorun kategorilerini blocker skoruna göre sıralar.
3. Sonuçta ilk odak alanı, neden kritik olduğu ve 7 günlük mini-plan gösterilir.
4. İlgili araca otomatik geçiş önerilir.

## 3. Soru kapsamı

- Quick mode: 5 soru.
- Detailed mode: 9 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `stressors` | Şu an en çok ne zorlayıcı geliyor? | `multi` | visa, job, language, housing, money, paperwork, loneliness, school, healthcare |
| `urgency` | Taşınma ne kadar yakın? | `single` | 0-1m, 1-3m, 3-6m, 6m+ |
| `blocked_progress` | Hangi alan ilerlemeyi gerçekten durduruyor? | `multi` | same categories |
| `confidence` | Genel güven seviyen? | `scale` | 1-5 ters risk |
| `help_needed` | Dış destek almak istediğin alanlar? | `multi` | mentor, legal, recruiter, housing, language |
| `documents_state` | Evrak/vize tarafında durum? | `single` | clear, partial, confused |
| `income_state` | Gelir/iş tarafında durum? | `single` | secured, searching, not_started |
| `support_state` | Destek ağı durumun? | `single` | strong, weak, none |
| `health_family_complexity` | Sağlık/aile/okul gibi ek karmaşıklık var mı? | `multi` | children, chronic_access_need, pets, elder_support, none |

## 4. Skor / karar modeli

Her kategori için:

`category_score = user_stress * 0.35 + progress_blocker * 0.35 + urgency_multiplier * 0.20 + dependency_factor * 0.10`

Kategoriler: `visa_docs`, `job_income`, `language`, `housing`, `finance`, `community_support`, `credential_recognition`, `healthcare_family`.

En yüksek kategori primary challenge olur. İlk 3 kategori result içinde gösterilir.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ortak tablolar yeterli. RPC: `relocation_score_top_challenge_v1(p_session_id uuid)`.

Result `recommendations` içinde ilgili araç bağlantısı üretilir:

- `visa_docs` -> Readiness + First 90 Days.
- `job_income` -> Job Probability + Salary.
- `language` -> Career Path / 90 Days.
- `housing` -> City Match / 90 Days.
- `community_support` -> Diaspora Matchmaker.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "top_relocation_challenge",
  "slug": "oncelikli-tasinma-sorunu",
  "title_tr": "Hangi Soruna Önce Odaklanmalısın? — Öncelikli Engel Aracı",
  "category": "relocation_assessment",
  "quick_question_count": 5,
  "detailed_question_count": 9,
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

> Öncelikli engelin: İş/Gelir. Taşınma takvimin yakın olduğu için iş arama netleşmeden konut ve bütçe kararları da riskli hale geliyor. Bu hafta: hedef rol listesini çıkar, maaş karşılaştırmasını çalıştır, iş bulma olasılığını hesapla.

CTA'lar:

- İş bulma olasılığını hesapla
- Maaş karşılaştırmasını aç
- Mentor bul
- Hazırlık skorunu tekrar çalıştır

## 8. Veri kaynakları ve ingestion notu

- Kullanıcı cevapları
- CorteQS tool taxonomy

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
login -> /relocation/tools/oncelikli-tasinma-sorunu -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
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
